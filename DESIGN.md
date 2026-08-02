# Design

## Design System Overview

The site uses a clean academic layout with a restrained geospatial signature. It is a static bilingual profile page with English-first navigation and a complete Chinese content layer toggled in place.

## Color Tokens

Colors are implemented with OKLCH values in `styles.css`.

- `--bg`: nearly white neutral background.
- `--surface`: white content surface.
- `--ink`: primary academic text.
- `--muted`: secondary metadata text.
- `--line`: subtle dividers and borders.
- `--geo-blue`: geospatial blue accent.
- `--canopy`: muted vegetation green accent.
- `--field`: soft research highlight tint.
- `--road`: dark blue-green for links and focus states.

The palette should remain mostly neutral. Blue and green accents are used for research tags, focus states, and subtle linework, not as a full-page theme.

## Typography

- Display text, body copy, metadata, tags, and editor controls use `Times New Roman`, Times, and serif CJK fallbacks.
- The base font size is 15px, with modest `rem` scaling for headings and compact utility text.

Headings should be calm and balanced. Letter spacing stays at zero or positive for small utility labels.

## Layout

- Sticky top navigation.
- First viewport includes name, identity, research positioning, actions, profile photo, and compact research metrics.
- Main content is divided into full-width sections with a constrained inner container.
- Publications use a list style rather than heavy cards.
- Project summaries use modest cards because they are repeated items.
- Mobile layout stacks content vertically and keeps the language toggle visible.

## Components

- Header navigation with anchor links and language buttons.
- Hero intro with bilingual content blocks.
- Profile photo block using the supplied personal photo.
- Research focus list with three domain-specific directions.
- Education timeline.
- Publications list with tags and DOI links where available.
- Projects list with funding/project context from the CV.
- News list.
- Contact footer.

## Motion

Motion is subtle: page-load reveal and hover transitions only. Reduced-motion users receive instant rendering without transform-based movement.

## Content Editing

The first version embeds content in `index.html` to make manual editing easy. When the publication list grows or the site needs multiple pages, content can move into structured JSON or Markdown later.
