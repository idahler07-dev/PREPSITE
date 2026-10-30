import "server-only";
import { z } from "zod";

/**
 * Server-side environment variables, validated once on first use.
 * Every secret lives here; nothing in this module is sent to the browser.
 */
const bool = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const csv = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),

  AUTH_SECRET: z.string().min(16),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: z.string().optional(),
  /** Comma-separated emails that are promoted to admin on sign-in. */
  ADMIN_EMAILS: csv,
  /** Sign-in emails one IP address may request per hour (raise it if a whole classroom shares one IP). */
  MAGIC_LINKS_PER_IP_HOUR: z.coerce.number().int().min(1).default(10),

  EMAIL_TRANSPORT: z.enum(["outbox", "smtp", "resend"]).default("outbox"),
  EMAIL_FROM: z.string().default("PrepSite <no-reply@example.com>"),
  RESEND_API_KEY: z.string().optional(),
  SMTP_URL: z.string().optional(),

  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default(".data/storage"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: bool,

  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL_FAST: z.string().default("claude-haiku-5-5"),
  AI_MODEL_SMART: z.string().default("claude-sonnet-5-5"),

  DESMOS_API_KEY: z.string().optional(),

  /** Demo site: "Try as student / admin" buttons without email. Never turn on for the real site. */
  DEMO_MODE: bool,

  /** Comma-separated: mock, payme, click, octo. */
  PAYMENT_PROVIDERS: csv,
  /** The mock provider is refused in production unless this is set (staging only). */
  ALLOW_MOCK_PAYMENTS: bool,
  MOCK_PAYMENT_SECRET: z.string().default("dev-mock-payment-secret"),
  PAYME_MERCHANT_ID: z.string().optional(),
  /** Payme cabinet key (the test key while PAYME_SANDBOX is on). */
  PAYME_KEY: z.string().optional(),
  PAYME_SANDBOX: bool,
  CLICK_SERVICE_ID: z.string().optional(),
  CLICK_MERCHANT_ID: z.string().optional(),
  CLICK_MERCHANT_USER_ID: z.string().optional(),
  CLICK_SECRET_KEY: z.string().optional(),
  OCTO_SHOP_ID: z.string().optional(),
  OCTO_SECRET: z.string().optional(),
  /** Octo creates test transactions while this is on. */
  OCTO_TEST: bool,
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment variables:\n${issues}\nSee .env.example.`);
  }
  cached = parsed.data;
  return cached;
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}
