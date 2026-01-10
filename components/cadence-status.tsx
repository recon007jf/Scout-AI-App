/**
 * COMPONENT: CadenceStatus
 * Displays Cadence Guardrails status (daily cap, quiet hours, spacing)
 *
 * BACKEND TODO: Connect to getCadenceStatus()
 */

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Mail, Calendar, AlertTriangle } from "lucide-react"

export function CadenceStatus() {
  // MOCK DATA - Replace with getCadenceStatus()
  const cadence = {
    dailyCap: 25,
    sentToday: 12,
    quietHoursActive: false,
    quietHoursRange: "8:00 PM - 8:00 AM",
    lastSentTimestamp: "2024-01-15T14:30:00Z",
    minimumSpacing: "4 hours",
  }

  const percentUsed = (cadence.sentToday / cadence.dailyCap) * 100

  return (
    <Card className="p-6">
      <h3 className="mb-6 text-xl font-semibold text-foreground">Cadence Guardrails</h3>

      <div className="space-y-6">
        {/* Daily Cap */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Daily Send Cap</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {cadence.sentToday} / {cadence.dailyCap}
            </span>
          </div>
          <Progress value={percentUsed} className="h-2" />
          {percentUsed > 80 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              Approaching daily limit
            </div>
          )}
        </div>

        {/* Quiet Hours */}
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Quiet Hours</span>
              <Badge variant={cadence.quietHoursActive ? "destructive" : "secondary"}>
                {cadence.quietHoursActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">No sends during {cadence.quietHoursRange}</p>
          </div>
        </div>

        {/* Minimum Spacing */}
        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <span className="text-sm font-medium text-foreground">Minimum Spacing</span>
            <p className="mt-1 text-xs text-muted-foreground">
              At least {cadence.minimumSpacing} between touches to same Target
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
