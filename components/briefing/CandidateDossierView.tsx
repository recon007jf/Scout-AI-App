/**
 * COMPONENT: CandidateDossierView
 * 
 * Purpose: Renders static candidate identity data (LinkedIn, Bio, History)
 * Constraints:
 * - STRICT READ-ONLY: No state, no setters, no async calls
 * - Pure render: Receives Target, renders HTML
 * - Separates Immutable Identity from Mutable Drafts
 * 
 * This is the "Diamond Standard" identity layer.
 */

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
    Building2,
    Mail,
    Linkedin,
    TrendingUp,
    Users,
    Briefcase,
} from "lucide-react"

interface CandidateData {
    id: string
    name: string
    contactName: string
    title: string
    company: string
    email?: string | null
    linkedinUrl?: string
    profileImage?: string
    confidence: number
    aiRationale?: string
    businessPersona?: {
        type: string
        description: string
        decisionStyle: string
        communicationPreference: string
    }
    dossier?: {
        companySize?: string
        industry?: string
        opportunityScore?: number
        recentActivity?: string[]
        painPoints?: string[]
    }
}

interface CandidateDossierViewProps {
    candidate: CandidateData | null
}

function getInitials(name: string): string {
    if (!name) return "??"
    const parts = name.trim().split(" ")
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * CandidateDossierView - Pure Read-Only Component
 * 
 * Renders the immutable identity and context for a candidate.
 * This component has NO state and makes NO async calls.
 */
export function CandidateDossierView({ candidate }: CandidateDossierViewProps) {
    if (!candidate) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                Select a candidate to view their profile.
            </div>
        )
    }

    const displayName = candidate.contactName || candidate.name || "Unknown Contact"

    return (
        <div className="space-y-6" data-testid="candidate-dossier-view">
            {/* LAYER 1: IDENTITY HEADER */}
            <div className="flex gap-5 items-start p-4 bg-muted/20 rounded-lg border border-border/50">
                {/* AVATAR BLOCK */}
                <div className="h-16 w-16 rounded-full overflow-hidden bg-muted flex-shrink-0 border border-border">
                    {candidate.profileImage ? (
                        <img
                            src={candidate.profileImage}
                            alt={displayName}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayName) + "&background=random"
                            }}
                        />
                    ) : (
                        <Avatar className="h-full w-full">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                                {getInitials(displayName)}
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>

                {/* INFO BLOCK */}
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground truncate">{displayName}</h2>
                    <p className="text-sm font-medium text-muted-foreground truncate">{candidate.title}</p>

                    <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-foreground">{candidate.company}</span>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                        {/* EMAIL */}
                        <div className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {candidate.email ? (
                                <a href={`mailto:${candidate.email}`} className="text-primary hover:underline font-medium">
                                    {candidate.email}
                                </a>
                            ) : (
                                <span className="text-muted-foreground italic">Email unavailable</span>
                            )}
                        </div>

                        {/* LINKEDIN */}
                        <div className="flex items-center gap-1.5">
                            <Linkedin className="h-4 w-4 text-muted-foreground" />
                            {candidate.linkedinUrl ? (
                                <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    LinkedIn Profile
                                </a>
                            ) : (
                                <span className="text-muted-foreground italic">No LinkedIn</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* CONFIDENCE BLOCK */}
                <div className="flex-shrink-0">
                    <Badge variant={candidate.confidence > 80 ? "default" : "secondary"} className="gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {candidate.confidence}% Match
                    </Badge>
                </div>
            </div>

            {/* LAYER 2: BUSINESS PERSONA (if available) */}
            {candidate.businessPersona && (
                <Card className="p-4 bg-card/60">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        <Users className="h-3.5 w-3.5" />
                        Business Persona
                    </h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{candidate.businessPersona.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{candidate.businessPersona.description}</p>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                            <div>
                                <span className="text-muted-foreground">Decision Style:</span>
                                <p className="font-medium">{candidate.businessPersona.decisionStyle}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Communication:</span>
                                <p className="font-medium">{candidate.businessPersona.communicationPreference}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* LAYER 3: COMPANY CONTEXT (if available) */}
            {candidate.dossier && (
                <Card className="p-4 bg-card/60">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        <Briefcase className="h-3.5 w-3.5" />
                        Company Context
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {candidate.dossier.industry && (
                            <div>
                                <span className="text-xs text-muted-foreground uppercase">Industry</span>
                                <p className="font-medium text-sm">{candidate.dossier.industry}</p>
                            </div>
                        )}
                        {candidate.dossier.companySize && (
                            <div>
                                <span className="text-xs text-muted-foreground uppercase">Company Size</span>
                                <p className="font-medium text-sm">{candidate.dossier.companySize}</p>
                            </div>
                        )}
                    </div>

                    {/* Pain Points */}
                    {candidate.dossier.painPoints && candidate.dossier.painPoints.length > 0 && (
                        <div className="mt-4">
                            <span className="text-xs text-muted-foreground uppercase">Pain Points</span>
                            <ul className="mt-1 space-y-1">
                                {candidate.dossier.painPoints.map((point, idx) => (
                                    <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recent Activity */}
                    {candidate.dossier.recentActivity && candidate.dossier.recentActivity.length > 0 && (
                        <div className="mt-4">
                            <span className="text-xs text-muted-foreground uppercase">Recent Activity</span>
                            <ul className="mt-1 space-y-1">
                                {candidate.dossier.recentActivity.map((activity, idx) => (
                                    <li key={idx} className="text-sm text-muted-foreground">
                                        {activity}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Card>
            )}
        </div>
    )
}
