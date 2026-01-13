# Style Rules - Scout UI

## Color Philosophy

### Dark Mode First

- Default and only theme
- Deep backgrounds, light text
- Subtle borders over shadows
- Muted colors for chrome, vibrant for data

### Semantic Color Usage

**Success:**

- Connection status: emerald/green
- Completion indicators
- Positive metrics

**Warning:**

- Offline status: orange/amber
- Caution states
- Review required

**Error:**

- Failed operations: red
- Validation errors
- Destructive confirmations

**Info:**

- Blue for links, emails
- Neutral information
- Default interactivity

**Accent:**

- Feature-specific colors
- Match icon color to active state background
- Consistency within feature area

## Typography Intent

### Readability Over Density

- Line height: `leading-relaxed` (1.625) for body text
- Never cram text
- Ample whitespace between paragraphs

### Hierarchy Through Weight

- Bold for emphasis, not just size changes
- Semibold for section headers
- Regular for body, muted for supporting

### Monospace for Technical Content

- API responses
- Code snippets
- Email addresses
- IDs and keys

## Density and Spacing

### Comfortable, Not Cramped

- Button padding: `px-4 py-2` minimum
- Card padding: `p-6` standard
- Section gaps: `gap-6` or `gap-8`

### Consistent Spacing Scale

- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)

### Navigation Specific

- Icon buttons: 72px × 72px (generous touch targets)
- Icon size: 40px (clearly visible)
- Vertical gap between items: `gap-2` (8px)

## Interaction Tone

### Hover States

- Subtle background change
- NO color shifts on icons
- Smooth transition: `transition-colors`

### Active/Selected States

- Strong background color (50% opacity)
- Border or highlight accent
- Persist until deselected

### Focus States

- Visible keyboard focus rings
- Blue outline, 2px
- Never remove focus indicators

### Disabled States

- Reduced opacity: `opacity-50`
- Cursor: `cursor-not-allowed`
- Muted text color
- NEVER hide disabled options

## Button Styling

### Primary Actions

- Solid background color
- White text
- Example: "Connect Outlook" (green bg)

### Secondary Actions

- Outline style
- Colored border and text
- Transparent background

### Tertiary Actions

- Ghost style
- No border, just text color
- Subtle hover background

### Destructive Actions

- Red color scheme
- Confirm before executing
- Clear warning language

## Form Styling

### Input Fields

- Dark background: `bg-input`
- Subtle border: `border border-input`
- Focus: Blue ring
- Placeholder: `text-muted-foreground`

### Labels

- Above input, `text-sm font-medium`
- Required indicator if needed
- Help text below in smaller, muted text

### Validation

- Inline error messages
- Red accent for error state
- Show errors on blur or submit

## Card Design

### Structure

- Background: `bg-card`
- Border: `border border-border`
- Rounded: `rounded-lg`
- Padding: `p-6`

### Sections Within Cards

- Dividers: `border-t border-border`
- Headings: Slight margin-bottom
- Consistent internal spacing

## List Patterns

### Candidate Lists

- Alternating row highlights on hover
- Avatar + Name + Title + Company
- Right-aligned metadata (match %, status)
- Selected state: Colored border + background

### Settings Lists

- Icon + Label + Description
- Right-aligned action (button, toggle, badge)
- Dividers between items

## Animation Guidelines

### Transitions

- Default: 200ms ease
- Longer for complex: 300ms
- Keep smooth, avoid janky animations

### What to Animate

- Color changes
- Width/height (sidebar expand)
- Opacity (modals, tooltips)

### What NOT to Animate

- Layout shifts that cause reflow
- Transform on primary content
- Anything that impacts performance

## Accessibility Requirements

### Contrast Ratios

- Text: Minimum 4.5:1
- Large text: Minimum 3:1
- Icons: Ensure visibility against background

### Keyboard Navigation

- All interactive elements focusable
- Logical tab order
- Escape key closes modals
- Enter/Space activates buttons

### Screen Readers

- Alt text for icons
- Aria labels where needed
- Semantic HTML structure
- Skip to content link
