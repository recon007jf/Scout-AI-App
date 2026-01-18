# The Final Morning Briefing Logic (Authoritative)

## 1. Morning Briefing Is a Precomputed Daily Artifact

MB is not live, reactive, or generated on the fly.

- A **prep job** runs once per day (or per cycle).
- It selects candidates, enriches them, generates drafts, and locks the list.
- The UI is a **read-only consumer** of that prepared queue.

**Guarantees:**

- No surprise changes mid-session.
- No hidden async behavior.
- No latency when the user opens MB.

## 2. Candidate Eligibility Gate (Hard Requirements)

A candidate cannot enter MB unless **all** required fields are present.

**Non-Negotiable Required Fields:**
If any of these are missing, the candidate is **BLOCKED** from MB:

- Full name
- Company name
- Title / role
- City + State
- Valid work email (or verified deliverability signal)
- LinkedIn profile URL
- LinkedIn profile image (or resolvable via Serper)
- Ranking reason (data-backed, not generic)

**Rule:** No "Unknown", no placeholders.

## 3. The Daily Batch (Hard Limit)

- **Schedule:** Every day (e.g., 12:01 AM), the system selects **exactly 50 candidates**.
- **Scope:** This is the *entire universe* for that day. No more are added until the next cycle.
- **Purpose:** Protects deliverability, pacing, and cognitive load.

## 4. Visibility & Queue Flow

- **Background Queue:** 40 candidates (Invisible). Fully enriched, fully drafted.
- **Visible Queue:** Exactly **10 Active/Unsent** candidates.
  - Never fewer than 10 (unless daily batch is exhausted).
  - Always Unsent, Full Color, Actionable.

**The Promotion Loop (Approve → Send → Replace):**

1. User approves a candidate.
2. Candidate status: `UNSENT` → `SENT` (Turns Gray).
3. Candidate moves to **History** section (visually).
4. **Immediate Action:** The system promotes the next valid candidate from the background queue (40 → 39).
5. **Visible Result:** The list remains visually stable but always offers 10 actionable items.

## 5. Signal Transition (MB → Signals)

- **Trigger:** A response is detected (Replied, OOO, Bounced).
- **Action:** Candidate moves from Morning Briefing → Signals view.
- **Buffer:** Movement happens after a small delay (no "pop" disappearance) to maintain UI stability.

## 6. Availability Independent Logic (Vacation Mode)

- **State-Awareness:** MB generation tracks **Send State**, not User Presence.
- **If User is Away:**
  - No new sends occur.
  - MB does not advance.
  - Queue "holds state".
- **When User Returns:**
  - Resumes exactly where it left off.
  - No regeneration, no "catch-up" bursts.

## 7. Summary (The Mental Model)

Morning Briefing is a **daily, precomputed, fully-enriched, quality-gated batch** that **never degrades**, **never surprises**, and **never blocks** the user due to missing data.
