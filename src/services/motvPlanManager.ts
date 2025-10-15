import { supabase } from '@/integrations/supabase/client';
import { MotvApiService } from './motvApiService';
import { MotvErrorHandler } from '@/utils/motvErrorHandler';

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

      const motvUserIdInt = parseInt(motvUserId, 10);

      // 2. Buscar package code do novo plano
      const packageCode = await this.getPlanPackageCode(newPlanId);
      if (!packageCode) {
        throw new Error('Plano não possui pacote associado');
      }

      const productsId = parseInt(packageCode, 10);
      console.log('[MotvPlanManager] 📦 Package code:', packageCode, 'for MOTV user:', motvUserId);

      // 3. Verificar planos atuais
      const historyResult = await MotvApiService.planHistory(motvUserIdInt);
      
      if (historyResult.success && historyResult.plans) {
        const activePlans = historyResult.plans.filter(p => p.status === 'active');
        
        // Verificar se já tem esse plano
        const alreadyHasPlan = activePlans.some(p => p.products_id === productsId);
        if (alreadyHasPlan) {
          console.log('[MotvPlanManager] ℹ️ User already has this plan');
          return;
        }
      }

      // 4. Verificar se plano está disponível
      const planListResult = await MotvApiService.planList(motvUserIdInt);
      if (planListResult.success && planListResult.plans) {
        const planAvailable = planListResult.plans.find(p => p.products_id === productsId);
        if (!planAvailable) {
          throw new Error('Plano não está disponível para este usuário');
        }
      }

      // 5. Cancelar planos existentes
      console.log('[MotvPlanManager] 🚫 Canceling existing plans...');
      await MotvApiService.planCancelAll(motvUserIdInt);

      // 6. Criar novo plano
      console.log('[MotvPlanManager] ➕ Creating new plan...');
      const createResult = await MotvApiService.planCreate(motvUserIdInt, productsId);
      
      if (!createResult.success) {
        throw new Error(createResult.message || 'Erro ao atribuir plano');
      }

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

      const motvUserIdInt = parseInt(motvUserId, 10);

      // 2. Verificar planos atuais
      const historyResult = await MotvApiService.planHistory(motvUserIdInt);
      if (historyResult.success && historyResult.plans) {
        const activePlans = historyResult.plans.filter(p => p.status === 'active');
        console.log('[MotvPlanManager] 📋 Active plans found:', activePlans.length);
      }

      // 3. Cancelar todos os planos atuais
      console.log('[MotvPlanManager] 🚫 Canceling all active plans...');
      await MotvApiService.planCancelAll(motvUserIdInt);

      // 4. Buscar e aplicar pacote de suspensão (se existir)
      const suspensionPackage = await this.getSuspensionPackage();
      
      if (suspensionPackage) {
        console.log('[MotvPlanManager] 📦 Applying suspension package:', suspensionPackage.code);
        const productsId = parseInt(suspensionPackage.code, 10);
        await MotvApiService.planCreate(motvUserIdInt, productsId);
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
      .maybeSingle();

    if (error) {
      console.error('[MotvPlanManager] Error fetching suspension package:', error);
      return null;
    }

    return data || null;
  }
}
