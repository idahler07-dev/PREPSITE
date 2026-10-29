import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export const DEV_OUTBOX_DIR = path.join(process.cwd(), ".data", "dev-mail");

/** Send an email using the transport chosen by EMAIL_TRANSPORT. */
export async function sendMail(msg: MailMessage): Promise<void> {
  const e = env();
  switch (e.EMAIL_TRANSPORT) {
    case "resend": {
      if (!e.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${e.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: e.EMAIL_FROM, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
      });
      if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
      return;
    }
    case "smtp": {
      if (!e.SMTP_URL) throw new Error("SMTP_URL is not set");
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport(e.SMTP_URL);
      await transport.sendMail({ from: e.EMAIL_FROM, ...msg });
      return;
    }
    case "outbox": {
      if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_OUTBOX !== "true") {
        throw new Error("EMAIL_TRANSPORT=outbox is for development only. Configure smtp or resend.");
      }
      await mkdir(DEV_OUTBOX_DIR, { recursive: true });
      const file = path.join(DEV_OUTBOX_DIR, `${Date.now()}-${msg.to.replace(/[^a-z0-9@._-]/gi, "_")}.json`);
      await writeFile(file, JSON.stringify({ ...msg, sentAt: new Date().toISOString() }, null, 2));
      console.info(`[mail:outbox] to=${msg.to} subject="${msg.subject}" → ${path.relative(process.cwd(), file)}`);
      return;
    }
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
