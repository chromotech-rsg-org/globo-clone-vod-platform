import { supabase } from '@/integrations/supabase/client';
import { CreatePaymentRequest, CreatePaymentResponse } from '@/types/asaas';

export class AsaasPaymentService {
  static async createCustomer(data: {
    name: string;
    email: string;
    cpf: string;
    phone?: string;
  }) {
    const { data: result, error } = await supabase.functions.invoke('asaas-create-customer', {
      body: data,
    });

    if (error) throw error;
    return result;
  }

  static async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const { data: result, error } = await supabase.functions.invoke('asaas-create-payment', {
      body: request,
    });

    if (error) throw error;
    return result;
  }

  static async checkPaymentStatus(paymentId: string) {
    const { data: result, error } = await supabase.functions.invoke('asaas-check-payment-status', {
      body: { paymentId },
    });

    if (error) throw error;
    return result;
  }

  static async getPayment(paymentId: string) {
    const { data, error } = await supabase
      .from('asaas_payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserPayments(userId: string) {
    const { data, error } = await supabase
      .from('asaas_payments')
      .select('*, plans(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}