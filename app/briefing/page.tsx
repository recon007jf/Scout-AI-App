"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { BriefingTargetCard } from "@/components/briefing-target-card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { getMorningQueue } from "@/lib/api/morning-queue"
import { getOutreachStatus } from "@/lib/api/client"
import type { BriefingTarget, OutreachStatus } from "@/lib/types/scout"

export default function BriefingPage() {
  const [targets, setTargets] = useState<BriefingTarget[]>([])
  const [outreachStatus, setOutreachStatus] = useState<OutreachStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [queueData, statusData] = await Promise.all([getMorningQueue(), getOutreachStatus()])

      const mappedTargets: BriefingTarget[] = queueData.map((t) => ({
        targetId: t.id,
        name: t.name,
        title: t.title || t.role || "",
        company: t.company,
        email: t.email,
        linkedin: t.linkedin || "",
        status: t.status || "candidate",
        draft: t.draft,
        signals: t.signals || [],
      }))

      setTargets(mappedTargets)
      setOutreachStatus(statusData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load briefing")
      console.error("[v0] Briefing load error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleApprove = async (targetId: string) => {
    console.log("[v0] Approve target:", targetId)
    // TODO: Wire to /api/drafts/{id}/approve endpoint
    setTargets((prev) => prev.filter((t) => t.targetId !== targetId))
  }

  const handleReject = async (targetId: string) => {
    console.log("[v0] Reject target:", targetId)
    // TODO: Wire to /api/drafts/{id}/reject endpoint
    setTargets((prev) => prev.filter((t) => t.targetId !== targetId))
  }

  const handleEdit = async (targetId: string, updates: { subject: string; body: string }) => {
    console.log("[v0] Edit target:", targetId, updates)
    // TODO: Wire to /api/drafts/{id}/edit endpoint
    setTargets((prev) =>
      prev.map((t) =>
        t.targetId === targetId
          ? {
              ...t,
              draft: {
                ...t.draft,
                subject: updates.subject,
                body: updates.body,
              },
            }
          : t,
      ),
    )
  }

  const isApprovalDisabled = outreachStatus?.status === "paused"

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-red-400 text-lg">{error}</p>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Morning Briefing</h1>
            <p className="text-gray-400 mt-1">
              {targets.length} target{targets.length !== 1 ? "s" : ""} ready for review
            </p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Targets */}
        {targets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No targets available today.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {targets.map((target) => (
              <BriefingTargetCard
                key={target.targetId}
                target={target}
                isApprovalDisabled={isApprovalDisabled}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
