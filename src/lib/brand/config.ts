export const BRAND = {
  name: "Recalliq",
  tagline: "Your AI meeting memory.",
  secondaryTagline: "Turn conversations into searchable intelligence.",
  description:
    "Upload transcripts, extract action items, and chat with meetings using AI-powered searchable memory.",
  website: "https://recalliq.ai",
  proPlanName: "Recalliq Pro",
  assistantName: "Recalliq",
  exportFilePrefix: "recalliq-export",
} as const;

export type BrandConfig = typeof BRAND;
