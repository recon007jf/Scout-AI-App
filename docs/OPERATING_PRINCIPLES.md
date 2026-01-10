# **Scout Operating Principles**

## **The "No-Fail SaaS" Directive**

**Version:** 1.0

**Applies To:** Scout (Internal + Future Commercial)

**Audience:** Human founders and all AI collaborators (Gemini, ChatGPT, v0, AG)

**Status:** Governing document

---

## **1. Source & Provenance**

### **Primary Source**

**Creator of example principals:** Mike (Founder of Curator.io, Frill.co, Juno.co, Fluke.co, Smile.co)

**Interviewed By:** Pat Walls, *Starter Story*

**Video:** "How Mike Builds SaaS Businesses That Can't Fail"

**Context:** Mike operates multiple "boring" SaaS products generating over $200k/month, bootstrapped, with zero failures using a repeatable playbook.

### **Why This Video Matters to Scout**

This video is not inspirational content. It is an **operational manual** from a founder who has repeatedly reduced SaaS risk to near zero by:

* Choosing non-sexy but proven problems
* Prioritizing workflow over novelty
* Treating design as a trust mechanism
* Avoiding unnecessary platform risk
* Staying lean and feedback-driven

Scout is at a **Measure Twice, Cut Once** inflection point. The team explicitly chose to translate this video into operating doctrine to ensure Scout becomes a **durable business asset**, not a clever demo or AI experiment.

---

## **2. Scout's Core Problem (What We Are Actually Solving)**

### **Industry**

**Vertical:** Health Insurance / Employee Benefits

**Primary User:** Senior Insurance Brokers, TPAs, and agency leadership

### **The Real Problem**

Brokers do not lack data.

They lack **time, focus, and signal clarity**.

Their daily reality:

* Fragmented research across Google, LinkedIn, CRM notes, and inboxes
* High cognitive load deciding *who* to contact and *how*
* Fear of automation tools that feel spammy, unsafe, or impersonal
* Constant market shifts (renewals, mergers, regulation, layoffs)

### **Scout's Role**

Scout does **not** invent new behavior.

Scout:

* Compresses existing broker workflows
* Reduces decision fatigue
* Preserves human judgment at high-stakes moments
* Turns outreach into a calm, repeatable ritual

If Scout ever feels like a "new way of selling," it has failed.

---

## **3. The Five Governing Principles (Adapted for Scout)**

### **Principle 1: The "Boring Idea" Rule**

**Rule:** We optimize existing behavior. We do not invent new ones.

**Scout Translation:**

Brokers already:

* Research prospects
* Draft emails
* Track replies
* Adjust based on market signals

Scout simply removes friction.

**Kill Criteria:**

If a feature sounds impressive but does not map cleanly onto Outlook, research, or follow-up, it is rejected.

**North Star Test:**

"If this feels like a faster, calmer version of Outlook, build it.

If it feels like a science project, kill it."

---

### **Principle 2: Design Is Not Cosmetic, It Is Trust Infrastructure**

**Rule:** MVP does not mean ugly.

**Scout Translation:**

Streamlit was deprecated because it communicated "prototype."

Scout must visually signal:

* Stability
* Predictability
* Professionalism

**UI Doctrine:**

* Use boring, standard patterns
* Prefer tables, lists, queues, dashboards
* The "Morning Coffee" experience should feel like checking a bank account, not playing with AI

Design earns the right to be trusted with automation.

---

### **Principle 3: The Synthetic Co-Founder Model**

**Rule:** Scout operates as a full founding team, even if humans are limited.

**Roles:**

* **Front-End (v0):** UI, UX, interaction clarity
* **Back-End (AG):** Python core, data integrity, APIs
* **Product & Architecture (Gemini + ChatGPT):** System design, tradeoffs, guardrails
* **Founder (Joseph):** Vision, decisions, authority

**Constraint:**

Each role stays in its lane.

UI never embeds business logic.

Core never cares about CSS.

---

### **Principle 4: AI Is a Tool, Not the Product**

**Rule:** We intentionally break Mike's "avoid AI" rule, but we neutralize the risk.

**Risk Identified in Video:**

Dependency on APIs you do not control can kill a business.

**Scout Defense Strategy:**

* Vendor-agnostic "Plug-n-Play AI" layer
* Data ownership in Postgres (Supabase)
* Replaceable enrichment and LLM providers

**Critical Insight:**

Scout's moat is not AI output.

It is **workflow orchestration + human-in-the-loop control**.

AI assists. Humans decide.

---

### **Principle 5: Internal Users Pay Rent**

**Rule:** Internal use is not "free."

**Scout Translation:**

Andrew and internal brokers "pay" via:

* Daily usage
* Honest feedback
* Friction reports
* Missed expectations

If usage drops or feedback stops, Scout is failing regardless of how advanced the system is.

**Future Vision:**

Scout must be robust enough to:

* Be sold as a Lifetime Deal
* Support hundreds of brokers
* Operate without constant hand-holding

Internal use is treated as a live commercial deployment.

---

## **4. The Three User Archetypes Scout Must Serve**

### **1. The Lean-Forward Operator**

* Wants control
* Reviews every target
* Edits drafts manually
* Actively interrogates the system

Scout gives them:

* Dossiers
* Provenance
* Editable drafts
* Confidence, not speed alone

---

### **2. The Lean-Back Executive**

* Wants outcomes, not knobs
* Trusts automation
* Only wants alerts when it matters

Scout gives them:

* Automated target selection
* Safe sending cadence
* "Bat Phone" alerts for high-intent replies
* Minimal daily interaction

---

### **3. The Hybrid (Market-Driven) User**

* Behavior shifts with conditions
* Proactive during downturns
* Passive during stable periods

Scout must fluidly support **mode switching** without reconfiguration pain.

---

## **5. The Always-On AI Agent**

**Mandate:**

There is always an AI agent available inside Scout.

**Role of the Agent:**

* Explain why a target was selected
* Summarize market signals
* Clarify past decisions
* Answer questions about data, cadence, or outcomes

This agent does **not** replace judgment.

It replaces uncertainty.

If a user is confused, Scout has failed.

---

## **6. Final Directive**

Scout is not built to be impressive.

Scout is built to be **inevitable**.

Every decision, feature, UI element, and architectural choice must answer one question:

**Does this reduce risk while increasing calm, trust, and repeatable value?**

If yes, proceed.

If no, stop.
