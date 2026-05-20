import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/emails/components/email-layout";
import { EMAIL_BRAND } from "@/lib/email/constants";
import { getAppBaseUrl } from "@/lib/email/urls";
import { FREE_PLAN_MEETING_LIMIT } from "@/lib/meetings/constants";

type WelcomeEmailProps = {
  name: string;
};

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  const appUrl = getAppBaseUrl();
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return (
    <EmailLayout preview="Your Recalliq workspace is ready">
      <Heading style={heading}>Welcome to Recalliq</Heading>
      <Text style={paragraph}>Hi {firstName},</Text>
      <Text style={paragraph}>
        Thanks for signing up. Recalliq turns meeting transcripts into
        searchable memory you can talk to—grounded in what was actually said.
      </Text>
      <Text style={featureHeading}>On the free plan you get:</Text>
      <Text style={listItem}>
        · {FREE_PLAN_MEETING_LIMIT} free meetings to build your library
      </Text>
      <Text style={listItem}>· AI meeting memory across every transcript</Text>
      <Text style={listItem}>· Searchable transcripts and follow-up questions</Text>
      <Button href={`${appUrl}/new`} style={button}>
        Add your first meeting
      </Button>
      <Text style={muted}>
        Paste a transcript from Zoom, Meet, or any notes—no integrations required.
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

export default WelcomeEmail;
