import { supabase } from "@/integrations/supabase/client";
import { MotvIntegrationService } from "./motvIntegration";
import CryptoJS from "crypto-js";

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

export class UserRegistrationFlowService {
  private static settings: any = null;

  // Carrega as configurações da integração
  private static async loadSettings() {
    if (!this.settings) {
      this.settings = await MotvIntegrationService.getIntegrationSettings();
      
      if (!this.settings) {
        throw new Error('Configurações de integração MOTV não encontradas. Verifique as configurações no painel administrativo.');
      }

      if (!this.settings.api_base_url) {
        throw new Error('URL da API MOTV não configurada. Verifique as configurações no painel administrativo.');
      }
    }
    return this.settings;
  }

  // Gera token de autenticação para API MOTV
  private static generateAuthToken(login?: string, secret?: string): string {
    const apiLogin = login || this.settings?.api_login || "agroplay.api";
    const apiSecret = secret || this.settings?.api_secret || "ldkjgeo29vkg99133xswrt48rq3sqyf6q4r58f8h";
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToHash = timestamp + apiLogin + apiSecret;
    const tokenHash = CryptoJS.SHA1(stringToHash).toString();
    return apiLogin + ":" + timestamp + ":" + tokenHash;
  }

  // Verifica se usuário existe no MOTV
  private static async checkUserExistsInMotv(email: string): Promise<{ exists: boolean; userData?: MotvUserData; error104?: boolean }> {
    try {
      const settings = await this.loadSettings();
      
      if (!settings || !settings.api_base_url) {
        throw new Error('Configurações da API MOTV não estão disponíveis');
      }

      console.log('Checking user in MOTV:', email);
      
      const authToken = this.generateAuthToken();
      
      const response = await fetch(`${settings.api_base_url}/api/customer/getDataV2`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(authToken)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            email: email
          }
        })
      });

      const result = await response.json();
      
      // Error 104 = user already exists
      if (result.error === 104) {
        console.log('User exists in MOTV (error 104)');
        return { exists: true, error104: true };
      }
      
      if (response.ok && result.status === 1 && result.data?.viewers_id) {
        return {
          exists: true,
          userData: {
            viewers_id: result.data.viewers_id,
            email: result.data.email,
            name: result.data.name,
            status: result.data.status
          }
        };
      }
      
      return { exists: false };
    } catch (error) {
      console.error('Error checking user in MOTV:', error);
      return { exists: false };
    }
  }

  // Autentica usuário no MOTV
  private static async authenticateUserInMotv(email: string, password: string): Promise<{ success: boolean; viewersId?: number }> {
    try {
      const settings = await this.loadSettings();
      const authToken = this.generateAuthToken();
      
      const response = await fetch(`${settings.api_base_url}/api/devices/motv/apiLoginV2`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(authToken)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            login: email,
            password: password,
            vendors_id: settings.vendor_id || 6843842
          }
        })
      });

      const result = await response.json();
      
      if (response.ok && result.status === 1 && result.data?.viewers_id) {
        return { success: true, viewersId: result.data.viewers_id };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Error authenticating user in MOTV:', error);
      return { success: false };
    }
  }

  // Busca histórico de planos do usuário no MOTV
  private static async getPlanHistoryFromMotv(viewersId: number): Promise<MotvPlanHistory> {
    try {
      const settings = await this.loadSettings();
      const authToken = this.generateAuthToken();
      
      const response = await fetch(`${settings.api_base_url}/api/subscription/getCustomerSubscriptionInfo`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(authToken)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            viewers_id: viewersId
          }
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting plan history from MOTV:', error);
      return { status: 0 };
    }
  }

  // Cria usuário no MOTV
  private static async createUserInMotv(userData: RegistrationData): Promise<{ success: boolean; viewersId?: number; error104?: boolean }> {
    try {
      const settings = await this.loadSettings();
      const authToken = this.generateAuthToken();
      
      const response = await fetch(`${settings.api_base_url}/api/integration/createMotvCustomer`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(authToken)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            name: userData.name,
            login: userData.email,
            password: userData.password,
            email: userData.email,
            cpf: userData.cpf || "",
            phone: userData.phone || ""
          }
        })
      });

      const result = await response.json();
      
      // Error 104 = user already exists
      if (result.error === 104) {
        console.log('Error 104: User already exists in MOTV');
        return { success: false, error104: true };
      }
      
      if (response.ok && result.status === 1 && result.data?.viewers_id) {
        return {
          success: true,
          viewersId: result.data.viewers_id
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Error creating user in MOTV:', error);
      return { success: false };
    }
  }

  // Cria usuário no sistema usando Edge Function
  private static async createUserInSystem(userData: RegistrationData, motvUserId?: string): Promise<string | null> {
    try {
      console.log('Creating user in system via Edge Function');
      
      const { data, error } = await supabase.functions.invoke('auth-register', {
        body: {
          email: userData.email,
          password: userData.password,
          name: userData.name,
          cpf: userData.cpf || null,
          phone: userData.phone || null,
          motv_user_id: motvUserId || null
        }
      });

      if (error) {
        console.error('Error calling auth-register:', error);
        return null;
      }

      if (!data.success) {
        console.error('auth-register returned error:', data.error);
        return null;
      }

      console.log('User created successfully:', data.user_id);
      return data.user_id;
    } catch (error) {
      console.error('Error creating user in system:', error);
      return null;
    }
  }

  // Verifica se usuário existe no sistema usando Edge Function
  private static async checkUserExistsInSystem(email: string): Promise<{ exists: boolean; userId?: string }> {
    try {
      console.log('Checking if user exists in system via Edge Function');
      
      const { data, error } = await supabase.functions.invoke('auth-check-user', {
        body: { email }
      });

      if (error) {
        console.error('Error calling auth-check-user:', error);
        return { exists: false };
      }

      if (!data.success) {
        console.error('auth-check-user returned error:', data.error);
        return { exists: false };
      }

      return { exists: data.exists, userId: data.user_id };
    } catch (error) {
      console.error('Error checking user in system:', error);
      return { exists: false };
    }
  }

  // Deleta usuário do sistema usando Edge Function
  private static async deleteUserFromSystem(userId: string): Promise<void> {
    try {
      console.log('Deleting user from system via Edge Function:', userId);
      
      const { data, error } = await supabase.functions.invoke('auth-delete-user', {
        body: { user_id: userId }
      });

      if (error) {
        console.error('Error calling auth-delete-user:', error);
      }

      if (data && !data.success) {
        console.error('auth-delete-user returned error:', data.error);
      }
    } catch (error) {
      console.error('Error in deleteUserFromSystem:', error);
    }
  }

  // Cancela todos os planos do usuário no MOTV
  private static async cancelAllPlansInMotv(viewersId: number): Promise<boolean> {
    try {
      const settings = await this.loadSettings();
      const authToken = this.generateAuthToken();
      
      const response = await fetch(`${settings.api_base_url}/api/integration/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(authToken)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            viewers_id: viewersId
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error canceling plans in MOTV:', error);
      return false;
    }
  }

  // Cria plano para usuário no MOTV
  private static async subscribePlanInMotv(viewersId: number, planCode: string): Promise<boolean> {
    try {
      const settings = await this.loadSettings();
      const authToken = this.generateAuthToken();
      
      const response = await fetch(`${settings.api_base_url}/api/integration/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(authToken)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            viewers_id: viewersId,
            products_id: planCode
          }
        })
      });

      const result = await response.json();
      return response.ok && result.status === 1;
    } catch (error) {
      console.error('Error subscribing plan in MOTV:', error);
      return false;
    }
  }

  // Busca pacote de suspensão
  private static async getSuspensionPackage(): Promise<any> {
    try {
      const { data: suspensionPackage } = await supabase
        .from('packages')
        .select('*')
        .eq('suspension_package', true)
        .eq('active', true)
        .single();

      return suspensionPackage;
    } catch (error) {
      console.error('Error getting suspension package:', error);
      return null;
    }
  }

  // Atribui pacote ao usuário no nosso sistema
  private static async assignPackageToUser(userId: string, packageId: string): Promise<boolean> {
    try {
      // Busca um plano associado ao pacote
      const { data: plan } = await supabase
        .from('plans')
        .select('id')
        .eq('package_id', packageId)
        .eq('active', true)
        .single();

      if (!plan) {
        console.error('No plan found for package:', packageId);
        return false;
      }

      // Cria a assinatura
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: plan.id,
          status: 'active',
          start_date: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Error assigning package to user:', error);
      return false;
    }
  }

  // Fluxo principal de cadastro
  public static async registerUser(userData: RegistrationData): Promise<RegistrationResult> {
    let systemUserId: string | null = null;
    
    try {
      console.log('Starting user registration flow for:', userData.email);
      
      // 1. Verificar configuração da integração MOTV (obrigatório)
      try {
        await this.loadSettings();
      } catch (error) {
        console.error('MOTV integration not configured:', error);
        return { 
          success: false, 
          message: 'Configuração da integração MOTV não encontrada. Configure no painel administrativo.' 
        };
      }
      
      // 2. Tentar criar usuário no MOTV primeiro
      console.log('Attempting to create user in MOTV');
      const motvCreationResult = await this.createUserInMotv(userData);
      
      // 3. Se recebeu erro 104 (usuário já existe no MOTV)
      if (motvCreationResult.error104) {
        console.log('User already exists in MOTV (error 104), attempting authentication');
        
        // 3.1 Tentar autenticar com as credenciais fornecidas
        const authResult = await this.authenticateUserInMotv(userData.email, userData.password);
        
        if (authResult.success && authResult.viewersId) {
          console.log('Authentication successful');
          
          // 3.2 Verificar se usuário já existe no sistema local
          const localUserCheck = await this.checkUserExistsInSystem(userData.email);
          
          if (localUserCheck.exists) {
            console.log('User already exists in local system');
            return {
              success: false,
              message: 'Este e-mail já está cadastrado. Você pode fazer login ou usar "Esqueci minha senha" se não lembra da senha.'
            };
          }
          
          // 3.3 Criar usuário no sistema local
          console.log('Creating user in local system');
          systemUserId = await this.createUserInSystem(userData, authResult.viewersId.toString());
          
          if (!systemUserId) {
            return { 
              success: false, 
              message: 'Erro ao criar usuário no sistema. Tente novamente.' 
            };
          }

          // 3.4 Buscar histórico de planos e atribuir
          const planHistory = await this.getPlanHistoryFromMotv(authResult.viewersId);
          const suspensionPackage = await this.getSuspensionPackage();
          
          let packageAssigned = false;
          if (planHistory.status === 1 && planHistory.data?.plans?.length) {
            const activePlan = planHistory.data.plans.find(p => p.status === 'active');
            if (activePlan) {
              const { data: existingPackage } = await supabase
                .from('packages')
                .select('id')
                .eq('code', activePlan.package_code)
                .eq('active', true)
                .single();
              
              if (existingPackage) {
                packageAssigned = await this.assignPackageToUser(systemUserId, existingPackage.id);
              }
            }
          }
          
          if (!packageAssigned && suspensionPackage) {
            packageAssigned = await this.assignPackageToUser(systemUserId, suspensionPackage.id);
          }

          if (!packageAssigned) {
            // Rollback se não conseguiu atribuir pacote
            await this.deleteUserFromSystem(systemUserId);
            return {
              success: false,
              message: 'Erro ao configurar plano do usuário. Tente novamente.'
            };
          }

          // 3.5 Fazer login automático
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: userData.password
          });

          if (loginError) {
            console.error('Error during auto-login:', loginError);
          }

          return {
            success: true,
            message: 'Usuário já possui conta no MOTV. Login realizado com sucesso!',
            autoLogin: true,
            userId: systemUserId,
            motvUserId: authResult.viewersId.toString()
          };
        } else {
          // 3.6 Autenticação falhou - senha incorreta
          console.log('Authentication failed - incorrect password');
          return {
            success: false,
            message: 'Este e-mail já está cadastrado no MOTV, mas a senha está incorreta. Você pode fazer login ou usar "Esqueci minha senha".'
          };
        }
      }
      
      // 4. Se criação no MOTV falhou por outro motivo
      if (!motvCreationResult.success) {
        console.error('Failed to create user in MOTV');
        return { 
          success: false, 
          message: 'Erro ao criar usuário no MOTV. Tente novamente.' 
        };
      }
      
      // 5. Usuário criado com sucesso no MOTV - criar no sistema local
      console.log('User created successfully in MOTV:', motvCreationResult.viewersId);
      
      systemUserId = await this.createUserInSystem(userData, motvCreationResult.viewersId?.toString());
      
      if (!systemUserId) {
        return { 
          success: false, 
          message: 'Erro ao criar usuário no sistema. Contate o suporte.' 
        };
      }

      // 6. Atribuir plano selecionado ou pacote de suspensão
      try {
        if (userData.selectedPlanId) {
          // Buscar o código do pacote do plano
          const { data: selectedPlan } = await supabase
            .from('plans')
            .select('package_id, packages(code)')
            .eq('id', userData.selectedPlanId)
            .single();

          if (selectedPlan?.packages?.code) {
            // Cancelar planos existentes e aplicar novo
            await this.cancelAllPlansInMotv(motvCreationResult.viewersId!);
            const subscribed = await this.subscribePlanInMotv(motvCreationResult.viewersId!, selectedPlan.packages.code);
            
            if (!subscribed) {
              // Rollback: deletar usuário do Supabase
              await this.deleteUserFromSystem(systemUserId);
              return { 
                success: false, 
                message: 'Erro ao assinar plano na MOTV. Tente novamente.' 
              };
            }
            
            const packageAssigned = await this.assignPackageToUser(systemUserId, selectedPlan.package_id);
            
            if (!packageAssigned) {
              // Rollback
              await this.deleteUserFromSystem(systemUserId);
              return {
                success: false,
                message: 'Erro ao configurar plano no sistema. Tente novamente.'
              };
            }
          }
        } else {
          // Atribuir pacote de suspensão
          const suspensionPackage = await this.getSuspensionPackage();
          if (suspensionPackage) {
            if (suspensionPackage.code === "0") {
              await this.cancelAllPlansInMotv(motvCreationResult.viewersId!);
            } else {
              await this.cancelAllPlansInMotv(motvCreationResult.viewersId!);
              const subscribed = await this.subscribePlanInMotv(motvCreationResult.viewersId!, suspensionPackage.code);
              
              if (!subscribed) {
                // Rollback
                await this.deleteUserFromSystem(systemUserId);
                return { 
                  success: false, 
                  message: 'Erro ao configurar pacote de suspensão. Tente novamente.' 
                };
              }
            }
            
            const packageAssigned = await this.assignPackageToUser(systemUserId, suspensionPackage.id);
            
            if (!packageAssigned) {
              // Rollback
              await this.deleteUserFromSystem(systemUserId);
              return {
                success: false,
                message: 'Erro ao configurar pacote no sistema. Tente novamente.'
              };
            }
          }
        }

        // 7. Fazer login automático
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        });

        if (loginError) {
          console.error('Error during auto-login:', loginError);
        }

        return {
          success: true,
          message: 'Usuário criado com sucesso!',
          autoLogin: true,
          userId: systemUserId,
          motvUserId: motvCreationResult.viewersId?.toString()
        };
      } catch (error) {
        // Rollback em caso de erro
        console.error('Error during plan assignment:', error);
        if (systemUserId) {
          await this.deleteUserFromSystem(systemUserId);
        }
        return {
          success: false,
          message: 'Erro ao configurar o plano do usuário. Tente novamente.'
        };
      }
    } catch (error) {
      console.error('Error in registration flow:', error);
      
      // Rollback em caso de erro geral
      if (systemUserId) {
        await this.deleteUserFromSystem(systemUserId);
      }
      
      return { 
        success: false, 
        message: 'Erro interno do sistema. Tente novamente.' 
      };
    }
  }
}
