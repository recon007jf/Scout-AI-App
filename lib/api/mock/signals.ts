import type { Signal } from "@/lib/types"

export const mockSignals: Signal[] = [
  {
    id: "sig_001",
    type: "email-reply",
    priority: "high",
    timestamp: "15 minutes ago",
    contact: {
      name: "Sarah Mitchell",
      title: "VP of Risk Management",
      company: "Lockton Companies",
      avatarUrl: "/professional-woman-headshot-business-executive.jpg",
    },
    summary: "Replied to outreach about D&O coverage for tech portfolio",
    details:
      "Sarah responded positively to your automated outreach about D&O insurance solutions. She mentioned they're currently reviewing their tech client portfolio and would like to schedule a call to discuss coverage gaps.",
    replyText:
      "Hi Andrew, Thanks for reaching out. We are actually in the middle of reviewing our D&O coverage for our tech clients and your timing is perfect. Would you have time for a 15-minute call next week to discuss?",
    actionable: true,
    signalStrength: 95,
    isRead: false,
  },
  {
    id: "sig_002",
    type: "email-reply",
    priority: "high",
    timestamp: "1 hour ago",
    contact: {
      name: "David Thompson",
      title: "Director of Employee Benefits",
      company: "Marsh McLennan",
      avatarUrl: "/professional-man-headshot-business-director.jpg",
    },
    summary: "Interested in cybersecurity insurance discussion",
    details:
      "David replied to your email about cybersecurity insurance for healthcare tech companies. He's managing several clients in this space and wants to explore your solutions.",
    replyText:
      "Andrew, this is very timely. I have 3 healthcare tech clients asking about cyber coverage. Let's set up some time to talk about what Point C Health offers.",
    actionable: true,
    signalStrength: 92,
    isRead: false,
  },
  {
    id: "sig_003",
    type: "job-change",
    priority: "medium",
    timestamp: "3 hours ago",
    contact: {
      name: "Jennifer Park",
      title: "VP Risk Management",
      company: "Aon",
      avatarUrl: "/professional-woman-headshot-vp-executive.jpg",
    },
    summary: "Changed jobs to VP Risk Management at Aon",
    details:
      "Jennifer Park has been promoted to VP of Risk Management at Aon. She previously worked as Director of Insurance at Willis Towers Watson and has expertise in property & casualty insurance.",
    actionable: true,
    signalStrength: 78,
    isRead: false,
  },
]
