import type { MetadataRoute } from "next";
import siteConfig from "@site";

/** Installable app (PWA). Icons are generated from the logo: pnpm tsx scripts/make-icons.ts */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    start_url: `/${siteConfig.defaultLocale}/dashboard`,
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2a4fb0",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
