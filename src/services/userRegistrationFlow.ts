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
 * Garante atomicidade: usuário só é criado localmente se tudo der certo no portal
 */
export class UserRegistrationFlowService {
  /**
   * FLUXO PRINCIPAL DE REGISTRO
   * 
   * Passos:
   * 1. Pré-validar package_code do plano (se fornecido)
   * 2. Verificar se usuário já existe no sistema interno
   * 3. Verificar se usuário já existe no portal (busca)
   * 4. Se não existir no portal, criar usuário no portal
   * 5. Atribuir plano no portal (usando packageCode validado)
   * 6. APENAS APÓS plano atribuído: criar usuário no sistema interno
   * 7. Auto-login e criar assinatura local
   */
  public static async registerUser(userData: RegistrationData): Promise<RegistrationResult> {
    try {
      console.log('[UserRegistrationFlow] 🚀 Starting registration process for:', userData.email);

      // PASSO 1: Pré-validação do plano (se fornecido)
      let packageCode: string | null = null;
      if (userData.selectedPlanId) {
        try {
          console.log('[UserRegistrationFlow] 🔎 Pre-validating plan package code...');
          packageCode = await this.getPackageCodeForPlan(userData.selectedPlanId);
          console.log('[UserRegistrationFlow] ✅ Package code validated:', packageCode);
        } catch (e) {
          console.error('[UserRegistrationFlow] ❌ Plan pre-validation failed:', e);
          throw new Error('Não foi possível encontrar o pacote configurado para o plano selecionado. Verifique a configuração do plano ou tente novamente mais tarde.');
        }
      }

      // PASSO 2: Verificar existência no sistema interno
      console.log('[UserRegistrationFlow] 🔍 Checking internal system...');
      const existingUser = await this.checkUserExistsInSystem(userData.email);
      
      if (existingUser.exists) {
        console.log('[UserRegistrationFlow] ⚠️ User already exists in system:', existingUser.userId);
        return {
          success: false,
          message: 'Este e-mail já está cadastrado no sistema.'
        };
      }

      // PASSO 3: Verificar existência no portal (via busca)
      console.log('[UserRegistrationFlow] 🔎 Checking portal for existing user...');
      let motvUserId: number | null = null;
      
      const searchResult = await MotvApiService.customerSearch(userData.email);
      
      if (searchResult.success && searchResult.customers && searchResult.customers.length > 0) {
        // Usuário já existe no portal - buscar pelo email exato
        const emailLower = userData.email.toLowerCase();
        const foundUser = searchResult.customers.find(c => 
          c.email?.toLowerCase() === emailLower || c.login?.toLowerCase() === emailLower
        );
        
        if (foundUser?.viewers_id) {
          motvUserId = foundUser.viewers_id;
          console.log('[UserRegistrationFlow] ✅ User found in portal:', motvUserId);
          console.log('[UserRegistrationFlow] 🔄 Will proceed with existing portal user and assign plan');
        }
      }
      
      if (!motvUserId) {
        // PASSO 4: Criar usuário no portal
        console.log('[UserRegistrationFlow] 📝 Creating user in portal...');
        const createResult = await MotvApiService.customerCreate({
          name: userData.name,
          login: userData.email,
          email: userData.email,
          password: userData.password,
          cpf: userData.cpf,
          phone: userData.phone
        });

        if (!createResult.success || !createResult.viewersId) {
          console.error('[UserRegistrationFlow] ❌ Failed to create user in portal:', createResult.message);
          throw new Error(createResult.message || 'Erro ao criar usuário no portal');
        }

        motvUserId = createResult.viewersId;
        console.log('[UserRegistrationFlow] ✅ User created in portal:', motvUserId);
      }

      // PASSO 5: Atribuir plano no portal (se fornecido e necessário)
      if (userData.selectedPlanId && motvUserId && packageCode) {
        console.log('[UserRegistrationFlow] 📦 Assigning plan in portal...');
        try {
          await this.managePlanInMotv(motvUserId, packageCode);
          console.log('[UserRegistrationFlow] ✅ Plan assigned in portal');
        } catch (error: any) {
          console.error('[UserRegistrationFlow] ❌ Failed to assign plan in portal:', error);
          // Se falhou a atribuição do plano, não criar usuário local
          throw new Error('Erro ao atribuir o plano no portal. Tente novamente. Se o problema persistir, entre em contato com o suporte.');
        }
      }

      // PASSO 6: Criar usuário no sistema interno (só depois do plano ser atribuído no portal)
      console.log('[UserRegistrationFlow] 👤 Creating user in internal system...');
      const createUserResult = await this.createUserInSystem({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        cpf: userData.cpf,
        phone: userData.phone,
        motvUserId: motvUserId?.toString()
      });

      if (!createUserResult.success || !createUserResult.user_id) {
        console.error('[UserRegistrationFlow] ❌ Failed to create user in system:', createUserResult.error);
        throw new Error('Erro ao criar usuário no sistema: ' + (createUserResult.error || 'Erro desconhecido'));
      }

      const userId = createUserResult.user_id;
      console.log('[UserRegistrationFlow] ✅ User created in system:', userId);

      // PASSO 7: Criar assinatura local
      if (userData.selectedPlanId) {
        console.log('[UserRegistrationFlow] 📋 Creating local subscription...');
        await this.assignPackageToUser(userId, userData.selectedPlanId);
        console.log('[UserRegistrationFlow] ✅ Local subscription created');
      }

      console.log('[UserRegistrationFlow] 🎉 Registration completed successfully!');
      return {
        success: true,
        message: 'Cadastro realizado com sucesso!',
        userId,
        motvUserId: motvUserId?.toString()
      };

    } catch (error: any) {
      console.error('[UserRegistrationFlow] ❌ Registration flow error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao processar cadastro. Tente novamente.'
      };
    }
  }

  /**
   * Resolve package code via secure backend function
   */
  private static async getPackageCodeForPlan(planId: string): Promise<string> {
    console.log('[UserRegistrationFlow] 🔎 Resolving package code for plan via edge function:', planId);

    const { data, error } = await supabase.functions.invoke('plans-resolve-package-code', {
      body: { planId }
    });

    console.log('[UserRegistrationFlow] 📦 Edge function response:', { data, error });

    if (error) {
      console.error('[UserRegistrationFlow] ❌ Edge function error:', error);
      throw new Error('Erro ao buscar informações do pacote do plano');
    }

    if (!data?.success || !data?.packageCode) {
      console.error('[UserRegistrationFlow] ❌ Package code not found:', data?.message);
      throw new Error(data?.message || 'Código do pacote não configurado');
    }

    return String(data.packageCode);
  }

  /**
   * Assign plan in portal (MOTV)
   * @param motvUserId - Portal user ID
   * @param packageCode - Package code (products_id) already resolved
   */
  private static async managePlanInMotv(motvUserId: number, packageCode: string): Promise<void> {
    console.log('[UserRegistrationFlow] 📦 Managing plan in portal for user:', motvUserId, 'with package:', packageCode);

    // Step 1: Check current plans
    console.log('[UserRegistrationFlow] 🔍 Checking current plans...');
    const historyResult = await MotvApiService.planHistory(motvUserId);
    
    if (!historyResult.success) {
      console.error('[UserRegistrationFlow] ❌ Failed to get plan history:', historyResult.message);
      throw new Error('Erro ao verificar planos existentes no portal');
    }

    // Step 2: Cancel active plans
    const activePlans = historyResult.plans?.filter(p => p.status?.toLowerCase() === 'ativo') || [];
    
    if (activePlans.length > 0) {
      console.log('[UserRegistrationFlow] 🗑️ Canceling', activePlans.length, 'active plan(s)');
      const cancelResult = await MotvApiService.planCancelAll(motvUserId);
      
      if (!cancelResult.success) {
        console.error('[UserRegistrationFlow] ❌ Failed to cancel plans:', cancelResult.message);
        throw new Error('Erro ao cancelar planos existentes no portal');
      }
      
      console.log('[UserRegistrationFlow] ✅ Active plans canceled');
    }

    // Step 3: Create new plan with the validated package code
    console.log('[UserRegistrationFlow] 📦 Creating new plan - User:', motvUserId, 'Package:', packageCode);
    
    const createPlanResult = await MotvApiService.planCreate(motvUserId, Number(packageCode));
    console.log('[UserRegistrationFlow] 📋 Create plan result:', createPlanResult);
    
    if (!createPlanResult.success) {
      console.error('[UserRegistrationFlow] ❌ Failed to create plan:', createPlanResult.message);
      throw new Error('Erro ao atribuir plano no portal: ' + (createPlanResult.message || 'Erro desconhecido'));
    }

    console.log('[UserRegistrationFlow] ✅ Plan successfully assigned in portal');
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
    motvUserId?: string;
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
