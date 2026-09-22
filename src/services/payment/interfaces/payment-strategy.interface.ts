export interface PaymentPayload {
  orderId: string;
  amount: number;
  currency?: string;
  customer?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}
export interface PaymentResult {
  success: boolean;
  clientSecret?: string | null;
  redirectUrl?: string | null;
  transactionId?: string | null;
}

export interface IPaymentStrategy {
  processPayment(payload: PaymentPayload): Promise<PaymentResult>;
}
