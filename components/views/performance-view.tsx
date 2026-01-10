"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Mail, Users, Target, DollarSign, CheckCircle2, Clock } from "lucide-react"

interface Metric {
  label: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon: React.ComponentType<{ className?: string }>
}

const mockMetrics: Metric[] = [
  {
    label: "Emails Sent",
    value: "248",
    change: "+12% vs last month",
    trend: "up",
    icon: Mail,
  },
  {
    label: "Response Rate",
    value: "32%",
    change: "+5% vs last month",
    trend: "up",
    icon: CheckCircle2,
  },
  {
    label: "Active Targets",
    value: "64",
    change: "+8 this month",
    trend: "up",
    icon: Target,
  },
  {
    label: "Pipeline Value",
    value: "$1.2M",
    change: "+18% vs last month",
    trend: "up",
    icon: DollarSign,
  },
  {
    label: "Avg Response Time",
    value: "2.4 days",
    change: "-0.6 days improvement",
    trend: "up",
    icon: Clock,
  },
  {
    label: "Network Size",
    value: "342",
    change: "+24 this month",
    trend: "up",
    icon: Users,
  },
]

const activityData = [
  { month: "Jul", emails: 180, responses: 52, meetings: 12 },
  { month: "Aug", emails: 195, responses: 58, meetings: 15 },
  { month: "Sep", emails: 210, responses: 64, meetings: 18 },
  { month: "Oct", emails: 225, responses: 68, meetings: 21 },
  { month: "Nov", emails: 235, responses: 72, meetings: 23 },
  { month: "Dec", emails: 248, responses: 79, meetings: 26 },
]

const topPerformers = [
  { name: "Jennifer Martinez", company: "Willis Towers Watson", engagements: 15, revenue: "$195K" },
  { name: "Sarah Chen", company: "Gallagher", engagements: 12, revenue: "$180K" },
  { name: "Robert Sullivan", company: "Woodruff-Sawyer", engagements: 10, revenue: "$145K" },
  { name: "Michael Porter", company: "Marsh McLennan", engagements: 8, revenue: "$125K" },
  { name: "David Kim", company: "Aon", engagements: 6, revenue: "$95K" },
]

export function PerformanceView() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "quarter" | "year">("month")

  const maxEmails = Math.max(...activityData.map((d) => d.emails))

  return (
    <div className="h-full p-8 overflow-y-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground mb-2">Performance</h2>
          <p className="text-muted-foreground">Analytics and metrics dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeframe === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("week")}
            className={timeframe !== "week" ? "bg-transparent" : ""}
          >
            Week
          </Button>
          <Button
            variant={timeframe === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("month")}
            className={timeframe !== "month" ? "bg-transparent" : ""}
          >
            Month
          </Button>
          <Button
            variant={timeframe === "quarter" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("quarter")}
            className={timeframe !== "quarter" ? "bg-transparent" : ""}
          >
            Quarter
          </Button>
          <Button
            variant={timeframe === "year" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("year")}
            className={timeframe !== "year" ? "bg-transparent" : ""}
          >
            Year
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {mockMetrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="p-6 bg-card/60 hover:bg-card/80 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    metric.trend === "up" ? "bg-green-500/10" : "bg-red-500/10"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${metric.trend === "up" ? "text-green-400" : "text-red-400"}`} />
                </div>
                {metric.trend === "up" ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-1">{metric.value}</h3>
              <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
              <p className={`text-xs ${metric.trend === "up" ? "text-green-400" : "text-red-400"}`}>{metric.change}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Activity Chart */}
        <Card className="col-span-8 p-6 bg-card/60">
          <h3 className="text-lg font-semibold text-foreground mb-6">Activity Trends</h3>
          <div className="space-y-6">
            {/* Simple Bar Chart */}
            <div>
              <div className="flex items-end justify-between gap-3 h-48">
                {activityData.map((data) => (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col gap-1 justify-end flex-1">
                      <div
                        className="w-full bg-cyan-500/30 rounded-t transition-all hover:bg-cyan-500/40"
                        style={{ height: `${(data.emails / maxEmails) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{data.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-cyan-500/30" />
                  <span className="text-muted-foreground">Emails Sent</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <Card className="col-span-4 p-6 bg-card/60">
          <h3 className="text-lg font-semibold text-foreground mb-4">This Month</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
              <p className="text-2xl font-bold text-foreground mb-1">79</p>
              <p className="text-sm text-muted-foreground">Responses Received</p>
            </div>
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-2xl font-bold text-foreground mb-1">26</p>
              <p className="text-sm text-muted-foreground">Meetings Scheduled</p>
            </div>
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <p className="text-2xl font-bold text-foreground mb-1">12</p>
              <p className="text-sm text-muted-foreground">New Opportunities</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="p-6 bg-card/60">
        <h3 className="text-lg font-semibold text-foreground mb-4">Top Performing Contacts</h3>
        <div className="space-y-3">
          {topPerformers.map((performer, index) => (
            <div
              key={performer.name}
              className="flex items-center justify-between p-4 bg-card/40 rounded-lg hover:bg-card/60 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  #{index + 1}
                </div>
                <div>
                  <p className="font-medium text-foreground">{performer.name}</p>
                  <p className="text-sm text-muted-foreground">{performer.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="text-muted-foreground">Engagements</p>
                  <p className="font-semibold text-foreground">{performer.engagements}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Revenue</p>
                  <p className="font-semibold text-green-400">{performer.revenue}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
