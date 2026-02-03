/**
 * COMPONENT: QueueSidebar
 * 
 * Purpose: Selection + Navigation ONLY
 * Constraints:
 * - NO data fetching
 * - NO mutations
 * - NO async calls
 * - Pure display of the left-panel queue list
 */

"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
    Loader2,
    Building2,
    TrendingUp,
    Pause,
    Play,
    AlertCircle,
    Reply,
} from "lucide-react"
import type { MorningQueueTarget } from "@/lib/api/morning-queue"

// Use the canonical type from the API
type Target = MorningQueueTarget

interface QueueSidebarProps {
    targets: Target[]
    selectedId: string | null
    dismissedIds: Set<string>
    pausedIds: Map<string, string>
    outlookConnected: boolean
    outreachStatus: 'active' | 'paused'
    onSelect: (target: Target) => void
    onConnectOutlook: () => void
    onPauseOutreach: () => void
    onResumeOutreach: () => void
}

function getInitials(name: string): string {
    if (!name) return "??"
    const parts = name.trim().split(" ")
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function QueueSidebar({
    targets,
    selectedId,
    dismissedIds,
    pausedIds,
    outlookConnected,
    outreachStatus,
    onSelect,
    onConnectOutlook,
    onPauseOutreach,
    onResumeOutreach,
}: QueueSidebarProps) {
    // Sorting Logic: Unsent First, Processed Last
    const activeTargets = targets.filter((target) => !dismissedIds.has(target.id)).sort((a, b) => {
        const isProcessedA = ['sent', 'sending', 'failed', 'replied', 'ooo', 'bounced'].includes(a.status || '')
        const isProcessedB = ['sent', 'sending', 'failed', 'replied', 'ooo', 'bounced'].includes(b.status || '')

        if (isProcessedA === isProcessedB) return 0
        return isProcessedA ? 1 : -1
    })

    return (
        <div
            className="w-[400px] flex flex-col bg-card border-r border-border h-full overflow-hidden"
            data-testid="queue-sidebar"
        >
            {/* Header */}
            <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold mb-2">Morning Briefing</h2>
                <p className="text-sm text-muted-foreground mb-4">Review today's target batch and approve drafts</p>

                <div className="flex items-center justify-between mb-2">
                    {/* Status Indicator */}
                    {!outlookConnected ? (
                        <div className="text-sm text-orange-400">
                            Status: <span className="font-medium">Outreach Offline</span>
                        </div>
                    ) : (
                        <div className={cn("text-sm", outreachStatus === "active" ? "text-green-400" : "text-red-400")}>
                            Status:{" "}
                            <span className="font-medium">
                                {outreachStatus === "active" ? "Outreach Active" : "Outreach Paused"}
                            </span>
                        </div>
                    )}
                </div>

                {!outlookConnected ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 border-orange-500/20 text-orange-400 bg-transparent"
                        onClick={onConnectOutlook}
                    >
                        Connect Outlook in Settings
                    </Button>
                ) : outreachStatus === "paused" ? (
                    <Button
                        onClick={onResumeOutreach}
                        size="sm"
                        className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Resume Outreach
                    </Button>
                ) : (
                    <Button
                        onClick={onPauseOutreach}
                        size="sm"
                        variant="outline"
                        className="w-full border-orange-500/20 text-orange-400"
                    >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause Outreach
                    </Button>
                )}
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeTargets.map((target) => {
                    const status = target.status
                    const isSending = status === "sending"
                    const isSent = status === "sent"
                    const isFailed = status === "failed"
                    const isReplied = status === "replied"
                    const isOOO = status === "ooo"
                    const isBounced = status === "bounced"

                    const cardOpacity = isSending
                        ? "opacity-75"
                        : (isSent || isReplied || isOOO || isBounced)
                            ? "opacity-60"
                            : isFailed
                                ? "opacity-80"
                                : "opacity-100"

                    const textColor = (isSent || isReplied || isOOO || isBounced) ? "text-muted-foreground" : "text-foreground"

                    return (
                        <Card
                            key={target.id}
                            data-testid="target-card"
                            className={cn(
                                "p-4 cursor-pointer transition-all border relative overflow-hidden",
                                selectedId === target.id
                                    ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20"
                                    : "border-border hover:border-blue-500/50 hover:bg-accent/50",
                                cardOpacity,
                                isFailed && "border-l-4 border-l-destructive"
                            )}
                            onClick={() => onSelect(target)}
                        >
                            {isSending && (
                                <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-end pr-4 pointer-events-none">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <Avatar className="w-12 h-12 border-2 border-border">
                                    <AvatarImage src={target.profileImage} />
                                    <AvatarFallback className="bg-blue-500 text-white font-semibold">
                                        {getInitials(target.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-foreground/90 truncate">
                                                {target.contactName || target.name || "Unknown Contact"}
                                            </div>
                                            <p className={cn("text-sm truncate", textColor || "text-muted-foreground")}>{target.title}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isSent && (
                                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs px-2 py-0.5">
                                                    Sent
                                                </Badge>
                                            )}

                                            {isReplied && (
                                                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs px-2 py-0.5 gap-1">
                                                    <Reply className="w-3 h-3" />
                                                    Replied
                                                </Badge>
                                            )}

                                            {isOOO && (
                                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs px-2 py-0.5">
                                                    OOO
                                                </Badge>
                                            )}

                                            {isBounced && (
                                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs px-2 py-0.5 gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Bounced
                                                </Badge>
                                            )}

                                            {isFailed && (
                                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs px-2 py-0.5">
                                                    Failed
                                                </Badge>
                                            )}

                                            {dismissedIds.has(target.id) && (
                                                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                                                    Dismissed
                                                </Badge>
                                            )}
                                            {pausedIds.has(target.id) && (
                                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                                    Paused
                                                </Badge>
                                            )}

                                            {!isSent && !isFailed && !isReplied && !isOOO && !isBounced && (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                                    <span className="font-medium text-foreground">{target.confidence}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={cn("flex items-center gap-1 mt-1 text-xs text-muted-foreground", textColor)}>
                                        <Building2 className="h-3 w-3" />
                                        <span className="truncate">{target.company}</span>
                                    </div>
                                    {pausedIds.has(target.id) && (
                                        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                            {pausedIds.get(target.id) === "next-batch"
                                                ? "→ Moved to next batch today"
                                                : "→ Paused by user"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
