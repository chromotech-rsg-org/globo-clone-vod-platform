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
  maskedEmail?: string;
  errorType?: 'portal' | 'validation' | 'connection' | 'generic' | 'emailExists';
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
          message: 'Este e-mail já está cadastrado no sistema.',
          errorType: 'emailExists'
        };
      }

      // PASSO 3: Verificar existência no portal (via busca)
      console.log('[UserRegistrationFlow] 🔎 Checking portal for existing user...');
      let motvUserId: number | null = null;
      let userExistsInPortal = false;
      let portalUserData: any = null;
      
      try {
        const searchResult = await MotvApiService.customerSearch(userData.email);
        
        if (searchResult.success && searchResult.customers && searchResult.customers.length > 0) {
          // Usuário já existe no portal - buscar pelo email exato
          const emailLower = userData.email.toLowerCase();
          const foundUser = searchResult.customers.find(c => 
            c.email?.toLowerCase() === emailLower || c.login?.toLowerCase() === emailLower
          );
          
          if (foundUser?.viewers_id) {
            motvUserId = foundUser.viewers_id;
            userExistsInPortal = true;
            console.log('[UserRegistrationFlow] ✅ User found in portal:', motvUserId);
            
            // Buscar dados completos do usuário
            const customerData = await MotvApiService.customerFind(motvUserId);
            if (customerData.success) {
              portalUserData = customerData;
            }
            
            // NOVO FLUXO: Validar senha do usuário existente no portal
            console.log('[UserRegistrationFlow] 🔐 Validating password for existing portal user...');
            const authResult = await MotvApiService.customerAuthenticate(userData.email, userData.password);
            
            if (authResult.success) {
              // Senha correta! Atualizar dados no MOTV e seguir para criar no sistema
              console.log('[UserRegistrationFlow] ✅ Password validated! Will update MOTV and create in system');
              
              try {
                // Atualizar dados no MOTV com os dados fornecidos
                await MotvApiService.customerUpdate(motvUserId, {
                  email: userData.email,
                  profileName: userData.name,
                  phone: userData.phone
                });
                console.log('[UserRegistrationFlow] ✅ User data updated in MOTV');
              } catch (updateError) {
                console.error('[UserRegistrationFlow] ⚠️ Failed to update MOTV data, but will continue:', updateError);
              }
              
              // Continuar fluxo: pular criação no portal e ir direto para gestão de plano
              // (motvUserId já está definido, então não entrará no bloco de criação)
            } else {
              // Senha não confere! Criar usuário com senha hash impossível e enviar reset
              console.log('[UserRegistrationFlow] ⚠️ Password mismatch! Will create with random password and send reset email');
              
              // Gerar senha hash impossível de reproduzir
              const randomPassword = crypto.randomUUID() + '-' + Date.now() + '-' + Math.random();
              
              // Criar usuário no sistema com senha impossível e dados do portal
              const createResult = await this.createUserInSystem({
                email: userData.email,
                password: randomPassword,
                name: portalUserData?.name || userData.name,
                cpf: portalUserData?.cpf || userData.cpf,
                phone: portalUserData?.phone || userData.phone,
                motvUserId: motvUserId?.toString(),
                planId: userData.selectedPlanId
              });
              
              if (!createResult.success) {
                throw new Error('Erro ao criar usuário no sistema');
              }
              
              // Enviar email de reset de senha
              const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                userData.email,
                {
                  redirectTo: `${window.location.origin}/reset-password-confirm`
                }
              );
              
              if (resetError) {
                console.error('[UserRegistrationFlow] ❌ Failed to send reset email:', resetError);
              }
              
              // Mascarar email para exibição
              const maskedEmail = this.maskEmail(userData.email);
              
              return {
                success: false,
                requiresPasswordUpdate: true,
                maskedEmail,
                message: 'Usuário já existe no portal mas a senha não confere',
                errorType: 'validation'
              };
            }
          }
        }
      } catch (error: any) {
        console.error('[UserRegistrationFlow] ❌ Error searching for user in portal:', error);
        return {
          success: false,
          message: 'Erro ao verificar usuário no portal. Tente novamente.',
          errorType: 'connection'
        };
      }

      // PASSO 4: Se precisar atribuir plano E usuário existe, validar acesso ao portal ANTES de criar local
      if (userData.selectedPlanId && motvUserId && packageCode && userExistsInPortal) {
        console.log('[UserRegistrationFlow] 🔍 Pre-validating portal access for existing user...');
        try {
          // Tenta buscar histórico de planos para validar que o portal está acessível
          const historyResult = await MotvApiService.planHistory(motvUserId);
          if (!historyResult.success) {
            console.error('[UserRegistrationFlow] ❌ Portal validation failed:', historyResult.message);
            throw new Error('Não foi possível acessar o portal. Tente novamente mais tarde.');
          }
          console.log('[UserRegistrationFlow] ✅ Portal access validated');
        } catch (error: any) {
          console.error('[UserRegistrationFlow] ❌ Portal pre-validation error:', error);
          throw new Error('Erro ao acessar o portal. Tente novamente. Se o problema persistir, entre em contato com o suporte.');
        }
      }
      
      // PASSO 5: Criar usuário no portal (apenas se não existir)
      if (!motvUserId) {
        console.log('[UserRegistrationFlow] 📝 Creating user in portal...');
        try {
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
        } catch (error: any) {
          console.error('[UserRegistrationFlow] ❌ Error creating user in portal:', error);
          throw new Error(error.message || 'Erro ao criar usuário no portal. Tente novamente.');
        }
      }

      // PASSO 6: Atribuir plano no portal (se fornecido)
      if (userData.selectedPlanId && motvUserId && packageCode) {
        console.log('[UserRegistrationFlow] 📦 Assigning plan in portal...');
        try {
          await this.managePlanInMotv(motvUserId, packageCode);
          console.log('[UserRegistrationFlow] ✅ Plan assigned in portal');
        } catch (error: any) {
          console.error('[UserRegistrationFlow] ❌ Failed to assign plan in portal:', error);
          // Se falhou a atribuição do plano, não criar usuário local
          // Usuário fica no portal mas sem plano (pode ser corrigido em nova tentativa)
          throw new Error('Erro ao atribuir o plano no portal. Tente novamente. Se o problema persistir, entre em contato com o suporte.');
        }
      }

      // PASSO 7: Criar usuário no sistema interno (só depois do plano ser atribuído no portal)
      console.log('[UserRegistrationFlow] 👤 Creating user in internal system...');
      const createUserResult = await this.createUserInSystem({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        cpf: userData.cpf,
        phone: userData.phone,
        motvUserId: motvUserId?.toString(),
        planId: userData.selectedPlanId
      });

      if (!createUserResult.success || !createUserResult.user_id) {
        console.error('[UserRegistrationFlow] ❌ Failed to create user in system:', createUserResult.error);
        throw new Error('Erro ao criar usuário no sistema: ' + (createUserResult.error || 'Erro desconhecido'));
      }

      const userId = createUserResult.user_id;
      console.log('[UserRegistrationFlow] ✅ User created in system:', userId);
      
      if (userData.selectedPlanId) {
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
      
      // Determinar tipo de erro
      let errorType: 'portal' | 'validation' | 'connection' | 'generic' = 'generic';
      if (error.message?.includes('portal') || error.message?.includes('MOTV')) {
        errorType = 'portal';
      } else if (error.message?.includes('conexão') || error.message?.includes('conectar')) {
        errorType = 'connection';
      }
      
      return {
        success: false,
        message: error.message || 'Erro ao processar cadastro. Tente novamente.',
        errorType
      };
    }
  }
  
  /**
   * Mascarar email para exibição segura
   */
  private static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    
    const visibleChars = Math.min(3, Math.floor(localPart.length / 2));
    const maskedLocal = localPart.substring(0, visibleChars) + '***';
    
    return `${maskedLocal}@${domain}`;
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

    try {
      // Step 1: Check current plans
      console.log('[UserRegistrationFlow] 🔍 Checking current plans...');
      const historyResult = await MotvApiService.planHistory(motvUserId);
      
      if (!historyResult.success) {
        console.error('[UserRegistrationFlow] ❌ Failed to get plan history:', historyResult.message);
        throw new Error('Erro ao verificar planos existentes no portal');
      }

      // Step 2: Cancel all active plans (idempotent)
      console.log('[UserRegistrationFlow] 🗑️ Canceling any existing active plans (idempotent)');
      const cancelResult = await MotvApiService.planCancelAll(motvUserId);
      if (!cancelResult.success) {
        console.error('[UserRegistrationFlow] ❌ Failed to cancel plans:', cancelResult.message);
        throw new Error('Erro ao cancelar planos existentes no portal');
      }
      console.log('[UserRegistrationFlow] ✅ Cancel step completed');

      // Step 3: Create new plan with the validated package code
      console.log('[UserRegistrationFlow] 📦 Creating new plan - User:', motvUserId, 'Package:', packageCode);
      
      const createPlanResult = await MotvApiService.planCreate(motvUserId, Number(packageCode));
      console.log('[UserRegistrationFlow] 📋 Create plan result:', createPlanResult);
      
      if (!createPlanResult.success) {
        console.error('[UserRegistrationFlow] ❌ Failed to create plan:', createPlanResult.message);
        throw new Error('Erro ao atribuir plano no portal: ' + (createPlanResult.message || 'Erro desconhecido'));
      }

      console.log('[UserRegistrationFlow] ✅ Plan successfully assigned in portal');
    } catch (error: any) {
      console.error('[UserRegistrationFlow] ❌ Error in managePlanInMotv:', error);
      // Re-throw com mensagem mais clara
      throw new Error(error.message || 'Erro ao gerenciar plano no portal');
    }
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
    planId?: string;
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

}
