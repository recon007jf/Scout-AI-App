# Morning Coffee: Behavioral Walkthrough

A narrative map of Andrew's actual workflow when triaging AI-generated draft emails.

---

## Pre-Session Context

**When:** 7:00-7:30 AM, Monday-Friday  
**Where:** Andrew's office, desktop computer, large monitor  
**Mental State:** Fresh, focused, caffeinated - "planning mode" before chaos  
**Goal:** Review overnight-generated drafts, approve quality ones, edit/skip others  
**Time Budget:** 15-20 minutes max (but can vary based on day)

**Today's Context:** Normal Tuesday, no urgent deals, 20 minutes available → Andrew will likely mix quick-approves with careful review

---

## Entry: Entering Morning Coffee Mode

Andrew opens Scout. Default dashboard shows pipeline metrics.

He clicks **"Morning Coffee"** in navigation.

**Screen transition:**
- Dashboard fades
- UI simplifies (no sidebar, minimal chrome)
- Focused queue appears: **"12 drafts ready for review"**
- Calm, uncluttered workspace

**What he sees:**
- **Summary bar:** "12 drafts • 7 high-confidence • 3 medium • 1 needs attention • Est. 12 min"
- **Optional bulk actions:**
  - "Approve 7 high-confidence targets" button
  - "Review 3 medium-confidence" link
  - "1 needs attention" warning
- **Target list:** Vertical list of 12 targets (all visible with scroll)
- **Each row:** Name, Firm, Subject line, Confidence dot (green/yellow/red), "Why today?" tag
- All collapsed by default

**Andrew's initial decision:**
*7 greens is a lot. Let me scan them first before bulk-approving.*

---

## Scanning Phase (45 seconds)

Andrew scans all 12 targets quickly:
- 7 green dots (recognizes 4 names, 3 are new)
- 3 yellow dots (one is a VIP client - needs careful review)
- 1 red dot (at the top, flagged for attention)

**Mental plan forms based on today's context:**
1. Handle the red flag first (data issue needs fixing)
2. Quick-approve the 4 green targets he recognizes
3. Review the 3 new greens more carefully
4. Carefully review the 3 yellows (one is VIP)

*This is a hybrid approach - not full control, not full automation*

---

## Alternative Entry Flow: Busy Morning (5 Minutes Available)

**Context changes behavior:**

Andrew has back-to-back meetings. Only 5 minutes for Morning Coffee.

**What he does differently:**
1. Clicks "Approve 7 high-confidence targets" immediately
2. Quickly scans yellows - all look routine, approves 2
3. Reads the VIP yellow carefully, edits slightly, approves
4. Skips the red flag for later review
5. Done in 4 minutes

**System response:**
- "Morning Coffee Complete: 9 approved (7 auto, 2 reviewed), 1 edited, 1 flagged"
- All approved drafts queued to Outlook
- Red flag stays in queue for next session

*Same user, same day, different time pressure → different behavior*

---

## Target #1: Red Flag (Jennifer Park)

**Status:** Red dot  
**Subject:** "Reconnecting about your liability coverage"

Expands. Red banner shows:

**"Email verification failed. Address may be outdated."**  
**"Provenance: CRM (last verified 18 months ago)"**

Andrew's reaction: *Not sending if email might bounce.*

Clicks **[Dossier]**

**Shows:**
- Added 2 years ago, no recent interactions
- Email source: Manual entry (not enriched)
- No engagement history (never opened previous emails)

Andrew: *Dead lead. Need to verify email first.*

**Decision:** Skip

Clicks **[Skip]**

**Modal:** "Why are you skipping?"
- Needs research
- Bad timing  
- Data quality issue (selected)
- Other

Selects "Data quality issue" + note: *"Verify email before outreach"*

**Result:**
- Removed from queue
- Added to "Flagged for Review" list
- Core Engine logs feedback (AI learns)
- Counter: "11 remaining"

**Time:** 1 minute

---

## Targets #2-5: Quick Bulk Approval (Recognized Names)

Andrew decides the next 4 targets are people he knows well and trusts the AI with.

Instead of expanding each one individually, he:
1. Checks the checkboxes next to Sarah Chen, Michael Torres, David Kim, Lisa Martinez
2. Clicks "Approve Selected (4)"

**OR uses keyboard shortcut:**
- Presses 'A' on collapsed row #2 (Sarah) → instant approve without expanding
- Presses 'A' on collapsed row #3 (Michael) → instant approve
- Presses 'A' on collapsed row #4 (David) → instant approve  
- Presses 'A' on collapsed row #5 (Lisa) → instant approve

**Result:**
- All 4 rows collapse with green checkmarks
- Small confirmation: "4 drafts approved"
- Counter: "7 remaining"
- Next target auto-expands

**Time:** 30 seconds total for 4 approvals

*This is trust mode - Andrew knows these people, confidence is high, he's moving fast*

---

## Target #6: New Prospect - Careful Review (Robert Chang)

**Status:** Green dot (but Andrew doesn't recognize the name)  
**Subject:** "Introduction from Pacific Northwest Insurance Network"

Row auto-expanded after bulk approval.

Andrew doesn't recognize Robert Chang. Green dot means AI is confident, but this is a new relationship.

**He reads carefully:**
- Draft mentions they're both members of PNIN
- References Robert's recent post about group health trends
- Offers to connect for coffee

**Andrew's evaluation:**
- *This is accurate - I am in PNIN*
- *I don't remember Robert's post, but it's plausible*
- *Tone is good, not too salesy*

He clicks **[View Dossier]** to verify

**Dossier shows:**
- Robert is active in PNIN (verified)
- Posted about group health trends 3 days ago (verified)
- No prior contact, but strong contextual relevance

**Decision:** Approve, but with note

Andrew approves but adds a mental note: *Watch for Robert's response - if he replies positively, this is working well.*

**Time:** 1.5 minutes (more careful because new prospect)

*This is verify mode - green dot doesn't mean skip thinking*

---

## Targets #7-9: Routine Yellows (Quick Review)

Three yellow dots. Andrew expands each, reads quickly:

**Target #7:** Routine check-in, 4 months since last contact → Approve (30 sec)
**Target #8:** Cadence-driven follow-up, context is fine → Approve (25 sec)
**Target #9:** VIP client (Susan Park), renewal coming up

**Target #9 gets special treatment:**
Susan is a major account. Yellow because "no recent conversation."

Andrew reads draft carefully. It's fine, but too generic for a VIP.

**Decision:** Edit heavily

Rewrites opening: "Susan, I've been thinking about your team's growth..."
Adds specific reference to their last lunch meeting
Personalizes the renewal conversation

**Time:** 3 minutes on this one target

*VIP status overrides confidence score - always gets personal attention*

---

## Targets #10-12: Final Three Greens

All green, all look good. Andrew is in rhythm now.

- Expand, scan, approve (#10) - 25 sec
- Expand, scan, approve (#11) - 30 sec
- Expand, scan, approve (#12) - 25 sec

**Counter: "0 remaining"**

**Total session time:** ~11 minutes

---

## Exit: Session Complete

**Screen shows:**

**"Morning Coffee Complete"**
- 12 drafts reviewed in 11 minutes
- 9 approved as-is (4 bulk-approved, 5 individually reviewed)
- 2 edited and approved (1 minor, 1 major for VIP)
- 1 flagged for review (data quality)

**Session efficiency:**
- Average 55 seconds per draft
- 75% approval rate without edits
- 1 VIP received personalized attention
- 1 data issue caught before sending

**Adaptive behavior noted:**
- Bulk approved 4 recognized high-confidence targets (trust mode)
- Carefully reviewed 3 new prospects despite green dots (verify mode)
- Extra time on VIP despite yellow (relationship priority)
- Efficient on routine follow-ups (speed mode)

**System learning:**
- "VIP clients get extra review time - noted"
- "New prospects reviewed carefully even when green - adjusting confidence display"
- "Bulk approval used for recognized names - will surface recognition signals"

---

## Edge Cases: Context-Dependent Behavior

### Scenario 1: Extremely Busy Morning (3 minutes available)

Andrew opens Morning Coffee, sees 12 targets, has 3 minutes.

**What he does:**
- Clicks "Approve 7 high-confidence" immediately
- Scans yellows, approves all 3 without expanding
- Sees red flag, clicks "Skip for later"
- Exits in 2 minutes

**Result:**
- 10 approved, 1 skipped, 1 flagged
- Not thorough, but maintains momentum
- Can review sent emails later if needed

### Scenario 2: Cautious Day (Major Deal in Pipeline)

Andrew has a $500K deal closing today. Extra careful mode.

**What he does:**
- Ignores bulk actions completely
- Reviews all 12 individually, even greens
- Edits 4 drafts to be extra conservative
- Takes 25 minutes instead of usual 12

**Result:**
- High control, low speed
- Appropriate for high-stakes context

### Scenario 3: Trust Building (Month 1 with Scout)

Andrew's first week. Doesn't trust AI yet.

**What he does:**
- No bulk approvals
- Reviews every target carefully
- Edits 6 out of 12 drafts
- Checks Dossier on most targets
- Takes 30+ minutes

**Result:**
- Slow, but building confidence
- AI learns his voice from edits
- By week 4, approval rate increases

### Scenario 4: Post-Mistake Recovery

AI sent an email last week that was slightly off. Andrew caught it.

**What he does:**
- Temporarily reverts to full review mode
- Checks all greens carefully
- Less trust in bulk actions for a few days
- Gradually returns to hybrid approach

**Result:**
- System adapts to regain trust
- Shows it's learning from mistake

---

## Key Insight: Same User, Different Behavior

Andrew isn't "a Lean Forward user" or "a Lean Back user."

He's **adaptive** based on:
- Time available
- Market conditions
- Relationship importance
- Trust in AI (builds over time)
- Recent performance (AI accuracy)

**The UI must support all these behaviors fluidly, in the same interface.**

---

## Post-Session: Backend Behavior

**Approved drafts:**
- Queued to Andrew's Outlook outbox
- Scheduled per cadence rules (e.g., "Tuesday 9 AM")
- Andrew can still cancel/edit from Outlook

**Flagged draft:**
- Appears in "Flagged for Review" queue
- Andrew can research/fix later
- Core Engine logs data quality issue

**Edited drafts:**
- Core Engine logs changes (AI learns Andrew's style)
- Future drafts incorporate his edits

**System:**
- No automatic sends during Morning Coffee
- Human approval is final gate
- All actions reversible until actual send

---

## Edge Cases

**Out of time mid-session:**
- Can exit anytime
- Reviewed drafts stay approved
- Unreviewed stay in queue
- Can resume later

**Empty queue:**
- "No drafts pending. Great work!"
- Shows alternative actions

**Want to skip Morning Coffee:**
- Drafts accumulate
- Can batch-process later

**Approved draft seems wrong later:**
- Cancel from Outlook before send
- Pull back into Scout for re-edit
- Bat Phone for urgent overrides

---

**End of Walkthrough**

This maps Andrew's actual behavior, decisions, and system responses.

It's the behavioral contract we're designing to.
