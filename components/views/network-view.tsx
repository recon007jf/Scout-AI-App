"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Building2,
  Mail,
  Linkedin,
  Calendar,
  MessageSquare,
  TrendingUp,
  Search,
  Filter,
  ChevronRight,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { useProfileImage } from "@/lib/hooks/use-profile-image"
import type { ContactsResponse } from "@/lib/types/api"
import { getContacts } from "@/lib/api/client"

const ENABLE_LIVE_DATA = true

const relationshipConfig = {
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  engaged: { label: "Engaged", color: "bg-blue-100 text-blue-800" },
  prospect: { label: "Prospect", color: "bg-yellow-100 text-yellow-800" },
  cold: { label: "Cold", color: "bg-red-100 text-red-800" },
}

interface NetworkContact {
  id: string
  name: string
  title: string
  company: string
  email: string
  linkedinUrl?: string
  avatarUrl?: string
  relationship: "active" | "engaged" | "prospect" | "cold"
  lastContact: string
  engagementScore: number
  tags: string[]
  nextAction?: string
  notes?: string
}

function ContactAvatar({ name, company, linkedinUrl }: { name: string; company: string; linkedinUrl?: string }) {
  const { imageUrl } = useProfileImage(name, company, linkedinUrl)

  return (
    <Avatar className="w-9 h-9">
      {imageUrl && <AvatarImage src={imageUrl || "/placeholder.svg"} />}
      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        {name
          .split(" ")
          .map((n) => n[0])
          .join("")}
      </AvatarFallback>
    </Avatar>
  )
}

export function NetworkView() {
  const [contacts, setContacts] = useState<NetworkContact[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedContact, setSelectedContact] = useState<NetworkContact | null>(null)
  const [filterRelationship, setFilterRelationship] = useState<"all" | "active" | "engaged" | "prospect" | "cold">(
    "all",
  )
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setIsLoading(true)
      setDebugInfo("Loading contacts via client API...")

      const data = await getContacts()

      const mappedContacts = data.map((contact) => ({
        id: contact.id,
        name: contact.name || contact.full_name,
        title: contact.title || contact.role,
        company: contact.company || contact.firm,
        email: contact.email || contact.work_email,
        linkedinUrl: contact.linkedinUrl || contact.linkedin_url,
        relationship: (contact.relationship || contact.relationship_status || "prospect") as any,
        lastContact: contact.lastContact || (contact.last_contact ? new Date(contact.last_contact).toLocaleDateString() : "Never"),
        engagementScore: contact.engagementScore || contact.engagement_score || 0,
        tags: contact.tags || [],
        nextAction: contact.nextAction || "Follow up soon",
        notes: contact.notes || "Contact from API",
        avatarUrl: contact.avatarUrl
      }))

      setContacts(mappedContacts)
      console.log("[v0] Loaded contacts:", mappedContacts.length)
      setDebugInfo(`Loaded ${mappedContacts.length} contacts`)
    } catch (error) {
      console.error("[v0] Failed to load contacts:", error)
      setDebugInfo(`ERROR: ${error instanceof Error ? error.message : String(error)}`)
      setContacts([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.title.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterRelationship === "all" || contact.relationship === filterRelationship

    return matchesSearch && matchesFilter
  })

  return (
    <div className="h-full p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground mb-2">Network</h2>
          <p className="text-muted-foreground">Your contact and relationship ledger</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 bg-card/60"
            />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <Button
          variant={filterRelationship === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterRelationship("all")}
          className={filterRelationship !== "all" ? "bg-transparent" : ""}
        >
          All ({contacts.length})
        </Button>
        <Button
          variant={filterRelationship === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterRelationship("active")}
          className={filterRelationship !== "active" ? "bg-transparent" : ""}
        >
          Active ({contacts.filter((c) => c.relationship === "active").length})
        </Button>
        <Button
          variant={filterRelationship === "engaged" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterRelationship("engaged")}
          className={filterRelationship !== "engaged" ? "bg-transparent" : ""}
        >
          Engaged ({contacts.filter((c) => c.relationship === "engaged").length})
        </Button>
        <Button
          variant={filterRelationship === "prospect" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterRelationship("prospect")}
          className={filterRelationship !== "prospect" ? "bg-transparent" : ""}
        >
          Prospects ({contacts.filter((c) => c.relationship === "prospect").length})
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-320px)]">
        <div className="col-span-7 overflow-y-auto">
          <Card className="bg-card/40">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/30 sticky top-0">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Contact
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Company
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Relationship
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Engagement
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Last Contact
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Loading contacts...
                      </td>
                    </tr>
                  ) : filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No contacts found
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className="border-b border-border hover:bg-card/60 transition-colors cursor-pointer"
                        onClick={() => setSelectedContact(contact)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <ContactAvatar
                              name={contact.name}
                              company={contact.company}
                              linkedinUrl={contact.linkedinUrl}
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">{contact.name}</p>
                              <p className="text-xs text-muted-foreground">{contact.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-foreground">{contact.company}</p>
                        </td>
                        <td className="p-4">
                          <Badge className={relationshipConfig[contact.relationship].color} variant="outline">
                            {relationshipConfig[contact.relationship].label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${contact.engagementScore}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{contact.engagementScore}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-muted-foreground">{contact.lastContact}</p>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedContact(contact)
                            }}
                          >
                            View
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="col-span-5 overflow-y-auto">
          {selectedContact ? (
            <div className="space-y-4">
              <Card className="p-6 bg-card/60">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    {selectedContact.avatarUrl && <AvatarImage src={selectedContact.avatarUrl || "/placeholder.svg"} />}
                    <AvatarFallback>
                      {selectedContact.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-1">{selectedContact.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{selectedContact.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span>{selectedContact.company}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge className={relationshipConfig[selectedContact.relationship].color} variant="outline">
                    {relationshipConfig[selectedContact.relationship].label}
                  </Badge>
                  <Badge variant="secondary" className="gap-2">
                    <TrendingUp className="w-3 h-3" />
                    {selectedContact.engagementScore}% engagement
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <a
                    href={`mailto:${selectedContact.email}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    {selectedContact.email}
                  </a>
                  {selectedContact.linkedinUrl && (
                    <a
                      href={selectedContact.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Linkedin className="w-4 h-4" />
                      View LinkedIn Profile
                    </a>
                  )}
                </div>
              </Card>

              <Card className="p-5 bg-card/60">
                <div className="flex items-start gap-3 mb-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Last Contact</h4>
                    <p className="text-sm text-muted-foreground">{selectedContact.lastContact}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-amber-500/5 border-amber-500/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Next Action</h4>
                    <p className="text-sm text-foreground">{selectedContact.nextAction}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-card/60">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedContact.notes}</p>
                  </div>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button className="flex-1 gap-2">
                  <Mail className="w-4 h-4" />
                  Send Email
                </Button>
                <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                  <Calendar className="w-4 h-4" />
                  Schedule Call
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Select a contact</h3>
              <p className="text-muted-foreground">Click on any contact to view their details and activity</p>
            </div>
          )}
        </div>
      </div>

      {debugInfo && (
        <div className="mt-4 p-3 bg-muted/50 rounded border border-border">
          <p className="text-xs font-mono text-muted-foreground break-all">{debugInfo}</p>
        </div>
      )}
    </div>
  )
}
