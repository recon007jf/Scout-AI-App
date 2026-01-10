/**
 * Integration Types for Phase 1
 * Server-to-Server Communication via Next.js Proxy
 */

export interface HealthCheckResponse {
  success: boolean
  upstream: {
    status: string
    timestamp: string
  }
  message: string
}

export interface OutreachStatusResponse {
  status: "active" | "paused"
  paused_at: string | null
  resume_at: string | null
  duration: string | null
  queue_frozen: boolean
  queued_count: number
  in_flight_count: number
  next_block_at: string | null
  warning_due: boolean
}

export interface BriefingResponse {
  targets: Array<{
    broker_id: string
    name: string
    firm_name: string
    // Will be defined after Stage 2 logs real response
    [key: string]: any
  }>
}
