import NextAuth, { type DefaultSession } from "next-auth";
import type { Provider } from "next-auth/providers";
import type { EmailConfig } from "next-auth/providers/email";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import { env } from "./env";
import { verifyTelegramLogin, type TelegramAuthData } from "./telegram";
import { sendMail } from "@/server/mail";
import { magicLinkEmail } from "@/server/mail/templates";
import { rateLimit } from "@/server/rate-limit";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

function localeFromRequest(request: Request): string {
  const cookie = request.headers.get("cookie") ?? "";
  return /(?:^|;\s*)NEXT_LOCALE=([^;]+)/.exec(cookie)?.[1] ?? "en";
}

const emailProvider: EmailConfig = {
  id: "email",
  type: "email",
  name: "Email",
  maxAge: 60 * 60,
  normalizeIdentifier(identifier) {
    const email = identifier.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Invalid email");
    return email;
  },
  async sendVerificationRequest({ identifier, url, request }) {
    const limit = await rateLimit(`magic-link:email:${identifier}`, 5, 3600);
    if (!limit.ok) throw new Error("Too many sign-in emails. Try again later.");
    await sendMail(await magicLinkEmail(identifier, url, localeFromRequest(request)));
  },
};

function providers(): Provider[] {
  const e = env();
  const list: Provider[] = [emailProvider];
  if (e.AUTH_GOOGLE_ID && e.AUTH_GOOGLE_SECRET) {
    list.push(
      Google({
        clientId: e.AUTH_GOOGLE_ID,
        clientSecret: e.AUTH_GOOGLE_SECRET,
        // Google verifies email ownership, so linking to an existing email account is safe.
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }
  if (e.TELEGRAM_BOT_TOKEN) {
    const botToken = e.TELEGRAM_BOT_TOKEN;
    list.push(
      Credentials({
        id: "telegram",
        name: "Telegram",
        credentials: { payload: {} },
        async authorize(credentials) {
          let data: Partial<TelegramAuthData>;
          try {
            data = JSON.parse(String(credentials?.payload ?? ""));
          } catch {
            return null;
          }
          const tg = verifyTelegramLogin(data, botToken);
          if (!tg) return null;
          const name = [tg.firstName, tg.lastName].filter(Boolean).join(" ") || tg.username || null;
          const existing = await db.account.findUnique({
            where: { provider_providerAccountId: { provider: "telegram", providerAccountId: tg.id } },
            include: { user: true },
          });
          if (existing) {
            await db.user.update({ where: { id: existing.userId }, data: { telegramUsername: tg.username ?? null } });
            return { id: existing.user.id, name: existing.user.name, email: existing.user.email, image: existing.user.image };
          }
          const user = await db.user.create({
            data: {
              name,
              image: tg.photoUrl ?? null,
              telegramId: tg.id,
              telegramUsername: tg.username ?? null,
              accounts: { create: { type: "credentials", provider: "telegram", providerAccountId: tg.id } },
            },
          });
          return { id: user.id, name: user.name, email: user.email, image: user.image };
        },
      }),
    );
  }
  return list;
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  // The adapter's types target the classic @prisma/client entry point; the runtime API is identical.
  adapter: PrismaAdapter(db as unknown as Parameters<typeof PrismaAdapter>[0]),
  // JWT sessions are required for the Telegram (credentials) provider. Every
  // request still loads the user from the database (src/server/auth/session.ts),
  // so deleted users and role changes take effect immediately.
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: env().AUTH_SECRET,
  trustHost: true,
  providers: providers(),
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
    error: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Only allow same-site redirects.
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {}
      return baseUrl;
    },
  },
  events: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (user.id && email && env().ADMIN_EMAILS.map((x) => x.toLowerCase()).includes(email)) {
        await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
      }
    },
  },
}));
