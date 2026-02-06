# SCOUT PROJECT STATE

# Source of Truth - AG proposes edits, Joseph approves

PHASE: UAT Preparation (Alpha)
USER: Andrew (Non-technical, sensitive to robotic tone)
STACK: Python Backend (FastAPI), Next.js Frontend, Clerk Auth, Supabase DB
DOMAIN: scout-ai-app.com
INFRA: Vercel (frontend), Cloud Run (backend)

LAST_DECISIONS:

- BLOCKED: Clerk host_invalid error persists - escalated to Clerk support
- Configured 3 Clerk mail CNAMEs in GoDaddy (verified)
- Fixed Vercel env vars from TEST to LIVE keys
- Deleted duplicate Clerk app "My Application"
- Adopted Canonical State Model (AG proposes, Joseph approves)
- Inter-AI comms: ChatGPT (PM) and Gemini (Optimizer) active via API

CURRENT_BLOCKER: Clerk proxy verification failing - awaiting Clerk support response

CURRENT_PRIORITIES:

1. Validate Morning Briefing end-to-end
2. Verify Signals integration
3. Prepare for Andrew UAT

OPEN_BLOCKERS: None

TEAM_STATUS:

- Joseph: Available, chatting with AG
- ChatGPT (PM): API relay active
- Gemini (Optimizer): API relay active
- AG (Claude): Active in IDE, Librarian role
