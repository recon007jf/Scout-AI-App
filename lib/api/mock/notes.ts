export const mockNotes = [
  {
    id: "note-1",
    type: "quick" as const,
    content:
      "Sarah mentioned interest in expanding their digital transformation roadmap. Follow up next quarter with case studies.",
    contactName: "Sarah Mitchell",
    contactId: "contact-1",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["follow-up", "digital-transformation"],
    linkedTo: { type: "opportunity", label: "Q2 Digital Strategy" },
  },
  {
    id: "note-2",
    type: "structured" as const,
    content:
      "Initial Discovery Call - Tech Stack Assessment\n\nCurrent State:\n- Legacy CRM system causing data silos\n- Manual reporting processes\n- Limited API integration capabilities\n\nPain Points:\n- Sales team spending 40% time on admin work\n- Poor data visibility across departments\n- Compliance concerns with data handling\n\nNext Steps:\n- Schedule technical deep-dive\n- Provide ROI calculator\n- Connect with their IT director",
    contactName: "David Thompson",
    contactId: "contact-2",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["discovery", "technical-assessment", "crm"],
    linkedTo: { type: "meeting", label: "Discovery Call - Mar 15" },
    aiGenerated: false,
  },
  {
    id: "note-3",
    type: "voice" as const,
    content:
      "Voice note from field visit: Customer expressed concerns about implementation timeline. They need solution deployed before fiscal year end. Mentioned budget approval already secured. Need to fast-track proposal.",
    contactName: "Jennifer Park",
    contactId: "contact-3",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["urgent", "timeline", "budget-approved"],
    linkedTo: { type: "opportunity", label: "Enterprise Platform Migration" },
    aiGenerated: true,
  },
  {
    id: "note-4",
    type: "quick" as const,
    content:
      "Great conversation at the conference. Michael is looking for automation solutions for their procurement process. Send intro deck by end of week.",
    contactName: "Michael Chen",
    contactId: "contact-4",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["conference", "automation", "procurement"],
  },
  {
    id: "note-5",
    type: "structured" as const,
    content:
      "Quarterly Business Review - Key Takeaways\n\nSuccesses:\n- 95% user adoption rate\n- 30% reduction in process time\n- Positive feedback from end users\n\nChallenges:\n- Need additional training for advanced features\n- Integration with accounting system pending\n\nOpportunities:\n- Upsell: Advanced analytics module\n- Expand to two additional departments\n- Potential referral to sister company\n\nAction Items:\n- Schedule training session for Q2\n- Scope integration project\n- Draft upsell proposal",
    contactName: "Amanda Rodriguez",
    contactId: "contact-5",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["qbr", "success", "upsell-opportunity"],
    linkedTo: { type: "account", label: "Rodriguez Enterprises" },
    aiGenerated: false,
  },
]
