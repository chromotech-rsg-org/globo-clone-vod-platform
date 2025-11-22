import { useState, useEffect } from 'react';
import { AsaasPaymentService } from '@/services/asaasPaymentService';
import { AsaasPayment } from '@/types/asaas';

export const usePaymentStatus = (paymentId: string | null, intervalMs: number = 5000) => {
  const [payment, setPayment] = useState<AsaasPayment | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!paymentId) return;

    const checkStatus = async () => {
      try {
        setLoading(true);
        const result = await AsaasPaymentService.checkPaymentStatus(paymentId);
        setPayment(result.payment);
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setLoading(false);
      }
    };

    // Check immediately
    checkStatus();

    // Set up polling for PIX and BOLETO payments
    if (payment?.payment_method === 'PIX' || payment?.payment_method === 'BOLETO') {
      if (payment.status === 'PENDING') {
        const interval = setInterval(checkStatus, intervalMs);
        return () => clearInterval(interval);
      }
    }
  }, [paymentId, intervalMs, payment?.payment_method, payment?.status]);

  return { payment, loading };
};