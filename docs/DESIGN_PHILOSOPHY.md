# Scout: Design Philosophy & Principles

## Project Vision

Scout automates the tedious parts of sales prospecting (research, timing, drafting, tracking) so relationship-driven professionals can focus on what humans do best: building trust and making judgment calls.

**Target User:** Andrew, a senior insurance broker who values relationships over volume, trust over automation, and personal connection over "sales efficiency."

## Core Design Principle

> "If it feels like a CRM or spam software, we've failed. If it feels like a trusted assistant during a morning routine, we've succeeded."

---

## What We're Automating (The Tedious Work)

- Prospect research and enrichment (LinkedIn, company websites, news)
- Email draft generation based on target profiles
- Voice matching (emails sound like Andrew, not a template)
- Timing optimization (cadence management, spam avoidance)
- Response handling (out of office, rejections, data quality issues)
- CRM sync and data entry

**Andrew never sees this complexity. It happens overnight.**

---

## What We're Enhancing (The Human Work)

- **Judgment:** Is this target relevant today?
- **Relationship context:** Why does this matter to this person?
- **Voice authenticity:** Does this sound like me?
- **Timing discretion:** Is now the right moment?

**Morning Coffee is where AI labor meets human judgment.**

---

## Design Anti-Patterns (What to Avoid)

### CRM Anti-Patterns
- Dense data tables with 12+ columns
- "Pipeline stages" or "conversion funnels"
- "Records," "entities," or database terminology
- Bulk actions or checkboxes
- Metrics worship (conversion rates, productivity scores)

### Spam Software Anti-Patterns
- Volume bragging ("847 emails sent today!")
- "Send to all" functionality
- Hidden automation without approval
- Pressure to "clear the queue"
- Guilt about skipped opportunities

### Productivity Tool Anti-Patterns
- "Are you sure?" confirmation dialogs
- Red badges demanding attention
- Gamification (streaks, points, leaderboards)
- "Recommended action" nudges
- Time pressure or urgency signals

---

## Design Patterns (What to Embrace)

### Briefing Document Patterns
- Small, curated lists (8-12 items max)
- Clear reasoning for each item
- One decision at a time
- Generous white space and breathing room
- Calm, unrushed pacing

### Trusted Assistant Patterns
- "Why today?" explanations for every target
- Learning from edits ("Thanks, I'm learning from your changes")
- Transparent reasoning, opaque mechanics
- Respectful of judgment (skip = no penalty)
- Quiet background improvements

### Professional Ritual Patterns
- Predictable timing (morning routine)
- Manageable volume (fits in 15-20 minutes)
- Focused mode (reduced UI chrome)
- Keyboard-driven efficiency
- Clear exit point ("Session complete")

### Adaptive Interaction Patterns
- **Individual review** (full control) - Expand, read, edit each target
- **Bulk actions by confidence** (hybrid) - "Approve all 7 high-confidence targets"
- **Quick approval** (trust mode) - Press 'A' without expanding to read
- **Selective automation** (contextual) - "Auto-approve similar targets going forward"
- All available in same session - user chooses per target

---

## Visual Design Principles

### Dark Mode First (Default)
- **Default to dark mode** - Easy on eyes for morning ritual (7-7:30 AM usage)
- **Light mode available** - Optional toggle for user preference
- **Eye comfort prioritized** - Low contrast ratios, muted colors, no pure black/white
- **Reading optimization** - Text sized for sustained reading (16px+ body text)

**Dark Mode Palette Guidelines:**
- Background: Soft dark grays (#1a1a1a to #2a2a2a), not pure black
- Text: Off-white (#e5e5e5 to #f5f5f5), not pure white
- Accents: Muted, desaturated colors (avoid bright neons)
- Confidence indicators: Subtle green/yellow/red (not glaring)

**Light Mode Palette Guidelines:**
- Background: Soft off-whites (#fafafa to #f5f5f5), not pure white
- Text: Dark gray (#1a1a1a to #2a2a2a), not pure black
- Maintain readability with sufficient contrast (WCAG AA minimum)
- Keep same information hierarchy as dark mode

### Color & Typography
- Professional B2B aesthetic (think Linear, Attio, Clay in dark mode)
- Trustworthy and calm (insurance context)
- Not flashy or "sales-y"
- High information density without overwhelm
- 3-5 colors max, 2 font families max
- **Typography for readability:**
  - Body text: 16-18px for sustained reading
  - Line height: 1.5-1.6 for comfortable scanning
  - Font weight: Regular (400) for body, Medium (500) for emphasis
  - No thin fonts (hard to read in dark mode)

### Layout
- **Morning Coffee Mode:** Full-width, no persistent sidebar
- **Desktop-first:** Optimized for seated, deliberate work
- **Keyboard-driven:** A (approve), E (edit), P (polish), D (dossier), S (skip)
- **Progressive disclosure:** Collapsed shows essentials, expanded shows depth

### Information Hierarchy
- **Collapsed Target Card:**
  - Name, Firm
  - Draft subject line
  - Confidence indicator (green/yellow/red)
  - "Why today?" insight tag
  
- **Expanded Target Card:**
  - Target context (role, cadence status, verification)
  - Full draft (editable inline)
  - Action bar (Approve, Edit, Polish, Dossier, Skip)
  
- **Dossier (Side Panel):**
  - Relationship timeline
  - Past conversations
  - Enrichment data
  - AI reasoning for timing

---

## Terminology (Business Language, Not Database Language)

### Use This
- **Target** (not lead, prospect, or contact)
- **Dossier** (not profile, record, or entity)
- **Morning Coffee Queue** (not task list or pipeline)
- **Magic Polish** (not AI enhancement or optimization)
- **Bat Phone** (not urgent alerts or notifications)
- **Cadence Guardrails** (not spam prevention or delivery rules)
- **Verified vs. Candidate** (not validated vs. unvalidated)

### Never Use This
- Records, entities, rows
- Foreign keys, relationships, schemas
- Lead score, conversion funnel, pipeline
- Touchpoints, activities, engagements
- Optimization, efficiency metrics

---

## The Philosophical Test

Before adding any feature, button, or data field, ask:

**"Does this make Andrew spend more time on tedious work, or more time on relationships?"**

- **More tedious** → Remove it (automate or eliminate)
- **More relationships** → Keep it (surface and enhance)

### Examples

| Feature | Tedious or Relationship? | Decision |
|---------|--------------------------|----------|
| Manually verify email addresses | Tedious | Automate it |
| View past conversations | Relationship | Surface it |
| Update CRM fields before sending | Tedious | Auto-sync |
| Edit draft to match voice | Relationship | Make it easy |
| Configure cadence rules | Tedious | AI decides |
| Override timing for specific send | Relationship | Respect judgment |

---

## Trust & Control

### Human-in-the-Loop Gate
- No emails send automatically during Morning Coffee
- Approval required for every draft
- Reversible until actual send (Outlook outbox)
- Clear feedback: "Queued to Outlook for Tuesday 9 AM"

### Adaptive Trust Model

**Default State: Safety First**
- New users always review individually (build trust)
- Bulk actions are opt-in (never forced)
- AI suggestions are helpful, not pushy
- User can always override automation

**Enable Speed When Wanted:**
- Keyboard shortcuts for quick approval (press A without expanding)
- Bulk approve by confidence tier (optional)
- "Auto-approve similar" for specific target types
- Summary view shows session efficiency

**System Learns User Preferences:**
- Tracks approval patterns (when user wants control vs speed)
- Adjusts confidence thresholds based on what user trusts
- Surfaces exceptions that need attention
- Never assumes - always lets user choose

### Confidence Transparency

Every target shows "Why today?" with clear reasoning:
- **Green (High Confidence):** "Renewal timing + verified email + past engagement"
- **Yellow (Medium):** "Routine cadence, no recent conversation"  
- **Red (Needs Attention):** "Email verification failed" or "Data quality issue"

This helps users decide when to trust vs verify.

---

## Morning Coffee: The Core Experience

### What It Is
- A **focused mode**, not a page
- A **decision ritual**, not a task list
- A **judgment checkpoint**, not queue processing

### Adaptive Interaction Flow

**Morning Coffee Queue: 12 targets**

**Top Section (Optional Bulk Actions):**
- "Approve 7 high-confidence targets" (Green dot count)
- "Review 3 medium-confidence targets" (Yellow dot count)
- "1 needs attention" (Red dot - always requires review)

**User can:**
- Use bulk approve → 7 targets instantly approved, queue drops to 5
- Ignore bulk actions and review individually
- Mix both approaches in same session

**Per-Target Options:**
- Expand → Read full draft → Approve/Edit/Skip individually
- Quick approve → Checkmark without expanding (Trust mode)
- Auto-approve similar → Let AI handle this type going forward (Automation)

**System Adapts to Behavior:**
- Reviews everything this week → AI stays conservative
- Bulk approves greens for 2 weeks → AI learns trust patterns
- Suddenly reviews everything → AI notices context change, adjusts

### Entry State
- Andrew clicks "Morning Coffee" in navigation
- UI simplifies (no sidebar, no peripheral chrome)
- Shows: "12 drafts ready • 7 high-confidence • 3 medium • 1 needs attention"
- Bulk action suggestions visible but optional
- Calm, focused workspace

### Interaction Flow Options

**Option 1: High Control (Lean Forward)**
1. Ignore bulk actions
2. Expand first target
3. Read draft carefully
4. Approve/Edit/Skip individually
5. Repeat for each target

**Option 2: Hybrid (Adaptive)**
1. Click "Approve 7 high-confidence"
2. Review 3 medium-confidence individually
3. Handle 1 flagged target carefully
4. Session complete in 5 minutes

**Option 3: High Trust (Lean Back)**
1. Scan list quickly
2. Quick-approve greens with keyboard (A, A, A, A...)
3. Expand only yellows/reds for review
4. Session complete in 3 minutes

**All three approaches supported. User chooses based on context that day.**

---

## State Variations (Every View Must Handle)

- **Loading:** Skeleton UI, no spinners
- **Empty:** "No opportunities today. Great work!" (positive framing)
- **Partial data:** Degrade gracefully (show what's available)
- **Error:** Clear explanation, no jargon, offer recovery action

---

## Integration Points (Backend Contract)

### Abstract Function Calls (Not REST Routes)
// BACKEND TODO: Implement these integration points
getMorningCoffeeQueue(): Promise<Target[]>
approveDraft(targetId: string): Promise<void>
editDraft(targetId: string, content: string): Promise<void>
magicPolish(targetId: string): Promise<Draft>
skipTarget(targetId: string, reason: string): Promise<void>
getDossier(targetId: string): Promise<Dossier>
// MOCK DATA - Replace with getMorningCoffeeQueue()
// Expected shape: Target[]
const mockTargets: Target[] = [
  {
    targetId: "t_001",
    fullName: "Sarah Chen",
    firmName: "Coastal Insurance",
    cadenceDay: 3,
    draftSubject: "Following up on your workers' comp renewal",
    confidenceScore: 0.94,
    verificationStatus: "verified",
    // ... provenance fields (display only)
  }
]
// ... rest of code here ...

---

## Tech Stack

### Frontend (v0's Domain)
- Next.js App Router (v14+)
- TypeScript (Strict Mode)
- Tailwind CSS (Utility-first, no arbitrary values)
- shadcn/ui (Radix-based components, no custom invention)
- Lucide React (Icons, no emojis)
- TanStack Query (Server state, optimistic updates)
- Supabase Auth (Client-side SDK)

### Backend (Antigravity's Domain)
- Python Core Engine
- RESTful JSON API
- Outlook Graph API integration
- AI providers (Gemini, OpenAI, Claude - swappable)

### Boundary
- Frontend is "dumb client" - presentation only
- Backend owns all business logic
- API Interface is the contract between us

---

## Q1 2026 Roadmap

**Phase 1 (Dec 29 - Jan 4):** Morning Coffee Deck + Magic Polish Modal  
**Phase 2 (Jan 5-11):** Dossier View + Firm Context  
**Phase 3 (Jan 12+):** Bat Phone Panel + Safety Valve Settings

---

## Questions Still Open (As of Dec 2024)

1. **Daily volume target:** What's the ideal queue size? (Currently: 8-12)
2. **Empty queue messaging:** Success or failure when no targets?
3. **Response visibility:** Does Andrew see all responses or just summaries?
4. **Voice training timeline:** How long until AI matches voice?
5. **Cadence override:** Can Andrew force immediate send?
6. **Bat Phone behavior:** Interrupt during Morning Coffee or separate?

---

**Last Updated:** Dec 24, 2024  
**Status:** Planning Phase (Build starts Dec 29, 2024)
