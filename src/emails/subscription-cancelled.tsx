import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/emails/components/email-layout";
import { EMAIL_BRAND } from "@/lib/email/constants";
import { getAppBaseUrl } from "@/lib/email/urls";
import { PRO_PLAN_PRICE_LABEL } from "@/lib/payments/constants";
import { formatMeetingDate } from "@/lib/meetings/format";

type SubscriptionCancelledEmailProps = {
  name: string;
  accessUntil?: string | null;
};

export function SubscriptionCancelledEmail({
  name,
  accessUntil,
}: SubscriptionCancelledEmailProps) {
  const appUrl = getAppBaseUrl();
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return (
    <EmailLayout preview="Your Recalliq Pro subscription was cancelled">
      <Heading style={heading}>Subscription cancelled</Heading>
      <Text style={paragraph}>Hi {firstName},</Text>
      <Text style={paragraph}>
        Your Recalliq Pro subscription ({PRO_PLAN_PRICE_LABEL}) has been
        cancelled. You will not be charged again.
      </Text>
      {accessUntil ? (
        <Text style={renewalBox}>
          Pro access remains until{" "}
          <strong style={renewalStrong}>
            {formatMeetingDate(accessUntil)}
          </strong>
          .
        </Text>
      ) : null}
      <Button href={`${appUrl}/billing`} style={button}>
        Resubscribe anytime
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

export default SubscriptionCancelledEmail;
