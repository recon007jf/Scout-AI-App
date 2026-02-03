"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Activity, Mail, Clock, Archive } from "lucide-react"

interface SignalEvidence {
    lastActivity: string;
    targetUrl?: string;
    sourceContext?: string;
}

interface SignalBadgeProps {
    status: string; // "approved" | "pending" | "rejected" | "paused" | "failed" | "lurking" | "replied" etc.
    evidence?: SignalEvidence;
    className?: string;
}

export function SignalBadge({ status, evidence, className }: SignalBadgeProps) {
    // Map internal status to Badge Visuals
    const getBadgeConfig = (status: string) => {
        const s = status.toLowerCase();

        if (s === "replied" || s === "approved") { // Assuming 'approved' might map to engaged for now, or use exact status
            return {
                label: "REPLIED",
                color: "bg-green-500/15 text-green-500 hover:bg-green-500/25 border-green-500/50",
                icon: Mail
            };
        }
        if (s === "lurking" || s === "clicked") {
            return {
                label: "ACTIVITY DETECTED",
                color: "bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 border-blue-500/50",
                icon: Activity
            };
        }
        if (s === "pending") {
            return {
                label: "PENDING (3d)",
                color: "bg-muted text-muted-foreground border-border",
                icon: Clock
            };
        }
        return {
            label: "ARCHIVED",
            color: "bg-gray-900/50 text-gray-500 border-gray-800",
            icon: Archive
        };
    }

    const config = getBadgeConfig(status);
    const Icon = config.icon;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Badge
                    variant="outline"
                    className={`cursor-pointer transition-all gap-1.5 ${config.color} ${className}`}
                >
                    <Icon className="w-3 h-3" />
                    {config.label}
                </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden bg-zinc-950 border-zinc-800" side="bottom" align="start">
                {/* Header */}
                <div className="p-3 border-b border-zinc-800 bg-zinc-900/50">
                    <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                        Why is this state <span className="uppercase">{status}?</span>
                    </h4>
                </div>

                {/* Raw Data Table */}
                <div className="p-4 space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                        <span className="text-zinc-500">Last Activity:</span>
                        <span className="col-span-2 text-zinc-300 font-mono">
                            {evidence?.lastActivity || "N/A"}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <span className="text-zinc-500">Target:</span>
                        <span className="col-span-2 text-blue-400 break-all">
                            {evidence?.targetUrl || "Unknown"}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <span className="text-zinc-500">Source:</span>
                        <span className="col-span-2 text-zinc-300">
                            {evidence?.sourceContext || "System Ingestion"}
                        </span>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="p-3 bg-blue-950/20 border-t border-blue-900/30">
                    <p className="text-[10px] text-blue-400 leading-relaxed">
                        <strong>Note:</strong> Activity ≠ Intent. This indicates curiosity, not commitment.
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    )
}
