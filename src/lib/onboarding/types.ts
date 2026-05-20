export const ONBOARDING_CHECKLIST_KEYS = [
  "uploadTranscript",
  "askQuestion",
  "openSearch",
  "visitDashboard",
  "visitBilling",
] as const;

export type OnboardingChecklistKey = (typeof ONBOARDING_CHECKLIST_KEYS)[number];

export type OnboardingProgress = Partial<Record<OnboardingChecklistKey, boolean>>;

export type OnboardingStep =
  | "welcome"
  | "demo"
  | "upload"
  | "checklist"
  | "complete";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "welcome",
  "demo",
  "upload",
  "checklist",
  "complete",
];

export function countCompletedSteps(progress: OnboardingProgress): number {
  return ONBOARDING_CHECKLIST_KEYS.filter((key) => progress[key]).length;
}

export function isChecklistComplete(progress: OnboardingProgress): boolean {
  return countCompletedSteps(progress) >= 3;
}
