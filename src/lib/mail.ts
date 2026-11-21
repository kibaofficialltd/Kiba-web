import "server-only";
import { db } from "@/db";
import { emergencyOutbox } from "@/db/schema";
import { env } from "@/lib/env";

type MailInput = { to: string; subject: string; text: string; html?: string };

/**
 * Sends transactional email.
 *
 * With SMTP configured, mail is delivered via nodemailer. Without it (local
 * development), messages are persisted to `emergency_outbox` and logged so the
 * verification/reset flow remains testable — never silently dropped.
 */
export async function sendMail(input: MailInput): Promise<{ delivered: boolean }> {
  if (env.smtp.host && env.smtp.user) {
    try {
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.port === 465,
        auth: { user: env.smtp.user, pass: env.smtp.pass },
      });
      await transport.sendMail({
        from: env.smtp.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      return { delivered: true };
    } catch (error) {
      console.error("[mail] SMTP delivery failed, falling back to outbox", error);
    }
  }

  await db.insert(emergencyOutbox).values({
    toEmail: input.to,
    subject: input.subject,
    body: input.text,
  });
  console.info(`[mail:outbox] to=${input.to} subject="${input.subject}"\n${input.text}`);
  return { delivered: false };
}

export function verificationEmail(username: string, url: string): MailInput["text"] {
  return [
    `Welcome to KIBAOFFICIAL SMP, ${username}.`,
    "",
    "Confirm your email address to activate your player portal:",
    url,
    "",
    "This link expires in 24 hours. If you did not create this account, ignore this email.",
  ].join("\n");
}

export function resetEmail(username: string, url: string): string {
  return [
    `Hi ${username},`,
    "",
    "We received a request to reset your KIBAOFFICIAL password:",
    url,
    "",
    "This link expires in 1 hour. If you did not request it, you can safely ignore this email.",
  ].join("\n");
}
