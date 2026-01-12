import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Scout</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-card shadow-lg",
            },
          }}
        />
      </div>
    </div>
  )
}
