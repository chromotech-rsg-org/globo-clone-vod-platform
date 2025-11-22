export type PaymentMethod = 'BOLETO' | 'PIX' | 'CREDIT_CARD';

export type PaymentStatus = 
  | 'PENDING' 
  | 'RECEIVED' 
  | 'CONFIRMED' 
  | 'OVERDUE' 
  | 'REFUNDED' 
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS';

export interface AsaasSettings {
  id: string;
  environment: 'sandbox' | 'production';
  sandbox_api_key?: string;
  production_api_key?: string;
  webhook_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AsaasCustomer {
  id: string;
  user_id: string;
  asaas_customer_id: string;
  environment: 'sandbox' | 'production';
  customer_data: any;
  created_at: string;
  updated_at: string;
}

export interface AsaasPayment {
  id: string;
  user_id: string;
  plan_id: string;
  asaas_payment_id: string;
  asaas_customer_id: string;
  payment_method: PaymentMethod;
  value: number;
  status: PaymentStatus;
  due_date?: string;
  payment_date?: string;
  invoice_url?: string;
  bank_slip_url?: string;
  pix_qr_code?: string;
  pix_copy_paste?: string;
  credit_card_data?: any;
  raw_data?: any;
  environment: 'sandbox' | 'production';
  created_at: string;
  updated_at: string;
}

export interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  cpf?: string;
  postalCode?: string;
  addressNumber?: string;
  phone?: string;
}

export interface CreatePaymentRequest {
  customerId: string;
  planId: string;
  paymentMethod: PaymentMethod;
  creditCardData?: CreditCardData;
}

export interface CreatePaymentResponse {
  paymentId: string;
  internalPaymentId: string;
  status: PaymentStatus;
  value: number;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  identificationField?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  expirationDate?: string;
  creditCardStatus?: string;
  transactionReceiptUrl?: string;
}