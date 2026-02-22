# SkillSwap — UI Improvements Reference

Date implemented: Feb 21, 2026

---

## 1. Animated Background Orbs
**File:** `src/index.css`

Three large, blurred, floating orbs are fixed behind all content. They slowly drift around using CSS keyframe animations (`orb-float-1`, `orb-float-2`, `orb-float-3`). Their color is driven by `var(--accent)` so they automatically adapt to every theme.

- Classes: `.bg-orb`, `.bg-orb-1`, `.bg-orb-2`, `.bg-orb-3`
- Opacity is kept low (`0.18`) so they are subtle, not distracting.
- Applied in `App.jsx` — three `<div>` elements just inside the root wrapper.

---

## 2. Hero / Landing Section
**File:** `src/App.jsx`

A full-width hero section appears above the search bar on the Browse view. It includes:

- A floating animated badge ("Student Skill Exchange Platform") with a subtle up/down float animation (`.hero-badge` class).
- A bold two-line headline: **"Exchange Skills, Grow Together"** with a gradient on "Grow Together".
- A subtitle paragraph.
- Two stat pills showing live skill count and "Free to join".
- A "Get started" gradient pill button shown only to logged-out users.

All elements stagger in with Framer Motion on page load.

---

## 3. Gradient Text Utility
**File:** `src/index.css`

New utility class `.gradient-text` applies a linear gradient from `var(--accent)` to `var(--glow)` as a text fill. Used on the hero headline. Works across all themes automatically.

---

## 4. Gradient "Request Trade" Button
**File:** `src/index.css` + `src/components/SkillCard.jsx`

New utility class `.btn-gradient` replaces the flat `bg-accent-theme` button on every skill card. It uses a `linear-gradient` from the accent color to a purple-shifted mix, with a glow `box-shadow` on hover.

- Looks more premium than a flat button.
- Glow color is `var(--glow)` so it adapts to the active theme.

---

## 5. Category Icons on Skill Card Badges
**File:** `src/components/SkillCard.jsx`

Each category badge now shows a matching Lucide icon next to the text:

| Category    | Icon       |
|-------------|------------|
| Tech        | `<Code />`     |
| Arts        | `<Palette />`  |
| Academic    | `<BookOpen />` |
| Life Skills | `<Heart />`    |
| Other       | `<Layers />`   |

Implemented via a `CATEGORY_CONFIG` lookup object at the top of `SkillCard.jsx`.

---

## 6. User Avatar on Skill Cards
**File:** `src/components/SkillCard.jsx`

The poster's Google profile photo (`skill.userData?.picture`) is now shown as a small circle (24×24px) next to their name on every skill card. If no photo is available, a fallback circle shows the user's initial letter in the accent color. Includes a subtle `ring` border using `ring-accent-theme/30`.

---

## 7. Description Clamped to 3 Lines
**File:** `src/components/SkillCard.jsx`

The skill description now has `line-clamp-3` applied. This limits descriptions to a maximum of 3 lines on every card, making the bento grid visually uniform and preventing tall cards from breaking the layout.

---

## 8. Offering / Seeking Left-Border Accent
**File:** `src/index.css` + `src/components/SkillCard.jsx`

Each skill card has a colored left border based on its type:

- **Offering** → green left border (`.card-offering`: `border-left: 3px solid rgba(34,197,94,0.6)`)
- **Seeking** → yellow/amber left border (`.card-seeking`: `border-left: 3px solid rgba(234,179,8,0.6)`)

This lets users instantly scan the grid by type without reading any text.

---

## 9. ThemeSelector — Colored Dots with AnimatePresence
**File:** `src/components/ThemeSelector.jsx`

The theme dropdown was redesigned:

- Each theme option now shows a **colored circle dot** that visually represents the theme's accent color, instead of plain text.
- The active theme shows a checkmark (`<Check />`) on the right.
- A section label "THEME" appears at the top of the dropdown.
- The dropdown now uses `AnimatePresence` for a proper enter/exit scale+fade animation (previously it had no exit animation).
- Dot colors:

| Theme     | Dot Color |
|-----------|-----------|
| Light     | `#3b82f6` |
| Dark      | `#60a5fa` |
| Midnight  | `#64748b` |
| Cyberpunk | `#ff00ff` |
| Emerald   | `#10b981` |

---

## Files Changed

| File | What Changed |
|------|-------------|
| `src/index.css` | Added: orb animations, `.gradient-text`, `.btn-gradient`, `.hero-badge`, `.card-offering`, `.card-seeking` |
| `src/App.jsx` | Added: background orb divs, hero section, `z-10` on main, `z-40` on header |
| `src/components/SkillCard.jsx` | Rewritten: category icons, user avatar, line-clamp, gradient button, border accent |
| `src/components/ThemeSelector.jsx` | Rewritten: colored dots, AnimatePresence exit animation, checkmark on active theme |
