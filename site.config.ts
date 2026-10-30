/**
 * Brand and site settings. Edit this file to rebrand the site.
 *
 * Everything here is public (it ships to the browser). Never put secrets here;
 * secrets belong in environment variables (see .env.example).
 *
 * User-facing *text* (tagline, page copy) lives in /messages/en.json. Colors and
 * fonts are design tokens in src/app/globals.css (see DESIGN.md). This file
 * holds names, logo files, contact details and links. Regenerate the logo
 * files with `pnpm tsx scripts/make-brand.ts`.
 */

export const siteConfig = {
  /** Brand name shown in the header, emails and page titles. */
  name: "Satify",
  /** Short name used by the installable app (PWA) and small screens. */
  shortName: "Satify",
  /** Legal name of the learning centre, used on legal pages and receipts. */
  legalName: "Satify Learning Centre LLC",

  logo: {
    /**
     * Files in /public/brand. Replace them with your own (SVG or PNG).
     * `mark` is the square icon (also the favicon). If your logo already
     * contains the name, set showName to false and use `light` / `dark`.
     */
    mark: "/brand/mark.svg",
    markDark: "/brand/mark-dark.svg",
    light: "/brand/logo.svg",
    dark: "/brand/logo-dark.svg",
    /** 1200×630 image for link previews (Telegram, Instagram, WhatsApp). */
    og: "/brand/og.png",
    showName: true,
  },

  /**
   * Brand colors as OKLCH or any CSS color. `primary` is used for buttons,
   * links and focus rings. Keep contrast WCAG AA against `primaryForeground`
   * in both themes (the defaults below pass at 4.5:1+).
   */
  colors: {
    light: {
      primary: "oklch(0.45 0.16 258)",
      primaryForeground: "oklch(0.985 0 0)",
      accent: "oklch(0.95 0.03 258)",
      accentForeground: "oklch(0.3 0.12 258)",
    },
    dark: {
      primary: "oklch(0.78 0.12 258)",
      primaryForeground: "oklch(0.2 0.05 258)",
      accent: "oklch(0.3 0.06 258)",
      accentForeground: "oklch(0.95 0.02 258)",
    },
  },

  contact: {
    email: "hello@example.com",
    phone: "+998 00 000 00 00",
    telegram: "@your_centre",
    telegramUrl: "https://t.me/your_centre",
    address: "Tashkent, Uzbekistan",
    /** Shown on the contact page. */
    hours: "Mon–Sat, 09:00–19:00 (UTC+5)",
  },

  social: {
    telegram: "https://t.me/your_centre",
    instagram: "",
    youtube: "",
  },

  /**
   * Shows a "draft text" notice on the terms, privacy and refund pages.
   * Set to false once the final texts are in content/legal/.
   */
  legalPagesAreDrafts: true,

  /** Time zone used for streaks, daily questions and reminders. */
  defaultTimeZone: "Asia/Tashkent",

  questionCodes: {
    /**
     * Format for auto-suggested question codes. Tokens:
     *   {prefix}  the prefix typed on the import / editor form, e.g. "LC-M-"
     *   {domain}  short domain code, e.g. ALG, ADV, PSD, GEO, INI, CAS, EOI, SEC
     *   {number}  the next free number for that prefix + domain, zero-padded
     * Example: "{prefix}{domain}-{number}" → LC-M-ALG-0001
     */
    format: "{prefix}{domain}-{number}",
    padding: 4,
    defaultPrefix: { RW: "LC-RW-", MATH: "LC-M-" },
  },

  review: {
    /**
     * How many open student error reports send a published question back to
     * review (status in_review, hidden from students until re-approved).
     */
    reportsToUnpublish: 1,
  },

  /** Official free resources we link to (never host). */
  officialResources: [
    {
      id: "questionBank",
      url: "https://satsuitequestionbank.collegeboard.org/",
    },
    {
      id: "bluebook",
      url: "https://bluebook.collegeboard.org/students/download-bluebook",
    },
    {
      id: "practiceTests",
      url: "https://satsuite.collegeboard.org/digital/digital-practice-preparation/practice-tests",
    },
    {
      id: "khanAcademy",
      url: "https://www.khanacademy.org/test-prep/digital-sat",
    },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
export default siteConfig;
