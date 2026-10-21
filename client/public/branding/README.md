# BookNest Brand Assets

All brand assets for BookNest — a student project reading tracker app.

## Assets

| File | Description | Usage |
|------|-------------|-------|
| `colors.json` | Complete color palette with semantic tokens | Import in CSS/JS for consistent theming |
| `logo.svg` | Full horizontal logo with wordmark | Website header, marketing pages |
| `logo-icon.svg` | Icon-only logo (nest with eggs) | Favicon, app icon, social avatars |
| `favicon.svg` | 32×32 SVG favicon | `<link rel="icon" href="/branding/favicon.svg">` |
| `hero-banner.svg` | 1200×600 landing page hero | Homepage hero section |
| `og-image.svg` | 1200×630 Open Graph image | Social sharing (Twitter, LinkedIn, Discord, etc.) |

## Color Palette

### Primary (Forest Green)
- **500**: `#4a7c4a` — Main brand color
- **600**: `#3d663d` — Hover states, emphasis
- **700**: `#335233` — Dark text on light backgrounds

### Accent (Warm Orange)
- **500**: `#ff9214` — CTAs, highlights, eggs in nest
- **600**: `#e8740d` — Hover states

### Neutrals
- **Background**: `#fafafa` (neutral-50)
- **Surface**: `#ffffff` (white)
- **Text Primary**: `#171717` (neutral-900)
- **Text Secondary**: `#525252` (neutral-600)
- **Text Muted**: `#a3a3a3` (neutral-400)
- **Border**: `#e5e5e5` (neutral-200)

## Typography

- **Font Family**: System UI stack (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
- **Logo Wordmark**: 700 weight, -0.5px letter-spacing
- **Headings**: 700-800 weight, tight letter-spacing
- **Body**: 400 weight, normal letter-spacing
- **UI Labels**: 500-600 weight, uppercase + tracking for small caps effect

## Logo Usage

- **Clear space**: Minimum 24px padding around logo
- **Minimum width**: 160px (full logo), 32px (icon only)
- **Backgrounds**: Works on light (neutral-50/100) and dark (primary-900/950) backgrounds
- **Don't**: Stretch, recolor, add effects, or separate icon from wordmark in horizontal layout

## Icon Symbolism

The nest with three eggs represents:
- **Nest** = Your reading sanctuary / home for books
- **Three eggs** = Past, present, future reads (or: Want to Read, Reading, Read)
- **Warm orange eggs** = Growth, warmth, stories waiting to hatch

## Implementation Notes

All SVGs are:
- Self-contained (no external dependencies)
- Scalable without quality loss
- Use CSS-compatible color values (can be overridden via CSS `filter` or `fill` if needed)
- Optimized for web use (minimal paths, no embedded rasters)

For production, consider generating PNG fallbacks from SVGs for older browser support.