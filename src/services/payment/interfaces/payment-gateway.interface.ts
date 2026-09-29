export interface PaymentItem {
  name: string;
  unitAmount: number;
  quantity: number;
  description?: string;
}

export interface CreateCheckoutSessionInput {
  tenantId: string;
  orderId: string;
  customerEmail: string;
  currency: string;
  items: PaymentItem[];
  successUrl: string;
  cancelUrl: string;
  vendorProviderAccountId?: string;
  platformFeeAmount?: number;
}

export interface CheckoutSessionResult {
  sessionId: string;
  chechoutUrl: string;
}

export interface IPaymentGatewayProvider {
  createCheckoutSeesion(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSessionResult>;
  refundPayment(
    transactionId: string,
    amount?: number,
  ): Promise<{ refundId: string; status: string }>;
}
