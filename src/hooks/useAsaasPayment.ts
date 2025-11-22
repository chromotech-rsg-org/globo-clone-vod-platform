import { useState } from 'react';
import { AsaasPaymentService } from '@/services/asaasPaymentService';
import { CreatePaymentRequest, CreatePaymentResponse } from '@/types/asaas';
import { useToast } from './use-toast';

export const useAsaasPayment = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createCustomer = async (data: {
    name: string;
    email: string;
    cpf: string;
    phone?: string;
  }) => {
    setLoading(true);
    try {
      const result = await AsaasPaymentService.createCustomer(data);
      return result;
    } catch (error: any) {
      toast({
        title: 'Erro ao criar cliente',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> => {
    setLoading(true);
    try {
      const result = await AsaasPaymentService.createPayment(request);
      return result;
    } catch (error: any) {
      toast({
        title: 'Erro ao criar pagamento',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (paymentId: string) => {
    try {
      const result = await AsaasPaymentService.checkPaymentStatus(paymentId);
      return result;
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  };

  return {
    loading,
    createCustomer,
    createPayment,
    checkPaymentStatus,
  };
};