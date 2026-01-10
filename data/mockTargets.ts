export interface TargetInterface {
  id: string
  contactName: string
  title: string
  company: string
  linkedinUrl: string
  email: string
  profileImage: string
  confidenceScore: number
  aiRationale: string
  status: "pending" | "approved" | "rejected"
  businessPersona: {
    type: string
    description: string
    decisionStyle: string
    communicationPreference: string
  }
  dossier: {
    companySize: string
    industry: string
    recentActivity: string[]
    painPoints: string[]
    opportunityScore: number
    selfFundedPlans: {
      clientName: string
      planType: string
      enrollmentSize: number
      renewalDate?: string
      upcomingChanges?: string
    }[]
  }
  draft: {
    subject: string
    body: string
    tone: string
    wordCount: number
  }
}

export const mockTargets: TargetInterface[] = [
  {
    id: "1",
    contactName: "Robert Sullivan",
    title: "VP of Risk Management",
    company: "Woodruff-Sawyer",
    linkedinUrl: "https://www.linkedin.com/in/robert-sullivan",
    email: "rsullivan@woodruffsawyer.com",
    profileImage: "/professional-male-executive-vp-risk.jpg",
    confidenceScore: 87,
    status: "pending",
    aiRationale:
      "Recent expansion into tech sector, posted about D&O insurance challenges on LinkedIn 3 days ago. Company hiring signals growth phase.",
    businessPersona: {
      type: "Strategic Controller",
      description:
        "Robert is a data-driven decision maker who values comprehensive analysis and ROI metrics. He prefers detailed documentation and systematic approaches to risk management.",
      decisionStyle: "Analytical and deliberate - requires multiple touchpoints with detailed data before committing",
      communicationPreference:
        "Formal emails with clear structure, executive summaries, and supporting data. Responds well to case studies and quantifiable results.",
    },
    dossier: {
      companySize: "500-1000 employees",
      industry: "Professional Services",
      recentActivity: [
        "Posted about D&O insurance challenges on LinkedIn (3 days ago)",
        "Company announced Series C funding round ($50M)",
        "Hiring 3 new risk analysts (posted on LinkedIn Jobs)",
        "Attended RIMS conference in San Francisco (2 weeks ago)",
      ],
      painPoints: [
        "Managing insurance costs during rapid growth phase",
        "Complex D&O coverage requirements for tech clients",
        "Need for specialized cyber liability solutions",
        "Regulatory compliance across multiple jurisdictions",
      ],
      opportunityScore: 87,
      selfFundedPlans: [
        {
          clientName: "TechVision Inc.",
          planType: "Level-Funded Medical",
          enrollmentSize: 350,
          renewalDate: "March 15, 2025",
          upcomingChanges: "Considering switch to full self-funded due to growth",
        },
        {
          clientName: "DataCore Solutions",
          planType: "Self-Funded with Stop-Loss",
          enrollmentSize: 580,
          renewalDate: "June 1, 2025",
          upcomingChanges: "Expanding to include telemedicine benefits",
        },
        {
          clientName: "CloudFirst Technologies",
          planType: "Partially Self-Funded",
          enrollmentSize: 425,
          renewalDate: "February 1, 2025",
          upcomingChanges: "Renewal imminent - evaluating cost containment strategies",
        },
      ],
    },
    draft: {
      subject: "D&O Coverage Strategy for Growing Tech Portfolios",
      body: `Hi Robert,

I noticed your recent LinkedIn post about navigating D&O insurance challenges in the tech sector - it resonated with challenges I've seen other risk leaders face during growth phases.

At Point C Health, we've developed a specialized approach for professional services firms managing tech client portfolios. Our framework helps risk managers like you balance comprehensive D&O coverage with cost efficiency during expansion.

Given Woodruff-Sawyer's recent Series C round and tech sector focus, I thought you might find value in a brief conversation about how we've helped similar firms optimize their D&O strategies.

Would you be open to a 15-minute call next week?

Best regards,
Andrew Oram
Point C Health`,
      tone: "Professional, consultative",
      wordCount: 112,
    },
  },
  {
    id: "2",
    contactName: "Sarah Chen",
    title: "Director of Benefits",
    company: "Gallagher",
    linkedinUrl: "https://www.linkedin.com/in/sarah-chen",
    email: "schen@ajg.com",
    profileImage: "/professional-female-director-benefits.jpg",
    confidenceScore: 92,
    status: "pending",
    aiRationale:
      "Leading benefits transformation initiative, engaged with mental health benefits content on LinkedIn. Company prioritizing employee wellness.",
    businessPersona: {
      type: "Collaborative Builder",
      description:
        "Sarah values partnership and relationship-building in business dealings. She seeks vendors who act as strategic partners rather than mere service providers.",
      decisionStyle: "Consensus-driven with emphasis on team input - appreciates collaborative discovery processes",
      communicationPreference:
        "Warm but professional tone, prefers dialogue over one-way pitches. Values personal connection and shared goals.",
    },
    dossier: {
      companySize: "10,000+ employees",
      industry: "Insurance Brokerage",
      recentActivity: [
        "Shared article on mental health benefits innovation (1 day ago)",
        "Speaking at HR Tech Conference next month",
        "Company launched new wellness platform for clients",
        "Promoted to Director role 6 months ago",
      ],
      painPoints: [
        "Integrating mental health benefits into existing programs",
        "Demonstrating ROI of wellness initiatives to clients",
        "Managing benefits complexity for remote workforce",
        "Staying ahead of regulatory changes in healthcare",
      ],
      opportunityScore: 92,
      selfFundedPlans: [
        {
          clientName: "Meridian Healthcare Group",
          planType: "Full Self-Funded Medical & Rx",
          enrollmentSize: 1250,
          renewalDate: "January 15, 2025",
          upcomingChanges: "Critical renewal - exploring mental health benefit enhancements",
        },
        {
          clientName: "Pacific Manufacturing Co.",
          planType: "Self-Funded with Aggregate Stop-Loss",
          enrollmentSize: 890,
          renewalDate: "April 1, 2025",
        },
        {
          clientName: "Evergreen Hospitality",
          planType: "Level-Funded Medical",
          enrollmentSize: 650,
          renewalDate: "May 15, 2025",
          upcomingChanges: "Evaluating wellness program integration",
        },
        {
          clientName: "Summit Financial Services",
          planType: "Self-Funded HSA-Compatible",
          enrollmentSize: 420,
          renewalDate: "March 1, 2025",
          upcomingChanges: "Adding mental health EAP coverage",
        },
      ],
    },
    draft: {
      subject: "Mental Health Benefits Integration - Insights from Recent Implementations",
      body: `Hi Sarah,

Congratulations on your upcoming presentation at HR Tech! I saw you shared that piece on mental health benefits innovation - it's a topic close to my heart.

We've been working with several large brokerages to integrate comprehensive mental health coverage into their benefit strategies. The results have been remarkable, particularly around employee retention metrics.

I'd love to share some insights from these implementations, especially around ROI demonstration and remote workforce considerations.

Would you be interested in connecting for a brief conversation? I think there might be some mutual value in comparing notes.

Best,
Andrew Oram
Point C Health`,
      tone: "Warm, collaborative",
      wordCount: 98,
    },
  },
]
