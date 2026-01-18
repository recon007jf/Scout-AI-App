# Morning Briefing Admission Contract

## 🛑 The "Line in the Sand"

This document defines the **non-negotiable** criteria for a candidate to enter the "Morning Briefing" UI.
Any candidate missing **ANY P0 Field** remains in the backlog (`status != 'READY'`) and must be enriched.

---

## 1. Identity (Who)

**Goal:** Contactability & Credibility.

- [ ] **First Name**
- [ ] **Last Name**
- [ ] **Work Email** (Primary, Validated)
- [ ] **LinkedIn URL** (Canonical `/in/` link)

## 2. Professional Context (Why)

**Goal:** Relevance & Ranking.

- [ ] **Company Name**
- [ ] **Job Title**
- [ ] **Business Persona / Role** (e.g. "Benefits Director")

## 3. Location (Where)

**Goal:** Compliance & Strategy.

- [ ] **State**
- [ ] **City/Metro**

## 4. Funding Signal (The Why)

**Goal:** The Core Signal.
*Must have at least ONE:*

- [ ] **Stop-Loss Indicator** (5500 Filing)
- [ ] **Self-Funded Flag**

## 5. Explainability (Trust)

**Goal:** Defensibility.

- [ ] **Ranking Reason** (Data-backed narrative)

## 6. Draft Readiness (UX)

**Goal:** Zero-Latency.

- [ ] **Subject Line** (Pre-generated)
- [ ] **Email Body** (Pre-generated)

---

## 🚫 Hard Gate Rule

**IF** `Missing(P0)` **THEN** `Status = ENRICHMENT_NEEDED`.
**NO** Placeholders.
**NO** "Unknowns".
**NO** Exceptions.
