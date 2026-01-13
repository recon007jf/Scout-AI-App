# UI Navigation Specification - PERMANENT CONTRACT

**CRITICAL: READ THIS ENTIRE FILE BEFORE TOUCHING ANY NAVIGATION CODE**

This document defines the EXACT structure, styling, and behavior of the Scout application navigation sidebar. This is the CONTRACT that must NEVER be violated.

---

## Navigation Icons - EXACT SPECIFICATIONS

### Icon Files and Paths

**ALL icons use custom image files from `/public/icons/` directory:**

1. **Morning Briefing**: `/icons/morning-briefing.png` (coffee cup)
2. **Signals**: `/icons/signals.png` (envelope/letter icon)
3. **Network**: `/icons/ledger.png` (spreadsheet/ledger icon)
4. **Territory**: `/icons/map-view.png` (map with location pin)
5. **Calendar**: `/icons/calendar.png` (calendar icon with dynamic date overlay)
6. **Performance**: `/icons/performance.png` (bar chart with upward arrow)
7. **Notes**: `/icons/notes-icon.svg` (document/paper with horizontal lines)
8. **Settings**: `/icons/settings.png` (gear icon)

**Menu hamburger uses Lucide component: `<Menu />` from `lucide-react`**

---

## Size Specifications

### Button Container
- Size: `w-18 h-18` (72px × 72px)
- Border radius: `rounded-xl`
- Padding: Default from size
- Transition: `transition-colors`

### Icon Images
- Size: `w-10 h-10` (40px × 40px)
- Always centered within button container

### Calendar Date Overlay
- Font size: `text-base` (16px)
- Font weight: `font-bold`
- Color: `text-foreground`
- Position: Absolutely centered over calendar icon using `inset-0 flex items-center justify-center`
- Parent container MUST have `relative` positioning
- Date is dynamically generated from `currentDay` state (current day of month)

---

## Active State Styling

### Background Colors (when active)
Active items get STRONG, PROMINENT backgrounds:

- **Morning Briefing**: `bg-amber-900/50` (brownish/tan background)
- **Signals**: `bg-green-900/50`
- **Network**: `bg-blue-900/50`
- **Territory**: `bg-purple-900/50`
- **Calendar**: `bg-pink-900/50`
- **Performance**: `bg-cyan-900/50`
- **Notes**: `bg-orange-900/50`

**Settings button (bottom of sidebar):**
- Active: `bg-gray-900/50`
- Inactive: `bg-gray-800/50`

### Key Rules:
- Use `-900` color shades (NOT -500)
- Use `/50` opacity (50% - NOT 10% or 20%)
- Backgrounds MUST be visually prominent and obvious
- Border radius matches button: `rounded-xl`

---

## Component Structure (AppShell)

### Navigation Items Array Structure
```tsx
const navigationItems = [
  { 
    id: "morning-briefing", 
    label: "Morning Briefing", 
    icon: "/icons/morning-briefing.png",
    color: "amber",
    view: "morning-briefing" as View
  },
  // ... etc
]
```

### Icon Rendering Logic
```tsx
{typeof item.icon === "string" ? (
  <div className="relative w-10 h-10">
    <Image
      src={item.icon || "/placeholder.svg"}
      alt={item.label}
      width={40}
      height={40}
      className="object-contain"
    />
    {item.id === "calendar" && (
      <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-foreground">
        {currentDay}
      </span>
    )}
  </div>
) : (
  <item.icon className="w-10 h-10" />
)}
```

### Button Structure
```tsx
<button
  onClick={() => handleNavigation(item.view)}
  className={cn(
    "relative w-18 h-18 rounded-xl flex items-center justify-center transition-colors",
    activeView === item.view && colors.bgActive
  )}
>
  {/* Icon rendering here */}
</button>
```

---

## Color Class Function

```tsx
const getColorClasses = (color: string) => {
  const colorMap = {
    amber: { bgActive: "bg-amber-900/50" },
    green: { bgActive: "bg-green-900/50" },
    blue: { bgActive: "bg-blue-900/50" },
    purple: { bgActive: "bg-purple-900/50" },
    pink: { bgActive: "bg-pink-900/50" },
    cyan: { bgActive: "bg-cyan-900/50" },
    orange: { bgActive: "bg-orange-900/50" },
  }
  return colorMap[color] || { bgActive: "bg-gray-900/50" }
}
```

---

## Critical Rules - NEVER VIOLATE

1. **NEVER use Lucide icon components for navigation items** (except Menu)
2. **NEVER change icon file paths** without explicit user approval
3. **NEVER use weak backgrounds** (like /10 or /20 opacity)
4. **NEVER use light color shades** (like -500) for active states
5. **ALWAYS use -900 shades with /50 opacity** for active backgrounds
6. **ALWAYS ensure calendar parent has `relative` positioning**
7. **ALWAYS center calendar date using `inset-0 flex items-center justify-center`**
8. **NEVER change icon sizes** without explicit approval (icons: 40px, buttons: 72px)

---

## Testing Checklist

Before deploying ANY navigation changes, verify:

- [ ] All 8 icons display correctly (no broken images)
- [ ] Icons are 40px × 40px (w-10 h-10)
- [ ] Button containers are 72px × 72px (w-18 h-18)
- [ ] Active states show STRONG, PROMINENT colored backgrounds
- [ ] Calendar date appears INSIDE the calendar icon (not below it)
- [ ] Calendar date is current day number (dynamically generated)
- [ ] Settings icon at bottom has proper active state
- [ ] All navigation clicks work correctly
- [ ] No console errors related to image loading

---

## File Locations

- **Component**: `components/app-shell.tsx`
- **Icon Assets**: `public/icons/`
- **This Specification**: `UI_NAVIGATION_SPECIFICATION.md`

---

## Version History

- **2026-01-13**: Initial specification created after repeated navigation toolbar breakage
- User requirement: "BURN INTO YOUR BRAIN" - this is the permanent reference

---

**READ THIS FILE BEFORE MAKING ANY CHANGES TO:**
- Navigation icons
- App Shell component
- Icon styling or sizing
- Active state backgrounds
- Calendar date overlay
