# Upload System (Maya v2)

This doc explains the end-to-end upload pipeline: iPhone UI → API calls → storage/layout → optional indexing.

## 1) What the user can add (mobile UX)

The **Scan** tab supports three sources, all converging to the same “preview → review → save” flow:

1. **Scan document** (best for papers)
   - Uses live document scanning (`react-native-document-scanner-plugin`) to detect edges and crop.
   - Produces a single JPEG file URI.

2. **Photos** (take a photo or pick from your camera roll)
   - Uses `react-native-image-picker`.
   - iOS shows an action sheet: **Take photo** / **Choose from Photos**.
   - We request `assetRepresentationMode: 'compatible'` so iOS gives a widely supported representation (instead of a HEIC-only asset when possible).

3. **Files** (pick a file from the Files app / iCloud Drive)
   - Uses `react-native-document-picker`.
   - Supports PDFs + images.
   - Copies to caches when possible (`copyTo: 'cachesDirectory'`) so we can upload a stable local URI.

### Preview and state model

After the user selects something, the app stores an `attachment` with:
- `uri`: local file URI
- `name`: filename (best effort)
- `type`: MIME type (best effort)
- `kind`: `image | pdf | text | file`
- `source`: `scan | photo | import`
- `size` (when available)

The UI then:
- shows an **image preview** when `kind === 'image'`
- shows a **file card** when `kind !== 'image'` (PDF, etc.)
- if the user is signed in, it **uploads automatically** and opens the review sheet
- if the user is not signed in, it opens a “guest” sheet (share or sign in)

If a user ends up with an attachment but no `docId` (e.g. signed out, or upload failed), the button switches to **Upload & review** to upload the *same attachment* later without re-picking.

## 2) API contracts

### `POST /upload`

**Request**
- `multipart/form-data`
- field: `file`

**Response**
- `{ doc_id: string, extracted_info: { doctype, date, expediteur, recapitulatif, google_calendar } }`

### `POST /validate`

**Request**
- JSON: `{ doc_id: string, extracted_info: { ... } }`

**Response**
- `{ doc_id: string, validated_info: { ... } }`

## 3) Backend processing (`/upload`)

Location: `app/main.py` (`upload_document`)

### Type detection

The backend decides how to handle the upload using:
- `file.content_type` (MIME type)
- `file.filename` extension (fallback)

Supported:
- Images: `.jpg/.jpeg`, `.png`, `.webp`
- PDFs: `.pdf`
- Text: anything else is treated as text via `decode(errors="ignore")`

If an image is not one of the supported types (e.g. HEIC), `/upload` returns a `400` with a clear message:
> “Unsupported image type. Please upload a JPG, PNG, or WebP.”

### Storage paths and “temporary vs final”

On upload we write into a temp bucket:
- `storage/<TEMP_STORAGE>/<doc_id>.<ext>`

Then we create a `documents` row with `file_path` pointing to that temp file (or the PDF path).

### Extracted info

- In **DEV mode** (`MAYA_DEV_MODE=1`) we skip external AI and return mocked extracted data.
- In **full mode** we call `DocumentAnalyzer`:
  - images → vision analysis (`analyze_image_paths`)
  - PDFs → extract embedded text (`pypdf`) → text analysis (`analyze_text`)
  - raw text → text analysis (`analyze_text`)

PDF note: only works for PDFs that contain embedded text; image-only PDFs will return a `400` explaining that OCR isn’t available for that file.

### Optional indexing (Chroma)

After storing the document we optionally index `raw_text` into Chroma.

Important behavior:
- Chroma ingestion is **best-effort**: failures are logged and the upload still succeeds (no user-facing 500 just because Chroma isn’t running).

## 4) Backend finalization (`/validate`)

Location: `app/main.py` (`validate`)

When the user confirms the extracted fields:
- We update the DB row fields (`doctype`, `expediteur`, `date`, etc.)
- If `file_path` exists, we move it from temp into the final folder tree:
  - `storage/<user_id>/<doctype>/<expediteur>/<date>.<ext>`
- Extension is preserved (PDF stays `.pdf`, PNG stays `.png`, etc.)

Optional: Chroma indexing of the validated JSON is also best-effort (failure won’t break validation).

## 5) Serving files back to the app

FastAPI mounts:
- `GET /storage/...` from `app/storage/` (mounted as static files).

Mobile builds the URL as:
- `<API_BASE_URL>/storage/<normalized path>`

### Library behavior for PDFs

In the Library UI:
- images open an in-app preview modal
- PDFs open via the system viewer (`Linking.openURL`) to keep UX simple and native

## 6) Running with / without Chroma locally

### Backend only (no Chroma)
- Works: upload + review + validate + library images/PDFs
- Search/RAG won’t work

### Backend + Chroma

`docker-compose.yml` includes a `server` service behind the `chroma` profile.

Run:
- `docker compose --profile chroma up -d`

Notes:
- Uses `ghcr.io/chroma-core/chroma:latest`
- Exposes Chroma at `http://localhost:8001`
- Persists data in the `index_data` named volume at `/data` inside the container

## 7) iOS permission + tooling notes

### Permissions
The iOS `Info.plist` already includes:
- `NSCameraUsageDescription` (needed for camera/photo capture)
- `NSPhotoLibraryUsageDescription` (needed to pick from Photos)

### CocoaPods UTF-8
If `pod install` fails with encoding errors, run:
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install`

This only forces UTF-8 for that command so CocoaPods doesn’t crash on unicode normalization.

## 8) Common failure modes / quick debug

- **Upload returns 500 when Chroma is down**: should no longer happen; ingestion is best-effort now.
- **Chroma telemetry error** (`posthog capture()` signature): fixed by pinning `posthog<3` in `requirements.txt`.
- **PDF says “no extractable text”**: that PDF is image-only; scan it (or OCR the PDF externally).
- **HEIC upload rejected**: expected; the backend accepts JPG/PNG/WebP. Use Photos with “compatible” assets or convert to JPG.

