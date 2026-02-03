/**
 * COMPONENT: ActionFooter
 * 
 * Purpose: THE MUTATION CHOKE POINT
 * Constraints:
 * - THE ONLY component that calls mutation APIs
 * - All state-changing actions flow through here
 * - Provides visual feedback during async operations
 */

"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Loader2,
    CheckCircle2,
    X,
    Pause,
    Undo2,
} from "lucide-react"

interface ActionFooterProps {
    targetId: string
    isPaused: boolean
    isDismissed: boolean
    outlookConnected: boolean
    outreachActive: boolean
    onApprove: (targetId: string) => Promise<void>
    onPause: (targetId: string) => Promise<void>
    onUnpause: (targetId: string) => void
    onDismiss: (targetId: string) => Promise<void>
    onUndoDismiss: (targetId: string) => void
}

export function ActionFooter({
    targetId,
    isPaused,
    isDismissed,
    outlookConnected,
    outreachActive,
    onApprove,
    onPause,
    onUnpause,
    onDismiss,
    onUndoDismiss,
}: ActionFooterProps) {
    const [isApproving, setIsApproving] = useState(false)
    const [isPausing, setIsPausing] = useState(false)
    const [isDismissing, setIsDismissing] = useState(false)

    const handleApprove = async () => {
        setIsApproving(true)
        try {
            await onApprove(targetId)
        } finally {
            setIsApproving(false)
        }
    }

    const handlePause = async () => {
        setIsPausing(true)
        try {
            await onPause(targetId)
        } finally {
            setIsPausing(false)
        }
    }

    const handleDismiss = async () => {
        setIsDismissing(true)
        try {
            await onDismiss(targetId)
        } finally {
            setIsDismissing(false)
        }
    }

    const canApprove = outlookConnected && outreachActive

    return (
        <Card className="p-4 bg-card/40" data-testid="action-footer">
            <div className="flex gap-2">
                {/* APPROVE BUTTON */}
                <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleApprove}
                    disabled={!canApprove || isApproving}
                    data-testid="approve-button"
                >
                    {isApproving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Approve Draft
                </Button>

                {/* PAUSE/UNPAUSE BUTTON */}
                {isPaused ? (
                    <Button
                        variant="outline"
                        className="border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 bg-amber-500/10"
                        onClick={() => onUnpause(targetId)}
                    >
                        <Undo2 className="w-4 h-4 mr-2" />
                        Unpause
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        className="border-border/50 hover:bg-accent/5 bg-transparent"
                        onClick={handlePause}
                        disabled={isPausing}
                    >
                        {isPausing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Pause className="w-4 h-4 mr-2" />
                        )}
                        Pause
                    </Button>
                )}

                {/* DISMISS/UNDO DISMISS BUTTON */}
                {isDismissed ? (
                    <Button
                        variant="outline"
                        className="border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 bg-amber-500/10"
                        onClick={() => onUndoDismiss(targetId)}
                    >
                        <Undo2 className="w-4 h-4 mr-2" />
                        Undo
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        className="border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
                        onClick={handleDismiss}
                        disabled={isDismissing}
                        data-testid="dismiss-button"
                    >
                        {isDismissing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <X className="w-4 h-4 mr-2" />
                        )}
                        Dismiss Target
                    </Button>
                )}
            </div>

            {/* Status Messages */}
            {!outlookConnected ? (
                <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded text-sm text-orange-600 dark:text-orange-400">
                    Connect Outlook in Settings to activate outreach and approve drafts.
                </div>
            ) : !outreachActive ? (
                <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-sm text-amber-600 dark:text-amber-400">
                    Outreach is paused. Resume to approve drafts.
                </div>
            ) : null}
        </Card>
    )
}
