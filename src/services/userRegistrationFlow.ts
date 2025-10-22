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

      // PASSO 2: Verificar existência no MOTV (primeiro via busca)
      // Pré-validação: obter código do pacote do plano antes de criar usuário no portal
      if (userData.selectedPlanId) {
        try {
          console.log('[UserRegistrationFlow] 🔎 Pre-validating plan package code...');
          await this.getPackageCodeForPlan(userData.selectedPlanId);
        } catch (e) {
          console.error('[UserRegistrationFlow] ❌ Plan pre-validation failed:', e);
          throw e;
        }
      }
      console.log('[UserRegistrationFlow] 🔎 Checking MOTV for existing user...');
      let motvUserId: number | null = null;
      let motvPlanAssigned = false;

      const searchInitial = await MotvApiService.customerSearch(userData.email);
      if (searchInitial.success) {
        const emailLower = userData.email.toLowerCase();
        const foundInitial = searchInitial.customers?.find(c =>
          c.email?.toLowerCase() === emailLower || c.login?.toLowerCase() === emailLower
        );
        if (foundInitial?.viewers_id) {
          motvUserId = foundInitial.viewers_id;
          console.log('[UserRegistrationFlow] ✅ Found existing MOTV user:', motvUserId);
        }
      }

      if (!motvUserId) {
        // Não encontrado: criar no MOTV
        console.log('[UserRegistrationFlow] 📝 Creating user in MOTV...');
        const createResult = await MotvApiService.customerCreate({
          name: userData.name,
          login: userData.email,
          password: userData.password,
          email: userData.email,
          cpf: userData.cpf,
          phone: userData.phone
        });

        console.log('[UserRegistrationFlow] 📋 MOTV createResult:', {
          success: createResult.success,
          viewersId: createResult.viewersId,
          error: createResult.error,
          message: createResult.message
        });

        if (createResult.success && createResult.viewersId) {
          console.log('[UserRegistrationFlow] ✅ User created in MOTV:', createResult.viewersId);
          motvUserId = createResult.viewersId;
        } else if (MotvErrorHandler.isUserExistsError(createResult.error)) {
          // Usuário já existe no MOTV - tentar localizar e prosseguir
          console.log('[UserRegistrationFlow] ⚠️ User exists in MOTV, attempting lookup...');
          const search = await MotvApiService.customerSearch(userData.email);
          const emailLower = userData.email.toLowerCase();
          const found = search.success && search.customers?.find(c => 
            c.email?.toLowerCase() === emailLower || c.login?.toLowerCase() === emailLower
          );
          if (found?.viewers_id) {
            motvUserId = found.viewers_id;
            console.log('[UserRegistrationFlow] 🔎 Found existing MOTV user:', motvUserId);
          } else {
            return {
              success: false,
              requiresPasswordUpdate: true,
              message: 'Usuário já existe no portal. Por favor, tente fazer login ou recuperar sua senha.'
            };
          }
        } else {
          // Outro erro - tentar reautenticar para verificar se criou mesmo assim
          console.log('[UserRegistrationFlow] ⚠️ MOTV create returned error, attempting re-authentication...');
          const reauth = await MotvApiService.customerAuthenticate(userData.email, userData.password);
          
          if (reauth.success && reauth.viewersId) {
            motvUserId = reauth.viewersId;
            console.log('[UserRegistrationFlow] ✅ Re-authentication succeeded, user exists with id:', motvUserId);
          } else {
            // Se reauth falhou, tentar busca por email/login
            console.log('[UserRegistrationFlow] 🔎 Re-auth failed, attempting search fallback...');
            const search = await MotvApiService.customerSearch(userData.email);
            const emailLower = userData.email.toLowerCase();
            const found = search.success && search.customers?.find(c => 
              c.email?.toLowerCase() === emailLower || c.login?.toLowerCase() === emailLower
            );
            
            if (found?.viewers_id) {
              motvUserId = found.viewers_id;
              console.log('[UserRegistrationFlow] ✅ Search fallback succeeded, found user:', motvUserId);
            } else {
              const errorPayload = createResult.error ?? { message: createResult.message || 'Erro ao criar usuário no MOTV' };
              const errorInfo = MotvErrorHandler.handleError(errorPayload, 'criar usuário no portal', { createResult });
              return {
                success: false,
                message: MotvErrorHandler.formatUserMessage(errorInfo)
              };
            }
          }
        }
      }

      if (!motvUserId) {
        throw new Error('Falha ao obter ID do usuário no portal');
      }

      // PASSO 3: Atribuir plano no MOTV ANTES de criar usuário local
      if (userData.selectedPlanId) {
        try {
          console.log('[UserRegistrationFlow] 📦 Assigning plan in MOTV before local creation...');
          await this.managePlanInMotv(motvUserId, userData.selectedPlanId);
          motvPlanAssigned = true;
        } catch (e) {
          console.error('[UserRegistrationFlow] ❌ Failed to assign plan in MOTV before local creation', e);
          throw e;
        }
      } else {
        console.log('[UserRegistrationFlow] ℹ️ No plan selected, skipping MOTV plan assignment');
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

      // Associar plano local (se selecionado) e, em seguida, atribuir plano no MOTV
      if (userData.selectedPlanId) {
        await this.assignPackageToUser(localUserId, userData.selectedPlanId);
        try {
          if (!motvPlanAssigned) {
            console.log('[UserRegistrationFlow] 📦 Now assigning plan in MOTV...');
            await this.managePlanInMotv(motvUserId, userData.selectedPlanId);
          } else {
            console.log('[UserRegistrationFlow] ℹ️ Plan already assigned in MOTV earlier');
          }
        } catch (e) {
          console.error('[UserRegistrationFlow] ❌ Failed to assign plan in MOTV after local subscription', e);
          throw e;
        }
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
  // Helper: resolver código do pacote (products_id) para um plano
  private static async getPackageCodeForPlan(planId: string): Promise<string> {
    console.log('[UserRegistrationFlow] 🔎 Resolving package code for plan:', planId);

    // Buscar plano básico
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, package_id')
      .eq('id', planId)
      .maybeSingle();

    console.log('[UserRegistrationFlow] 🧭 Plan base result:', { plan, planError });

    if (planError) {
      console.error('[UserRegistrationFlow] ❌ Error fetching plan:', planError);
      throw new Error('Erro ao buscar informações do plano');
    }

    if (!plan) {
      console.error('[UserRegistrationFlow] ❌ Plan not found:', planId);
      throw new Error('Plano não encontrado');
    }

    // Tentar via coluna direta package_id
    if ((plan as any).package_id) {
      const { data: pkg, error: pkgError } = await supabase
        .from('packages')
        .select('code, active, suspension_package')
        .eq('id', (plan as any).package_id)
        .maybeSingle();

      console.log('[UserRegistrationFlow] 🧭 Package via plan.package_id:', { pkg, pkgError });

      if (pkgError) {
        console.error('[UserRegistrationFlow] ❌ Error fetching package:', pkgError);
        throw new Error('Erro ao buscar informações do pacote');
      }

      if ((pkg as any)?.code) {
        return String((pkg as any).code);
      }
    }

    // Fallback: relação many-to-many via plan_packages
    const { data: planPkgs, error: ppError } = await supabase
      .from('plan_packages')
      .select('package_id, packages:package_id(code, active, suspension_package)')
      .eq('plan_id', planId);

    console.log('[UserRegistrationFlow] 🧭 plan_packages result:', { planPkgs, ppError });

    if (ppError) {
      console.error('[UserRegistrationFlow] ❌ Error fetching plan packages:', ppError);
      throw new Error('Erro ao buscar pacotes do plano');
    }

    const candidates = (planPkgs || []).map((pp: any) => (pp as any).packages).filter(Boolean);
    const preferred = candidates.find((p: any) => p.active === true && p.suspension_package !== true) || candidates[0];

    const packageCode = (preferred as any)?.code;

    if (!packageCode) {
      console.error('[UserRegistrationFlow] ❌ No package code found for plan. Plan packages data:', JSON.stringify(planPkgs));
      throw new Error('Código do pacote não configurado. Por favor, configure o código do pacote no plano antes de continuar.');
    }

    return String(packageCode);
  }

  private static async managePlanInMotv(motvUserId: number, planId: string): Promise<void> {
    console.log('[UserRegistrationFlow] 📦 Looking for package code for plan:', planId);

    // Resolver package_code do plano
    const packageCode = await this.getPackageCodeForPlan(planId);
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
    console.log('[UserRegistrationFlow] ➕ Creating new plan with motvUserId:', motvUserId, 'productsId:', packageCode);
    const productsId = parseInt(packageCode, 10);
    
    if (isNaN(productsId)) {
      console.error('[UserRegistrationFlow] ❌ Invalid products_id:', packageCode);
      throw new Error('Código do pacote inválido');
    }

    console.log('[UserRegistrationFlow] 📤 Calling planCreate with viewersId:', motvUserId, 'productsId:', productsId);
    const createPlanResult = await MotvApiService.planCreate(motvUserId, productsId);
    console.log('[UserRegistrationFlow] 📥 Plan creation result:', createPlanResult);

    if (!createPlanResult.success) {
      console.error('[UserRegistrationFlow] ❌ Failed to create plan:', createPlanResult.message, 'Error code:', createPlanResult.error);
      throw new Error(createPlanResult.message || 'Erro ao atribuir plano no portal');
    }

    console.log('[UserRegistrationFlow] ✅ Plan assigned successfully in portal');
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
