# UI Image Placeholders - Scout-UI

## Profile Images (LinkedIn)

All white circles throughout Scout-UI are **LinkedIn profile image placeholders**.

### Locations:

**Morning Briefing:**
- Target list (left sidebar) - 40x40px circular avatars
- Target detail panel (main view) - 64x64px circular avatars

**Signals View:**
- Signal cards (left panel) - 24x24px circular avatars
- Signal detail panel (right panel) - 56x56px circular avatars

### Backend Integration:

These placeholders will be replaced with actual LinkedIn profile images when the backend provides:
- Field: `profileImage` or `avatarUrl`
- Source: Google search via Serper API (not direct LinkedIn API)
- Process: Backend searches Google for LinkedIn profiles, extracts profile image URLs
- Format: HTTPS URL to profile photo
- Fallback: Initials displayed in colored circle

### Current Behavior:

When no `profileImage` URL is provided:
- Shows initials derived from contact name
- Background color generated from name hash
- Maintains consistent sizing across views

### Example Data:

```typescript
{
  contactName: "Sarah Mitchell",
  profileImage: "https://media.licdn.com/dms/image/..." // Extracted via Serper/Google
}
```

### Notes:

- All avatars use the shadcn/ui Avatar component
- Alt text includes "LinkedIn profile" for accessibility
- Placeholder SVG shown until real image loads
- Fallback initials always displayed if image fails
- Backend enriches broker data by searching Google (Serper) for LinkedIn profiles
