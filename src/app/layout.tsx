import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import siteConfig from "@site";
import { ServiceWorkerRegister } from "@/components/layout/sw-register";
import { Providers } from "@/components/providers";
import { BrandStyle } from "@/components/brand-style";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(base),
    title: { default: t("title", { name: siteConfig.name }), template: `%s · ${siteConfig.name}` },
    description: t("description"),
    applicationName: siteConfig.name,
    icons: { icon: siteConfig.logo.mark, apple: "/brand/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: siteConfig.shortName },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#16181d" },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <BrandStyle nonce={nonce} />
      </head>
      <body className="min-h-dvh font-sans">
        <NextIntlClientProvider>
          <Providers nonce={nonce}>{children}</Providers>
          <ServiceWorkerRegister />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
