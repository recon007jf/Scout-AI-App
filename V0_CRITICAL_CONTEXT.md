# V0 CRITICAL CONTEXT - READ THIS FIRST

**LAST UPDATED**: 2026-01-12

## USER EXPECTATIONS

### STOP WASTING TIME
- **Configuration before code** - Check env vars, settings first before writing code
- **Research before implementing** - Use docs BEFORE building, not after it breaks
- **Ask before acting** - Propose approach and wait for confirmation on complex changes
- **Challenge yourself** - "Is there a simpler way? Am I overengineering?"

### WHEN USER SAYS SOMETHING IS BROKEN
1. **Read the current working state first** - Don't investigate, KNOW what should be there
2. **You built this** - You should recognize missing elements immediately from screenshots
3. **Map dependencies** - Understand what other things will break before changing anything

## UI COMPONENT HIERARCHY

### Morning Briefing (PRIMARY FEATURE)
- **CORRECT Component**: `components/morning-briefing-dashboard.tsx`
  - 3-column layout: LEFT SIDEBAR (candidate list) + CENTER (candidate details) + RIGHT (AI panel)
  - Shows 10 candidates with avatars, names, titles, match %
  - Each candidate card is clickable to load details
- **WRONG Component**: `components/views/morning-briefing.tsx`
  - Simple 2-panel layout with no sidebar
  - Only Previous/Next buttons, no candidate list
  - This is NOT the main dashboard

### AppShell
- **File**: `components/app-shell.tsx`
- **Critical**: Must render `MorningBriefingDashboard`, NOT `MorningBriefingView`
- **Purpose**: Main layout wrapper that handles view switching

### Authentication Components
- **Clerk Auth**: `/sign-in` and `/sign-up` routes (standard Clerk pattern)
- **Supabase Auth (Legacy)**: Still used for database access via service role
- **DO NOT** break data fetching when changing auth

## AUTHENTICATION ARCHITECTURE

### Current State: HYBRID AUTH
- **Frontend**: Clerk for user authentication
- **Database**: Supabase PostgreSQL (NOT Supabase Auth)
- **Backend**: Accepts Clerk Bearer tokens (primary) + Supabase session (fallback)

### Critical Files
- `middleware.ts` - Clerk middleware for route protection
- `components/app-shell.tsx` - Uses Clerk's `useUser()` hook
- `lib/supabase/client.ts` - Supabase client for database access (NOT auth)

### DO NOT
- Remove Supabase client - still needed for database queries
- Mix auth providers in the same component
- Change auth without checking data fetching dependencies

## DATA FLOW

### Morning Briefing Data
1. **Source**: `lib/api/morning-queue.ts` → queries Supabase database
2. **Loads**: `components/morning-briefing-dashboard.tsx` line 229 `loadData()`
3. **Returns**: Up to 10 targets with status "ENRICHED" or "DRAFT_READY"
4. **Displays**: Left sidebar candidate list + selected candidate details

### Draft Emails
- **Storage**: `llm_email_subject` and `llm_email_body` tables in Supabase
- **Cache**: `draftCache` state object in morning-briefing-dashboard.tsx
- **Display**: Uses `editedSubject` and `editedBody` state, NOT `currentDraft.subject`

## COMMON MISTAKES YOU'VE MADE

### Mistake 1: Building custom auth instead of using Clerk
- **What happened**: Spent days on custom Supabase auth with PKCE, password reset, etc.
- **Correct approach**: Use Clerk's pre-built components (3 lines of code)
- **Lesson**: ALWAYS suggest proven tools before custom implementations

### Mistake 2: Changing component imports without understanding them
- **What happened**: Changed `MorningBriefingDashboard` to `MorningBriefingView` during Clerk migration
- **Result**: Broke the entire UI - lost candidate sidebar, AI panel, etc.
- **Lesson**: READ the current component before changing imports

### Mistake 3: Fixing config issues with code
- **What happened**: Created `/dashboard` redirect route when env vars were wrong
- **Correct approach**: Just update environment variables
- **Lesson**: Configuration first, code second

### Mistake 4: Breaking data fetching when changing auth
- **What happened**: Removed Supabase client initialization when adding Clerk
- **Result**: No draft emails, no candidate data loading
- **Lesson**: Auth changes must preserve data access patterns

## CRITICAL RULES

1. **Before ANY change**: Read the current working file in full
2. **Before touching AppShell**: Verify what components it renders and why
3. **Before changing auth**: Map all data fetching dependencies
4. **Before writing code**: Check if configuration, env vars, or existing tools solve it
5. **When user shows screenshot**: KNOW immediately what's missing based on component hierarchy
6. **When breaking one thing**: Check what else depends on it

## ENVIRONMENT VARIABLES

### Clerk (Authentication)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/login`

### Supabase (Database Only)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Backend
- `PYTHON_BACKEND_URL`
- Backend accepts Clerk Bearer tokens via middleware injection

## WHEN USER SAYS "IT'S BROKEN"

1. **Don't investigate** - You should KNOW what should be there
2. **Read this file first** - Refresh your memory on component hierarchy
3. **Check Common Mistakes section** - Did you repeat a past error?
4. **Think in systems** - What else did changing X affect?

---

**READ THIS FILE AT THE START OF EVERY SESSION AND BEFORE MAJOR CHANGES**
