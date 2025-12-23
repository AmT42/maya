# Maya (v2) — AI Document Scanner & Organizer

Maya is a mobile app that helps people stay on top of administrative documents by letting them scan a document and turning it into structured, searchable information.

This repo contains:
- **React Native iOS app** in `mobileApp/`
- **FastAPI backend** in `app/` (Postgres + optional OCR/LLM/RAG integrations)

## Core Capabilities

- **Scan documents on mobile** with live border detection (`react-native-document-scanner-plugin`)
- **Upload + classify + extract fields** (backend pipeline: OCR → LLM extraction → persistence)
- **Auto-organization** into a folder-like hierarchy: `doctype/expediteur/date`
- **Browse documents** like folders (doctype → expediteur → documents)
- **Preview scanned images** served from backend `/storage/...`
- **Semantic search** (Chroma vector DB) *(disabled in dev mode)*
- **Optional Google Calendar event** for deadlines *(disabled in dev mode)*

## High-level Architecture

```
iPhone (React Native)
  - Scan (Vision/Doc scanner)
  - Auth (JWT stored in AsyncStorage)
  - Upload / Validate / Browse / Search
           |
           v
FastAPI (app/main.py)
  - Auth: /register, /login, /users/me
  - Upload: /upload (stores image + extracts info)
  - Validate: /validate (finalize classification + move file)
  - Browse: /user/documents
  - Search: /user/search (Chroma)
           |
           +--> Postgres (documents + users)
           +--> /storage static files (images)
           +--> (optional) Google Vision OCR
           +--> (optional) OpenAI LLM extraction
           +--> (optional) ChromaDB semantic search
           +--> (optional) Google Calendar events
```

## Quick Start (iPhone dev, recommended)

### Prereqs
- Node.js `>=16`
- Xcode
- CocoaPods (`pod`)
- Docker (for backend + Postgres)

### 1) Start backend + Postgres (Docker)

From repo root:
```bash
docker compose up -d --build
```

Backend should be reachable at:
- `http://localhost:8000/docs`

If the backend starts before Postgres is ready, restart it once:
```bash
docker compose restart web
```

### 2) Start Metro (React Native bundler)

From `mobileApp/`:
```bash
npm start -- --host 0.0.0.0
```

If port 8081 is already in use:
```bash
lsof -nP -iTCP:8081 -sTCP:LISTEN
kill <PID>
```

### 3) Install iOS pods and run from Xcode

```bash
cd mobileApp
npm install
cd ios
pod install
```

Open the workspace in Xcode (important: **workspace**, not xcodeproj):
- `mobileApp/ios/mobileApp.xcworkspace`

Select your iPhone, set a Development Team, then Run.

### 4) Make sure the iPhone can reach your Mac

On a real iPhone, `localhost` points to the phone itself.
You need your Mac LAN IP (example):
```bash
ipconfig getifaddr en0
```

Sanity checks from the iPhone (Safari):
- Backend: `http://<mac-ip>:8000/docs`
- Metro: `http://<mac-ip>:8081/status` (should return `packager-status:running`)

The app’s `API_BASE_URL` is derived from the Metro host (see `mobileApp/src/config/apiConfig.js`), so on-device it should automatically use `http://<mac-ip>:8000` in debug builds.

## Backend Modes

### DEV mode (recommended for mobile UI work)
Set `MAYA_DEV_MODE=1` (via `.env` or container env). In DEV mode the backend:
- accepts uploads and stores files
- returns mocked `extracted_info` (no OCR/LLM required)
- skips Chroma and Google Calendar

### Full mode (OCR/LLM/RAG)
Provide credentials/keys in `.env`:
- `OPENAI_API_KEY`
- `GOOGLE_CREDENTIALS_PATH` (Vision)
- `GOOGLE_SA_CREDENTIALS` (Calendar service account)
- `ADMIN` (Chroma basic auth)

## Troubleshooting

- **CocoaPods “boost checksum incorrect”**: the upstream `boostorg.jfrog.io` URL can return HTML; `pod install` will fail. Use `pod cache clean boost --all` and re-run `pod install --repo-update`.
- **Flipper build errors**: Flipper is disabled in `mobileApp/ios/Podfile` to avoid toolchain issues.
- **iOS deployment target**: set to iOS 13+ (required by the scanner plugin).
- **iPhone can’t reach backend**: check Wi‑Fi isolation and macOS firewall; verify `http://<mac-ip>:8000/docs` loads on the iPhone.

## More docs
- iOS setup notes: `docs/ios-setup.md`
