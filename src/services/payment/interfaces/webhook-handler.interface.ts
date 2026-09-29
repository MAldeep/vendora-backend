export interface StandardWebhookEvent {
  type: "PAYMENT_SUCCESS" | "PAYMENT_FAILED" | "ACCOUNT_UPDATED" | "UNKNOWN";
  eventId: string;
  data: {
    tenantId?: string;
    orderId?: string;
    providerTransactionId?: string;
    amount?: number;
    currency?: string;
    rawPayload: object;
  };
}

export interface IWebhookHandlerProvider {
  verifyAndParseEvent(
    rawBody: Buffer | string,
    signature: string | Record<string, unknown>,
    secret?: string,
  ): Promise<StandardWebhookEvent>;
}
