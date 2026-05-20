export const AnalyticsEvents = {
  signup: "signup",
  onboardingComplete: "onboarding_complete",
  uploadTranscript: "upload_transcript",
  createMeeting: "create_meeting",
  firstAiMessage: "first_ai_message",
  aiMessage: "ai_message",
  search: "search",
  billingClick: "billing_click",
  paymentSuccess: "payment_success",
  commandPalette: "command_palette",
  marketingCta: "marketing_cta",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;
