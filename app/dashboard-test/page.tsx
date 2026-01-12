import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DashboardTestPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/clerk-login")
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Clerk Auth Test - SUCCESS</h1>
          <Link href="/clerk-login">
            <Button variant="outline">Back to Login</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authenticated User Info</CardTitle>
            <CardDescription>Data from Clerk session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="text-sm font-mono">{user.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{user.emailAddresses[0]?.emailAddress || "No email"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">First Name</p>
                <p className="text-sm">{user.firstName || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Name</p>
                <p className="text-sm">{user.lastName || "Not set"}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-green-600 font-medium">✓ Clerk authentication is working correctly</p>
              <p className="text-xs text-muted-foreground mt-2">This page is protected by Clerk middleware</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
