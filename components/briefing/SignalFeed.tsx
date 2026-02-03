/**
 * COMPONENT: SignalFeed
 * 
 * Week 2 - Signals Injection (Read-Only)
 * 
 * Purpose: Display AI-generated signal proposals for a candidate
 * Constraints:
 * - READ-ONLY: No mutations, no auto-apply, no side effects
 * - VISUAL HYGIENE: Clearly labeled as "PROPOSAL" / "DRAFT INTENT"
 * - ISOLATION: Does not import ActionFooter or any mutation handlers
 */

"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Lightbulb,
    TrendingUp,
    TrendingDown,
    Clock,
    HelpCircle,
    Sparkles,
    Wand2,
} from "lucide-react"

/**
 * SignalsProposal - Contract matching backend mock
 * This is the read-only proposal from the Signals engine
 */
export interface SignalsProposal {
    id: string
    parent_state_hash: string
    intent: 'positive' | 'negative' | 'ooo' | 'question'
    reasoning: string
    confidence: number
    proposed_mutations?: {
        subject?: string
        body?: string
    }
}

interface SignalFeedProps {
    proposal: SignalsProposal | null
    isLoading?: boolean
    onApply?: (proposal: SignalsProposal) => void
}

const intentConfig = {
    positive: {
        icon: TrendingUp,
        label: "Positive Signal",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
    },
    negative: {
        icon: TrendingDown,
        label: "Negative Signal",
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
    },
    ooo: {
        icon: Clock,
        label: "Out of Office",
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
    },
    question: {
        icon: HelpCircle,
        label: "Question Detected",
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
    },
}

export function SignalFeed({ proposal, isLoading, onApply }: SignalFeedProps) {
    // Loading state
    if (isLoading) {
        return (
            <Card className="p-4 bg-amber-500/5 border-amber-500/20 animate-pulse" data-testid="signal-feed-loading">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
                        Analyzing Signals...
                    </span>
                </div>
                <div className="h-4 bg-muted/30 rounded w-3/4" />
            </Card>
        )
    }

    // No proposal available
    if (!proposal) {
        return null // Render nothing when no proposal - keeps UI clean
    }

    const config = intentConfig[proposal.intent]
    const IntentIcon = config.icon

    return (
        <Card
            className={`p-4 ${config.bgColor} ${config.borderColor} border`}
            data-testid="signal-feed"
        >
            {/* Header: SIGNAL DETECTED label (Visual Hygiene) */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        SIGNAL DETECTED
                    </span>
                    <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-400 border-amber-500/30"
                    >
                        PROPOSAL
                    </Badge>
                </div>
                <Badge
                    variant="outline"
                    className={`text-xs px-2 py-0.5 ${config.bgColor} ${config.color} ${config.borderColor}`}
                >
                    <IntentIcon className="w-3 h-3 mr-1" />
                    {config.label}
                </Badge>
            </div>

            {/* Reasoning */}
            <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                {proposal.reasoning}
            </p>

            {/* Confidence Score */}
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${config.bgColor.replace('/10', '/50')} rounded-full transition-all`}
                        style={{ width: `${proposal.confidence}%` }}
                    />
                </div>
                <span className={`text-xs font-semibold ${config.color}`}>
                    {proposal.confidence}%
                </span>
            </div>

            {/* Proposed Mutations + Apply Button */}
            {proposal.proposed_mutations && (
                <div className="mt-3 pt-3 border-t border-border/30">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Draft Intent
                            </span>
                        </div>
                        {/* APPLY BUTTON: Only visible when onApply provided */}
                        {onApply && (
                            <Button
                                size="sm"
                                onClick={() => onApply(proposal)}
                                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                                data-testid="apply-proposal-button"
                            >
                                <Wand2 className="w-3 h-3 mr-1" />
                                Apply Proposal
                            </Button>
                        )}
                    </div>

                    {proposal.proposed_mutations.subject && (
                        <div className="mb-2">
                            <span className="text-[10px] text-muted-foreground uppercase">Suggested Subject:</span>
                            <p className="text-xs text-foreground/80 italic">
                                "{proposal.proposed_mutations.subject}"
                            </p>
                        </div>
                    )}

                    {proposal.proposed_mutations.body && (
                        <div>
                            <span className="text-[10px] text-muted-foreground uppercase">Suggested Opening:</span>
                            <p className="text-xs text-foreground/60 italic line-clamp-2">
                                "{proposal.proposed_mutations.body.slice(0, 150)}..."
                            </p>
                        </div>
                    )}
                </div>
            )}
        </Card>
    )
}
