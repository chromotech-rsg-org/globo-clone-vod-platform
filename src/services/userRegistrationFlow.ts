import { supabase } from "@/integrations/supabase/client";
import { MotvApiService } from "./motvApiService";
import { MotvErrorHandler } from "@/utils/motvErrorHandler";

export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  cpf?: string;
  phone?: string;
  selectedPlanId?: string;
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  requiresPasswordUpdate?: boolean;
  userId?: string;
  motvUserId?: string;
  autoLogin?: boolean;
}

/**
 * Serviço de fluxo completo de registro de usuário
 * Segue o fluxo definido para criação e sincronização MOTV
 */
export class UserRegistrationFlowService {
  /**
   * FLUXO PRINCIPAL DE REGISTRO
   * 
   * Passos:
   * 1. Verificar se usuário já existe no sistema interno
   * 2. Tentar autenticar no MOTV (para verificar se já existe)
   * 3. Se não existir, criar no MOTV
   * 4. Gerenciar plano no MOTV (se selecionado)
   * 5. Criar usuário no sistema interno
   * 6. Auto-login e associar plano local
   */
  public static async registerUser(userData: RegistrationData): Promise<RegistrationResult> {
    console.log('[UserRegistrationFlow] 🚀 Starting registration for:', userData.email);

    try {
      // PASSO 1: Verificar se usuário já existe no sistema interno
      const existsLocally = await this.checkUserExistsInSystem(userData.email);
      if (existsLocally.exists) {
        console.log('[UserRegistrationFlow] ❌ User already exists locally');
        return {
          success: false,
          message: 'Este e-mail já está cadastrado. Por favor, faça login ou clique em "Esqueci minha senha" para recuperar seu acesso.'
        };
      }

      // PASSO 2: Tentar autenticar no MOTV (verifica se já existe)
      console.log('[UserRegistrationFlow] 🔐 Attempting MOTV authentication...');
      const authResult = await MotvApiService.customerAuthenticate(userData.email, userData.password);
      
      let motvUserId: number | null = null;

      if (authResult.success && authResult.viewersId) {
        // Usuário existe no MOTV com essa senha
        console.log('[UserRegistrationFlow] ✅ User exists in MOTV:', authResult.viewersId);
        motvUserId = authResult.viewersId;
      } else {
        // PASSO 3: Tentar criar no MOTV
        console.log('[UserRegistrationFlow] 📝 Creating user in MOTV...');
        const createResult = await MotvApiService.customerCreate({
          name: userData.name,
          login: userData.email,
          password: userData.password,
          email: userData.email,
          cpf: userData.cpf,
          phone: userData.phone
        });

        if (createResult.success && createResult.viewersId) {
          console.log('[UserRegistrationFlow] ✅ User created in MOTV:', createResult.viewersId);
          motvUserId = createResult.viewersId;
        } else if (MotvErrorHandler.isUserExistsError(createResult.error)) {
          // Erro 104/106: usuário já existe no MOTV
          console.log('[UserRegistrationFlow] ⚠️ User exists in MOTV but wrong password');
          return {
            success: false,
            requiresPasswordUpdate: true,
            message: 'Usuário já existe no MOTV. Por favor, tente fazer login ou recuperar sua senha.'
          };
        } else {
          // Outro erro ao criar
          const errorPayload = createResult.error ?? { message: createResult.message || 'Erro ao criar usuário no MOTV' };
          const errorInfo = MotvErrorHandler.handleError(errorPayload, 'criar usuário no MOTV', { createResult });
          return {
            success: false,
            message: MotvErrorHandler.formatUserMessage(errorInfo)
          };
        }
      }

      if (!motvUserId) {
        throw new Error('Falha ao obter ID do usuário MOTV');
      }

      // PASSO 4: Gerenciar plano no MOTV (se selecionado)
      if (userData.selectedPlanId) {
        console.log('[UserRegistrationFlow] 📦 Managing plan in MOTV...');
        await this.managePlanInMotv(motvUserId, userData.selectedPlanId);
      } else {
        console.log('[UserRegistrationFlow] ℹ️ No plan selected, skipping plan assignment');
      }

      // PASSO 5: Criar usuário no sistema interno
      console.log('[UserRegistrationFlow] 💾 Creating user in system...');
      const createResult = await this.createUserInSystem({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        cpf: userData.cpf,
        phone: userData.phone,
        motv_user_id: motvUserId.toString()
      });

      if (!createResult.success || !createResult.user_id) {
        throw new Error(createResult.error || 'Falha ao criar usuário no sistema');
      }

      const localUserId = createResult.user_id;
      console.log('[UserRegistrationFlow] ✅ User created locally:', localUserId);

      // PASSO 6: Auto-login e associar plano local
      console.log('[UserRegistrationFlow] 🔐 Auto-login...');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });

      if (signInError) {
        console.error('[UserRegistrationFlow] ⚠️ Auto-login failed:', signInError);
        return {
          success: true,
          message: 'Cadastro realizado com sucesso! Por favor, faça login.',
          userId: localUserId
        };
      }

      // Associar plano local (se selecionado)
      if (userData.selectedPlanId) {
        await this.assignPackageToUser(localUserId, userData.selectedPlanId);
      }

      console.log('[UserRegistrationFlow] ✅ Registration completed successfully');
      return {
        success: true,
        message: 'Cadastro realizado com sucesso!',
        userId: localUserId,
        autoLogin: true
      };

    } catch (error: any) {
      console.error('[UserRegistrationFlow] ❌ Registration flow error:', error);
      const errorInfo = MotvErrorHandler.handleError(error, 'processar cadastro');
      return {
        success: false,
        message: MotvErrorHandler.formatUserMessage(errorInfo)
      };
    }
  }

  /**
   * Gerenciar plano no MOTV
   * - Busca o package_code do plano
   * - Cancela planos existentes
   * - Cria novo plano
   */
  private static async managePlanInMotv(motvUserId: number, planId: string): Promise<void> {
    console.log('[UserRegistrationFlow] 📦 Looking for package code for plan:', planId);

    // Buscar package_code do plano
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, package_id, packages(code)')
      .eq('id', planId)
      .maybeSingle();

    if (planError) {
      console.error('[UserRegistrationFlow] ❌ Error fetching plan:', planError);
      throw new Error('Erro ao buscar informações do plano');
    }

    const packageCode = (plan?.packages as any)?.code;
    if (!packageCode) {
      console.warn('[UserRegistrationFlow] ⚠️ No package code found for plan');
      return; // Não bloqueia o cadastro se não tiver código
    }

    console.log('[UserRegistrationFlow] 📦 Package code found:', packageCode);

    // Verificar planos atuais
    const historyResult = await MotvApiService.planHistory(motvUserId);
    if (historyResult.success && historyResult.plans) {
      const activePlans = historyResult.plans.filter(p => p.status === 'active');
      
      // Verificar se já tem esse plano ativo
      const alreadyHasPlan = activePlans.some(p => p.package_code === packageCode);
      if (alreadyHasPlan) {
        console.log('[UserRegistrationFlow] ℹ️ User already has this plan active');
        return;
      }

      // Cancelar planos existentes se houver
      if (activePlans.length > 0) {
        console.log('[UserRegistrationFlow] 🚫 Canceling existing plans...');
        await MotvApiService.planCancelAll(motvUserId);
      }
    }

    // Criar novo plano
    console.log('[UserRegistrationFlow] ➕ Creating new plan...');
    const productsId = parseInt(packageCode, 10);
    const createPlanResult = await MotvApiService.planCreate(motvUserId, productsId);

    if (!createPlanResult.success) {
      console.error('[UserRegistrationFlow] ❌ Failed to create plan:', createPlanResult.message);
      throw new Error(createPlanResult.message || 'Erro ao atribuir plano no MOTV');
    }

    console.log('[UserRegistrationFlow] ✅ Plan assigned successfully');
  }

  /**
   * Verificar se usuário já existe no sistema
   */
  private static async checkUserExistsInSystem(email: string): Promise<{ exists: boolean; userId?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('auth-check-user', {
        body: { email }
      });

      if (error) {
        console.error('[UserRegistrationFlow] Error checking user:', error);
        return { exists: false };
      }

      return {
        exists: data?.exists || false,
        userId: data?.user_id
      };
    } catch (error) {
      console.error('[UserRegistrationFlow] Exception checking user:', error);
      return { exists: false };
    }
  }

  /**
   * Criar usuário no sistema via edge function
   */
  private static async createUserInSystem(data: {
    email: string;
    password: string;
    name: string;
    cpf?: string;
    phone?: string;
    motv_user_id?: string;
  }): Promise<{ success: boolean; user_id?: string; error?: string }> {
    try {
      const { data: result, error } = await supabase.functions.invoke('auth-register', {
        body: data
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Associar plano ao usuário no sistema
   */
  private static async assignPackageToUser(userId: string, planId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        start_date: new Date().toISOString()
      });

    if (error) {
      console.error('[UserRegistrationFlow] Error assigning package:', error);
      throw error;
    }
  }
}
