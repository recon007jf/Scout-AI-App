// ... existing code ...

## Authentication

// <CHANGE> Updated auth section to reflect Antigravity ownership
### Authentication Flow

**Handled by:** Antigravity backend

**UI Responsibility:**
- Display login form
- Store auth token/session (localStorage or httpOnly cookie)
- Include token in API request headers
- Redirect to login on 401 responses

**Backend Responsibility (Antigravity):**
- User authentication (email/password, OAuth, etc.)
- Session management
- Token generation and validation
- Role/permission enforcement

**Function:** `login(email: string, password: string)`

**Returns:** `Promise<{ token: string; user: User }>`

**Function:** `logout()`

**Returns:** `Promise<void>`

**Function:** `getCurrentUser()`

**Returns:** `Promise<User | null>`

\`\`\`typescript
interface User {
  userId: string
  email: string
  fullName: string
  role: 'broker' | 'admin'
}
\`\`\`

// ... existing code ...

## Environment Variables

\`\`\`bash
// <CHANGE> Removed Supabase env vars, simplified to just Antigravity API
# Required - Antigravity API
NEXT_PUBLIC_API_BASE_URL=https://api.scout.yourdomain.com

# Feature flags
NEXT_PUBLIC_USE_MOCKS=false
NEXT_PUBLIC_ENABLE_BAT_PHONE=false

# Development
NEXT_PUBLIC_DEV_MODE=true
\`\`\`

// ... existing code ...

## Questions for Backend Team (Antigravity)

1. **API Base URL:** What's the production endpoint for Antigravity?
2. **Auth Strategy:** JWT tokens? Session cookies? Where to store?
3. **Auth Headers:** `Authorization: Bearer {token}` format?
4. **Rate Limits:** Any throttling we should handle in the UI?
5. **WebSocket Support:** For real-time Bat Phone alerts?
6. **Error Tracking:** Should UI report errors to a service?
7. **Outlook Integration:** Does Antigravity handle Outlook API directly?

// ... existing code ...
\`\`\`

\`\`\`env file="" isHidden
