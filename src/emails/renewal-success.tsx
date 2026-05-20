import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/emails/components/email-layout";
import { EMAIL_BRAND } from "@/lib/email/constants";
import { getAppBaseUrl } from "@/lib/email/urls";
import { formatRenewalLabel } from "@/emails/upgrade-success";
import { PRO_PLAN_PRICE_LABEL } from "@/lib/payments/constants";

type RenewalSuccessEmailProps = {
  name: string;
  currentPeriodEnd?: string | null;
};

export function RenewalSuccessEmail({
  name,
  currentPeriodEnd,
}: RenewalSuccessEmailProps) {
  const appUrl = getAppBaseUrl();
  const firstName = name.trim().split(/\s+/)[0] || "there";
  const renewalLabel = formatRenewalLabel(currentPeriodEnd);

  return (
    <EmailLayout preview="Your Recalliq Pro subscription renewed">
      <Heading style={heading}>Payment received</Heading>
      <Text style={paragraph}>Hi {firstName},</Text>
      <Text style={paragraph}>
        Your Recalliq Pro subscription ({PRO_PLAN_PRICE_LABEL}) renewed
        successfully. Unlimited meetings and AI remain active.
      </Text>
      {renewalLabel ? (
        <Text style={renewalBox}>
          <strong style={renewalStrong}>Next renewal:</strong> {renewalLabel}
        </Text>
      ) : null}
      <Button href={`${appUrl}/billing`} style={button}>
        View billing
      </Button>
    </EmailLayout>
  );
}

const heading = {
  color: EMAIL_BRAND.text,
  fontSize: "22px",
  fontWeight: 600,
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

const renewalStrong = { color: EMAIL_BRAND.text };

const button = {
  backgroundColor: EMAIL_BRAND.primary,
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 20px",
  textDecoration: "none",
};

export default RenewalSuccessEmail;
