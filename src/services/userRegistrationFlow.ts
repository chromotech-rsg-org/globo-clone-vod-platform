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
  private static async checkUserExistsInMotv(email: string): Promise<MotvUserData | null> {
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
      
      if (response.ok && result.status === 1 && result.data?.viewers_id) {
        return {
          viewers_id: result.data.viewers_id,
          email: result.data.email,
          name: result.data.name,
          status: result.data.status
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error checking user in MOTV:', error);
      return null;
    }
  }

  // Autentica usuário no MOTV
  private static async authenticateUserInMotv(email: string, password: string): Promise<boolean> {
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
      return response.ok && result.status === 1;
    } catch (error) {
      console.error('Error authenticating user in MOTV:', error);
      return false;
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
  private static async createUserInMotv(userData: RegistrationData): Promise<MotvUserData | null> {
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
      
      if (response.ok && result.status === 1 && result.data?.viewers_id) {
        return {
          viewers_id: result.data.viewers_id,
          email: userData.email,
          name: userData.name
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error creating user in MOTV:', error);
      return null;
    }
  }

  // Cria usuário no nosso sistema
  private static async createUserInSystem(userData: RegistrationData, motvData?: MotvUserData, temporaryPassword: boolean = false): Promise<string | null> {
    try {
      // Registra o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: temporaryPassword ? CryptoJS.lib.WordArray.random(32).toString() : userData.password,
        options: {
          data: {
            name: userData.name,
            cpf: userData.cpf || "",
            phone: userData.phone || ""
          }
        }
      });

      if (authError) {
        console.error('Error creating user in auth:', authError);
        return null;
      }

      // Atualiza o perfil do usuário com o MOTV ID (se disponível)
      if (authData.user && motvData?.viewers_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            motv_user_id: motvData.viewers_id.toString()
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }

      return authData.user?.id || null;
    } catch (error) {
      console.error('Error creating user in system:', error);
      return null;
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
  private static async subscribePlanInMotv(viewersId: number, planId: string): Promise<boolean> {
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
            products_id: planId
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
    try {
      console.log('Starting user registration flow for:', userData.email);
      
      // Verificar se as configurações de integração estão ativas (fallback para cadastro local)
      let motvEnabled = true;
      try {
        await this.loadSettings();
      } catch (error) {
        console.warn('MOTV integration not configured. Proceeding with local-only registration.', error);
        motvEnabled = false;
      }

      // Se integração não estiver configurada, realizar apenas cadastro local
      if (!motvEnabled) {
        const systemUserId = await this.createUserInSystem(userData);
        if (!systemUserId) {
          return { success: false, message: 'Erro ao criar usuário no sistema' };
        }

        if (userData.selectedPlanId) {
          const { data: selectedPlan } = await supabase
            .from('plans')
            .select('package_id')
            .eq('id', userData.selectedPlanId)
            .single();

          if (selectedPlan?.package_id) {
            await this.assignPackageToUser(systemUserId, selectedPlan.package_id);
          }
        } else {
          const suspensionPackage = await this.getSuspensionPackage();
          if (suspensionPackage) {
            await this.assignPackageToUser(systemUserId, suspensionPackage.id);
          }
        }

        return {
          success: true,
          message: 'Usuário criado com sucesso!',
          autoLogin: true,
          userId: systemUserId
        };
      }
      
      // 1. Verificar se o usuário existe no MOTV
      const existingMotvUser = await this.checkUserExistsInMotv(userData.email);
      
      if (existingMotvUser) {
        console.log('User exists in MOTV, attempting authentication');
        
        // 2. Usuário existe no MOTV - tentar autenticar
        const authSuccess = await this.authenticateUserInMotv(userData.email, userData.password);
        
        if (authSuccess) {
          // 2.1 Autenticação bem-sucedida
          console.log('Authentication successful, creating user in system');
          
          const systemUserId = await this.createUserInSystem(userData, existingMotvUser);
          if (!systemUserId) {
            return { success: false, message: 'Erro ao criar usuário no sistema' };
          }

          // Buscar histórico de planos
          const planHistory = await this.getPlanHistoryFromMotv(existingMotvUser.viewers_id);
          
          // Atribuir pacote baseado no histórico
          const suspensionPackage = await this.getSuspensionPackage();
          let packageAssigned = false;
          
          if (planHistory.status === 1 && planHistory.data?.plans?.length) {
            // Tem planos no histórico - buscar pacote correspondente
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
          
          // Se não conseguiu atribuir pacote do histórico, usar suspensão
          if (!packageAssigned && suspensionPackage) {
            await this.assignPackageToUser(systemUserId, suspensionPackage.id);
          }

          return {
            success: true,
            message: 'Usuário já possui conta no MOTV. Login realizado com sucesso!',
            autoLogin: true,
            userId: systemUserId,
            motvUserId: existingMotvUser.viewers_id.toString()
          };
        } else {
          // 2.2 Autenticação falhou - senha incorreta
          console.log('Authentication failed, creating user with temporary password');
          
          const systemUserId = await this.createUserInSystem(userData, existingMotvUser, true);
          if (!systemUserId) {
            return { success: false, message: 'Erro ao criar usuário no sistema' };
          }

          // Buscar e atribuir pacote baseado no histórico
          const planHistory = await this.getPlanHistoryFromMotv(existingMotvUser.viewers_id);
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
            await this.assignPackageToUser(systemUserId, suspensionPackage.id);
          }

          return {
            success: true,
            message: 'Já existe uma conta com este e-mail, mas a senha está incorreta. Será necessário redefinir a senha.',
            requiresPasswordReset: true,
            userId: systemUserId,
            motvUserId: existingMotvUser.viewers_id.toString()
          };
        }
      } else {
        // 3. Usuário NÃO existe no MOTV - criar em ambos os sistemas
        console.log('User does not exist in MOTV, creating new user');
        
        const motvUser = await this.createUserInMotv(userData);
        if (!motvUser) {
          return { success: false, message: 'Erro ao criar usuário no MOTV' };
        }

        const systemUserId = await this.createUserInSystem(userData, motvUser);
        if (!systemUserId) {
          return { success: false, message: 'Erro ao criar usuário no sistema' };
        }

        // Atribuir plano selecionado
        if (userData.selectedPlanId) {
          // Buscar o código do pacote do plano
          const { data: selectedPlan } = await supabase
            .from('plans')
            .select('package_id, packages(code)')
            .eq('id', userData.selectedPlanId)
            .single();

          if (selectedPlan?.packages?.code) {
            // Cancelar planos existentes e aplicar novo
            await this.cancelAllPlansInMotv(motvUser.viewers_id);
            await this.subscribePlanInMotv(motvUser.viewers_id, selectedPlan.packages.code);
            await this.assignPackageToUser(systemUserId, selectedPlan.package_id);
          }
        } else {
          // Atribuir pacote de suspensão se não selecionou plano
          const suspensionPackage = await this.getSuspensionPackage();
          if (suspensionPackage) {
            // Gerenciar pacote de suspensão
            if (suspensionPackage.code === "0") {
              await this.cancelAllPlansInMotv(motvUser.viewers_id);
            } else {
              await this.cancelAllPlansInMotv(motvUser.viewers_id);
              await this.subscribePlanInMotv(motvUser.viewers_id, suspensionPackage.code);
            }
            await this.assignPackageToUser(systemUserId, suspensionPackage.id);
          }
        }

        return {
          success: true,
          message: 'Usuário criado com sucesso!',
          autoLogin: true,
          userId: systemUserId,
          motvUserId: motvUser.viewers_id.toString()
        };
      }
    } catch (error) {
      console.error('Error in registration flow:', error);
      return { 
        success: false, 
        message: 'Erro interno do sistema. Tente novamente.' 
      };
    }
  }
}