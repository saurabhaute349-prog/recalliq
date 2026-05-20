import type { Metadata } from "next";

import { BRAND } from "@/lib/brand/config";
import { getPublicAppUrl } from "@/lib/env/public";

export const SITE_NAME = BRAND.name;
export const SITE_TAGLINE = "Your AI Meeting Memory";
export const SITE_DESCRIPTION = BRAND.description;

export const SEO_KEYWORDS = [
  "AI meeting memory",
  "AI meeting assistant",
  "searchable meeting intelligence",
  "transcript AI",
  "AI meeting notes",
  "AI meeting chat",
  "meeting summary AI",
  "action items from meetings",
] as const;

export function getSiteUrl(): string {
  return getPublicAppUrl().replace(/\/$/, "");
}

function getMetadataBase(): URL {
  try {
    return new URL(getSiteUrl());
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const defaultMetadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [...SEO_KEYWORDS],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Never Lose a Meeting Insight Again`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Your AI Meeting Memory`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export function pageMetadata(
  title: string,
  description?: string,
): Metadata {
  return {
    title,
    description: description ?? SITE_DESCRIPTION,
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description: description ?? SITE_DESCRIPTION,
    },
    twitter: {
      title: `${title} · ${SITE_NAME}`,
      description: description ?? SITE_DESCRIPTION,
    },
  };
}
