import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/emails/components/email-layout";
import { EMAIL_BRAND } from "@/lib/email/constants";
import { getAppBaseUrl } from "@/lib/email/urls";

type PaymentFailedEmailProps = {
  name: string;
};

export function PaymentFailedEmail({ name }: PaymentFailedEmailProps) {
  const appUrl = getAppBaseUrl();
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return (
    <EmailLayout preview="We could not process your Recalliq payment">
      <Heading style={heading}>Payment could not be processed</Heading>
      <Text style={paragraph}>Hi {firstName},</Text>
      <Text style={paragraph}>
        We were unable to charge your card for Recalliq Pro. Please update
        your payment method to keep unlimited access.
      </Text>
      <Button href={`${appUrl}/billing`} style={button}>
        Update billing
      </Button>
      <Text style={muted}>
        Your existing meetings and transcripts are still saved.
      </Text>
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

const button = {
  backgroundColor: EMAIL_BRAND.primary,
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  margin: "8px 0 16px",
  padding: "12px 20px",
  textDecoration: "none",
};

const muted = {
  color: EMAIL_BRAND.muted,
  fontSize: "13px",
  lineHeight: "20px",
  margin: 0,
};

export default PaymentFailedEmail;
