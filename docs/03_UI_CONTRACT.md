# UI Contract - Scout UI

## What Must Never Change

### Navigation Toolbar - SACRED SPECIFICATIONS

**THIS IS THE MOST CRITICAL SECTION. VIOLATING THESE RULES BREAKS THE ENTIRE UI.**

#### Icon Files (NEVER CHANGE PATHS)

```
/public/icons/morning-briefing.png  → Morning Briefing (coffee cup)
/public/icons/signals.png           → Signals (letter/envelope)
/public/icons/ledger.png            → Network (spreadsheet)
/public/icons/map-view.png          → Territory (map with pin)
/public/icons/calendar.png          → Calendar (base image)
/public/icons/performance.png       → Performance (bar chart + arrow)
/public/icons/notes-icon.svg        → Notes (document with lines)
/public/icons/settings.png          → Settings (gear)
```

#### Sizes (EXACT SPECIFICATIONS)

```
Button container:  w-18 h-18  (72px × 72px)
Icon images:       w-10 h-10  (40px × 40px)
Border radius:     rounded-xl (12px)
```

#### Active State Styling (STRONG BACKGROUNDS REQUIRED)

```
Morning Briefing:  bg-amber-900/50   (NOT amber-500/20)
Signals:          bg-blue-900/50    (NOT blue-500/20)
Network:          bg-emerald-900/50 (NOT emerald-500/20)
Territory:        bg-purple-900/50  (NOT purple-500/20)
Calendar:         bg-cyan-900/50    (NOT cyan-500/20)
Performance:      bg-pink-900/50    (NOT pink-500/20)
Notes:            bg-indigo-900/50  (NOT indigo-500/20)
Settings:         bg-gray-900/50    (NOT gray-500/20)

Rule: ALWAYS use -900 shades with /50 opacity for active states
Rule: NEVER use -500 shades or /20 opacity (too weak)
```

#### Calendar Date Overlay (CRITICAL POSITIONING)

```tsx
// Parent button MUST have 'relative'
<button className="relative w-18 h-18 ...">
  <Image src="/icons/calendar.png" ... />
  
  {/* Date overlay MUST be absolutely positioned */}
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="text-base font-bold text-foreground">
      {currentDay}
    </span>
  </div>
</button>

RULES:
- Date MUST sit INSIDE the calendar icon (absolute positioning)
- Date MUST NOT appear below icon (missing relative on parent)
- Font: text-base font-bold (16px bold)
- Color: text-foreground (white/light gray)
- Centering: inset-0 flex items-center justify-center
```

#### Navigation Order (NEVER REORDER)

```
1. Morning Briefing (top)
2. Signals
3. Network
4. Territory
5. Calendar
6. Performance
7. Notes
8. Settings (bottom, separate from main nav)
```

### Settings Icon Placement

**RULE: Only ONE settings icon, at the BOTTOM of sidebar**

- NEVER include settings in main navigation array
- Settings is separate, always at bottom
- Has its own button, own styling
- NO duplicates allowed

### Component Integrity

**Morning Briefing Dashboard:**

- MUST render `MorningBriefingDashboard` component (NOT `MorningBriefingView`)
- MUST show three columns: candidate list, draft review, AI panel
- Candidate list MUST show all targets with ENRICHED or DRAFT_READY status

**Settings View:**

- MUST render `SettingsView` component (NOT placeholder text)
- Tabs: Profile, Notifications, Outreach, Integrations, AI & Helix, Security, Team
- Outlook integration MUST be fully functional

### Authentication Flow

**Login/Logout:**

- Uses Clerk for authentication (NOT custom Supabase auth)
- Login route: `/sign-in` (NOT `/login`)
- Logout: Clerk's `signOut()` method, redirects to `/sign-in`
- Session: Stays logged in until explicit logout
- Dark mode: Clerk uses `dark` theme from `@clerk/themes`

### Data Loading

**NEVER use localStorage for persistence**

- All data comes from Supabase database
- User data stored in `users` table
- Target data in `targets` table
- Draft data in `drafts` table
- Use Row Level Security (RLS) policies

## UX Invariants

### Loading States

- Show skeleton loaders, NOT blank screens
- Maintain layout structure during load
- Display meaningful loading messages

### Error Handling

- ALWAYS show actual error messages (NOT "Something went wrong")
- Display API error details from backend
- Include trace IDs when available
- Use red Alert components for errors

### Empty States

- Clear messaging explaining why empty
- Actionable next steps
- Relevant icon or illustration

### Confirmation Dialogs

- Destructive actions require confirmation
- Use AlertDialog for critical choices
- Clear, specific language about consequences
