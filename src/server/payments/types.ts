import type { Currency } from "@/config/plans";

export type ProviderId = "mock" | "payme" | "click" | "octo";
export const PROVIDER_IDS: ProviderId[] = ["mock", "payme", "click", "octo"];

export interface CheckoutOrder {
  id: string;
  number: number;
  amount: number; // minor units
  currency: Currency;
  planId: string;
  locale: string;
  user: { id: string; email: string | null };
}

export type ProviderStatus = "paid" | "pending" | "canceled" | "failed" | "refunded" | "unknown";
export type RefundResult = "refunded" | "pending" | "manual";

/**
 * A payment provider. Checkout always happens on the provider's own page
 * (card numbers never reach this site). Each provider verifies its own
 * webhook signatures/credentials and answers in its own protocol.
 */
export interface PaymentProvider {
  id: ProviderId;
  currencies: Currency[];
  /** Credentials are present (and, for mock, allowed in this environment). */
  configured(): boolean;
  sandbox(): boolean;
  createCheckout(order: CheckoutOrder, urls: { returnUrl: string; notifyUrl: string }): Promise<{ redirectUrl: string; providerRef?: string }>;
  /** Verify, parse and apply a provider callback; returns the response the provider expects. */
  handleWebhook(req: Request): Promise<Response>;
  /** "manual": the refund has to be made in the provider's cabinet; its callback will confirm it. */
  refund(order: { id: string; amount: number; currency: Currency; providerRef: string | null }): Promise<RefundResult>;
  /** Ask the provider for the current status (daily reconciliation). */
  fetchStatus?(order: { id: string; providerRef: string | null }): Promise<ProviderStatus>;
}
