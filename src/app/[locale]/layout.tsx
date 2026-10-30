import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "@/components/layout/sw-register";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import siteConfig from "@site";
import { routing } from "@/i18n/routing";
import { localeDir } from "@/i18n/locales";
import { Providers } from "@/components/providers";
import { BrandStyle } from "@/components/brand-style";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: hasLocale(routing.locales, locale) ? locale : "en", namespace: "metadata" });
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(base),
    title: { default: t("title", { name: siteConfig.name }), template: `%s · ${siteConfig.name}` },
    description: t("description"),
    applicationName: siteConfig.name,
    icons: { icon: siteConfig.logo.mark, apple: "/brand/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: siteConfig.shortName },
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
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

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang={locale} dir={localeDir(locale)} suppressHydrationWarning>
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
