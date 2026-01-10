import type { Target, PolishedDraft } from "@/lib/types"

export const mockTargets: Target[] = [
  {
    targetId: "tgt_001",
    broker: {
      name: "Sarah Mitchell",
      title: "Senior Insurance Broker",
      firm: "Premier Risk Solutions",
      email: "sarah.mitchell@premierrisk.com",
      phone: "+1 (415) 555-0123",
      linkedIn: "https://linkedin.com/in/sarahmitchell",
      avatar: "/professional-woman-headshot-insurance-executive.jpg",
    },
    sponsor: {
      name: "Global Tech Industries",
      industry: "Technology",
      revenue: "$2.5B",
      employees: 5000,
      location: "San Francisco, CA",
    },
    signals: [
      {
        type: "renewal_90_days",
        priority: 95,
        description: "D&O policy renewal approaching in 90 days",
      },
      {
        type: "executive_turnover",
        priority: 85,
        description: "New CFO appointed last month",
      },
    ],
    dossier: {
      lastContact: "2024-11-15",
      relationshipScore: 72,
      previousInteractions: 8,
      keyNotes: ["Prefers morning calls", "Focus on cyber coverage"],
    },
    businessPersona: {
      type: "Strategic Controller",
      description:
        "Sarah is a data-driven decision maker who values comprehensive analysis and ROI metrics. She prefers detailed documentation and systematic approaches to risk management.",
      decisionStyle: "Analytical and deliberate - requires multiple touchpoints with detailed data before committing",
      communicationPreference:
        "Formal emails with clear structure, executive summaries, and supporting data. Responds well to case studies and quantifiable results.",
    },
    draft: {
      subject: "D&O Coverage Review - Global Tech Industries",
      body: "Hi Sarah,\n\nI noticed Global Tech Industries has a D&O renewal coming up, and with your new CFO joining last month, this might be a good time to review your coverage.\n\nI've been tracking some industry trends that could impact your premiums favorably. Would you have 15 minutes next week to discuss?\n\nBest regards,\nAndrew",
      generatedAt: new Date().toISOString(),
      version: 1,
    },
    status: "pending_review",
    priority: 95,
    createdAt: new Date().toISOString(),
  },
  {
    targetId: "tgt_002",
    broker: {
      name: "David Thompson",
      title: "Risk Management Director",
      firm: "Coastal Insurance Group",
      email: "d.thompson@coastalinsurance.com",
      phone: "+1 (617) 555-0198",
      linkedIn: "https://linkedin.com/in/davidthompson",
      avatar: "/professional-man-headshot-benefits-director.jpg",
    },
    sponsor: {
      name: "Maritime Logistics Corp",
      industry: "Transportation & Logistics",
      revenue: "$850M",
      employees: 2200,
      location: "Boston, MA",
    },
    signals: [
      {
        type: "expansion",
        priority: 88,
        description: "Company expanding into Asian markets",
      },
    ],
    dossier: {
      lastContact: "2024-10-22",
      relationshipScore: 65,
      previousInteractions: 4,
      keyNotes: ["Interested in marine cargo coverage"],
    },
    businessPersona: {
      type: "Collaborative Builder",
      description:
        "David values partnership and relationship-building in business dealings. He seeks vendors who act as strategic partners rather than mere service providers.",
      decisionStyle: "Consensus-driven with emphasis on team input - appreciates collaborative discovery processes",
      communicationPreference:
        "Warm but professional tone, prefers dialogue over one-way pitches. Values personal connection and shared goals.",
    },
    draft: {
      subject: "International Expansion Coverage - Maritime Logistics",
      body: "David,\n\nCongratulations on Maritime Logistics' expansion into Asia! I wanted to reach out about ensuring your coverage extends properly to these new territories.\n\nWe've helped several transportation companies navigate similar expansions. I'd love to share some insights.\n\nAre you available for a brief call this week?\n\nBest,\nAndrew",
      generatedAt: new Date().toISOString(),
      version: 1,
    },
    status: "pending_review",
    priority: 88,
    createdAt: new Date().toISOString(),
  },
]

export const mockPolishedDraft: PolishedDraft = {
  original: {
    subject: "D&O Coverage Review - Global Tech Industries",
    body: "Hi Sarah,\n\nI noticed Global Tech Industries has a D&O renewal coming up, and with your new CFO joining last month, this might be a good time to review your coverage.\n\nBest regards,\nAndrew",
  },
  polished: {
    subject: "Strategic D&O Review: Optimizing Coverage for Global Tech's Leadership Transition",
    body: "Hi Sarah,\n\nWith Global Tech Industries' D&O renewal approaching and your recent CFO appointment, I've identified three specific opportunities to enhance your coverage while potentially reducing costs:\n\n1. Enhanced Side A protection for your new executive team\n2. Updated limits aligned with current market valuations\n3. Streamlined claims procedures reflecting industry best practices\n\nI've prepared a brief analysis specific to your situation. Would next Tuesday or Wednesday work for a 15-minute call?\n\nBest regards,\nAndrew",
  },
  changes: [
    {
      type: "subject_enhanced",
      description: "Subject line now emphasizes strategic value and leadership context",
    },
    {
      type: "body_specificity",
      description: "Added three concrete value propositions with bullet points",
    },
    {
      type: "call_to_action",
      description: "Specific meeting times proposed instead of vague 'next week'",
    },
  ],
  improvementScore: 87,
}
