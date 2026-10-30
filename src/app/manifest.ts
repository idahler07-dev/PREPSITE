import type { MetadataRoute } from "next";
import siteConfig from "@site";
import { THEME_COLORS } from "@/config/theme-colors";

/** Installable app (PWA). Icons are generated with the logo: pnpm tsx scripts/make-brand.ts */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: THEME_COLORS.light,
    theme_color: THEME_COLORS.light,
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
