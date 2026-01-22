/**
 * COMPONENT: CandidateIdentityHeader
 * Canonical Identity Representation
 * Renders EXACTLY ONCE per screen (owned by View)
 */

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Building2, Mail, Linkedin, TrendingUp } from "lucide-react"

interface CandidateIdentityHeaderProps {
    name: string
    title: string
    firm: string
    email?: string | null
    linkedinUrl: string
    profileImage?: string
    confidence: number
}

function getInitials(name: string): string {
    if (!name) return "??"
    const parts = name.trim().split(" ")
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function CandidateIdentityHeader({
    name,
    title,
    firm,
    email,
    linkedinUrl,
    profileImage,
    confidence
}: CandidateIdentityHeaderProps) {
    return (
        <div className="flex gap-5 items-start p-4 bg-muted/20 rounded-lg border border-border/50 mb-6">
            {/* AVATAR BLOCK */}
            <div className="h-16 w-16 rounded-full overflow-hidden bg-muted flex-shrink-0 border border-border">
                {profileImage ? (
                    <img
                        src={profileImage}
                        alt={name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            // Fallback to UI Avatars if image fails
                            (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(name) + "&background=random"
                        }}
                    />
                ) : (
                    <Avatar className="h-full w-full">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                            {getInitials(name)}
                        </AvatarFallback>
                    </Avatar>
                )}
            </div>

            {/* INFO BLOCK */}
            <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground truncate">{name}</h2>
                <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>

                <div className="flex items-center gap-2 mt-1">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{firm}</span>
                </div>

                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    {/* EMAIL */}
                    <div className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {email ? (
                            <a href={`mailto:${email}`} className="text-primary hover:underline font-medium">
                                {email}
                            </a>
                        ) : (
                            <span className="text-muted-foreground italic">Email unavailable</span>
                        )}
                    </div>

                    {/* LINKEDIN */}
                    <div className="flex items-center gap-1.5">
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                        {linkedinUrl ? (
                            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
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
                <Badge variant={confidence > 80 ? "default" : "secondary"} className="gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {confidence}% Match
                </Badge>
            </div>
        </div>
    )
}
