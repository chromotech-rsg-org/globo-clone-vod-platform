import { supabase } from "@/integrations/supabase/client";
import { MotvIntegrationService } from "./motvIntegration";

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
  requiresPasswordReset?: boolean;
  userId?: string;
  motvUserId?: string;
  autoLogin?: boolean;
}

export interface MotvUserData {
  viewers_id: number;
  email: string;
  name: string;
  status?: string;
}

export interface MotvPlanHistory {
  status: number;
  data?: {
    plans?: Array<{
      package_code: string;
      status: string;
      start_date: string;
      end_date?: string;
    }>;
  };
}

/**
 * Serviço de fluxo completo de registro de usuário
 * Integra criação MOTV + Supabase Auth de forma transacional
 */
export class UserRegistrationFlowService {
  /**
   * Fluxo principal de registro
   */
  public static async registerUser(userData: RegistrationData): Promise<RegistrationResult> {
    console.log('Starting user registration flow for:', userData.email);

    try {
      // 1. Verificar se integração MOTV está configurada
      const motvConfigured = await MotvIntegrationService.checkIntegrationConfigured();
      if (!motvConfigured) {
        throw new Error('Configurações de integração MOTV não encontradas. Verifique as configurações no painel administrativo.');
      }

      // 2. Tentar criar usuário na MOTV
      const motvUserResult = await this.createUserInMotv(userData);
      
      if (!motvUserResult.success) {
        // Se erro 104 (usuário já existe na MOTV)
        if (motvUserResult.error === 104) {
          console.log('User already exists in MOTV (error 104), attempting authentication...');
          return await this.handleExistingMotvUser(userData);
        }
        
        // Outros erros da MOTV
        throw new Error(motvUserResult.message || 'Erro ao criar usuário na MOTV');
      }

      console.log('User created in MOTV successfully:', motvUserResult.viewersId);

      // 3. Aplicar plano na MOTV (ou pacote de suspensão)
      let planCode: string | null = null;
      
      if (userData.selectedPlanId) {
        const { data: plan } = await supabase
          .from('plans')
          .select('package_id, packages(code)')
          .eq('id', userData.selectedPlanId)
          .single();

        if (plan?.packages?.code) {
          planCode = plan.packages.code;
          console.log('Applying plan in MOTV:', planCode);
          
          // Cancelar planos existentes e aplicar novo
          await this.cancelAllPlansInMotv(motvUserResult.viewersId!);
          await this.subscribePlanInMotv(motvUserResult.viewersId!, planCode);
        }
      }

      if (!planCode) {
        // Sem plano selecionado: aplicar pacote de suspensão
        const suspensionPackage = await this.getSuspensionPackage();
        if (suspensionPackage) {
          console.log('Applying suspension package:', suspensionPackage.code);
          await this.subscribePlanInMotv(motvUserResult.viewersId!, suspensionPackage.code);
        }
      }

      // 4. Criar usuário no Supabase (apenas após sucesso na MOTV)
      let supabaseUserId: string | null = null;
      try {
        const createResult = await this.createUserInSystem({
          email: userData.email,
          password: userData.password,
          name: userData.name,
          cpf: userData.cpf,
          phone: userData.phone,
          motv_user_id: motvUserResult.viewersId?.toString()
        });

        if (!createResult.success) {
          throw new Error(createResult.error || 'Falha ao criar usuário no sistema');
        }

        supabaseUserId = createResult.user_id!;
        console.log('User created in Supabase:', supabaseUserId);

        // 5. Associar plano no Supabase
        if (userData.selectedPlanId) {
          await this.assignPackageToUser(supabaseUserId, userData.selectedPlanId);
        }

        // 6. Auto-login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        });

        if (signInError) {
          console.error('Auto-login failed:', signInError);
          return {
            success: true,
            message: 'Cadastro realizado com sucesso! Por favor, faça login.',
            requiresPasswordReset: false
          };
        }

        return {
          success: true,
          message: 'Cadastro realizado com sucesso!',
          userId: supabaseUserId
        };

      } catch (supabaseError) {
        // Rollback: deletar usuário do Supabase se criação falhou
        if (supabaseUserId) {
          console.error('Supabase error after creation, rolling back...', supabaseError);
          await this.deleteUserFromSystem(supabaseUserId);
        }
        throw supabaseError;
      }

    } catch (error: any) {
      console.error('Registration flow error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao processar cadastro. Por favor, tente novamente.'
      };
    }
  }

  /**
   * Trata usuário que já existe na MOTV (erro 104)
   */
  private static async handleExistingMotvUser(userData: RegistrationData): Promise<RegistrationResult> {
    // Tentar autenticar na MOTV com credenciais fornecidas
    const authResult = await this.authenticateUserInMotv(userData.email, userData.password);
    
    if (!authResult.success) {
      // Autenticação falhou: usuário existe mas senha está errada
      console.log('MOTV authentication failed for existing user');
      return {
        success: false,
        message: 'Este e-mail já está cadastrado. Você pode fazer login ou usar "Esqueci minha senha" se não lembra da senha.'
      };
    }

    console.log('MOTV authentication successful, checking local user...');
    const motvUserId = authResult.viewersId!;

    // Verificar se já existe localmente
    const existsLocally = await this.checkUserExistsInSystem(userData.email);
    
    if (existsLocally.exists) {
      // Já existe no Supabase também
      console.log('User exists both in MOTV and locally');
      return {
        success: false,
        message: 'Este e-mail já está cadastrado. Você pode fazer login ou usar "Esqueci minha senha" se não lembra da senha.'
      };
    }

    // Existe na MOTV mas não localmente: criar usuário local e mapear plano
    console.log('User exists in MOTV but not locally, creating local user...');
    
    try {
      const createResult = await this.createUserInSystem({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        cpf: userData.cpf,
        phone: userData.phone,
        motv_user_id: motvUserId.toString()
      });

      if (!createResult.success) {
        throw new Error(createResult.error || 'Falha ao criar usuário local');
      }

      const localUserId = createResult.user_id!;

      // Buscar plano existente na MOTV
      const planHistory = await this.getPlanHistoryFromMotv(motvUserId);
      
      if (planHistory?.status === 1 && planHistory.data?.plans?.length) {
        const activePlan = planHistory.data.plans.find(p => p.status === 'active');
        if (activePlan) {
          const { data: existingPackage } = await supabase
            .from('packages')
            .select('id')
            .eq('code', activePlan.package_code)
            .eq('active', true)
            .single();

          if (existingPackage) {
            const { data: localPlan } = await supabase
              .from('plans')
              .select('id')
              .eq('package_id', existingPackage.id)
              .eq('active', true)
              .single();

            if (localPlan) {
              await this.assignPackageToUser(localUserId, localPlan.id);
            }
          }
        }
      }

      // Auto-login
      await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });

      return {
        success: true,
        message: 'Cadastro sincronizado com sucesso!',
        userId: localUserId
      };

    } catch (error: any) {
      console.error('Error creating local user for existing MOTV user:', error);
      return {
        success: false,
        message: 'Erro ao sincronizar cadastro. Por favor, faça login ou entre em contato com o suporte.'
      };
    }
  }

  /**
   * Criar usuário na MOTV via motv-proxy
   */
  private static async createUserInMotv(userData: RegistrationData) {
    try {
      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'createCustomer',
          payload: {
            name: userData.name,
            login: userData.email,
            password: userData.password,
            email: userData.email,
            cpf: userData.cpf || '',
            phone: userData.phone || ''
          }
        }
      });

      if (error) throw error;

      const result = data?.result;
      
      // Erro 104: usuário já existe
      if (result?.error === 104 || result?.code === 104) {
        return { success: false, error: 104, message: 'User already exists' };
      }

      // Sucesso
      if (result?.status === 1 && result?.data?.viewers_id) {
        return {
          success: true,
          viewersId: result.data.viewers_id
        };
      }

      return {
        success: false,
        message: result?.message || 'Erro desconhecido ao criar usuário na MOTV'
      };

    } catch (error: any) {
      console.error('Error creating user in MOTV:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Autenticar usuário na MOTV
   */
  private static async authenticateUserInMotv(email: string, password: string) {
    try {
      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'apiLogin',
          payload: {
            login: email,
            password: password
          }
        }
      });

      if (error) throw error;

      const result = data?.result;
      
      if (result?.status === 1 && result?.data?.viewers_id) {
        return {
          success: true,
          viewersId: result.data.viewers_id
        };
      }

      return { success: false };

    } catch (error) {
      console.error('Error authenticating in MOTV:', error);
      return { success: false };
    }
  }

  /**
   * Buscar histórico de planos na MOTV
   */
  private static async getPlanHistoryFromMotv(viewersId: number): Promise<MotvPlanHistory | null> {
    try {
      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'getPlanInfo',
          payload: { viewers_id: viewersId }
        }
      });

      if (error) throw error;

      const result = data?.result;
      if (result?.status === 1) {
        return result;
      }

      return null;

    } catch (error) {
      console.error('Error getting plan history from MOTV:', error);
      return null;
    }
  }

  /**
   * Cancelar todos os planos na MOTV
   */
  private static async cancelAllPlansInMotv(viewersId: number) {
    try {
      await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'cancelAll',
          payload: { viewers_id: viewersId }
        }
      });
    } catch (error) {
      console.error('Error canceling plans in MOTV:', error);
    }
  }

  /**
   * Aplicar plano na MOTV
   */
  private static async subscribePlanInMotv(viewersId: number, planCode: string) {
    try {
      await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'subscribe',
          payload: {
            viewers_id: viewersId,
            products_id: planCode
          }
        }
      });
    } catch (error) {
      console.error('Error subscribing plan in MOTV:', error);
      throw error;
    }
  }

  /**
   * Criar usuário no Supabase via Edge Function
   */
  private static async createUserInSystem(data: {
    email: string;
    password: string;
    name: string;
    cpf?: string;
    phone?: string;
    motv_user_id?: string;
  }) {
    try {
      const { data: result, error } = await supabase.functions.invoke('auth-register', {
        body: data
      });

      if (error) throw error;
      return result;

    } catch (error: any) {
      console.error('Error creating user in system:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar se usuário existe no sistema
   */
  private static async checkUserExistsInSystem(email: string) {
    try {
      const { data, error } = await supabase.functions.invoke('auth-check-user', {
        body: { email }
      });

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error checking user existence:', error);
      return { exists: false };
    }
  }

  /**
   * Deletar usuário do sistema (rollback)
   */
  private static async deleteUserFromSystem(userId: string) {
    try {
      await supabase.functions.invoke('auth-delete-user', {
        body: { user_id: userId }
      });
    } catch (error) {
      console.error('Error deleting user from system:', error);
    }
  }

  /**
   * Buscar pacote de suspensão
   */
  private static async getSuspensionPackage() {
    const { data } = await supabase
      .from('packages')
      .select('*')
      .eq('suspension_package', true)
      .eq('active', true)
      .single();

    return data;
  }

  /**
   * Associar plano ao usuário no Supabase
   */
  private static async assignPackageToUser(userId: string, planId: string) {
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        start_date: new Date().toISOString()
      });

    if (error) {
      console.error('Error assigning package to user:', error);
      throw error;
    }
  }
}
