/**
 * Optional CLI helper — demo meetings are normally created via the app UI.
 * Usage: node scripts/seed-demo-meeting.mjs
 * Requires SUPABASE_SERVICE_ROLE_KEY and a user id in DEMO_USER_ID.
 */
console.info(
  "Demo meetings are created in-app via Settings/Onboarding → Try Demo Meeting.",
);
console.info(
  "Or call createDemoMeeting() from src/lib/demo/create-demo-meeting.ts after sign-in.",
);
