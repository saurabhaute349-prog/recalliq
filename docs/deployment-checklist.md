# Recalliq — Deployment Checklist

## Environment

- [ ] `NEXT_PUBLIC_APP_URL` set to production domain (https)
- [ ] Supabase production project + keys
- [ ] `supabase/phase2-recovery.sql` applied
- [ ] Razorpay live keys + webhook URL configured
- [ ] `GEMINI_API_KEY` set
- [ ] `RESEND_API_KEY` + `EMAIL_FROM` verified domain
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` (optional)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (optional)

## Security

- [ ] RLS enabled on all tables
- [ ] Service role key server-only (never `NEXT_PUBLIC_`)
- [ ] Webhook signature verification enabled (Razorpay)
- [ ] `NEXT_PUBLIC_LOCALHOST_ONLY` unset in production

## Build & deploy

- [ ] `npm run build` passes
- [ ] Smoke test: signup → upload → meeting → chat → billing
- [ ] Marketing pages: `/`, `/features`, `/pricing`
- [ ] `sitemap.xml` and `robots.txt` reachable

## Post-launch

- [ ] PostHog dashboards for signup, upload, payment
- [ ] Sentry alerts for API/AI errors
- [ ] Product Hunt assets (screenshots from `/`)
