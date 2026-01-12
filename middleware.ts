import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { proxy } from "./proxy"

const isClerkProtectedRoute = createRouteMatcher(["/clerk-test(.*)", "/dashboard-test(.*)"])

export default clerkMiddleware(async (auth, req) => {
  // If it's a Clerk-protected route, enforce auth
  if (isClerkProtectedRoute(req)) {
    await auth.protect()
    return
  }

  // For all other routes, use existing Supabase auth
  return proxy(req)
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
