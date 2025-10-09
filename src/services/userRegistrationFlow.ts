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
        // Se erro 104 (usuário já existe na MOTV) OU mensagem de email já em uso
        const isEmailAlreadyUsed = motvUserResult.error === 104 || 
          (motvUserResult.message && motvUserResult.message.toLowerCase().includes('already being used'));
        
        if (isEmailAlreadyUsed) {
          console.log('User already exists in MOTV, checking if user exists locally...');
          
          // Verificar se usuário já existe localmente
          const existsLocally = await this.checkUserExistsInSystem(userData.email);
          
          if (existsLocally.exists) {
            // Usuário já existe completamente - orientar para login
            return {
              success: false,
              message: 'Este e-mail já está cadastrado. Por favor, faça login ou clique em "Esqueci minha senha" para recuperar seu acesso.'
            };
          }
          
          // Existe na MOTV mas não localmente - tentar sincronizar
          return await this.handleExistingMotvUser(userData);
        }
        
        // Outros erros da MOTV
        throw new Error(motvUserResult.message || 'Erro ao criar usuário na MOTV');
      }

      console.log('User created in MOTV successfully:', motvUserResult.viewersId);

      // 3. Aplicar plano na MOTV usando o código do pacote
      let planCode: string | null = null;
      
      if (userData.selectedPlanId) {
        console.log('[UserRegistrationFlow] Looking for package code for plan:', userData.selectedPlanId);
        
        const { data: plan, error: planError } = await supabase
          .from('plans')
          .select('id, name, package_id, packages!inner(id, code, name)')
          .eq('id', userData.selectedPlanId)
          .single();

        console.log('[UserRegistrationFlow] Plan query result:', { plan, planError });

        if (planError) {
          console.error('[UserRegistrationFlow] Error fetching plan:', planError);
        }

        if (plan?.packages?.code) {
          planCode = plan.packages.code;
          console.log('[UserRegistrationFlow] Found package code:', planCode, 'for plan:', plan.name);
          
          // Cancelar planos existentes e aplicar novo
          console.log('[UserRegistrationFlow] Canceling existing plans for viewers_id:', motvUserResult.viewersId);
          await this.cancelAllPlansInMotv(motvUserResult.viewersId!);
          
          console.log('[UserRegistrationFlow] Subscribing to package:', planCode);
          await this.subscribePlanInMotv(motvUserResult.viewersId!, planCode);
          console.log('[UserRegistrationFlow] Plan applied successfully in MOTV');
        } else {
          console.warn('[UserRegistrationFlow] No package code found for plan:', userData.selectedPlanId);
        }
      }

      if (!planCode) {
        // Fallback: aplicar pacote padrão (861) quando não houver código vinculado
        try {
          const fallbackCode = '861';
          console.log('[UserRegistrationFlow] No package code found, applying fallback code:', fallbackCode);
          await this.cancelAllPlansInMotv(motvUserResult.viewersId!);
          await this.subscribePlanInMotv(motvUserResult.viewersId!, fallbackCode);
          planCode = fallbackCode;
        } catch (e) {
          console.error('[UserRegistrationFlow] Failed to apply fallback package 861:', e);
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

        // 5. Auto-login primeiro para satisfazer políticas RLS
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

        // 6. Associar plano no Supabase (já autenticado)
        if (userData.selectedPlanId) {
          await this.assignPackageToUser(supabaseUserId, userData.selectedPlanId);
        }

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
    console.log('[handleExistingMotvUser] Starting for email:', userData.email);
    
    // Primeiro, tentar buscar o usuário na MOTV pelo email
    const findResult = await this.findCustomerByEmail(userData.email);
    
    let motvUserId: number | null = null;
    
    if (findResult.success && findResult.viewersId) {
      console.log('[handleExistingMotvUser] Found existing MOTV user:', findResult.viewersId);
      motvUserId = findResult.viewersId;
    } else {
      // Se não encontrou, tentar autenticar
      console.log('[handleExistingMotvUser] Customer not found, trying authentication...');
      const authResult = await this.authenticateUserInMotv(userData.email, userData.password);
      
      if (!authResult.success) {
        // Não conseguiu nem encontrar nem autenticar
        console.log('[handleExistingMotvUser] Authentication failed');
        return {
          success: false,
          message: 'Este e-mail já está cadastrado. Por favor, faça login ou clique em "Esqueci minha senha" para recuperar seu acesso.'
        };
      }
      
      motvUserId = authResult.viewersId!;
    }

    console.log('[handleExistingMotvUser] MOTV user ID:', motvUserId);

    // Verificar se já existe localmente
    const existsLocally = await this.checkUserExistsInSystem(userData.email);
    
    if (existsLocally.exists) {
      // Já existe no Supabase também
      console.log('[handleExistingMotvUser] User exists both in MOTV and locally');
      return {
        success: false,
        message: 'Este e-mail já está cadastrado. Por favor, faça login ou clique em "Esqueci minha senha" para recuperar seu acesso.'
      };
    }

    // Existe na MOTV mas não localmente: aplicar plano na MOTV e criar usuário local
    console.log('[handleExistingMotvUser] User exists in MOTV but not locally, applying plan...');
    
    try {
      // 1. Aplicar plano na MOTV
      let planCode: string | null = null;
      
      if (userData.selectedPlanId) {
        console.log('[handleExistingMotvUser] Looking for package code for plan:', userData.selectedPlanId);
        
        const { data: plan, error: planError } = await supabase
          .from('plans')
          .select('id, name, package_id, packages!inner(id, code, name)')
          .eq('id', userData.selectedPlanId)
          .single();

        if (plan?.packages?.code) {
          planCode = plan.packages.code;
          console.log('[handleExistingMotvUser] Found package code:', planCode);
          
          // Cancelar planos existentes e aplicar novo
          console.log('[handleExistingMotvUser] Canceling existing plans for viewers_id:', motvUserId);
          await this.cancelAllPlansInMotv(motvUserId);
          
          console.log('[handleExistingMotvUser] Subscribing to package:', planCode);
          await this.subscribePlanInMotv(motvUserId, planCode);
          console.log('[handleExistingMotvUser] Plan applied successfully in MOTV');
        }
      }

      // Fallback para pacote padrão se não tiver código
      if (!planCode) {
        const fallbackCode = '861';
        console.log('[handleExistingMotvUser] No package code found, applying fallback code:', fallbackCode);
        await this.cancelAllPlansInMotv(motvUserId);
        await this.subscribePlanInMotv(motvUserId, fallbackCode);
        planCode = fallbackCode;
      }

      // 2. Criar usuário local
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

      // 3. Auto-login e associar plano local
      await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });

      if (userData.selectedPlanId) {
        await this.assignPackageToUser(localUserId, userData.selectedPlanId);
      }

      return {
        success: true,
        message: 'Cadastro sincronizado com sucesso!',
        userId: localUserId
      };

    } catch (error: any) {
      console.error('[handleExistingMotvUser] Error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao sincronizar cadastro. Por favor, tente novamente.'
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
      console.log('[UserRegistrationFlow] MOTV createCustomer result:', result);

      // Se result for string, retornar como erro
      if (typeof result === 'string') {
        return { success: false, message: result };
      }
      
      // Erro 104: usuário já existe
      if (result?.error === 104 || result?.code === 104) {
        return { success: false, error: 104, message: 'User already exists' };
      }

      // Aceitar status como 1 ou "1"
      const status = typeof result?.status === 'number' ? result.status : parseInt(result?.status);
      
      // Sucesso - aceitar viewers_id de múltiplas possíveis localizações
      if (status === 1) {
        const rawId = result?.data?.viewers_id ?? result?.response ?? result?.viewers_id ?? result?.data?.response;
        
        if (rawId != null) {
          const viewersId = typeof rawId === 'number' ? rawId : parseInt(String(rawId));
          
          if (!isNaN(viewersId)) {
            console.log('[UserRegistrationFlow] MOTV user created successfully, viewers_id:', viewersId);
            return {
              success: true,
              viewersId
            };
          }
        }
      }

      // Extrair mensagem de erro amigável
      const errorMsg = result?.message || result?.error_message || result?.data?.message || 'Erro ao criar usuário na MOTV';
      return {
        success: false,
        message: errorMsg
      };

    } catch (error: any) {
      console.error('Error creating user in MOTV:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Buscar cliente na MOTV pelo email
   */
  private static async findCustomerByEmail(email: string) {
    try {
      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'findCustomer',
          payload: {
            email: email
          }
        }
      });

      if (error) throw error;

      const result = data?.result;
      console.log('[findCustomerByEmail] Result:', result);
      
      // Aceitar status como number ou string "1"
      const status = typeof result?.status === 'number' ? result.status : parseInt(result?.status);
      
      if (status === 1) {
        const rawId = result?.data?.viewers_id ?? result?.response ?? result?.viewers_id;
        
        if (rawId != null) {
          const viewersId = typeof rawId === 'number' ? rawId : parseInt(String(rawId));
          
          if (!isNaN(viewersId)) {
            return {
              success: true,
              viewersId
            };
          }
        }
      }

      return { success: false };

    } catch (error) {
      console.error('Error finding customer in MOTV:', error);
      return { success: false };
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
      
      // Aceitar status como number ou string "1"
      const status = typeof result?.status === 'number' ? result.status : parseInt(result?.status);
      
      if (status === 1) {
        const rawId = result?.data?.viewers_id ?? result?.response ?? result?.viewers_id;
        
        if (rawId != null) {
          const viewersId = typeof rawId === 'number' ? rawId : parseInt(String(rawId));
          
          if (!isNaN(viewersId)) {
            return {
              success: true,
              viewersId
            };
          }
        }
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
      console.log('[UserRegistrationFlow] 🚫 Canceling all plans for viewers_id:', viewersId);
      
      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'cancelAll',
          viewers_id: viewersId
        }
      });

      if (error) {
        console.error('[UserRegistrationFlow] ❌ Edge function error on cancelAll:', error);
        throw error;
      }
      
      const result = data?.result;
      console.log('[UserRegistrationFlow] 📋 cancelAllPlansInMotv full result:', JSON.stringify(result, null, 2));
      
      const status = typeof result?.status === 'number' ? result.status : parseInt(result?.status);
      if (status !== 1) {
        const errorMsg = result?.message || result?.error_message || 'Erro ao cancelar planos na MOTV';
        console.error('[UserRegistrationFlow] ❌ Cancel failed with status:', status, 'message:', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('[UserRegistrationFlow] ✅ Plans canceled successfully');
      return result;
    } catch (error) {
      console.error('[UserRegistrationFlow] ❌ Error canceling plans in MOTV:', error);
      throw error;
    }
  }

  /**
   * Aplicar plano na MOTV
   */
  private static async subscribePlanInMotv(viewersId: number, planCode: string) {
    try {
      console.log('[UserRegistrationFlow] 📦 Subscribing plan - viewers_id:', viewersId, 'package_code:', planCode);
      
      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'subscribe',
          payload: {
            viewers_id: viewersId,
            products_id: planCode
          }
        }
      });

      if (error) {
        console.error('[UserRegistrationFlow] ❌ Edge function error on subscribe:', error);
        throw error;
      }
      
      const result = data?.result;
      console.log('[UserRegistrationFlow] 📋 subscribePlanInMotv full result:', JSON.stringify(result, null, 2));
      
      const status = typeof result?.status === 'number' ? result.status : parseInt(result?.status);
      if (status !== 1) {
        const errorMsg = result?.message || result?.error_message || 'Erro ao assinar plano na MOTV';
        console.error('[UserRegistrationFlow] ❌ Subscribe failed with status:', status, 'message:', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('[UserRegistrationFlow] ✅ Plan subscribed successfully to package:', planCode);
      return result;
    } catch (error) {
      console.error('[UserRegistrationFlow] ❌ Error subscribing plan in MOTV:', error);
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
      console.log('[UserRegistrationFlow] Calling auth-register with:', { 
        email: data.email, 
        name: data.name, 
        motv_user_id: data.motv_user_id 
      });

      const { data: result, error } = await supabase.functions.invoke('auth-register', {
        body: data
      });

      console.log('[UserRegistrationFlow] auth-register response:', { 
        success: result?.success, 
        error: error?.message || result?.error,
        user_id: result?.user_id 
      });

      if (error) {
        console.error('[UserRegistrationFlow] Edge function error:', error);
        return { success: false, error: error.message };
      }

      if (!result?.success) {
        console.error('[UserRegistrationFlow] Registration failed:', result?.error);
        return { success: false, error: result?.error || 'Falha ao criar usuário' };
      }

      return result;

    } catch (error: any) {
      console.error('[UserRegistrationFlow] Exception creating user in system:', error);
      return { success: false, error: error.message || 'Erro ao criar usuário no sistema' };
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
