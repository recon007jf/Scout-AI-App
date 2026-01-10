# Phase 1 Integration Guide: Server-Side Proxy Architecture

**Status:** Ready for Stage 0 Testing  
**Strategy:** Incremental (Option B) - Test each stage before moving to next  
**Authentication:** Server-to-Server using Google Service Account (no end-user login yet)

---

## Architecture Overview

```
Browser → Next.js API Routes → Cloud Run Backend
         (Server-Side Proxy)    (Service Account Auth)
```

**Critical Constraint:** Browser NEVER calls Cloud Run directly.  
All calls go through Next.js server routes that mint Google ID tokens.

---

## Environment Variables Required

Add these to Vercel (Server-only environment variables):

### Required Now (Stage 0-1):
```bash
GOOGLE_SERVICE_ACCOUNT_KEY='{
  "type": "service_account",
  "project_id": "scout-production",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "scout-backend@scout-production.iam.gserviceaccount.com",
  ...
}'
```

### Optional (Development):
```bash
NEXT_PUBLIC_USE_MOCKS=false  # Set to true to use mock data locally
```

---

## Staging Plan (Execute in Order)

### Stage 0: The Plumbing ✅ READY TO TEST

**Goal:** Prove server-to-server auth works  
**Endpoint:** `GET /health`

**Test Instructions:**
1. Deploy to Vercel with `GOOGLE_SERVICE_ACCOUNT_KEY` configured
2. Visit `/integration-test` page
3. Click "Run Stage 0 Test"
4. Check server logs for: `"[v0] Upstream Status: 200"`

**Success Criteria:**
- Green checkmark appears
- Response shows: `{"success": true, "message": "Stage 0 Complete"}`
- Server logs show ID token was minted with correct audience

**Troubleshooting:**
- 403 Error → Service account needs IAM permission on Cloud Run
- 401 Error → Token audience mismatch (must be Cloud Run URL)
- Connection Error → Cloud Run not deployed or URL wrong

---

### Stage 1: The Safety Lock ✅ READY TO TEST

**Goal:** Read global pause state from backend  
**Endpoint:** `GET /api/outreach/status`

**Test Instructions:**
1. After Stage 0 succeeds, click "Run Stage 1 Test"
2. Verify response includes `status: "active"` or `status: "paused"`

**Success Criteria:**
- Response shows current outreach status
- If paused, UI should display red "OUTREACH PAUSED" banner (automatic)

**Backend Requirements:**
Gemini must implement `/api/outreach/status` endpoint that returns:
```json
{
  "status": "active",
  "paused_at": null,
  "resume_at": null,
  "duration": null,
  "queue_frozen": false,
  "queued_count": 15,
  "in_flight_count": 0,
  "next_block_at": "2025-01-05T14:00:00Z",
  "warning_due": false
}
```

---

### Stage 2: The Data Feed ⏳ PENDING STAGE 0-1 SUCCESS

**Goal:** Display real briefing targets in UI  
**Endpoint:** `GET /api/briefing`

**Test Instructions:**
1. After Stage 0-1 succeed, wire up `/api/scout/briefing` route
2. Call from Morning Briefing dashboard
3. Check server logs for RAW JSON response
4. Update TypeScript types based on actual response shape

**Success Criteria:**
- Server logs show: `"[v0] RAW BRIEFING PAYLOAD: {...}"`
- UI displays at least one real target (e.g., Kevin Overbey)
- Target cards render with correct data

**Backend Requirements:**
Gemini must implement `/api/briefing` endpoint that returns:
```json
{
  "targets": [
    {
      "broker_id": "broker_12345",
      "name": "Kevin Overbey",
      "firm_name": "Chicago Investments",
      // ... other fields (snake_case from backend)
    }
  ]
}
```

**Data Mapping:**
- Backend uses `snake_case` (e.g., `broker_id`, `firm_name`)
- Frontend uses `camelCase` (e.g., `brokerId`, `firmName`)
- Adapter layer in `/api/scout/briefing` will transform the response

---

## Files Created

### Server-Side Auth:
- `lib/auth/service-account.ts` - Google auth client & ID token minting
- `app/api/scout/health/route.ts` - Stage 0 test endpoint
- `app/api/scout/outreach/status/route.ts` - Stage 1 pause state
- `app/api/scout/briefing/route.ts` - Stage 2 data feed (skeleton ready)

### Client Integration:
- `lib/api/client.ts` - Updated to call Next.js proxy routes
- `lib/api/health-check.ts` - Health check helper
- `lib/types/integration.ts` - Integration response types

### Testing UI:
- `app/integration-test/page.tsx` - Test harness page
- `components/integration-test-panel.tsx` - Interactive test controls

---

## How to Use Integration Test Page

1. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

2. **Add Environment Variable:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add `GOOGLE_SERVICE_ACCOUNT_KEY` with service account JSON (server-only)

3. **Visit Test Page:**
   ```
   https://scout-ui.vercel.app/integration-test
   ```

4. **Run Tests:**
   - Click "Run Stage 0 Test" → Should see green checkmark
   - Click "Run Stage 1 Test" → Should see outreach status
   - Check browser console and Vercel logs for detailed output

---

## Acceptance Criteria for Phase 1

To exit Phase 1 and proceed to production, provide:

✅ **Server Logs:** Showing `200 OK` for `/health` and `/api/briefing`  
✅ **Raw JSON Dump:** The actual payload from `/api/briefing` logged server-side  
✅ **Screenshot:** UI displaying "OUTREACH PAUSED" (Red Banner) when backend returns `status: "paused"`  
✅ **Screenshot:** UI displaying at least one real target (e.g., Kevin Overbey) in Morning Briefing

---

## Next Steps After Stage 2

1. **Freeze TypeScript Contracts:**
   - Use logged JSON from Stage 2 to finalize `Target` interface
   - Update adapter layer to map snake_case → camelCase

2. **Wire Remaining Endpoints:**
   - POST `/api/briefing/targets/{id}/approve`
   - POST `/api/briefing/targets/{id}/pause`
   - POST `/api/briefing/targets/{id}/dismiss`
   - POST `/api/outreach/pause`
   - POST `/api/outreach/resume`

3. **Add Signals View:**
   - GET `/api/signals`
   - POST `/api/signals/{id}/read`
   - POST `/api/signals/{id}/reply`

4. **Production Readiness:**
   - Error handling refinement
   - Loading states polish
   - Rate limiting strategy
   - Monitoring & alerting

---

## For Backend Team (Gemini)

You need to implement these endpoints in Cloud Run:

**Priority 1 (Stage 0-1):**
- ✅ `GET /health` - Already exists
- ⏳ `GET /api/outreach/status` - Returns pause state

**Priority 2 (Stage 2):**
- ⏳ `GET /api/briefing` - Returns today's target batch

**Priority 3 (Post-Stage 2):**
- Morning Briefing actions (approve, pause, dismiss)
- Pause/Resume controls
- Signals endpoints

**Authentication:**
- All requests will have `Authorization: Bearer {ID_TOKEN}` header
- Token audience (`aud`) will be your Cloud Run URL
- Verify token using Google's public keys

**CORS:**
Not needed! Since all calls go through Next.js proxy, there are no cross-origin requests.

---

## Contact

Questions? Check:
- Button Contract Matrix: `docs/BUTTON_CONTRACT_MATRIX.md`
- Integration types: `lib/types/integration.ts`
- Test page: `/integration-test`
