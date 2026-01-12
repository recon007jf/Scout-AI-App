import { SignUp } from "@clerk/nextjs"

export const dynamic = "force-dynamic"

export default function ClerkSignUpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Scout (Clerk Test)</h1>
          <p className="text-sm text-muted-foreground">Create Your Account</p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-card shadow-lg",
            },
          }}
          signInUrl="/clerk-login"
          forceRedirectUrl="/dashboard-test"
        />
      </div>
    </div>
  )
}
