# Visual Inventory - Scout UI

## Brand Identity

### Logos

- **Primary Logo**: "Scout" wordmark in white
- **Tagline**: "by Pacific AI Systems" in muted gray
- **Location**: Top-left of app shell, always visible

### Color Philosophy

**Background System:**

- Primary background: `bg-background` (near-black)
- Secondary panels: `bg-card` (dark gray)
- Elevated surfaces: Slight border, no shadow

**Accent Colors:**

- **Amber/Brown**: Morning Briefing (warm, inviting)
- **Blue**: Signals, primary actions
- **Emerald**: Success states, connected status
- **Red**: Errors, destructive actions
- **Gray**: Neutral, inactive states

**Active State Treatment:**

- Strong backgrounds: `bg-{color}-900/50` (50% opacity, 900 shade)
- NOT weak `/20` opacity
- NOT 500 shades

### Navigation Icons

**Custom Image-Based Icons:**
All located in `/public/icons/`

1. **morning-briefing.png** - Coffee cup icon
2. **signals.png** - Envelope/letter with signal lines
3. **ledger.png** - Spreadsheet/database grid
4. **map-view.png** - Map with location pin
5. **calendar.png** - Calendar base (date overlaid dynamically)
6. **performance.png** - Bar chart with upward arrow
7. **notes-icon.svg** - Document/paper with horizontal lines
8. **settings.png** - Gear icon

**Icon Specifications:**

- Icon size: 40px × 40px (`w-10 h-10`)
- Button container: 72px × 72px (`w-18 h-18`)
- Corner radius: `rounded-xl`
- Active state: Strong colored background matching feature theme

### Typography

**Font Stack:**

- Sans-serif: Geist (primary)
- Monospace: Geist Mono (code, technical)

**Hierarchy:**

- Page titles: `text-2xl font-bold`
- Section headers: `text-lg font-semibold`
- Body text: `text-sm leading-relaxed`
- Captions: `text-xs text-muted-foreground`

**Calendar Date Overlay:**

- Size: `text-base font-bold` (16px)
- Color: `text-foreground`
- Position: Centered over calendar icon using `inset-0 flex items-center justify-center`
- Parent must have `relative` positioning

## Component Imagery

### Avatar System

- Circular avatars with 2-letter initials
- Vibrant backgrounds: blue, amber, emerald, purple
- White text, centered
- Sizes: `w-8 h-8` (small), `w-12 h-12` (medium), `w-16 h-16` (large)

### Icons in Context

- Email icon: blue accent
- LinkedIn icon: blue accent
- Match percentage: green with upward arrow trend
- Notes: blue document icon with count badge

### Empty States

- Centered layout
- Muted icon (large)
- Descriptive text
- Clear call-to-action button
