"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Clock, Phone, Mail, Video, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarEvent {
  id: string
  title: string
  type: "call" | "email" | "meeting" | "follow-up" | "renewal"
  date: string
  time: string
  duration: string
  contact: string
  company: string
  description: string
  status: "upcoming" | "completed" | "overdue"
}

const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Follow-up call with Robert Sullivan",
    type: "call",
    date: "2024-01-15",
    time: "10:00 AM",
    duration: "30 min",
    contact: "Robert Sullivan",
    company: "Woodruff-Sawyer",
    description: "Discuss D&O proposal and address questions about tech sector coverage",
    status: "upcoming",
  },
  {
    id: "2",
    title: "Q2 Planning Meeting - Sarah Chen",
    type: "meeting",
    date: "2024-01-15",
    time: "2:00 PM",
    duration: "60 min",
    contact: "Sarah Chen",
    company: "Gallagher",
    description: "Review Q2 strategy and renewal pipeline for tech clients",
    status: "upcoming",
  },
  {
    id: "3",
    title: "Send case study to Michael Porter",
    type: "email",
    date: "2024-01-16",
    time: "9:00 AM",
    duration: "15 min",
    contact: "Michael Porter",
    company: "Marsh McLennan",
    description: "Share cybersecurity coverage success story from similar client",
    status: "upcoming",
  },
  {
    id: "4",
    title: "Renewal discussion - Jennifer Martinez",
    type: "renewal",
    date: "2024-01-17",
    time: "11:00 AM",
    duration: "45 min",
    contact: "Jennifer Martinez",
    company: "Willis Towers Watson",
    description: "Review renewal portfolio and discuss expansion opportunities",
    status: "upcoming",
  },
  {
    id: "5",
    title: "Virtual demo - David Kim",
    type: "meeting",
    date: "2024-01-18",
    time: "3:00 PM",
    duration: "45 min",
    contact: "David Kim",
    company: "Aon",
    description: "Product demonstration and re-engagement conversation",
    status: "upcoming",
  },
  {
    id: "6",
    title: "Completed: Initial outreach",
    type: "email",
    date: "2024-01-12",
    time: "10:00 AM",
    duration: "10 min",
    contact: "Lisa Thompson",
    company: "Arthur J. Gallagher",
    description: "Sent initial introduction email with D&O insights",
    status: "completed",
  },
]

const typeConfig = {
  call: { icon: Phone, label: "Call", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  email: { icon: Mail, label: "Email", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  meeting: { icon: Video, label: "Meeting", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  "follow-up": { icon: CheckCircle2, label: "Follow-up", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  renewal: { icon: CalendarIcon, label: "Renewal", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
}

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [viewMode, setViewMode] = useState<"week" | "month">("week")

  const today = new Date()
  const upcomingEvents = events
    .filter((e) => e.status === "upcoming")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const groupedByDate = upcomingEvents.reduce(
    (acc, event) => {
      const date = event.date
      if (!acc[date]) acc[date] = []
      acc[date].push(event)
      return acc
    },
    {} as Record<string, CalendarEvent[]>,
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const isToday = date.toDateString() === today.toDateString()
    const isTomorrow = date.toDateString() === new Date(today.getTime() + 86400000).toDateString()

    if (isToday) return "Today"
    if (isTomorrow) return "Tomorrow"

    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
  }

  return (
    <div className="h-full p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground mb-2">Calendar</h2>
          <p className="text-muted-foreground">Your schedule and upcoming activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-transparent">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent">
            This Week
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-280px)]">
        {/* Timeline View */}
        <div className="col-span-7 overflow-y-auto pr-2">
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([date, dateEvents]) => (
              <div key={date}>
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 mb-3 z-10">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{formatDate(date)}</h3>
                </div>
                <div className="space-y-3 pl-6 border-l-2 border-border">
                  {dateEvents.map((event) => {
                    const config = typeConfig[event.type]
                    const Icon = config.icon

                    return (
                      <Card
                        key={event.id}
                        className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${
                          selectedEvent?.id === event.id ? "border-primary bg-card/80" : "bg-card/40"
                        } -ml-6`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-foreground mb-1">{event.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {event.time} • {event.duration}
                                  </span>
                                </div>
                              </div>
                              <Badge className={config.color} variant="outline">
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {event.contact} • {event.company}
                            </p>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}

            {events.filter((e) => e.status === "completed").length > 0 && (
              <div>
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 mb-3 z-10">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Completed</h3>
                </div>
                <div className="space-y-3 pl-6 border-l-2 border-border opacity-60">
                  {events
                    .filter((e) => e.status === "completed")
                    .map((event) => {
                      const config = typeConfig[event.type]
                      const Icon = config.icon

                      return (
                        <Card key={event.id} className="p-4 bg-card/20 -ml-6">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground mb-1">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {event.contact} • {formatDate(event.date)}
                              </p>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Event Detail */}
        <div className="col-span-5 overflow-y-auto">
          {selectedEvent ? (
            <div className="space-y-4">
              <Card className="p-6 bg-card/60">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Badge className={typeConfig[selectedEvent.type].color} variant="outline" className="mb-3">
                      {typeConfig[selectedEvent.type].label}
                    </Badge>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{selectedEvent.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{formatDate(selectedEvent.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedEvent.time} ({selectedEvent.duration})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Contact</p>
                      <p className="text-sm font-medium text-foreground">{selectedEvent.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Company</p>
                      <p className="text-sm font-medium text-foreground">{selectedEvent.company}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/60">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Description</h4>
                <p className="text-sm text-foreground leading-relaxed">{selectedEvent.description}</p>
              </Card>

              <div className="flex gap-3">
                <Button className="flex-1 gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Complete
                </Button>
                <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                  <Clock className="w-4 h-4" />
                  Reschedule
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEvent(null)}
                className="w-full text-muted-foreground"
              >
                Clear Selection
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <CalendarIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Select an event</h3>
              <p className="text-muted-foreground">Click on any event to view details and take action</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
