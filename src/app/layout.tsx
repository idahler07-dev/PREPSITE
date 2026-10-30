import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import siteConfig from "@site";
import { ServiceWorkerRegister } from "@/components/layout/sw-register";
import { Providers } from "@/components/providers";
import { THEME_COLORS } from "@/config/theme-colors";
import { geist, geistMono, instrumentSerif } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(base),
    title: { default: t("title", { name: siteConfig.name }), template: `%s · ${siteConfig.name}` },
    description: t("description"),
    applicationName: siteConfig.name,
    icons: {
      icon: [
        { url: siteConfig.logo.mark, type: "image/svg+xml" },
        { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/brand/apple-touch-icon.png",
    },
    appleWebApp: { capable: true, title: siteConfig.shortName },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: t("title", { name: siteConfig.name }),
      description: t("description"),
      images: [{ url: siteConfig.logo.og, width: 1200, height: 630, alt: t("ogAlt", { name: siteConfig.name }) }],
    },
    twitter: { card: "summary_large_image", images: [siteConfig.logo.og] },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang={locale} suppressHydrationWarning className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-dvh font-sans">
        <NextIntlClientProvider>
          <Providers nonce={nonce}>{children}</Providers>
          <ServiceWorkerRegister />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
