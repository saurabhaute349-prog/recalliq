import "server-only";

import { Resend } from "resend";

import { getEmailEnv } from "@/lib/email/env";

let resendInstance: Resend | null = null;

export function getResend(): Resend {
  if (!resendInstance) {
    const { RESEND_API_KEY } = getEmailEnv();
    resendInstance = new Resend(RESEND_API_KEY);
  }

  return resendInstance;
}

export function getEmailFrom(): string {
  return getEmailEnv().EMAIL_FROM;
}
