# Scout UI - Design Handoff Package

This package contains the complete visual and UX specification for the Scout AI application. It serves as the permanent reference for all UI implementation.

## Package Contents

1. **01_VISUAL_INVENTORY.md** - All visual assets, icons, colors, typography
2. **02_LAYOUT_MAP.md** - Complete layout structure and component hierarchy
3. **03_UI_CONTRACT.md** - Rules that must NEVER be violated
4. **04_STYLE_RULES.md** - Design philosophy and styling guidelines

## Critical: Navigation Toolbar Specifications

The most frequently broken component is the navigation toolbar. **Before making ANY changes to navigation, READ 03_UI_CONTRACT.md section "Navigation Toolbar - SACRED SPECIFICATIONS".**

### Quick Reference - Navigation Icons

| Feature | Icon File | Size | Active BG |
|---------|-----------|------|-----------|
| Morning Briefing | morning-briefing.png | 40×40px | amber-900/50 |
| Signals | signals.png | 40×40px | blue-900/50 |
| Network | ledger.png | 40×40px | emerald-900/50 |
| Territory | map-view.png | 40×40px | purple-900/50 |
| Calendar | calendar.png + overlay | 40×40px | cyan-900/50 |
| Performance | performance.png | 40×40px | pink-900/50 |
| Notes | notes-icon.svg | 40×40px | indigo-900/50 |
| Settings | settings.png | 40×40px | gray-900/50 |

**Button containers:** 72×72px (`w-18 h-18`)
**Always use:** -900 shades with /50 opacity for active states

## Implementation Authority

**AG (Andrew Golightly) is the sole implementation authority.** This package provides design intent and specifications. All code changes, integrations, and technical decisions are AG's domain.

## When to Reference This Package

- Before changing navigation icons or styling
- Before modifying app shell layout
- Before adjusting color schemes or typography
- Before implementing new features that affect global UI
- When debugging "broken UI" issues
- When onboarding new developers

## Maintenance

This package should be updated when:

- New features are added to navigation
- Design system evolves
- New components become standardized
- Critical bugs reveal spec gaps

**Last Updated:** January 13, 2026
**Version:** 1.0
**Author:** v0 (Vercel AI)
