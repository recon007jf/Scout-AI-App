# Deployment Checklist: Scout Phase 1

## Pre-Deployment

- [ ] Google Service Account created with Cloud Run Invoker role
- [ ] Service Account JSON key downloaded
- [ ] Cloud Run backend deployed and healthy
- [ ] Cloud Run URL confirmed: `https://scout-backend-prod-283427197752.us-central1.run.app`

## Vercel Setup

- [ ] Project connected to Git repository
- [ ] Environment variable added: `GOOGLE_SERVICE_ACCOUNT_KEY` (server-only)
- [ ] Production deployment triggered

## Stage 0 Validation

- [ ] Visit `/integration-test` page
- [ ] Run Stage 0 test
- [ ] Green checkmark appears
- [ ] Server logs show: `[v0] Upstream Status: 200`
- [ ] Server logs show: `[v0] Minted ID Token with audience: ...`

## Stage 1 Validation

- [ ] Run Stage 1 test on `/integration-test`
- [ ] Response shows valid outreach status
- [ ] If status is "paused", red banner appears in Morning Briefing
- [ ] Warning modal appears after 2 hours of pause (if applicable)

## Stage 2 Validation (Pending Backend)

- [ ] Backend implements `GET /api/briefing`
- [ ] Server logs show: `[v0] RAW BRIEFING PAYLOAD: {...}`
- [ ] TypeScript types updated based on real response
- [ ] Morning Briefing displays real target (e.g., Kevin Overbey)
- [ ] Target card shows correct data (name, firm, email subject)

## Production Launch

- [ ] All 3 stages passing
- [ ] Error handling tested (500, 404, timeout)
- [ ] Loading states verified
- [ ] Button Contract Matrix validated against backend
- [ ] PM approval obtained

## Post-Launch Monitoring

- [ ] Check Vercel logs for errors
- [ ] Monitor Cloud Run logs for auth failures
- [ ] Verify outreach pause system works end-to-end
- [ ] Confirm no mock data leaking to production
