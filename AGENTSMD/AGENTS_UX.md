# AGENTS_UX.md — Maya Mobile UX (vNext)

This doc is a **high-context guide for coding agents** working on `mobileApp/` to preserve the product UX logic and “top-tier scanner app” behavior **without reading the entire code**.

Scope: **UX, information architecture, flows, copy, states**.

Related:

- Backend contracts + operational modes: `AGENTS.md`
- Visual system + UI primitives: `AGENTS_UI.md`

---

## 1) UX North Star (product principles)

Maya is a document scanning product. The UX should feel:

- **Scan-first**: capture is the primary value; scanning must be one tap away from anywhere.
- **Confidence + clarity**: the app always communicates what just happened and what’s next.
- **Minimal choices**: reduce branching flows; prefer “progressive disclosure”.
- **Fast retrieval**: recents + search feel instant; browsing is simple, not a maze.
- **Premium calm**: no clutter, no stacked buttons, no “form app” vibe.

---

## 2) Information architecture (IA)

### 2.1 Tabs (primary navigation)

We use a 4-tab shell with a raised central Scan action:

- `Files` — default “home” (Recents/Browse)
- `Search` — fast lookup
- `Scan` — primary action
- `Profile` — account + settings (and later: Dev Settings)

Rationale:

- Top scanner apps are “capture + retrieve” products, not folder-navigation products.
- Scan must always be visible and primary.

Implementation reference:

- `mobileApp/src/navigation/MainTabs.js`

---

## 3) Core journeys (end-to-end)

### 3.1 First-time user journey (zero confusion)

1. **Welcome**
2. Sign in / Create account
3. Land in **Files** with a clean empty state
4. Scan first document via the center Scan button

Rules:

- No deep menus on first run.
- Empty states must teach the next action (“Scan your first document…”).

Screen references:

- `mobileApp/src/screens/WelcomeScreen.js`
- `mobileApp/src/screens/FilesScreen.js`

### 3.2 Daily user journey (repeat usage)

The dominant loop:

1. Open app → see recent documents
2. Scan a new document or open a recent
3. Edit metadata only if needed
4. Continue

The app should feel like a “tool” (SwiftScan/Adobe Scan style): simple, reliable, fast.

---

## 4) Scan → Upload → Validate flow (critical path)

### 4.1 Goal

In one short flow, the user should:

- capture a scan
- get auto-extracted fields
- confirm/correct the fields
- save

### 4.2 Why we use a bottom sheet for validation

We avoid a full-screen “form” that breaks momentum.

- Bottom sheet = “review details” is a quick step, not a separate app mode.
- Keep the user mentally inside the “scan” task.

### 4.3 Data contract + constraints

Backend expects fields (at least):

- `doctype`
- `expediteur`
- `date` (string in `DD/MM/YYYY` format)
- `recapitulatif`
- `google_calendar` (optional string or null)

Important:

- Backend date parsing uses `datetime.strptime(date_str, '%d/%m/%Y')` and will fail if formatting is inconsistent.
- UX should guide the user to type `DD/MM/YYYY` or we should replace this with a date picker later.

Implementation reference:

- `mobileApp/src/screens/ScanScreen.js`
- Backend: `/upload`, `/validate` in `app/main.py`

### 4.4 States (must be handled cleanly)

Scan flow states:

- idle (scan CTA visible)
- scanning/uploading (busy indicator, prevent double taps)
- extraction succeeded → open validation sheet
- validation failed → clear error + allow retry
- save succeeded → return to Files

UX rules:

- Never leave the user in a “silent fail” state.
- Use short, actionable alert copy.

---

## 5) Files UX (home / retrieval)

### 5.1 “Recents” is home

We treat the library like modern scanner apps:

- default view shows **Recents** (time-based)
- browsing by folder is available but secondary

Implementation:

- `FilesScreen` uses a segmented control: `Recents | Browse`
- Recents are pulled from `/user/documents_filter` for a flat list

### 5.2 Browse (folder-like without maze navigation)

Backend browsing contract:

- `GET /user/documents` returns folder names until depth 2:
  - depth 0 → doctypes
  - depth 1 → expediteurs
  - depth 2 → documents

UX behavior:

- depth 0/1 shows folder rows (simple list)
- depth 2 shows document thumbnails (grid)
- a simple “Back” takes you up one level

Why:

- Keeps folder browsing discoverable but not dominant.
- Avoid breadcrumb clutter and visual noise.

Implementation reference:

- `mobileApp/src/screens/FilesScreen.js`

### 5.3 Preview behavior

Current behavior:

- tapping a document opens a full-screen modal preview (tap outside to close)

UX future direction (recommended):

- dedicated “Document Detail” screen:
  - preview + metadata
  - actions: share/export/rename/delete
  - keep modal for “quick peek”, but detail for editing actions

---

## 6) Search UX (fast and forgiving)

Backend behavior:

- DEV mode returns `[]`
- Full mode can return results or potentially 404 for no results

UX rules:

- Search UI must gracefully handle:
  - empty results
  - DEV mode empty results
  - user hasn’t searched yet (show hint/empty state)

Implementation reference:

- `mobileApp/src/screens/SearchScreen.js`

Copy guidance:

- Keep prompts short: “Try ‘invoice’, ‘rent’, ‘tax’…”

---

## 7) Auth UX (remove “toy form” feel)

Principles:

- No dense “form screens” with generic buttons.
- Make login feel like a **single task**: fill → continue.
- Errors should be **inline + human** (not raw API errors).

Flow:

- Welcome → Sign in / Create account
- Auth screens have a clear back affordance
- On success, the app switches to the main tabs (no manual navigation hacks)

Implementation reference:

- `mobileApp/src/navigation/RootNavigator.js` decides Auth vs Main
- `mobileApp/src/screens/LoginScreen.js`
- `mobileApp/src/screens/RegisterScreen.js`

Token persistence:

- tokens stored in AsyncStorage (`access_token`, `refresh_token`)
- Root bootstraps with `/users/me`; if invalid, tokens are cleared

---

## 8) Profile UX (simple and trustworthy)

Purpose:

- show account identity
- allow sign out
- later: settings and dev tools

Sign-out rules:

- must confirm destructive action
- must clear stored tokens

Implementation reference:

- `mobileApp/src/screens/ProfileScreen.js`

Recommended next additions:

- Dev Settings (backend URL override, dev mode indicator)
- “About” section (version, privacy)

---

## 9) Copywriting rules (avoid “toy” tone)

Voice:

- confident, short, human
- no exclamation spam
- avoid generic “Error occurred” unless paired with action

Do:

- “Incorrect username or password.”
- “Save failed. Please try again.”
- “No documents yet. Scan your first document to start building your library.”

Don’t:

- “An error occured during login.” (also spelling)
- long error blocks
- raw backend error dumps

---

## 10) UX guardrails for scaling

### 10.1 Keep one primary action per screen

Each screen must have a single clear CTA:

- Files: Scan
- Scan: Scan document / Confirm & save
- Auth: Continue/Create
- Search: Go

Avoid multiple primary buttons competing.

### 10.2 Prefer progressive disclosure

Don’t show every option up front.

- Example: metadata editing happens in a sheet after capture.

### 10.3 Strong empty/loading/error states

Every endpoint-backed view must define:

- loading state
- empty state
- error state (with retry path)

### 10.4 Respect backend contracts (date + storage URLs)

Known pitfalls:

- Date format must match backend parsing (`DD/MM/YYYY` currently).
- Storage URLs must be built via `buildStorageUrl` (don’t encode whole paths; don’t break slashes).

Reference:

- `mobileApp/src/utils/storageUrl.js`

### 10.5 Don’t extend legacy flows

Legacy UI exists but should not be extended:

- `DocumentScreen`, `UserProfile`, `AddNewDoc`, `ValidationModal`

vNext flows live in:

- `FilesScreen`, `ScanScreen`, `SearchScreen`, `ProfileScreen`

---

## 11) Product roadmap notes (what “top-tier” would add next)

If/when asked to push toward SwiftScan/Adobe Scan level:

- Multi-page scanning (page rail, reorder, delete, add page)
- Crop/rotate/filter (single editor with preview)
- Document Detail screen + share/export (PDF)
- Smarter metadata entry (doctype picker, vendor autocomplete, date picker)
- Better search experience (suggestions, history, highlight)
- Settings (dev URL override, appearance, export format)

Guiding rule: add features without adding clutter—features should appear only when needed.
