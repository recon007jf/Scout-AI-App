import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function resetAdminPassword() {
  const email = "admin@pacificaisystems.com"
  const newPassword = "AdminTest123!"

  console.log(`[v0] Resetting password for ${email}...`)

  // Get user by email
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

  if (listError) {
    console.error("[v0] Error listing users:", listError)
    return
  }

  const user = users.users.find((u) => u.email === email)

  if (!user) {
    console.error(`[v0] User not found: ${email}`)
    return
  }

  console.log(`[v0] Found user ID: ${user.id}`)

  // Update password
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword })

  if (error) {
    console.error("[v0] Error updating password:", error)
    return
  }

  console.log("[v0] ✅ Password successfully updated!")
  console.log(`[v0] You can now log in with:`)
  console.log(`[v0] Email: ${email}`)
  console.log(`[v0] Password: ${newPassword}`)
}

resetAdminPassword()
