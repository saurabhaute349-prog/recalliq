import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/emails/components/email-layout";
import { EMAIL_BRAND } from "@/lib/email/constants";
import { getAppBaseUrl } from "@/lib/email/urls";
import {
  PRO_PLAN_INTERVAL,
  PRO_PLAN_LABEL,
  PRO_PLAN_PRICE_LABEL,
} from "@/lib/payments/constants";

type UpgradeSuccessEmailProps = {
  name: string;
  planName?: string;
  renewalLabel?: string | null;
};

export function UpgradeSuccessEmail({
  name,
  planName = PRO_PLAN_LABEL,
  renewalLabel,
}: UpgradeSuccessEmailProps) {
  const appUrl = getAppBaseUrl();
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return (
    <EmailLayout preview={`You're on Recalliq ${planName}`}>
      <Heading style={heading}>You&apos;re on {planName}</Heading>
      <Text style={paragraph}>Hi {firstName},</Text>
      <Text style={paragraph}>
        Your upgrade to Recalliq {planName} ({PRO_PLAN_PRICE_LABEL}) is
        confirmed. Thank you for supporting Recalliq.
      </Text>
      {renewalLabel ? (
        <Text style={renewalBox}>
          <strong style={renewalStrong}>Renewal:</strong> {renewalLabel}
        </Text>
      ) : null}
      <Text style={featureHeading}>Your {planName} plan includes:</Text>
      <Text style={listItem}>· Unlimited meetings and transcript memory</Text>
      <Text style={listItem}>· Unlimited AI chat on every meeting</Text>
      <Text style={listItem}>· Full conversation history, always available</Text>
      <Button href={`${appUrl}/dashboard`} style={button}>
        Go to dashboard
      </Button>
      <Text style={muted}>
        Manage billing anytime from your account settings.
      </Text>
    </EmailLayout>
  );
}

const heading = {
  color: EMAIL_BRAND.text,
  fontSize: "22px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: "28px",
  margin: "0 0 20px",
};

const paragraph = {
  color: EMAIL_BRAND.text,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const renewalBox = {
  backgroundColor: EMAIL_BRAND.background,
  border: `1px solid ${EMAIL_BRAND.border}`,
  borderRadius: "8px",
  color: EMAIL_BRAND.muted,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 20px",
  padding: "12px 14px",
};

const renewalStrong = {
  color: EMAIL_BRAND.text,
};

const featureHeading = {
  color: EMAIL_BRAND.text,
  fontSize: "15px",
  fontWeight: 600,
  lineHeight: "24px",
  margin: "0 0 8px",
};

const listItem = {
  color: EMAIL_BRAND.muted,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 4px",
};

const button = {
  backgroundColor: EMAIL_BRAND.primary,
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  margin: "8px 0 20px",
  padding: "12px 20px",
  textDecoration: "none",
};

const muted = {
  color: EMAIL_BRAND.muted,
  fontSize: "13px",
  lineHeight: "20px",
  margin: 0,
};

export function formatRenewalLabel(
  currentPeriodEnd: string | null | undefined,
): string | null {
  if (!currentPeriodEnd) {
    return `Billed at ${PRO_PLAN_PRICE_LABEL} (${PRO_PLAN_INTERVAL === "month" ? "monthly" : PRO_PLAN_INTERVAL}).`;
  }

  const date = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(currentPeriodEnd));

  return `Your plan renews on ${date} (${PRO_PLAN_INTERVAL}ly billing).`;
}

export default UpgradeSuccessEmail;
