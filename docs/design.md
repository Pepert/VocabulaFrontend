# Design charter

Vocabula's visual language, inspired by the friendly learning-app style
(Duolingo et al.): bold rounded shapes, chunky "3D" buttons, generous
whitespace, and one confident accent color.

The **source of truth is [`src/theme.ts`](../src/theme.ts)** - this
document explains the choices; the code holds the values. Screens and
components consume tokens from the theme and never hard-code colors,
sizes or fonts.

## Principles

1. **Friendly, not childish.** Rounded corners and chunky buttons, but
   restrained: two structural colors (green, blue) plus accents.
2. **Reading first.** The chapter page is the product; its text size and
   line height are tuned for reading a learned language, not for density.
3. **Interactive surfaces push in.** Buttons and list rows physically
   depress when pressed (the bottom edge collapses) - feedback everywhere.
4. **Disabled means locked.** Unavailable actions render in the grey
   locked style instead of disappearing.

## Palette

| Token | Hex | Usage |
|---|---|---|
| `green` / `greenEdge` | `#58CC02` / `#43A302` | Primary actions (the "go, learning" color); edge is the button's 3D bottom |
| `blue` / `blueEdge` | `#1CB0F6` / `#1899D6` | Secondary emphasis, links, chevrons, the Chapters action |
| `yellow` | `#FFC800` | Celebration accents (chapter pill) |
| `red` / `redEdge` | `#FF4B4B` / `#E33D3D` | Errors only |
| `text` | `#3C3C3C` | Primary text |
| `textMuted` | `#8F8F8F` | Secondary text |
| `border` | `#E5E5E5` | Card and divider borders |
| `surfaceTint` | `#EFF7E6` | Screen background - soft green tint, white cards float on it |
| `surfaceAlt` | `#F7F7F7` | Grey alternative for subtle separates |
| `lockedBg/Edge/Text` | `#E5E5E5` / `#D6D6D6` / `#AFAFAF` | Disabled buttons |

## Typography

Font: **Nunito** (Google Fonts, via `@expo-google-fonts/nunito`), loaded in
the root layout before any screen renders.

| Style | Weight | Size | Notes |
|---|---|---|---|
| Title (h1) | 900 | 32 | Screen and story titles |
| Heading (h2) | 900 | 22 | Cards, rows |
| Body | 400 | 16 | Regular text |
| Body muted | 400 | 15 | Explanations, metadata |
| Button | 800 | 15 | UPPERCASE, +0.5 letter spacing |
| Reading | 400 | 18, line-height 30 | Chapter content - reading is the feature |

## Shapes and spacing

- Radii: buttons `12`, cards `16`, pills fully rounded.
- Spacing scale: 4 / 8 / 16 / 24 / 32 / 48 (`spacing.*`).
- Buttons: 14 vertical padding, 4-wide bottom border in the edge color;
  while pressed the border collapses (the "push in").
- Cards: white surface, 2-wide `border` outline, on `surfaceAlt`
  backgrounds.

## Components

- `PrimaryButton` (`src/components/PrimaryButton.tsx`) - variants:
  `green` (primary), `blue` (secondary emphasis), `ghost` (outlined,
  for navigation/back), `locked` (disabled), `danger`.
- `Card` - the content surface, also from the same file.
- Settings (`src/app/settings.tsx`) - expandable section header
  ("General", open by default) with white option cards; the language
  options use a green radio dot for the active one. The sign-in page
  uses compact pill buttons for its EN/FR language selector.
- New-word spans (`src/lib/chapterSegments.ts` + the reading page) -
  words worth noticing render in colour, no underline (modern flat look),
  and tapping one opens a small definition sheet (word + meaning).
  Blue = vocabulary the story itself introduced; green = notebook
  vocabulary appearing in the story for the first time. Only the first
  occurrence of each word is coloured.
  `splitChapterByNewWords` is the pure helper that splits chapter text
  into renderable segments and carries the selected entry to the sheet.

## Not yet decided (future)

- Dark mode (tokens would need a second palette).
- A mascot or illustrated empty states (needs artwork).
- App icon and splash artwork (the current badge is a placeholder).
