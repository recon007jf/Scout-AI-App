"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Pause,
    Plus,
    Minus,
    Info,
    ArrowRight,
    X,
    Loader2,
    CheckCircle2,
    RefreshCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { getApiBaseUrl } from "@/lib/api/client"

// ============================================================================
// TYPES
// ============================================================================

type PlanState = "proposed" | "approved" | "paused"
type ReasonType = "freshness" | "intent" | "renewal" | "timing" | "relationship"

interface Candidate {
    id: string
    name: string
    company: string
    state: string
}

interface RegionReason {
    label: string
    type: ReasonType
}

interface RegionData {
    code: string
    name: string
    candidates: number
    enabled: boolean
    reason?: RegionReason
}

interface ReplacementRecord {
    id: string
    removed: Candidate
    replacedWith: Candidate
    reason: string
    timestamp: Date
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOTAL_TARGET = 50

const reasonColors: Record<ReasonType, string> = {
    freshness: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    intent: "bg-green-500/20 text-green-400 border-green-500/30",
    renewal: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    timing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    relationship: "bg-blue-500/20 text-blue-400 border-blue-500/30",
}

const stateColors: Record<string, string> = {
    NV: "bg-blue-500/20 text-blue-400",
    CA: "bg-green-500/20 text-green-400",
    OR: "bg-purple-500/20 text-purple-400",
    WA: "bg-orange-500/20 text-orange-400",
    AZ: "bg-cyan-500/20 text-cyan-400",
    UT: "bg-rose-500/20 text-rose-400",
    ID: "bg-amber-500/20 text-amber-400",
    CO: "bg-pink-500/20 text-pink-400",
}

// Note: initialRegions and mockCandidates removed - now fetched from API

// State name mapping
const STATE_NAMES: Record<string, string> = {
    CA: "California",
    NV: "Nevada",
    OR: "Oregon",
    WA: "Washington",
    AZ: "Arizona",
    CO: "Colorado",
    UT: "Utah",
    ID: "Idaho",
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MorningPlanDashboard() {
    const router = useRouter()
    const { toast } = useToast()

    // State
    const [planState, setPlanState] = useState<PlanState>("proposed")
    const [regions, setRegions] = useState<RegionData[]>([])
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [planId, setPlanId] = useState<string | null>(null)
    const [strategyRationale, setStrategyRationale] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isApproving, setIsApproving] = useState(false)

    // UI State
    const [showCandidates, setShowCandidates] = useState(true)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [skipConfirmation, setSkipConfirmation] = useState(false)
    const [dontAskAgain, setDontAskAgain] = useState(false)

    // Replacement State
    const [replacingId, setReplacingId] = useState<string | null>(null)
    const [replacementHistory, setReplacementHistory] = useState<ReplacementRecord[]>([])
    const [showReplacementDialog, setShowReplacementDialog] = useState(false)
    const [pendingRemoval, setPendingRemoval] = useState<Candidate | null>(null)
    const [removalReason, setRemovalReason] = useState("")
    const [showHistory, setShowHistory] = useState(false)

    // Derived state
    const activeRegions = regions.filter((r) => r.enabled && r.candidates > 0)

    // ============================================================================
    // DATA LOADING
    // ============================================================================

    useEffect(() => {
        const loadPlanData = async () => {
            setIsLoading(true)
            try {
                // Fetch real data from backend API
                const token = typeof window !== "undefined" ? localStorage.getItem("scout_auth_token") : null
                const response = await fetch(`${getApiBaseUrl()}/api/daily-plan`, {
                    cache: 'no-store',
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                })

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`)
                }

                const data = await response.json()

                // Map API response to component state
                setPlanId(data.id)
                setPlanState(data.status as PlanState)
                setStrategyRationale(data.strategy_rationale || [])

                // Map region_constraints to RegionData array
                const regionConstraints = data.region_constraints || {}
                const regionMetadata = data.region_metadata || {}
                const mappedRegions: RegionData[] = Object.entries(regionConstraints).map(([code, count]) => {
                    const meta = regionMetadata[code]
                    return {
                        code,
                        name: STATE_NAMES[code] || code,
                        candidates: count as number,
                        enabled: (count as number) > 0,
                        reason: meta ? { label: meta.reason, type: (meta.reason_type || "freshness") as ReasonType } : undefined,
                    }
                })
                setRegions(mappedRegions.length > 0 ? mappedRegions : [])

                // Map candidates array
                const mappedCandidates: Candidate[] = (data.candidates || []).map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    company: c.firm,
                    state: c.state,
                }))
                setCandidates(mappedCandidates)

                console.log("[MorningPlan] Loaded plan:", { planId: data.id, candidates: mappedCandidates.length, regions: mappedRegions })
            } catch (error) {
                console.error("[MorningPlan] Failed to load data:", error)
                toast({
                    title: "Failed to load plan data",
                    description: String(error),
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        loadPlanData()
    }, [])

    // ============================================================================
    // HANDLERS
    // ============================================================================

    const redistributeCandidates = (newRegions: RegionData[]): RegionData[] => {
        const enabledRegions = newRegions.filter((r) => r.enabled)
        if (enabledRegions.length === 0) return newRegions

        const baseCount = Math.floor(TOTAL_TARGET / enabledRegions.length)
        const remainder = TOTAL_TARGET % enabledRegions.length

        let idx = 0
        return newRegions.map((r) => {
            if (!r.enabled) return { ...r, candidates: 0 }
            const extra = idx < remainder ? 1 : 0
            idx++
            return { ...r, candidates: baseCount + extra }
        })
    }

    const toggleRegion = (code: string) => {
        setRegions((prev) => {
            const toggled = prev.map((r) => (r.code === code ? { ...r, enabled: !r.enabled } : r))
            return redistributeCandidates(toggled)
        })
    }

    const adjustCandidates = (code: string, delta: number) => {
        setRegions((prev) => {
            const region = prev.find((r) => r.code === code)
            if (!region) return prev

            const newCount = Math.max(0, Math.min(TOTAL_TARGET, region.candidates + delta))
            const actualDelta = newCount - region.candidates
            if (actualDelta === 0) return prev

            const otherEnabled = prev.filter((r) => r.enabled && r.code !== code)
            if (otherEnabled.length === 0) return prev

            const perRegion = Math.floor(Math.abs(actualDelta) / otherEnabled.length)
            let remaining = Math.abs(actualDelta) % otherEnabled.length

            return prev.map((r) => {
                if (r.code === code) {
                    return { ...r, candidates: newCount }
                }
                if (r.enabled) {
                    let adjustment = perRegion
                    if (remaining > 0) {
                        adjustment += 1
                        remaining--
                    }
                    const adjusted = actualDelta > 0 ? r.candidates - adjustment : r.candidates + adjustment
                    return { ...r, candidates: Math.max(0, adjusted) }
                }
                return r
            })
        })
    }

    const handleApproveClick = () => {
        if (skipConfirmation) {
            handleConfirmApprove()
        } else {
            setShowConfirmDialog(true)
        }
    }

    const handleConfirmApprove = async () => {
        if (dontAskAgain) {
            setSkipConfirmation(true)
        }
        setShowConfirmDialog(false)
        setIsApproving(true)

        try {
            // Call real API to approve plan
            const token = typeof window !== "undefined" ? localStorage.getItem("scout_auth_token") : null
            const response = await fetch(`${getApiBaseUrl()}/api/daily-plan/approve`, {
                method: "POST",
                cache: 'no-store',
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({}),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || `API Error: ${response.status}`)
            }

            const data = await response.json()
            console.log("[MorningPlan] Plan approved:", data)

            setPlanState("approved")
            toast({
                title: "Plan approved!",
                description: `Generated ${data.strategy_rationale?.pop() || "drafts"}. Redirecting...`,
            })

            // Navigate to morning briefing after short delay
            setTimeout(() => {
                router.push("/scout/morning")
            }, 1500)
        } catch (error) {
            console.error("[MorningPlan] Approval failed:", error)
            toast({
                title: "Approval failed",
                description: String(error),
                variant: "destructive",
            })
        } finally {
            setIsApproving(false)
        }
    }

    const handlePause = () => setPlanState("paused")
    const handleReset = () => setPlanState("proposed")

    const initiateRemoval = (candidate: Candidate) => {
        setPendingRemoval(candidate)
        setRemovalReason("")
        setShowReplacementDialog(true)
    }

    const executeReplacement = async () => {
        if (!pendingRemoval) return

        setShowReplacementDialog(false)
        const removedCandidate = pendingRemoval
        const reason = removalReason.trim() || "No reason provided"

        setReplacingId(removedCandidate.id)

        try {
            // TODO: Replace with real API call
            // const res = await fetch('/api/candidates/replace', { method: 'POST', body: JSON.stringify({ candidateId: removedCandidate.id, reason }) })

            await new Promise((resolve) => setTimeout(resolve, 1200))

            // Mock replacement
            const replacement: Candidate = {
                id: `replacement-${Date.now()}`,
                name: `Replacement for ${removedCandidate.name}`,
                company: "New Company",
                state: removedCandidate.state, // Preserve region constraint
            }

            const record: ReplacementRecord = {
                id: `${Date.now()}`,
                removed: removedCandidate,
                replacedWith: replacement,
                reason,
                timestamp: new Date(),
            }
            setReplacementHistory((prev) => [record, ...prev])

            setCandidates((prev) => prev.map((c) => (c.id === removedCandidate.id ? replacement : c)))

            // TODO: Emit system note to Helix
            console.log("[Helix Sync] Candidate replaced:", { removed: removedCandidate.name, replacement: replacement.name, reason })

        } catch (error) {
            console.error("[MorningPlan] Replacement failed:", error)
            toast({
                title: "Replacement failed",
                variant: "destructive",
            })
        } finally {
            setReplacingId(null)
            setPendingRemoval(null)
            setRemovalReason("")
        }
    }

    const cancelRemoval = () => {
        setShowReplacementDialog(false)
        setPendingRemoval(null)
        setRemovalReason("")
    }

    // ============================================================================
    // RENDER
    // ============================================================================

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading today's plan...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {/* State Banner */}
            {planState !== "proposed" && (
                <div
                    className={cn(
                        "px-6 py-3 flex items-center justify-between border-b",
                        planState === "approved" && "bg-green-500/10 border-green-500/20",
                        planState === "paused" && "bg-orange-500/10 border-orange-500/20"
                    )}
                >
                    <div className="flex items-center gap-3">
                        {planState === "approved" ? (
                            <>
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-green-400 font-medium">Plan Approved</span>
                                <span className="text-muted-foreground">
                                    Redirecting to drafts...
                                </span>
                            </>
                        ) : (
                            <>
                                <div className="h-2 w-2 rounded-full bg-orange-500" />
                                <span className="text-orange-400 font-medium">Outreach Paused</span>
                                <span className="text-muted-foreground">No emails will be sent until resumed</span>
                            </>
                        )}
                    </div>
                    {planState === "paused" && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="text-muted-foreground hover:text-foreground bg-transparent"
                        >
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Resume
                        </Button>
                    )}
                </div>
            )}

            <div className="p-6 space-y-8">
                {/* Hero Goal Section */}
                <div className="text-center space-y-4 py-4">
                    {planState === "proposed" && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-2" />
                            READY FOR REVIEW
                        </Badge>
                    )}
                    <h1 className="text-4xl font-bold tracking-tight">
                        {"TODAY'S GOAL: "}
                        <span className="text-green-400">{candidates.length} TARGETS</span>
                    </h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        Review today's outreach plan. Scan the list below to exclude anyone who shouldn't be contacted.
                    </p>
                </div>

                {/* Regional Targeting */}
                <Card className="p-5 border-border">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="font-medium">Regional Targeting</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Adjust volume per state or add new regions to today's outreach
                            </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                            {activeRegions.length} regions active
                        </Badge>
                    </div>

                    {/* Active Regions Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
                        {regions
                            .filter((r) => r.enabled)
                            .map((region) => (
                                <Card
                                    key={region.code}
                                    className="relative p-4 bg-muted/40 border-border hover:border-muted-foreground/30 transition-colors"
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 bg-transparent"
                                        onClick={() => toggleRegion(region.code)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>

                                    <div className="mb-2">
                                        <Badge className={cn("font-mono text-xs mb-1", stateColors[region.code])}>
                                            {region.code}
                                        </Badge>
                                        <h3 className="font-semibold text-lg leading-tight">{region.name}</h3>
                                    </div>

                                    {region.reason && (
                                        <Badge
                                            variant="outline"
                                            className={cn("text-xs font-normal mb-3", reasonColors[region.reason.type])}
                                        >
                                            {region.reason.label}
                                        </Badge>
                                    )}

                                    <div className="text-4xl font-bold tabular-nums mb-3">{region.candidates}</div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 bg-transparent border-border hover:bg-muted"
                                            onClick={() => adjustCandidates(region.code, -5)}
                                            disabled={region.candidates === 0}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 bg-transparent border-border hover:bg-muted"
                                            onClick={() => adjustCandidates(region.code, 5)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                    </div>

                    {/* Available Regions */}
                    {regions.some((r) => !r.enabled) && (
                        <div>
                            <span className="text-xs text-muted-foreground mb-2 block">
                                Add regions to today's outreach:
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {regions
                                    .filter((r) => !r.enabled)
                                    .map((region) => (
                                        <button
                                            key={region.code}
                                            onClick={() => toggleRegion(region.code)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-blue-500/50 hover:text-foreground hover:bg-blue-500/5 transition-all"
                                        >
                                            <Plus className="h-3 w-3" />
                                            {region.name}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Strategy Rationale */}
                <div className="border-l-2 border-blue-500 pl-5 py-1">
                    <div className="flex items-center gap-2 mb-3">
                        <Info className="h-4 w-4 text-blue-400" />
                        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Strategy Rationale
                        </h2>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-foreground">•</span>
                            <span>
                                Focusing on <span className="text-foreground">Nevada</span> due to high lead freshness
                                from yesterday's signals.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-foreground">•</span>
                            <span>Excluding Pacific Northwest per your 'Cost-per-Lead' threshold rule.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-foreground">•</span>
                            <span>
                                Prioritizing <span className="text-foreground">high-intent signals</span> in California
                                technology hubs.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Candidate Overview */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Quick Scan
                            </h2>
                            <span className="text-xs text-muted-foreground">
                                {candidates.length} candidates
                                {replacementHistory.length > 0 && (
                                    <span className="text-blue-400 ml-1">({replacementHistory.length} replaced)</span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {replacementHistory.length > 0 && (
                                <Badge
                                    className="bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-pointer hover:bg-blue-500/30 transition-colors"
                                    onClick={() => setShowHistory(true)}
                                >
                                    {replacementHistory.length} replaced
                                </Badge>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCandidates(!showCandidates)}
                                className="border-orange-500/50 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300"
                            >
                                {showCandidates ? "Hide List" : `Daily Target Overview (${candidates.length})`}
                            </Button>
                        </div>
                    </div>

                    {showCandidates && (
                        <Card className="p-4 border-border">
                            <p className="text-xs text-muted-foreground mb-4">
                                Click the X to remove anyone who shouldn't be contacted - a replacement will be pulled automatically.
                            </p>
                            <TooltipProvider>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                                    {candidates.map((candidate) => {
                                        const isReplacing = replacingId === candidate.id
                                        return (
                                            <Tooltip key={candidate.id}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={cn(
                                                            "group relative p-2 rounded-lg border text-left transition-all min-h-[60px]",
                                                            isReplacing
                                                                ? "bg-muted/50 border-muted animate-pulse"
                                                                : "bg-muted/40 border-border hover:border-muted-foreground/30"
                                                        )}
                                                    >
                                                        {isReplacing ? (
                                                            <div className="flex flex-col items-center justify-center h-full py-2">
                                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mb-1" />
                                                                <p className="text-[10px] text-muted-foreground text-center">
                                                                    Pulling replacement...
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-start justify-between gap-1">
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-sm font-medium truncate">
                                                                            {candidate.name}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground truncate">
                                                                            {candidate.company}
                                                                        </p>
                                                                    </div>
                                                                    <Badge
                                                                        className={cn(
                                                                            "text-[10px] px-1.5 py-0 shrink-0",
                                                                            stateColors[candidate.state]
                                                                        )}
                                                                    >
                                                                        {candidate.state}
                                                                    </Badge>
                                                                </div>
                                                                <button
                                                                    onClick={() => initiateRemoval(candidate)}
                                                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <X className="h-3 w-3 text-white" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs">
                                                    <p className="font-medium">{candidate.name}</p>
                                                    <p className="text-muted-foreground">{candidate.company}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )
                                    })}
                                </div>
                            </TooltipProvider>
                        </Card>
                    )}
                </div>

                {/* Approval Actions */}
                {planState === "proposed" && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-border">
                        <Button
                            variant="outline"
                            className="bg-transparent border-border text-muted-foreground hover:text-foreground"
                            onClick={handlePause}
                        >
                            <Pause className="h-4 w-4 mr-2" />
                            Pause Outreach
                        </Button>
                        <Button
                            className="bg-green-700 hover:bg-green-800 text-white px-6"
                            onClick={handleApproveClick}
                            disabled={isApproving}
                        >
                            {isApproving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approve Daily Plan
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Approve Daily Plan?</DialogTitle>
                        <DialogDescription>
                            This will lock regions and candidates for the day and begin generating email drafts.
                            You'll review each draft before anything is sent.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 py-4">
                        <Checkbox
                            id="dont-ask"
                            checked={dontAskAgain}
                            onCheckedChange={(checked: boolean) => setDontAskAgain(checked)}
                        />
                        <label
                            htmlFor="dont-ask"
                            className="text-sm text-muted-foreground cursor-pointer"
                        >
                            Don't ask me again
                        </label>
                    </div>
                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirmDialog(false)}
                            className="bg-transparent"
                        >
                            No, go back
                        </Button>
                        <Button
                            onClick={handleConfirmApprove}
                            className="bg-green-700 hover:bg-green-800 text-white"
                        >
                            Yes, approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Replacement Reason Dialog */}
            <Dialog open={showReplacementDialog} onOpenChange={setShowReplacementDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove {pendingRemoval?.name}?</DialogTitle>
                        <DialogDescription>
                            A replacement will be automatically pulled from the same region ({pendingRemoval?.state}).
                            Optionally, note why you're removing this contact.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="removal-reason" className="text-sm text-muted-foreground">
                            Reason (optional)
                        </Label>
                        <Textarea
                            id="removal-reason"
                            value={removalReason}
                            onChange={(e) => setRemovalReason(e.target.value)}
                            placeholder="e.g., Already a client, Wrong contact, etc."
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button variant="outline" onClick={cancelRemoval} className="bg-transparent">
                            Cancel
                        </Button>
                        <Button onClick={executeReplacement} className="bg-red-600 hover:bg-red-700 text-white">
                            Remove & Replace
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Replacement History Dialog */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Replacement History</DialogTitle>
                        <DialogDescription>
                            {replacementHistory.length} replacements made today
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto space-y-3 py-4">
                        {replacementHistory.map((record) => (
                            <div key={record.id} className="p-3 rounded-lg bg-muted/40 border border-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-1 text-red-400">
                                        <X className="h-3 w-3" />
                                        <span className="text-sm">{record.removed.name}</span>
                                    </div>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <div className="flex items-center gap-1 text-green-400">
                                        <Plus className="h-3 w-3" />
                                        <span className="text-sm">{record.replacedWith.name}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">{record.reason}</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                    {record.timestamp.toLocaleTimeString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
