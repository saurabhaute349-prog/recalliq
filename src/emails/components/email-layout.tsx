import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

import { BRAND } from "@/lib/brand/config";
import { EMAIL_BRAND } from "@/lib/email/constants";
import { getAppBaseUrl } from "@/lib/email/urls";

type EmailLayoutProps = {
  preview: string;
  children: ReactNode;
};

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  const appUrl = getAppBaseUrl();

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>{BRAND.name}</Text>
          </Section>
          <Section style={card}>{children}</Section>
          <Hr style={hr} />
          <Text style={footer}>
            {BRAND.name} — {BRAND.tagline}
            <br />
            <Link href={appUrl} style={footerLink}>
              Open {BRAND.name}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: EMAIL_BRAND.background,
  fontFamily: EMAIL_BRAND.fontFamily,
  margin: 0,
  padding: "32px 16px",
};

const container = {
  margin: "0 auto",
  maxWidth: "560px",
};

const header = {
  marginBottom: "16px",
};

const logo = {
  color: EMAIL_BRAND.text,
  fontSize: "18px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  margin: 0,
};

const card = {
  backgroundColor: EMAIL_BRAND.surface,
  border: `1px solid ${EMAIL_BRAND.border}`,
  borderRadius: "12px",
  padding: "32px 28px",
};

const hr = {
  borderColor: EMAIL_BRAND.border,
  margin: "24px 0 16px",
};

const footer = {
  color: EMAIL_BRAND.muted,
  fontSize: "12px",
  lineHeight: "20px",
  margin: 0,
  textAlign: "center" as const,
};

const footerLink = {
  color: EMAIL_BRAND.primary,
  textDecoration: "none",
};
