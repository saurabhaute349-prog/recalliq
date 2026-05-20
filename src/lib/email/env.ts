import "server-only";

import { z } from "zod";

const emailEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  EMAIL_FROM: z
    .string()
    .min(3, "EMAIL_FROM is required")
    .refine(
      (value) => value.includes("@"),
      "EMAIL_FROM must be a valid address or \"Name <email@domain.com>\"",
    ),
});

export type EmailEnv = z.infer<typeof emailEnvSchema>;

export function isEmailConfigured(): boolean {
  return emailEnvSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY?.trim(),
    EMAIL_FROM: process.env.EMAIL_FROM?.trim(),
  }).success;
}

export function getEmailEnv(): EmailEnv {
  const parsed = emailEnvSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY?.trim(),
    EMAIL_FROM: process.env.EMAIL_FROM?.trim(),
  });

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => issue.message)
      .join("; ");
    throw new Error(`Email configuration invalid: ${message}`);
  }

  return parsed.data;
}
