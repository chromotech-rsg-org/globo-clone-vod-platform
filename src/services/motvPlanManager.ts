import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço centralizado para gerenciar planos MOTV
 * Lida com mudanças de plano, cancelamentos e suspensões
 */
export class MotvPlanManager {
  /**
   * Trocar plano do usuário (cancelar atual + aplicar novo)
   */
  static async changePlan(userId: string, newPlanId: string): Promise<void> {
    try {
      console.log('[MotvPlanManager] 🔄 Changing plan for user:', userId, 'to plan:', newPlanId);

      // 1. Buscar motv_user_id
      const motvUserId = await this.getUserMotvId(userId);
      if (!motvUserId) {
        console.warn('[MotvPlanManager] ⚠️ User has no motv_user_id, skipping MOTV update');
        return;
      }

      // 2. Buscar package code do novo plano
      const packageCode = await this.getPlanPackageCode(newPlanId);
      if (!packageCode) {
        throw new Error('Plano não possui pacote associado');
      }

      console.log('[MotvPlanManager] 📦 Package code:', packageCode, 'for MOTV user:', motvUserId);

      // 3. Cancelar todos os planos atuais (se houver)
      try {
        await this.cancelAllPlans(motvUserId);
      } catch (error: any) {
        // Se falhar ao cancelar (ex: usuário novo sem planos), apenas loga e continua
        console.warn('[MotvPlanManager] ⚠️ Could not cancel plans (user may not have any):', error.message);
      }

      // 4. Aplicar novo plano
      await this.subscribePlan(motvUserId, packageCode);

      console.log('[MotvPlanManager] ✅ Plan changed successfully');
    } catch (error) {
      console.error('[MotvPlanManager] ❌ Error changing plan:', error);
      throw error;
    }
  }

  /**
   * Cancelar plano do usuário (aplicar suspensão ou cancel total)
   */
  static async cancelPlan(userId: string): Promise<void> {
    try {
      console.log('[MotvPlanManager] 🚫 Canceling plan for user:', userId);

      // 1. Buscar motv_user_id
      const motvUserId = await this.getUserMotvId(userId);
      if (!motvUserId) {
        console.warn('[MotvPlanManager] ⚠️ User has no motv_user_id, skipping MOTV cancellation');
        return;
      }

      // 2. Buscar pacote de suspensão
      const suspensionPackage = await this.getSuspensionPackage();

      // 3. Cancelar todos os planos atuais
      await this.cancelAllPlans(motvUserId);

      // 4. Se existe pacote de suspensão, aplicar
      if (suspensionPackage) {
        console.log('[MotvPlanManager] 📦 Applying suspension package:', suspensionPackage.code);
        await this.subscribePlan(motvUserId, suspensionPackage.code);
      } else {
        console.log('[MotvPlanManager] ℹ️ No suspension package found, only canceled plans');
      }

      console.log('[MotvPlanManager] ✅ Plan canceled successfully');
    } catch (error) {
      console.error('[MotvPlanManager] ❌ Error canceling plan:', error);
      throw error;
    }
  }

  /**
   * Buscar motv_user_id do usuário
   */
  private static async getUserMotvId(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('motv_user_id')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[MotvPlanManager] Error fetching user MOTV ID:', error);
      return null;
    }

    return data?.motv_user_id || null;
  }

  /**
   * Buscar package code do plano
   */
  private static async getPlanPackageCode(planId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('plans')
      .select('package_id, packages(code)')
      .eq('id', planId)
      .single();

    if (error) {
      console.error('[MotvPlanManager] Error fetching plan package:', error);
      return null;
    }

    return (data?.packages as any)?.code || null;
  }

  /**
   * Buscar pacote de suspensão
   */
  private static async getSuspensionPackage(): Promise<{ code: string } | null> {
    const { data, error } = await supabase
      .from('packages')
      .select('code')
      .eq('suspension_package', true)
      .eq('active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[MotvPlanManager] Error fetching suspension package:', error);
      return null;
    }

    return data || null;
  }

  /**
   * Cancelar todos os planos do usuário na MOTV
   */
  private static async cancelAllPlans(motvUserId: string): Promise<void> {
    console.log('[MotvPlanManager] 🚫 Canceling all plans for MOTV user:', motvUserId);

    const { data, error } = await supabase.functions.invoke('motv-proxy', {
      body: {
        op: 'cancelAll',
        viewers_id: motvUserId
      }
    });

    if (error) {
      console.error('[MotvPlanManager] ❌ Edge function error on cancelAll:', error);
      throw error;
    }

    console.log('[MotvPlanManager] 📋 Full cancelAll response:', JSON.stringify(data, null, 2));
    
    const result = data?.result;
    console.log('[MotvPlanManager] 📋 cancelAll result:', JSON.stringify(result, null, 2));

    // Validar status com segurança
    const rawStatus = result?.status || result?.code;
    const status = typeof rawStatus === 'number' ? rawStatus : (rawStatus ? parseInt(String(rawStatus)) : NaN);
    
    if (isNaN(status)) {
      console.error('[MotvPlanManager] ❌ Invalid status from MOTV:', { rawStatus, result });
      throw new Error('Resposta inválida da MOTV ao cancelar planos');
    }
    
    // Status 1 = sucesso, Status 6 pode ser "nenhum plano ativo"
    if (status !== 1 && status !== 6) {
      const errorMsg = result?.message || result?.error_message || result?.response || `Erro ao cancelar planos na MOTV (status: ${status})`;
      console.error('[MotvPlanManager] ❌ Cancel failed with status:', status, 'message:', errorMsg);
      throw new Error(errorMsg);
    }

    if (status === 6) {
      console.log('[MotvPlanManager] ℹ️ No active plans to cancel (status 6)');
    } else {
      console.log('[MotvPlanManager] ✅ Plans canceled successfully');
    }
  }

  /**
   * Assinar plano na MOTV
   */
  private static async subscribePlan(motvUserId: string, packageCode: string): Promise<void> {
    console.log('[MotvPlanManager] 📦 Subscribing plan - MOTV user:', motvUserId, 'package:', packageCode);

    const { data, error } = await supabase.functions.invoke('motv-proxy', {
      body: {
        op: 'subscribe',
        payload: {
          viewers_id: motvUserId,
          products_id: packageCode
        }
      }
    });

    if (error) {
      console.error('[MotvPlanManager] ❌ Edge function error on subscribe:', error);
      throw error;
    }

    console.log('[MotvPlanManager] 📋 Full subscribe response:', JSON.stringify(data, null, 2));
    
    const result = data?.result;
    console.log('[MotvPlanManager] 📋 subscribe result:', JSON.stringify(result, null, 2));

    // Validar status com segurança
    const rawStatus = result?.status || result?.code;
    const status = typeof rawStatus === 'number' ? rawStatus : (rawStatus ? parseInt(String(rawStatus)) : NaN);
    
    if (isNaN(status)) {
      console.error('[MotvPlanManager] ❌ Invalid status from MOTV:', { rawStatus, result });
      throw new Error('Resposta inválida da MOTV ao assinar plano');
    }
    
    // Status 1 = sucesso, Status 10 pode ser "plano já ativo" ou outro erro
    if (status !== 1) {
      const errorMsg = result?.message || result?.error_message || result?.response || `Erro ao assinar plano na MOTV (status: ${status})`;
      const fullError = `Status ${status}: ${errorMsg}. Viewers ID: ${motvUserId}, Package: ${packageCode}`;
      console.error('[MotvPlanManager] ❌ Subscribe failed:', fullError);
      console.error('[MotvPlanManager] 📋 Full result object:', result);
      throw new Error(fullError);
    }

    console.log('[MotvPlanManager] ✅ Plan subscribed successfully to package:', packageCode);
  }
}
