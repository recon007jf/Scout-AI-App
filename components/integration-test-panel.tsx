"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react"
import { getOutreachStatus, getBriefing } from "@/lib/api/client"

type TestStatus = "idle" | "running" | "success" | "error"

export function IntegrationTestPanel() {
  const [stage1Status, setStage1Status] = useState<TestStatus>("idle")
  const [stage1Result, setStage1Result] = useState<any>(null)
  const [stage2Status, setStage2Status] = useState<TestStatus>("idle")
  const [stage2Result, setStage2Result] = useState<any>(null)

  async function runStage1() {
    setStage1Status("running")
    setStage1Result(null)

    try {
      const result = await getOutreachStatus()
      setStage1Result(result)
      setStage1Status("success")
    } catch (error) {
      setStage1Result({ error: error instanceof Error ? error.message : "Unknown error" })
      setStage1Status("error")
    }
  }

  async function runStage2() {
    setStage2Status("running")
    setStage2Result(null)

    try {
      const result = await getBriefing()
      setStage2Result(result)
      setStage2Status("success")
    } catch (error) {
      setStage2Result({ error: error instanceof Error ? error.message : "Unknown error" })
      setStage2Status("error")
    }
  }

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <h2 className="text-xl font-bold mb-4 text-white">Phase 1 Integration Tests</h2>

      <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-500">Stage 0 Deprecated</p>
            <p className="text-xs text-yellow-200 mt-1">
              Health check endpoint disabled. Stage 1 now serves as primary system health validation.
            </p>
          </div>
        </div>
      </div>

      {/* Stage 1: Outreach Status - NOW PRIMARY HEALTH CHECK */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-lg font-semibold text-white">Stage 1: Primary System Health</h3>
          {stage1Status === "success" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          {stage1Status === "error" && <XCircle className="w-5 h-5 text-red-500" />}
          {stage1Status === "running" && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
        </div>

        <p className="text-sm text-gray-400 mb-3">Validates Auth + Container + DB via GET /api/outreach/status</p>

        <Button onClick={runStage1} disabled={stage1Status === "running"} className="mb-3">
          {stage1Status === "running" ? "Testing..." : "Run Stage 1 Test"}
        </Button>

        {stage1Result && (
          <pre className="bg-black p-3 rounded text-xs text-green-400 overflow-auto">
            {JSON.stringify(stage1Result, null, 2)}
          </pre>
        )}
      </div>

      {/* Stage 2: Briefing Data */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-lg font-semibold text-white">Stage 2: The Data Pipeline</h3>
          {stage2Status === "success" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          {stage2Status === "error" && <XCircle className="w-5 h-5 text-red-500" />}
          {stage2Status === "running" && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
        </div>

        <p className="text-sm text-gray-400 mb-3">Fetches briefing data from GET /api/briefing</p>

        <Button onClick={runStage2} disabled={stage2Status === "running"} className="mb-3">
          {stage2Status === "running" ? "Testing..." : "Run Stage 2 Test"}
        </Button>

        {stage2Result && (
          <pre className="bg-black p-3 rounded text-xs text-green-400 overflow-auto max-h-96">
            {JSON.stringify(stage2Result, null, 2)}
          </pre>
        )}
      </div>

      <div className="border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-500">
          Stage 2 logs sanitized JSON payload (PII redacted) to server console for Gemini to freeze TypeScript contracts
        </p>
      </div>
    </Card>
  )
}
