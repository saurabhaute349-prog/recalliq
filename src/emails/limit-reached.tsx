import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/emails/components/email-layout";
import { EMAIL_BRAND } from "@/lib/email/constants";
import { getAppBaseUrl } from "@/lib/email/urls";
import {
  FREE_PLAN_MEETING_LIMIT,
  FREE_PLAN_MESSAGE_LIMIT,
} from "@/lib/meetings/constants";
import { PRO_PLAN_PRICE_LABEL } from "@/lib/payments/constants";

export type LimitReachedKind = "meetings" | "ai_questions";

type LimitReachedEmailProps = {
  name: string;
  kind: LimitReachedKind;
};

export function LimitReachedEmail({ name, kind }: LimitReachedEmailProps) {
  const appUrl = getAppBaseUrl();
  const firstName = name.trim().split(/\s+/)[0] || "there";

  const isMeetings = kind === "meetings";
  const limitLabel = isMeetings
    ? `${FREE_PLAN_MEETING_LIMIT} meetings`
    : `${FREE_PLAN_MESSAGE_LIMIT} AI questions per meeting`;

  return (
    <EmailLayout
      preview={
        isMeetings
          ? "You've used your free meetings"
          : "You've used your free AI questions"
      }
    >
      <Heading style={heading}>
        {isMeetings ? "Meeting limit reached" : "AI question limit reached"}
      </Heading>
      <Text style={paragraph}>Hi {firstName},</Text>
      <Text style={paragraph}>
        You&apos;ve reached the free plan limit of {limitLabel}. Your existing
        meetings and transcripts stay safe—you can still read everything you&apos;ve
        saved.
      </Text>
      <Text style={paragraph}>
        When you&apos;re ready for more room, Pro ({PRO_PLAN_PRICE_LABEL}) adds
        unlimited meetings and unlimited AI chat so memory never runs out
        mid-conversation.
      </Text>
      <Button href={`${appUrl}/billing`} style={button}>
        View Pro plans
      </Button>
      <Text style={muted}>
        No pressure—upgrade only when it fits your workflow.
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

export default LimitReachedEmail;
