# Scout-UI Button Contract Matrix

**Last Updated:** January 4, 2026  
**Created By:** V0 (Frontend UI Lead)  
**Purpose:** Complete specification of all interactive elements requiring backend endpoints

---

## Document Structure

For each button/action, this matrix defines:
1. **Location** - Where it appears in the UI
2. **Button Name** - Clear identifier
3. **User Action** - What the user is trying to do
4. **UI Behavior** - What happens immediately (optimistic update, loading state)
5. **Required Data** - What data the frontend needs to send
6. **Expected Outcome** - What should happen in the system
7. **Response Needed** - What the backend should return
8. **Error Handling** - What happens if it fails

---

## Phase 1: Morning Briefing

### MB-000: Pause Outreach Button (GLOBAL - CRITICAL SAFETY FEATURE)
**Location:** Morning Briefing > Header Area (top right, always visible)  
**Visual:** Gray button with orange outline and text, pause icon, text "Pause Outreach"  
**Status Display:** Above button shows "Status: Outreach Active" in green text

**User Action:** Emergency brake - user wants to immediately stop ALL scheduled email sends

**UI Behavior:**
- Button click opens duration selection modal
- Modal options:
  - Manual (until I resume) - DEFAULT
  - 1 hour
  - 2 hours
  - 3 hours
  - 1 day
  - 2 days
  - 3 days
- On confirm:
  - Status text changes to "Status: Outreach Paused" in red
  - Button changes to green "Resume Outreach" with play icon
  - Shows timestamp: "Paused 15 minutes ago" in gray text below button
- UI polls GET /api/outreach/status every 60 seconds to stay synchronized

**Required Data to Send:**
```typescript
POST /api/outreach/pause
{
  duration: "manual" | "1h" | "2h" | "3h" | "1d" | "2d" | "3d",
  reason?: string              // Optional user note
}
```

**Expected Backend Action (CRITICAL):**
- **AUTHORITATIVE IN SUPABASE:** Pause state must be stored in database, not just UI
- **ENFORCED IN SEND WORKER:** Backend send loop must check pause status before every send
- Immediately refuse all send attempts while paused
- If timed pause: Auto-resume happens SERVER-SIDE based on backend clock, not client timer
- Cancel any sends scheduled during pause period
- Mark queue as frozen in database
- Log pause event with full metadata
- If duration is timed: Calculate resume_at timestamp and store

**Response Needed:**
```typescript
{
  status: "paused",
  paused_at: string,               // ISO timestamp (server time)
  resume_at: string | null,        // Null if manual, timestamp if timed
  duration: string,                // Echo of requested duration
  queue_frozen: true
}
```

**2-Hour Threshold Warning:**
- UI checks status.warning_due from GET /api/outreach/status
- If warning_due === true, show modal:
  - "⚠️ Outreach Still Paused"
  - "Outreach has been paused for 2 hours. Do you want to continue pausing?"
  - Buttons: "Resume Outreach" (green) | "Keep Paused" (outline)
- Backend calculates warning_due: `now - paused_at >= 2 hours AND warning_not_acknowledged`
- Optional: Store warning_ack_at in Supabase to show only once per pause event

**GET /api/outreach/status Response:**
```typescript
{
  status: "active" | "paused",
  paused_at: string | null,
  resume_at: string | null,
  duration: string | null,
  queue_frozen: boolean,
  queued_count: number,            // How many messages in queue
  in_flight_count: number,         // Currently sending
  next_block_at: string | null,    // Next scheduled send time
  warning_due: boolean             // True if paused >= 2 hours
}
```

**Error Scenarios:**
- Queue freeze fails → Show critical error, log incident
- Network timeout → Retry automatically
- Partial failure → Show warning, list what succeeded/failed

**Integration with Send Worker:**
```
Every send attempt must:
1. Check GET /api/outreach/status
2. If status === "paused", hard fail with error: "Outreach is paused"
3. If status === "active", proceed with send
```

**Priority:** PHASE 1 - MOST CRITICAL for production safety

---

### MB-000B: Resume Outreach Button (GLOBAL)
**Location:** Same position as Pause button (replaces it when paused)  
**Visual:** Gray button with green outline and text, play icon, text "Resume Outreach"  
**Status Display:** "Status: Outreach Paused" in red text

**User Action:** User wants to restart all outreach after manual or timed pause

**UI Behavior:**
- Button shows loading state
- On success:
  - Status changes to "Status: Outreach Active" in green
  - Button changes back to orange "Pause Outreach"
  - Timestamp text disappears
  - System resumes normal send schedule

**Required Data to Send:**
```typescript
POST /api/outreach/resume
{
  // No payload needed - user ID from auth token
}
```

**Expected Backend Action (IDEMPOTENT):**
- **Safe to call multiple times** - Always returns current state
- Unfreeze send queues in database
- Update outreach status to `active` in Supabase
- Reschedule paused emails based on new timeline
- Clear pause metadata (paused_at, resume_at, duration)
- Log resume event with timestamp
- **Auto-resume for timed pauses happens automatically on backend**, not triggered by this endpoint

**Response Needed:**
```typescript
{
  status: "active",
  resumed_at: string,              // ISO timestamp
  queue_frozen: false
}
```

**Priority:** PHASE 1 - CRITICAL for production safety

---

### MB-001: Approve Draft Button
**Location:** Morning Briefing > Target Card Detail > Action Bar  
**Visual:** Green button with checkmark icon, text "Approve Draft"

**User Action:** User approves the AI-generated email draft and wants to send it immediately

**UI Behavior:**
- Button shows loading spinner
- Button disabled during request
- Target card moves to "Approved" visual state
- Success toast: "Draft approved and queued for sending"

**Required Data to Send:**
```typescript
{
  targetId: string,       // ID of the target
  userId: string,         // Current user ID
  draftId: string,        // ID of the draft being approved
  timestamp: string       // When approved
}
```

**Expected Backend Action:**
- Mark draft as `approved` in database
- Queue email for sending via Outlook integration
- Update target status to `approved`
- Log approval action
- Trigger email send

**Response Needed:**
```typescript
{
  success: boolean,
  targetId: string,
  newStatus: "approved",
  sentAt: string | null,       // Timestamp when email sent
  queuePosition?: number        // If queued, position in send queue
}
```

**Error Scenarios:**
- Outlook API failure → Show error, revert UI, allow retry
- Database update fails → Revert UI state
- Network timeout → Show retry option

---

### MB-002: Pause Target Button
**Location:** Morning Briefing > Target Card Detail > Action Bar  
**Visual:** Outline button with pause icon, text "Pause"

**User Action:** User wants to delay outreach to this target (either to next batch or specific date)

**UI Behavior:**
- Opens modal with two options:
  - "Move to next batch today"
  - "Reschedule to specific date" (date picker appears)
- On confirm: Target card gets amber "Paused" badge
- Card shows pause info: "→ Moved to next batch today" or "→ Rescheduled to [date]"
- Card visual appears grayed out (60% opacity)

**Required Data to Send:**
```typescript
{
  targetId: string,
  userId: string,
  pauseType: "next-batch" | "specific-date",
  pauseUntil?: string,      // ISO date string if specific-date
  reason?: string           // Optional user note
}
```

**Expected Backend Action:**
- Update target with pause status
- Remove from current briefing queue
- Schedule for future briefing (either today's next batch or specific date)
- Store pause metadata

**Response Needed:**
```typescript
{
  success: boolean,
  targetId: string,
  pausedUntil: string,      // When target will appear again
  nextBriefingDate: string
}
```

**Error Handling:**
- Network fail → Revert to original state, show error
- Invalid date → Show validation error in modal

---

### MB-003: Unpause Target Button
**Location:** Morning Briefing > Target Card Detail > Action Bar (appears after pause)  
**Visual:** Amber outline button with undo icon, text "Unpause"

**User Action:** User wants to immediately re-activate a paused target

**UI Behavior:**
- Button shows loading state
- Amber "Paused" badge disappears
- Card returns to full opacity
- Pause info text disappears
- Target remains in current view

**Required Data to Send:**
```typescript
{
  targetId: string,
  userId: string
}
```

**Expected Backend Action:**
- Remove pause status from target
- Add back to active briefing queue
- Clear pause metadata

**Response Needed:**
```typescript
{
  success: boolean,
  targetId: string,
  status: "active"
}
```

---

### MB-004: Dismiss Target Button
**Location:** Morning Briefing > Target Card Detail > Action Bar  
**Visual:** Red outline button with X icon, text "Dismiss Target"

**User Action:** User determines this target is not a good fit and wants to remove from queue

**UI Behavior:**
- Target card gets red "Dismissed" badge
- Card grayed out (60% opacity)
- "Dismiss" button changes to amber "Undo" button
- Target stays visible but marked as dismissed

**Required Data to Send:**
```typescript
{
  targetId: string,
  userId: string,
  dismissReason: "bad_fit" | "wrong_timing" | "already_contacted" | "other",
  notes?: string
}
```

**Expected Backend Action:**
- Mark target as dismissed in database
- Remove from active queue
- Store dismiss reason for ML training
- Don't show in future briefings unless manually re-added

**Response Needed:**
```typescript
{
  success: boolean,
  targetId: string,
  status: "dismissed",
  dismissedAt: string
}
```

---

### MB-005: Undo Dismiss Button
**Location:** Morning Briefing > Target Card Detail > Action Bar (appears after dismiss)  
**Visual:** Amber outline button with undo icon, text "Undo"

**User Action:** User wants to restore a dismissed target

**UI Behavior:**
- Red "Dismissed" badge disappears
- Card returns to full opacity
- "Undo" button changes back to "Dismiss Target"
- Target returns to active state

**Required Data to Send:**
```typescript
{
  targetId: string,
  userId: string
}
```

**Expected Backend Action:**
- Remove dismissed status
- Restore to active queue
- Clear dismiss metadata

**Response Needed:**
```typescript
{
  success: boolean,
  targetId: string,
  status: "active"
}
```

---

### MB-006: Edit Email Button
**Location:** Morning Briefing > Target Detail > Draft Tab  
**Visual:** Small outline button with pencil icon, text "Edit Email"

**User Action:** User wants to manually modify the AI-generated email draft

**UI Behavior:**
- Draft switches to edit mode
- Subject line becomes editable input
- Email body becomes editable textarea
- "Edit Email" button disappears
- New buttons appear: "Save Changes", "Cancel", "Regenerate", "Regenerate with Comments"
- Current draft content populates the editable fields

**No API Call on Button Click** (just UI state change)

---

### MB-007: Save Changes Button  
**Location:** Morning Briefing > Target Detail > Draft Tab (edit mode)  
**Visual:** Green button, text "Save Changes"

**User Action:** User wants to save their manual edits to the draft

**UI Behavior:**
- Button shows loading spinner
- On success: Exit edit mode, show saved draft
- Success toast: "Draft saved"

**Required Data to Send:**
```typescript
{
  targetId: string,
  draftId: string,
  userId: string,
  subject: string,         // Updated subject
  body: string,            // Updated body
  editedAt: string         // Timestamp
}
```

**Expected Backend Action:**
- Update draft in database with new content
- Mark draft as `manually_edited`
- Preserve edit history (optional)

**Response Needed:**
```typescript
{
  success: boolean,
  draftId: string,
  subject: string,
  body: string,
  lastEditedAt: string
}
```

---

### MB-008: Regenerate Button
**Location:** Morning Briefing > Target Detail > Draft Tab (edit mode)  
**Visual:** Outline button with rotate icon, text "Regenerate"

**User Action:** User wants AI to generate a completely new draft (no specific instructions)

**UI Behavior:**
- Button shows loading spinner with "Regenerating..." text
- Draft content replaced with new AI-generated content
- Edit mode remains active
- New subject and body appear in editable fields

**Required Data to Send:**
```typescript
{
  targetId: string,
  draftId: string,
  userId: string,
  regenerationType: "full"    // vs "with_comments"
}
```

**Expected Backend Action:**
- Call AI (Helix/Gemini) to generate new draft
- Use target dossier data as context
- Create new draft version in database
- Return new subject and body

**Response Needed:**
```typescript
{
  success: boolean,
  draftId: string,
  subject: string,
  body: string,
  generatedAt: string,
  reasoning?: string          // Why this approach (optional)
}
```

**Error Handling:**
- AI API failure → Show error, keep old draft intact
- Timeout → Show retry option

---

### MB-009: Regenerate with Comments Button
**Location:** Morning Briefing > Target Detail > Draft Tab (edit mode)  
**Visual:** Outline button with message icon, text "Regenerate with Comments"

**User Action:** User wants AI to regenerate the draft with specific instructions

**UI Behavior:**
- Button click opens textarea input below
- User types instructions (e.g., "Make it more casual" or "Emphasize cost savings")
- New buttons appear: "Cancel", "Regenerate" (to execute)
- On regenerate: Shows loading spinner
- Draft updates with new AI-generated content following user's instructions

**Required Data to Send:**
```typescript
{
  targetId: string,
  draftId: string,
  userId: string,
  regenerationType: "with_comments",
  userInstructions: string,    // User's regeneration instructions
  currentDraft: {              // For AI context
    subject: string,
    body: string
  }
}
```

**Expected Backend Action:**
- Pass user instructions to AI
- AI generates new draft incorporating feedback
- Store regeneration history
- Return new content

**Response Needed:**
```typescript
{
  success: boolean,
  draftId: string,
  subject: string,
  body: string,
  generatedAt: string,
  appliedInstructions: string  // Echo of what was requested
}
```

**Error Handling:**
- AI API failure → Show error, keep old draft intact
- Timeout → Show retry option

---

### MB-010: Cancel Edit Button
**Location:** Morning Briefing > Target Detail > Draft Tab (edit mode)  
**Visual:** Outline button, text "Cancel"

**User Action:** User wants to discard edits and return to view mode

**UI Behavior:**
- Exit edit mode
- Restore original draft content (before editing started)
- Show original "Edit Email" button again
- No API call needed (pure UI state)

---

## Phase 1: Signals View

### SIG-001: Signal Card Click
**Location:** Signals View > Left Panel > Signal Card  
**Visual:** Clickable card with signal summary and metadata

**User Action:** User clicks a signal to view full details

**UI Behavior:**
- Card gets highlighted border
- Right panel shows full signal details
- If signal is unread, mark it as read

**Required Data to Send:**
```typescript
{
  signalId: string,
  userId: string,
  readAt: string
}
```

**Expected Backend Action:**
- Update signal status to `read`
- Log signal view event
- Update user's read signals tracking

**Response Needed:**
```typescript
{
  success: boolean,
  signalId: string,
  isRead: true
}
```

---

### SIG-002: Generate Draft Reply Button
**Location:** Signals View > Signal Detail Panel > Action Card  
**Visual:** Outline button, text "Create Draft"

**User Action:** User wants AI to generate a reply to this signal (e.g., email response)

**UI Behavior:**
- Button shows loading with "Generating..." text
- On success: Alert/modal shows generated draft
- Future: Could open draft in edit mode

**Required Data to Send:**
```typescript
{
  signalId: string,
  userId: string,
  signalType: string,          // "email-reply", "linkedin-post", etc.
  contextData: {               // Signal-specific context
    originalMessage?: string,
    contactId: string
  }
}
```

**Expected Backend Action:**
- Call AI to generate appropriate response
- Use signal context and contact dossier
- Create draft in database
- Return draft content

**Response Needed:**
```typescript
{
  success: boolean,
  draftId: string,
  subject: string,
  body: string,
  replyType: "email" | "linkedin" | "other"
}
```

---

### SIG-003: Add to Target Queue Button
**Location:** Signals View > Signal Detail Panel > Action Card  
**Visual:** Primary button with users icon, text "Add to Target Queue"

**User Action:** User wants to convert this signal into a target in Morning Briefing

**UI Behavior:**
- Button shows loading
- Success alert: "Added to Morning Briefing queue!"
- Signal card gets badge: "Added to Queue"

**Required Data to Send:**
```typescript
{
  signalId: string,
  userId: string,
  contactId: string,
  priority: "high" | "medium" | "low",
  notes?: string
}
```

**Expected Backend Action:**
- Create new target from signal data
- Add to Morning Briefing queue
- Link signal to target for context
- Update signal status to `converted`

**Response Needed:**
```typescript
{
  success: boolean,
  targetId: string,
  queuePosition: number,
  willAppearIn: string         // "Tomorrow's Morning Briefing"
}
```

---

### SIG-004: Filter Buttons
**Location:** Signals View > Top Bar  
**Visual:** Row of filter buttons: "All Signals", "Email Responses", "Job Changes", "Events", "Other"

**User Action:** User wants to filter signals by type

**UI Behavior:**
- Active filter button highlighted
- Signal cards list updates to show only matching types
- No backend call needed (client-side filtering of already-loaded data)

**Optional Backend Enhancement:**
- Could send filter selection for analytics/preferences
- Could lazy-load signals by type for performance

---

## Phase 2: Notes System

### NOTE-001: Add Note Button
**Location:** Notes View > Top Bar OR Contact Notes Component  
**Visual:** Primary button with plus icon, text "New Note" or "Add Note"

**User Action:** User wants to create a new note (quick capture, structured, or voice)

**UI Behavior:**
- Opens note entry form
- Shows note type selector (Quick / Structured / Voice)
- For voice: Shows recording UI
- No API call until save

---

### NOTE-002: Save Note Button
**Location:** Notes View > Note Entry Form  
**Visual:** Primary button, text "Save Note"

**User Action:** User wants to save their note

**UI Behavior:**
- Button shows loading
- Note appears in notes list
- Form closes
- Success toast

**Required Data to Send:**
```typescript
{
  userId: string,
  noteType: "quick" | "structured" | "voice",
  content: string,                    // Text or transcription
  contactId?: string,                 // If linked to contact
  contactName?: string,
  tags: string[],
  linkedTo?: {                        // Optional link to signal/target/calendar
    type: "signal" | "target" | "calendar",
    id: string,
    label: string
  },
  audioFileUrl?: string,              // If voice note
  timestamp: string
}
```

**Expected Backend Action:**
- Store note in database
- If voice: Store/process audio file
- Link to contact if specified
- Trigger AI analysis (Helix) to:
  - Extract insights
  - Identify potential signals
  - Suggest tags
  - Surface in future briefings if relevant

**Response Needed:**
```typescript
{
  success: boolean,
  noteId: string,
  createdAt: string,
  aiAnalysis?: {
    suggestedTags: string[],
    potentialSignals: string[],
    followUpRecommendations: string[]
  }
}
```

---

### NOTE-003: Start/Stop Voice Recording
**Location:** Notes View > Note Entry Form (Voice type selected)  
**Visual:** Button toggles between "Start Recording" (primary) and "Stop Recording" (red/destructive)

**User Action:** User wants to record a voice note

**UI Behavior:**
- Browser requests microphone permission
- Recording indicator appears
- On stop: Audio processed
- Transcription appears in content field (via backend)

**Required Data to Send:**
```typescript
// On stop recording:
{
  userId: string,
  audioBlob: Blob,              // Recorded audio
  format: "webm" | "mp3",
  duration: number              // seconds
}
```

**Expected Backend Action:**
- Process audio file
- Transcribe using Whisper/Speech-to-Text API
- Store audio file (Cloud Storage)
- Return transcription

**Response Needed:**
```typescript
{
  success: boolean,
  audioFileUrl: string,
  transcription: string,
  confidence: number,           // Transcription confidence score
  duration: number
}
```

---

## Phase 3: Settings

### SET-001: Save Profile Changes
**Location:** Settings > Profile Tab  
**Visual:** Primary button, text "Save Changes"

**User Action:** User updated their profile information

**Required Data to Send:**
```typescript
{
  userId: string,
  updates: {
    fullName?: string,
    email?: string,
    phone?: string,
    title?: string,
    company?: string,
    territory?: string
  }
}
```

**Expected Backend Action:**
- Validate email uniqueness
- Update user profile in database
- Update any cached user data

**Response Needed:**
```typescript
{
  success: boolean,
  user: {
    id: string,
    fullName: string,
    email: string,
    // ... all fields
    updatedAt: string
  }
}
```

---

### SET-002: Save Notification Preferences
**Location:** Settings > Notifications Tab  
**Visual:** Save button after toggle changes

**Required Data to Send:**
```typescript
{
  userId: string,
  preferences: {
    morningBriefingTime: string,     // "8:00 AM"
    weeklyDigest: string,            // "monday", "friday", "none"
    signalAlerts: "instant" | "daily" | "weekly",
    emailNotifications: boolean,
    pushNotifications: boolean
  }
}
```

**Expected Backend Action:**
- Update user notification preferences
- Adjust notification scheduling
- Update email subscription settings

**Response Needed:**
```typescript
{
  success: boolean,
  preferences: { /* echoed back */ }
}
```

---

### SET-003: Save Outreach Automation Settings
**Location:** Settings > Outreach Tab

**Required Data to Send:**
```typescript
{
  userId: string,
  settings: {
    dailySendLimit: number,
    sendFrequency: "daily" | "twice" | "three",
    sendWindow: {
      start: string,    // "9:00 AM"
      end: string       // "5:00 PM"
    },
    autoApprove: boolean,
    personalizeLevel: "high" | "medium" | "low"
  }
}
```

**Expected Backend Action:**
- Update automation settings
- Adjust send queue behavior
- Configure rate limiting

---

### SET-004: Connect Integration (Outlook, LinkedIn)
**Location:** Settings > Integrations Tab  
**Visual:** "Connect" button for each service

**User Action:** User wants to link their Outlook/LinkedIn account

**UI Behavior:**
- Opens OAuth flow in new window
- After auth: Button changes to "Connected" with green indicator
- Shows connected account email/username

**Required Data to Send:**
```typescript
// Initial request to start OAuth
{
  userId: string,
  service: "outlook" | "linkedin",
  redirectUrl: string
}
```

**Expected Backend Action:**
- Initiate OAuth flow
- Store OAuth tokens securely
- Verify integration permissions
- Test connection

**Response Needed:**
```typescript
{
  success: boolean,
  service: "outlook" | "linkedin",
  connected: boolean,
  connectedAccount: string,    // email or username
  permissions: string[],
  connectedAt: string
}
```

---

### SET-005: Change LLM Model
**Location:** Settings > Helix AI Tab  
**Visual:** Dropdown selector with model options

**User Action:** User selects different AI model for Helix

**Required Data to Send:**
```typescript
{
  userId: string,
  modelId: string,              // "gpt-4-turbo", "claude-3.5-sonnet", etc.
}
```

**Expected Backend Action:**
- Update user's AI model preference
- Switch model for future Helix interactions
- Update usage/billing tier if needed

**Response Needed:**
```typescript
{
  success: boolean,
  modelId: string,
  modelName: string,
  capabilities: string[],
  estimatedCostPerRequest: number
}
```

---

### SET-006: Update Password
**Location:** Settings > Security Tab

**Required Data to Send:**
```typescript
{
  userId: string,
  currentPassword: string,
  newPassword: string
}
```

**Expected Backend Action:**
- Verify current password
- Hash new password
- Update password in database
- Invalidate all existing sessions (optional)
- Send confirmation email

**Response Needed:**
```typescript
{
  success: boolean,
  message: string,
  requiresRelogin: boolean
}
```

---

## Summary Statistics

### Phase 1 (MVP - Morning Briefing + Signals):
- **Global Outreach Control:** 2 buttons (CRITICAL)
- **Morning Briefing Actions:** 10 buttons
- **Signals Actions:** 4 buttons
- **Total Phase 1:** 16 backend endpoints needed

### Phase 2 (Notes System):
- **Notes Actions:** 3 buttons
- **Total with Phase 2:** 19 endpoints

### Phase 3 (Settings):
- **Settings Actions:** 6 buttons  
- **Total with Phase 3:** 25 endpoints

---

## Integration Priority

### Critical Path (Must have for MVP):
1. **MB-000: Pause Outreach (GLOBAL) - EMERGENCY BRAKE**
2. **MB-000B: Resume Outreach (GLOBAL) - SAFETY RESTORATION**
3. MB-001: Approve Draft
4. MB-002: Pause Target
5. MB-004: Dismiss Target
6. MB-007: Save Changes (manual draft edit)
7. MB-008: Regenerate (AI draft)
8. SIG-001: Mark Signal as Read
9. SIG-003: Add to Target Queue

### High Priority (Should have for launch):
10. MB-009: Regenerate with Comments
11. SIG-002: Generate Draft Reply
12. SET-002: Notification Preferences
13. SET-004: Integration Connections
14. SET-005: LLM Model Selection

### Medium Priority (Nice to have):
15. NOTE-002: Save Note
16. NOTE-003: Voice Recording
17. SET-001: Profile Updates
18. SET-006: Password Change

---

## Next Steps for Backend Team

1. **Review this matrix** - Validate that each action makes sense from a data/business logic perspective
2. **Define database schema** - What tables/fields are needed to support these actions
3. **Create API endpoint spec** - Match each button to specific REST endpoint with method (POST, PUT, PATCH)
4. **Define response contracts** - Confirm the exact JSON structure for each response
5. **Identify shared logic** - Which actions share similar backend patterns (e.g., all "mark as X" actions)
6. **Prioritize implementation** - Start with Critical Path endpoints for MVP
7. **Share endpoint documentation** - Once endpoints are built, provide URLs and examples

---

## Notes for Backend Team

**Authentication:**
- All requests will include auth token in header (Bearer token or session cookie)
- User ID can be extracted from auth token on backend
- Frontend shouldn't need to send userId explicitly (though included in spec for clarity)

**Optimistic Updates:**
- UI updates immediately on button click
- If backend fails, UI reverts to previous state
- This requires backend to return full updated state so UI can confirm

**Timestamps:**
- Frontend sends ISO 8601 format: `2025-01-01T10:30:00Z`
- Backend should echo back in same format

**IDs:**
- Frontend currently uses mock UUIDs
- Backend can use whatever ID system (UUID, sequential, etc.)
- Just ensure IDs are unique and consistent

**Error Responses:**
- Please return structured error format:
```typescript
{
  success: false,
  error: {
    code: string,        // "INVALID_TARGET", "OUTLOOK_API_FAILURE", etc.
    message: string,     // User-friendly message
    details?: any        // Technical details for debugging
  }
}
```

**Critical: Global Pause/Resume System**
- This is THE most important safety feature for production
- Must be bulletproof - domain reputation depends on it
- Backend MUST guarantee queue freeze happens immediately
- Consider rate limiting on resume to avoid spam detection
- Log all pause/resume events for audit trail
- Frontend will show threshold warnings at 2-hour intervals

---

**Document Maintained By:** V0 (Frontend)  
**Questions/Clarifications:** Ask user to route to V0 for UI questions, Gemini for backend questions, ChatGPT for product/PM questions
