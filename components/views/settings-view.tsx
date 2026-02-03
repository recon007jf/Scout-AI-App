"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamInvites } from "@/components/team-invites"
import { useUserRole } from "@/lib/hooks/use-user-role"
import { Bell, Mail, Shield, Zap, Users, Key, MessageSquare, CheckCircle2, XCircle } from "lucide-react"

type SettingsTab = "profile" | "notifications" | "outreach" | "integrations" | "ai" | "security" | "team"

export function SettingsView({ initialTab, onMount }: { initialTab?: string; onMount?: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>((initialTab as SettingsTab) || "profile")
  const [emailFrequency, setEmailFrequency] = useState("daily")
  const [signalThreshold, setSignalThreshold] = useState("75")
  const [autoApprove, setAutoApprove] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [outlookConnected, setOutlookConnected] = useState<boolean | null>(null)
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(false) // Changed default to false since it shows connected
  const [linkedinConnected, setLinkedinConnected] = useState<boolean | null>(false)
  const [profileName, setProfileName] = useState("")
  const [profileEmail, setProfileEmail] = useState("")
  const [profileCompany, setProfileCompany] = useState("")
  const [profileRole, setProfileRole] = useState("")
  const [profileTimezone, setProfileTimezone] = useState("pst")
  const [outlookTestResult, setOutlookTestResult] = useState<string | null>(null)
  const [isConnectingOutlook, setIsConnectingOutlook] = useState(false)
  const [isTestingOutlook, setIsTestingOutlook] = useState(false)
  const [isConnectingGmail, setIsConnectingGmail] = useState(false)
  const [isDisconnectingGmail, setIsDisconnectingGmail] = useState(false)
  const [isDisconnectingLinkedin, setIsDisconnectingLinkedin] = useState(false)

  const userRole = useUserRole()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab as SettingsTab)
    }

    if (onMount) {
      onMount()
    }

    const params = new URLSearchParams(window.location.search)
    const status = params.get("status")

    if (status === "success") {
      setOutlookConnected(true)
      setOutlookTestResult("Outlook connected successfully!")
      window.history.replaceState({}, "", "/settings?tab=integrations")
    } else if (status === "error") {
      setOutlookConnected(false)
      setOutlookTestResult(params.get("message") || "OAuth authorization failed")
      window.history.replaceState({}, "", "/settings?tab=integrations")
    }

    const loadProfileSettings = async () => {
      try {
        const userEmail = localStorage.getItem("scout_user_email") || "andrew.oram@pointchealth.com"
        const response = await fetch(`/api/scout/settings?user_email=${encodeURIComponent(userEmail)}`)

        if (response.ok) {
          const data = await response.json()
          if (data.preferences) {
            setProfileName(data.preferences.full_name || "")
            setProfileEmail(data.preferences.email || "")
            setProfileCompany(data.preferences.company || "")
            setProfileRole(data.preferences.role || "")
            setProfileTimezone(data.preferences.timezone || "pst")
          }
        }
      } catch (error) {
        console.error("[v0] Failed to load profile settings:", error)
      }
    }

    loadProfileSettings()

    // Auto-fetch Outlook connection status on mount
    const fetchOutlookStatus = async () => {
      try {
        const response = await fetch('/api/scout/outreach/status')
        if (response.ok) {
          const data = await response.json()
          if (typeof data.outlook_connected === 'boolean') {
            setOutlookConnected(data.outlook_connected)
            console.log("[v0] Outlook status fetched:", data.outlook_connected)
          }
        }
      } catch (error) {
        console.error("[v0] Failed to fetch Outlook status:", error)
      }
    }
    fetchOutlookStatus()
  }, [initialTab, onMount])

  const handleOutlookToggle = async () => {
    if (outlookConnected === true) {
      if (!confirm("Are you sure you want to disconnect Outlook? You'll need to reconnect and re-authorize.")) {
        return
      }

      setIsConnectingOutlook(true)
      setOutlookTestResult(null)

      try {
        const response = await fetch("/api/scout/outlook/disconnect", {
          method: "DELETE",
        })
        const data = await response.json()

        if (data.success) {
          setOutlookConnected(null)
          setOutlookTestResult("Outlook disconnected successfully. You can now reconnect.")
        } else {
          setOutlookTestResult(`Failed to disconnect: ${data.error}`)
        }
      } catch (error) {
        setOutlookTestResult("Network error while disconnecting Outlook")
      } finally {
        setIsConnectingOutlook(false)
      }
    } else {
      setIsConnectingOutlook(true)
      try {
        const response = await fetch("/api/scout/outlook/auth-url")
        const data = await response.json()

        if (data.url) {
          window.location.href = data.url
        } else {
          setOutlookTestResult(`Failed to get OAuth URL: ${JSON.stringify(data)}`)
          setIsConnectingOutlook(false)
        }
      } catch (error) {
        console.error("Outlook OAuth Error:", error)
        setOutlookTestResult(`Failed to initiate OAuth: ${String(error)}`)
        setIsConnectingOutlook(false)
      }
    }
  }

  const handleTestOutlook = async () => {
    setIsTestingOutlook(true)
    setOutlookTestResult(null)

    try {
      const email = "andrew.oram@pointchealth.com"
      const token = localStorage.getItem("scout_auth_token")

      const headers: HeadersInit = {
        "Content-Type": "application/json"
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`/api/scout/outlook/test?email=${encodeURIComponent(email)}`, {
        headers
      })
      const data = await response.json()

      if (response.ok && data.success) {
        setOutlookConnected(true)
        setOutlookTestResult("Outlook connection successful!")
      } else {
        setOutlookConnected(false)
        // Handle FastAPI 422/403 details or generic errors
        const errorMsg = data.error || data.detail || (data.user_email ? "Token Refused" : "Unknown Error")
        setOutlookTestResult(`Connection failed: ${errorMsg}`)
      }
    } catch (error) {
      setOutlookConnected(false)
      setOutlookTestResult(`Network error while testing Outlook: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsTestingOutlook(false)
    }
  }

  const connectGmail = async () => {
    setIsConnectingGmail(true)
    try {
      const response = await fetch("/api/scout/gmail/auth-url")
      const data = await response.json()

      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        alert("Failed to get Gmail authorization URL")
      }
    } catch (error) {
      console.error("[v0] Gmail connect error:", error)
      alert("Network error while connecting Gmail")
    } finally {
      setIsConnectingGmail(false)
    }
  }

  const disconnectGmail = async () => {
    if (!confirm("Are you sure you want to disconnect Gmail? You will need to reconnect to use Gmail features.")) {
      return
    }

    setIsDisconnectingGmail(true)
    try {
      const response = await fetch("/api/scout/gmail/disconnect", {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setGmailConnected(false)
        alert("Gmail disconnected successfully")
      } else {
        const errorMsg = data.details ? `Failed to disconnect Gmail:\n${data.details}` : "Failed to disconnect Gmail"
        alert(errorMsg)
      }
    } catch (error) {
      console.error("[v0] Gmail disconnect error:", error)
      alert("Failed to disconnect Gmail. Please try again.")
    } finally {
      setIsDisconnectingGmail(false)
    }
  }

  const disconnectLinkedin = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect LinkedIn? You will need to reconnect to sync contacts and activity.",
      )
    ) {
      return
    }

    setIsDisconnectingLinkedin(true)
    try {
      const response = await fetch("/api/scout/linkedin/disconnect", {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(`Failed to disconnect LinkedIn: ${errorData.error}`)
        return
      }

      setLinkedinConnected(false)
      alert("LinkedIn disconnected successfully")
    } catch (error) {
      console.error("[LinkedIn Disconnect Error]", error)
      alert("Failed to disconnect LinkedIn. Please try again.")
    } finally {
      setIsDisconnectingLinkedin(false)
    }
  }

  const saveProfileChanges = async () => {
    try {
      const userEmail = localStorage.getItem("scout_user_email") || "andrew.oram@pointchealth.com"

      const response = await fetch("/api/scout/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userEmail,
          preferences: {
            full_name: profileName,
            email: profileEmail,
            company: profileCompany,
            role: profileRole,
            timezone: profileTimezone,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      const data = await response.json()
      console.log("[v0] Settings saved:", data)
      alert("Profile information saved successfully")
    } catch (error) {
      console.error("[v0] Error saving profile settings:", error)
      alert("Failed to save profile settings. Please try again.")
    }
  }

  const runRefinery = async () => {
    if (
      !confirm("⚠️ TEST MODE: Run the refinery CSV processor now?\n\nThis will process up to 50 entries from the CSV.")
    ) {
      return
    }

    try {
      const response = await fetch("/api/scout/refinery/run?limit=50", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to run refinery")
      }

      alert(`Refinery ran successfully!\n\n${JSON.stringify(data.data, null, 2)}`)
    } catch (error) {
      console.error("[v0] Error running refinery:", error)
      alert(`Failed to run refinery: ${error}`)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account, preferences, and integrations</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SettingsTab)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto">
            <TabsTrigger value="profile" className="gap-2">
              <Bell className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="outreach" className="gap-2">
              <Mail className="w-4 h-4" />
              Outreach
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Zap className="w-4 h-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              AI & Helix
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            {(userRole === "admin" || isAdmin) && (
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 bg-card/60">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Profile Information</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                This information is used by the AI to generate personalized email signatures and customize your outreach
                messages.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter your full name"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profileCompany}
                    onChange={(e) => setProfileCompany(e.target.value)}
                    placeholder="Enter your company name"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profileRole}
                    onChange={(e) => setProfileRole(e.target.value)}
                    placeholder="Enter your role"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={profileTimezone} onValueChange={setProfileTimezone}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                      <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                      <SelectItem value="cst">Central Time (CST)</SelectItem>
                      <SelectItem value="est">Eastern Time (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={saveProfileChanges}>Save Changes</Button>
                <Button variant="outline" className="bg-transparent">
                  Cancel
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-card/60">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Appearance</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Theme</Label>
                  <Select defaultValue="dark">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compact View</Label>
                    <p className="text-sm text-muted-foreground">Show more content on screen</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6 bg-card/60">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Notification Preferences</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email alerts for important events</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Browser notifications for real-time updates</p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
                <div>
                  <Label>Morning Briefing Time</Label>
                  <Select defaultValue="8am">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6am">6:00 AM</SelectItem>
                      <SelectItem value="7am">7:00 AM</SelectItem>
                      <SelectItem value="8am">8:00 AM</SelectItem>
                      <SelectItem value="9am">9:00 AM</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1.5">When to send your daily briefing</p>
                </div>
                <div>
                  <Label>Signal Alerts</Label>
                  <Select defaultValue="high">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Signals</SelectItem>
                      <SelectItem value="high">High Priority Only</SelectItem>
                      <SelectItem value="none">No Alerts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card/60">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Digest Settings</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Weekly Summary</Label>
                  <Select defaultValue="monday">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday Morning</SelectItem>
                      <SelectItem value="friday">Friday Afternoon</SelectItem>
                      <SelectItem value="none">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Outreach Tab */}
          <TabsContent value="outreach" className="space-y-6">
            <Card className="p-6 bg-card/60">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Email Outreach Settings</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <Label>Daily Batch Size</Label>
                  <Input type="number" defaultValue="10" className="mt-1.5" />
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Number of targets to include in Morning Briefing
                  </p>
                </div>
                <div>
                  <Label>Batch Frequency</Label>
                  <Select value={emailFrequency} onValueChange={setEmailFrequency}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="twice">Twice Daily</SelectItem>
                      <SelectItem value="three">3x Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Minimum Signal Strength</Label>
                  <Input
                    type="number"
                    value={signalThreshold}
                    onChange={(e) => setSignalThreshold(e.target.value)}
                    className="mt-1.5"
                  />
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Only include targets with signal strength above {signalThreshold}%
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Approve Drafts</Label>
                    <p className="text-sm text-muted-foreground">Automatically send drafts above 95% confidence</p>
                  </div>
                  <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card/60">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Email Signature</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Signature Template</Label>
                  <textarea
                    className="w-full mt-1.5 min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue={`Best regards,
Andrew Orr
Account Executive
Point C Health
andrew@pointchealth.com`}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-blue-400" />
                Connected Services
              </h3>
            </div>

            {/* Outlook Card */}
            <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Outlook</h4>
                    <p className="text-sm text-muted-foreground">Email sending and calendar</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      outlookConnected === true
                        ? "bg-transparent border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        : "bg-transparent border-green-500/20 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                    }
                    onClick={handleOutlookToggle}
                    disabled={isConnectingOutlook || isTestingOutlook}
                  >
                    {isConnectingOutlook
                      ? "Connecting..."
                      : outlookConnected === true
                        ? "Disconnect"
                        : "Connect Outlook"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                    onClick={handleTestOutlook}
                    disabled={isTestingOutlook}
                  >
                    {isTestingOutlook ? "Testing..." : "Test Connection"}
                  </Button>
                  {outlookConnected === true && <Badge className="bg-green-500/10 text-green-400">Connected</Badge>}
                  {outlookConnected === false && <Badge className="bg-red-500/10 text-red-400">Not Connected</Badge>}
                  {outlookConnected === null && <Badge className="bg-yellow-500/10 text-yellow-400">Unknown</Badge>}
                </div>
              </div>

              {outlookTestResult && (
                <div
                  className={`flex flex-col gap-2 p-4 rounded-lg border ${outlookTestResult.includes("success")
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-red-500/10 border-red-500/20"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {outlookTestResult.includes("success") ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    )}
                    <p
                      className={`text-sm ${outlookTestResult.includes("success") ? "text-green-400" : "text-red-400"}`}
                    >
                      {outlookTestResult}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Gmail Card */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium">Gmail</h4>
                  <p className="text-sm text-muted-foreground">
                    {gmailConnected ? "andrew@pacificaisystems.com" : "Email sending and inbox"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {gmailConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={disconnectGmail}
                    disabled={isDisconnectingGmail}
                  >
                    {isDisconnectingGmail ? "Disconnecting..." : "Disconnect"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-gray-500/20 text-gray-400 cursor-not-allowed opacity-50"
                    disabled
                    title="Gmail integration not yet available"
                  >
                    Connect Gmail
                  </Button>
                )}
                <Badge
                  className={
                    gmailConnected === true
                      ? "bg-green-500/10 text-green-400"
                      : gmailConnected === false
                        ? "bg-gray-500/10 text-gray-400"
                        : "bg-yellow-500/10 text-yellow-400"
                  }
                >
                  {gmailConnected === true ? "Connected" : gmailConnected === false ? "Not Connected" : "Unknown"}
                </Badge>
              </div>
            </div>

            {/* LinkedIn Card */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium">LinkedIn</h4>
                  <p className="text-sm text-muted-foreground">Sync contacts and activity</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {linkedinConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={disconnectLinkedin}
                    disabled={isDisconnectingLinkedin}
                  >
                    {isDisconnectingLinkedin ? "Disconnecting..." : "Disconnect"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-gray-500/20 text-gray-400 cursor-not-allowed opacity-50"
                    disabled
                    title="LinkedIn integration not yet available"
                  >
                    Connect
                  </Button>
                )}
                <Badge
                  className={
                    linkedinConnected === true
                      ? "bg-green-500/10 text-green-400"
                      : linkedinConnected === false
                        ? "bg-gray-500/10 text-gray-400"
                        : "bg-yellow-500/10 text-yellow-400"
                  }
                >
                  {linkedinConnected ? "Connected" : "Not Connected"}
                </Badge>
              </div>
            </div>
          </TabsContent>

          {/* AI & Helix Tab */}
          <TabsContent value="ai" className="space-y-6">
            <Card className="p-6 bg-card/60">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Helix AI Assistant</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <Label>AI Model</Label>
                  <p className="text-sm text-muted-foreground mb-1.5">Choose the language model for Helix</p>
                  <Select defaultValue="gemini-pro">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-pro">Google Gemini Pro</SelectItem>
                      <SelectItem value="gpt-4o" disabled>
                        GPT-4 Optimized (Coming Soon)
                      </SelectItem>
                      <SelectItem value="gpt-4-turbo" disabled>
                        GPT-4 Turbo (Coming Soon)
                      </SelectItem>
                      <SelectItem value="gpt-4" disabled>
                        GPT-4 (Coming Soon)
                      </SelectItem>
                      <SelectItem value="claude-opus" disabled>
                        Claude 3 Opus (Coming Soon)
                      </SelectItem>
                      <SelectItem value="claude-sonnet" disabled>
                        Claude 3 Sonnet (Coming Soon)
                      </SelectItem>
                      <SelectItem value="claude-haiku" disabled>
                        Claude 3 Haiku (Coming Soon)
                      </SelectItem>
                      <SelectItem value="grok-beta" disabled>
                        Grok Beta (Coming Soon)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Proactive Suggestions</Label>
                    <p className="text-sm text-muted-foreground">Helix can offer insights without being asked</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Voice Input</Label>
                    <p className="text-sm text-muted-foreground">Enable voice commands and transcription</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div>
                  <Label>Response Style</Label>
                  <Select defaultValue="balanced">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Email Draft Tone</Label>
                  <Select defaultValue="professional">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card/60">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Automation Rules</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Generate Drafts</Label>
                    <p className="text-sm text-muted-foreground">Create email drafts for all targets automatically</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Signal Analysis</Label>
                    <p className="text-sm text-muted-foreground">Analyze new signals and prioritize automatically</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="p-6 bg-card/60">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Security Settings</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <Label>Change Password</Label>
                  <div className="space-y-3 mt-1.5">
                    <Input type="password" placeholder="Current password" />
                    <Input type="password" placeholder="New password" />
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                  <Button className="mt-3">Update Password</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" className="bg-transparent">
                    Enable
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card/60">
              <div className="flex items-center gap-3 mb-4">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Billing & Subscription</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Professional Plan</p>
                    <p className="text-sm text-muted-foreground">$99/month • Renews Jan 15, 2026</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" className="bg-transparent">
                    Manage Subscription
                  </Button>
                  <Button variant="outline" className="bg-transparent">
                    View Invoices
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          {(userRole === "admin" || isAdmin) && (
            <TabsContent value="team" className="space-y-6">
              <TeamInvites />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

export default SettingsView
