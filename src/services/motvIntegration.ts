import { supabase } from "@/integrations/supabase/client";

export interface IntegrationJobPayload {
  jobType: 'create_user' | 'update_user' | 'delete_user' | 'subscribe' | 'get_customer' | 'find_customer';
  entityType: 'user' | 'subscription';
  entityId: string;
  data: any;
}

export class MotvIntegrationService {
  // Queue a job for background processing
  static async queueJob(payload: IntegrationJobPayload) {
    try {
      const { data, error } = await supabase
        .from('integration_jobs')
        .insert({
          job_type: payload.jobType,
          entity_type: payload.entityType,
          entity_id: payload.entityId,
          payload: payload.data,
        })
        .select()
        .single();

      if (error) {
        console.error('Error queuing integration job:', error);
        throw error;
      }

      console.log('Integration job queued:', data.id);
      
      // Trigger job processing (fire and forget)
      this.triggerJobProcessing().catch(err => 
        console.error('Error triggering job processing:', err)
      );

      return data;
    } catch (error) {
      console.error('Failed to queue integration job:', error);
      throw error;
    }
  }

  // Trigger job processing via edge function
  static async triggerJobProcessing() {
    try {
      const { data, error } = await supabase.functions.invoke('integration-dispatcher', {
        body: { action: 'process_pending' }
      });

      if (error) {
        console.error('Error processing integration jobs:', error);
        return false;
      }

      console.log('Integration jobs processed:', data);
      return true;
    } catch (error) {
      console.error('Failed to trigger job processing:', error);
      return false;
    }
  }

  // Process a specific job
  static async processJob(jobId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('integration-dispatcher', {
        body: { action: 'process_job', jobId }
      });

      if (error) {
        console.error('Error processing integration job:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to process integration job:', error);
      throw error;
    }
  }

  // User integration methods
  static async createUser(userId: string, userData: any) {
    const payload = {
      jobType: 'create_user' as const,
      entityType: 'user' as const,
      entityId: userId,
      data: {
        name: userData.name,
        email: userData.email,
        cpf: userData.cpf,
        phone: userData.phone,
        // Add other fields as needed based on API documentation
      }
    };

    return this.queueJob(payload);
  }

  static async updateUser(userId: string, userData: any) {
    const payload = {
      jobType: 'update_user' as const,
      entityType: 'user' as const,
      entityId: userId,
      data: {
        name: userData.name,
        email: userData.email,
        cpf: userData.cpf,
        phone: userData.phone,
        // Add other fields as needed based on API documentation
      }
    };

    return this.queueJob(payload);
  }

  static async deleteUser(userId: string) {
    const payload = {
      jobType: 'delete_user' as const,
      entityType: 'user' as const,
      entityId: userId,
      data: {
        userId: userId
      }
    };

    return this.queueJob(payload);
  }

  // Subscription integration methods
  static async subscribeUser(userId: string, subscriptionData: any) {
    // Get user's profile and subscription details
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email, cpf, phone, motv_user_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      throw userError;
    }

    // Get subscription with plan and package details
    const { data: subscriptionDetails, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        plan_id,
        status,
        start_date,
        end_date,
        plans!inner (
          id,
          name,
          package_id,
          packages (
            id,
            name,
            code,
            vendor_id
          )
        )
      `)
      .eq('id', subscriptionData.id)
      .single();

    if (subError) {
      console.error('Error fetching subscription details:', subError);
      throw subError;
    }

    const payload = {
      jobType: 'subscribe' as const,
      entityType: 'subscription' as const,
      entityId: subscriptionData.id,
      data: {
        userId: userId,
        userEmail: userProfile.email,
        userName: userProfile.name,
        cpf: userProfile.cpf,
        phone: userProfile.phone,
        motvUserId: userProfile.motv_user_id,
        packageCode: subscriptionDetails.plans.packages?.code,
        packageName: subscriptionDetails.plans.packages?.name,
        planName: subscriptionDetails.plans.name,
        vendorId: subscriptionDetails.plans.packages?.vendor_id,
        subscriptionId: subscriptionData.id,
        startDate: subscriptionData.start_date,
        endDate: subscriptionData.end_date,
        status: subscriptionData.status
      }
    };

    return this.queueJob(payload);
  }

  // Método específico para criar plano no MOTV
  static async createPlanInMotv(userId: string, planId: string) {
    // Buscar detalhes do usuário e plano
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email, motv_user_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user for plan creation:', userError);
      throw userError;
    }

    const { data: planDetails, error: planError } = await supabase
      .from('plans')
      .select(`
        id,
        name,
        package_id,
        packages (
          id,
          name,
          code,
          vendor_id
        )
      `)
      .eq('id', planId)
      .single();

    if (planError) {
      console.error('Error fetching plan details:', planError);
      throw planError;
    }

    const payload = {
      jobType: 'subscribe' as const,
      entityType: 'user' as const,
      entityId: userId,
      data: {
        userId: userId,
        userEmail: userProfile.email,
        userName: userProfile.name,
        motvUserId: userProfile.motv_user_id,
        packageCode: planDetails.packages?.code,
        packageName: planDetails.packages?.name,
        planName: planDetails.name,
        vendorId: planDetails.packages?.vendor_id,
        action: 'create_plan'
      }
    };

    return this.queueJob(payload);
  }

  // Utility methods for admin
  static async getIntegrationSettings() {
    const { data, error } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching integration settings:', error);
      throw error;
    }

    return data;
  }

  static async updateIntegrationSettings(settings: {
    api_base_url: string;
    api_login: string;
    api_secret: string;
    vendor_id?: number;
  }) {
    // First, deactivate all existing settings
    await supabase
      .from('integration_settings')
      .update({ active: false })
      .eq('active', true);

    // Create new active settings
    const { data, error } = await supabase
      .from('integration_settings')
      .insert({
        api_base_url: settings.api_base_url,
        api_login: settings.api_login,
        api_secret: settings.api_secret,
        vendor_id: settings.vendor_id,
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating integration settings:', error);
      throw error;
    }

    return data;
  }

  static async getJobsHistory(limit = 50) {
    const { data, error } = await supabase
      .from('integration_jobs')
      .select(`
        *,
        integration_logs (
          id,
          endpoint,
          status_code,
          success,
          error_message,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching jobs history:', error);
      throw error;
    }

    return data;
  }
}