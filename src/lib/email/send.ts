import "server-only";

import { render } from "@react-email/render";

import { LimitReachedEmail, type LimitReachedKind } from "@/emails/limit-reached";
import { PaymentFailedEmail } from "@/emails/payment-failed";
import { RenewalSuccessEmail } from "@/emails/renewal-success";
import { SubscriptionCancelledEmail } from "@/emails/subscription-cancelled";
import {
  UpgradeSuccessEmail,
  formatRenewalLabel,
} from "@/emails/upgrade-success";
import { WelcomeEmail } from "@/emails/welcome-email";
import { BRAND } from "@/lib/brand/config";
import { isEmailConfigured } from "@/lib/email/env";
import {
  logEmailError,
  logEmailSent,
  logEmailSkipped,
  type EmailKind,
} from "@/lib/email/log";
import { getEmailFrom, getResend } from "@/lib/email/resend";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  kind: EmailKind;
};

async function sendTransactionalEmail(input: SendEmailInput): Promise<void> {
  if (!isEmailConfigured()) {
    logEmailSkipped(input.kind, "email env not configured");
    return;
  }

  try {
    const resend = getResend();
    const from = getEmailFrom();
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      throw new Error(error.message);
    }

    logEmailSent(input.kind, input.to);
  } catch (error) {
    logEmailError(input.kind, error);
  }
}

export async function sendWelcomeEmail(input: {
  to: string;
  name: string;
}): Promise<void> {
  try {
    const html = await render(WelcomeEmail({ name: input.name }));
    await sendTransactionalEmail({
      to: input.to,
      subject: `Welcome to ${BRAND.name}`,
      html,
      kind: "welcome",
    });
  } catch (error) {
    logEmailError("welcome", error);
  }
}

export async function sendLimitReachedEmail(input: {
  to: string;
  name: string;
  kind: LimitReachedKind;
}): Promise<void> {
  try {
    const subject =
      input.kind === "meetings"
        ? `You've used your free meetings on ${BRAND.name}`
        : `You've used your free AI questions on ${BRAND.name}`;

    const html = await render(
      LimitReachedEmail({ name: input.name, kind: input.kind }),
    );

    await sendTransactionalEmail({ to: input.to, subject, html, kind: "limit-reached" });
  } catch (error) {
    logEmailError("limit-reached", error);
  }
}

export async function sendUpgradeSuccessEmail(input: {
  to: string;
  name: string;
  planName?: string;
  currentPeriodEnd?: string | null;
}): Promise<void> {
  try {
    const planName = input.planName ?? "Pro";
    const html = await render(
      UpgradeSuccessEmail({
        name: input.name,
        planName,
        renewalLabel: formatRenewalLabel(input.currentPeriodEnd),
      }),
    );

    await sendTransactionalEmail({
      to: input.to,
      subject: `Your ${BRAND.name} ${planName} plan is active`,
      html,
      kind: "upgrade-success",
    });
  } catch (error) {
    logEmailError("upgrade-success", error);
  }
}

export async function sendRenewalSuccessEmail(input: {
  to: string;
  name: string;
  currentPeriodEnd?: string | null;
}): Promise<void> {
  try {
    const html = await render(
      RenewalSuccessEmail({
        name: input.name,
        currentPeriodEnd: input.currentPeriodEnd,
      }),
    );

    await sendTransactionalEmail({
      to: input.to,
      subject: `Your ${BRAND.proPlanName} subscription renewed`,
      html,
      kind: "renewal-success",
    });
  } catch (error) {
    logEmailError("renewal-success", error);
  }
}

export async function sendPaymentFailedEmail(input: {
  to: string;
  name: string;
}): Promise<void> {
  try {
    const html = await render(PaymentFailedEmail({ name: input.name }));

    await sendTransactionalEmail({
      to: input.to,
      subject: `Action needed: ${BRAND.name} payment failed`,
      html,
      kind: "payment-failed",
    });
  } catch (error) {
    logEmailError("payment-failed", error);
  }
}

export async function sendSubscriptionCancelledEmail(input: {
  to: string;
  name: string;
  accessUntil?: string | null;
}): Promise<void> {
  try {
    const html = await render(
      SubscriptionCancelledEmail({
        name: input.name,
        accessUntil: input.accessUntil,
      }),
    );

    await sendTransactionalEmail({
      to: input.to,
      subject: `Your ${BRAND.proPlanName} subscription was cancelled`,
      html,
      kind: "subscription-cancelled",
    });
  } catch (error) {
    logEmailError("subscription-cancelled", error);
  }
}
