# Layout Map - Scout UI

## App Shell Structure

### Persistent Elements (Always Visible)

**Left Sidebar Navigation:**

- Width: Auto (fits content)
- Background: Dark (`bg-background`)
- Border: Right border separator
- Structure:
  - Logo section (top)
  - Navigation items (middle, scrollable)
  - Settings button (bottom, fixed)

**Top Header:**

- Height: ~64px
- Background: Dark with subtle border
- Contents:
  - Search bar (center, expandable)
  - User profile menu (right)
  - Keyboard shortcut hint: `⌘ K`

### Main Content Area

**Layout Pattern:**

- Flexbox-based, full viewport height
- `flex-1` to fill available space
- Scrollable content within viewport

**Common Patterns:**

1. **Three-Column Layout** (Morning Briefing)
   - Left: Candidate list (320px fixed)
   - Center: Draft review (flex-1)
   - Right: AI Agent Panel (auto width, 384px when expanded)

2. **Two-Column Layout** (Settings)
   - Left: Tab navigation (fixed width)
   - Right: Content area (flex-1)

3. **Single Column Layout** (Territory, Calendar)
   - Full width content
   - Internal grid/flex as needed

## Navigation Item Structure

**Complete HTML Hierarchy:**

```
<button className="relative w-18 h-18 rounded-xl flex items-center justify-center transition-colors">
  {/* For image-based icons */}
  <Image 
    src="/icons/{icon-name}.png" 
    alt="{Feature Name}"
    width={40}
    height={40}
    className="w-10 h-10"
  />
  
  {/* Special case: Calendar date overlay */}
  {item.id === 'calendar' && (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-base font-bold text-foreground">
        {currentDay}
      </span>
    </div>
  )}
</button>
```

**Active State Classes:**

```
className={`
  relative w-18 h-18 rounded-xl 
  flex items-center justify-center 
  transition-colors
  ${isActive ? 'bg-amber-900/50' : 'hover:bg-muted'}
`}
```

## Conditional UI Elements

### AI Agent Panel (Right Sidebar)

- Collapsed: 48px width (`w-12`)
- Expanded: 384px width (`w-96`)
- Transition: Smooth width animation
- Toggle: Click collapsed bar to expand
- Contents when expanded:
  - Chat interface with Helix AI
  - Context-aware suggestions
  - Message history

### Connection Status Banners

- Location: Below page header
- Style: Orange background, prominent text
- Example: "Status: Outreach Offline - Connect Outlook in Settings"
- Dismissible: X button on right

### Modal Overlays

- Dark backdrop with blur: `backdrop-blur-sm bg-black/50`
- Modal content: Centered, `bg-card`, rounded corners
- Close: X button top-right, ESC key, click outside

## Responsive Behavior

**Desktop (Primary Target):**

- Sidebar always visible
- Multi-column layouts active
- Hover states enabled

**Tablet:**

- Sidebar collapsible
- Two-column max
- Touch-friendly targets

**Mobile:**

- Sidebar as drawer/overlay
- Single column stacked
- Bottom navigation alternative
