export interface DossierContact {
  id: string
  full_name: string
  firm: string
  role: string
  work_email: string
  linkedin_url?: string
  risk_profile?: string // Legacy field, treat as read-only
}

export interface DossierDraft {
  subject: string
  body: string
  generated_at: string
}

export interface DossierNote {
  note_id: string
  note_text: string
  timestamp: string
}

export interface Dossier {
  dossier_id: string
  contact: DossierContact
  draft?: DossierDraft
  notes: DossierNote[]
}

export interface BriefingResponse {
  dossiers: Dossier[]
}

export interface Contact {
  id: string
  full_name: string
  firm: string
  role: string
  work_email: string
  linkedin_url?: string
  relationship_status?: string
  engagement_score?: number
  last_contact?: string
  tags?: string[]
}

export interface ContactsResponse {
  contacts: Contact[]
  pagination: {
    page: number
    page_size: number
    total: number
  }
}

export interface Signal {
  id: string
  type: "email_reply" | "job_change" | "linkedin_post" | "company_news"
  priority: "high" | "medium" | "low"
  priority_score: number
  timestamp: string
  title: string
  details: string
  actionable: boolean
  contact: Contact
  metadata?: Record<string, any>
}

export interface SignalsResponse {
  signals: Signal[]
}

export interface NoteRequest {
  user_email: string
  dossier_id: string
  note_text: string
}

export interface NoteResponse {
  note_id?: string
  dossier_id?: string
  note_text?: string
  timestamp?: string
  error?: string // Check this even on 200 OK
}

export interface DraftActionRequest {
  user_email: string
  dossier_id: string
  action: "approve" | "dismiss" | "pause"
  timestamp: string
}

export interface DraftActionResponse {
  status: "success" | "error"
  test_mode?: boolean
  message: string
  error?: string
}

export interface ProfileImageResponse {
  imageUrl: string | null
  error?: string
}

export interface SettingsResponse {
  full_name: string
  email: string
  phone?: string
  title?: string
  company?: string
  bio?: string
}
