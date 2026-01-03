# AGENTS_UI.md — Maya Mobile UI System (vNext)

This doc is a **high-context guide for coding agents** working on `mobileApp/` to keep the UI consistent, premium, and scalable **without reading the whole codebase**.

Scope: **React Native mobile UI** (iOS-first).

Related:

- Repo overview + backend contracts: `AGENTS.md`
- UX flows and product rules: `AGENTS_UX.md`

---

## 1) UI North Star (how it should feel)

Maya’s vNext UI is designed to feel:

- **Minimal + premium**: no “toy” visuals, no busy layouts.
- **Rounded + soft**: consistent radii + gentle shadows.
- **Futuristic but calm**: subtle glow accents, no neon overload.
- **Confident**: the app looks intentional even when data is empty (empty states, skeleton-like spacing).

Non-goals:

- “Material-y” heavy surfaces or noisy borders.
- Hard-coded colors scattered across screens.
- Inconsistent spacing/radius that makes the app look stitched together.

---

## 2) Design system: where it lives

**Theme tokens**

- `mobileApp/src/theme/theme.js`
- `ThemeProvider` wraps the app in `mobileApp/App.js`
- Theme is selected by `useColorScheme()` (OS Dark/Light), but the system is **dark-first** (premium scanning context).

**UI primitives**

- `mobileApp/src/components/ui/`
  - `Screen.js` — safe area + background + status bar
  - `Card.js` — rounded elevated surface
  - `Button.js` — primary/secondary/ghost
  - `TextField.js` — rounded input with label + themed placeholder
  - `SegmentedControl.js` — Recents/Browse toggle styling
  - `IconButton.js` — small square icon button used in headers
  - `EmptyState.js` — empty state visuals + copy

Rule: **New screens should be built from these primitives first**. If you need a new pattern, add a new primitive; don’t reinvent styling inside each screen.

---

## 3) Color system (artistic direction + implementation)

### 3.1 Palette direction: “Midnight + Cyan”

Why:

- Document scanning apps look premium with a dark base (camera context).
- Cyan feels “tech/clean” without being aggressive.
- Violet is used as a secondary accent for “future” without turning neon.

### 3.2 Tokens (semantic colors)

Theme uses semantic roles (not raw hex in screens):

- `bg`: app background
- `surface`: primary elevated surfaces (cards/tab bar)
- `surface2`: secondary surfaces (inputs/secondary chips)
- `border`: subtle 1px outline
- `text`: primary text
- `textSecondary`: de-emphasized text
- `muted`: low-contrast hints
- `accent`: primary action (cyan)
- `accent2`: secondary highlight (violet)
- `success`, `error`, `warning`
- `shadow`

Implementation rule:

- **Never hard-code colors in screens** unless it’s an exceptional case (e.g., overlay alpha).
- Use `const theme = useTheme();` and reference `theme.colors.*`.

### 3.3 Contrast rules

Keep text legible:

- Title text should always be `theme.colors.text`.
- Secondary helper text should be `theme.colors.textSecondary`.
- Placeholder and muted copy should be `theme.colors.muted`.
- Avoid using `accent` for body text (accent is for actions/markers, not paragraphs).

---

## 4) Roundness, borders, and elevation (the “premium” look)

### 4.1 Radius system (single source of truth)

Radii in theme (`theme.radius`):

- `sm`: 12 (small controls)
- `md`: 16 (buttons/inputs)
- `lg`: 24 (cards/sheets)
- `pill`: 999 (chips/pills)

Rule: A screen should use **at most 2 radii** for cohesion (e.g., 24 for cards/sheets and 16 for inputs/buttons).

### 4.2 Borders

- Borders are usually `1px` using `theme.colors.border`.
- Borders are part of the premium system: they provide structure without harsh separators.

### 4.3 Shadows

Shadows are used sparingly:

- Cards + floating tab bar use shadow to “lift” surfaces.
- The **Scan** center tab uses a stronger shadow to feel primary.

Rule: Prefer subtle, wide shadows over strong, tight shadows (toy look comes from tight heavy shadows).

---

## 5) Typography (clarity + hierarchy)

Typography tokens live in `theme.typography`:

- `title` — hero titles (Welcome/Splash)
- `h2`, `h3` — headers
- `body` — normal copy
- `sub` — helper
- `caption` — small labels / chips

Implementation guidelines:

- Titles should be short (1–2 words) and large.
- Use **weight** to create hierarchy instead of adding more colors.
- Avoid all caps except for small label tokens (we keep label style inside `TextField`).

---

## 6) Layout + spacing (how to avoid “toy” layouts)

Spacing scale (`theme.spacing`):

- `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 24`, `xxl 32`

Rules:

- Default screen padding: **20** (we often use 20 to match iOS feel; it maps close to `xl`).
- Keep “breathing room”: big whitespace around primary controls.
- Use consistent vertical rhythm: headers, then content block(s), then actions.

Tap targets:

- Minimum **44x44** for any touchable.

---

## 7) Iconography (consistent and modern)

Libraries:

- Icons: `react-native-vector-icons/Ionicons` (consistent, modern, iOS-friendly).

Icon usage:

- Navigation icons: 20px.
- Accent icons in empty states: ~22px.
- Keep icon names consistent and descriptive (`scan-outline`, `folder-outline`, `person-outline`).

Rule: Don’t mix icon sets unless there is a strong reason. Ionicons is the default.

---

## 8) Navigation chrome (tabs + headers)

We redesigned the app shell as:

- Floating rounded bottom tabs with a central raised Scan action.

Implementation:

- Tabs: `mobileApp/src/navigation/MainTabs.js` uses `@react-navigation/bottom-tabs`.
- The tab bar is positioned above the safe area using `useSafeAreaInsets()` so it looks correct on notched devices.

Visual rules for tabs:

- Tab bar itself is a `surface` card.
- Central Scan button is `accent` and visually dominant.

---

## 9) Screen patterns (what to repeat everywhere)

### 9.1 Screen wrapper

Use `Screen` for:

- correct background color
- safe area
- status bar styling

### 9.2 Header pattern

Most screens follow:

- Big title (28-ish, bold)
- Short subtitle (13-ish, semi-bold)
- Optional right-side icon button (e.g. Scan shortcut)

### 9.3 Empty states

Empty states must look intentional:

- icon + short title + short subtitle
- center-aligned and padded
- never raw “No data” text

Use `EmptyState`.

---

## 10) “Don’t break the brand” checklist

Before you merge a UI change:

- [ ] No new hard-coded hex colors inside screens
- [ ] Radii match the system (12/16/24)
- [ ] Touch targets are ≥ 44px
- [ ] Spacing feels deliberate (no cramped stacks)
- [ ] Primary actions are obvious (one clear CTA)
- [ ] Empty states look premium, not placeholder text
- [ ] Uses primitives (`Screen`, `Card`, `Button`, `TextField`) where possible

---

## 11) Scaling guidelines (how to keep UI coherent as the app grows)

### 11.1 Use tokens, not constants

When adding new UI:

- Prefer semantic tokens (`theme.colors.surface2`) over raw values.
- Add new semantic tokens if needed rather than adding more raw hex.

### 11.2 Add primitives when a pattern repeats

If you copy/paste styling twice:

- Create a component in `mobileApp/src/components/ui/`.

### 11.3 Avoid “screen local design systems”

Don’t create a full `StyleSheet` with its own color/radius rules. Keep the majority of visuals driven from theme + primitives.

### 11.4 Keep inline styles minimal

The repo currently has ESLint warnings for inline styles. It’s not blocking, but the long-term direction:

- Move repeated inline styles into `StyleSheet`.
- Keep one-off values as inline only if they are truly one-off.

### 11.5 Accessibility and platform polish (iOS-first)

Do:

- Strong contrast on text in dark mode.
- Avoid tiny text (<12).
- Use safe areas and spacing generously.

Future (recommended):

- Support Dynamic Type / font scaling rules.
- Add accessibility labels to primary actions (Scan, Confirm).

---

## 12) Known legacy UI (do not extend)

Legacy screens/components still in repo but not part of vNext shell:

- `mobileApp/src/screens/DocumentScreen.js`
- `mobileApp/src/screens/UserProfile.js`
- `mobileApp/src/components/AddNewDoc.js`
- `mobileApp/src/utils/ValidationModal.js`

Rule: **Do not add features to these**. Extend the vNext screens (`FilesScreen`, `ScanScreen`, etc.).
