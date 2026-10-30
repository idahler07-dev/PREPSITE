import "server-only";
import { env } from "@/lib/env";
import type { Currency } from "@/config/plans";
import { clickProvider } from "./providers/click";
import { mockProvider } from "./providers/mock";
import { octoProvider } from "./providers/octo";
import { paymeProvider } from "./providers/payme";
import type { PaymentProvider, ProviderId } from "./types";

const ALL: Record<ProviderId, PaymentProvider> = { mock: mockProvider, payme: paymeProvider, click: clickProvider, octo: octoProvider };

export function getProvider(id: string): PaymentProvider | undefined {
  return ALL[id as ProviderId];
}

/** Providers switched on in PAYMENT_PROVIDERS that have their credentials. */
export function enabledProviders(currency?: Currency): PaymentProvider[] {
  return env()
    .PAYMENT_PROVIDERS.map((id) => ALL[id as ProviderId])
    .filter((p): p is PaymentProvider => !!p && p.configured() && (!currency || p.currencies.includes(currency)));
}

export function providerSupports(id: ProviderId, currency: Currency): boolean {
  return enabledProviders(currency).some((p) => p.id === id);
}
