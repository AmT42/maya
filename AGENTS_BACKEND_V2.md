# AGENTS_BACKEND_V2.md (Backend v2 — OpenRouter + Gemini)

This doc explains how the current backend works after migrating **document ingestion** and **chat** to **OpenRouter** using **Gemini 3 Flash** (multimodal, no separate OCR model).

---

## 1) What changed (high level)

### Before (legacy)
- `/upload` saved the image → ran Google Vision OCR → sent OCR text to a LangChain `ChatOpenAI(gpt-3.5-turbo)` few-shot prompt → `eval()`’d the model output to get a Python dict.

### Now (v2)
- `/upload` saves the image → sends the image directly to **Gemini 3 Flash via OpenRouter** → receives **schema-shaped JSON** for:
  - document classification (`doctype`)
  - entity/date/deadline extraction (`date`, `google_calendar`, etc.)
  - summary for search (`recapitulatif`)
  - optional OCR-like transcription (`raw_text`)
- `/chat` and `/chat/stream` use the same OpenRouter gateway for user-facing assistant chat (streaming supported).

Google Vision OCR + the legacy LangChain extraction modules have been removed from the codebase.

---

## 2) Runtime modes

### DEV mode (`MAYA_DEV_MODE=1`)
- `/upload` stores the file (if image) and returns mocked `extracted_info`.
- No calls to OpenRouter, Chroma, or Google Calendar.
- `/chat` returns a stub message; `/chat/stream` returns a short SSE stub.

### Full mode (`MAYA_DEV_MODE=0`)
- `/upload` calls OpenRouter (Gemini) for multimodal extraction.
- Chroma ingestion still runs (and still uses OpenAI embeddings today).
- `/validate` stores validated JSON in Chroma and creates a Google Calendar event **only if** `google_calendar` is present.

---

## 3) Key modules

### OpenRouter gateway
- `app/services/llm/openrouter_client.py`
  - Uses `httpx` to call OpenRouter’s OpenAI-compatible endpoint: `POST /api/v1/chat/completions`
  - Adds privacy/provider routing defaults:
    - `provider.zdr` (default `true`)
    - `provider.data_collection` (default `"deny"`)
  - Supports:
    - non-streaming chat completions (JSON extraction)
    - streaming chat completions (SSE passthrough)

### Document analyzer (multimodal “OCR + extraction”)
- `app/services/document_ai/analyzer.py`
  - Builds a **multimodal** request (text + images).
  - Sends images as **base64 data URLs**.
  - Preprocesses images before sending:
    - EXIF orientation normalize
    - JPEG conversion + downscale (max side ~2000px) to reduce payload/latency
  - Uses OpenRouter structured outputs when available:
    - `response_format: { type: "json_schema", json_schema: { strict: true, schema: ... } }`
    - `plugins: [{ id: "response-healing" }]` for robustness on non-streaming calls
  - Fallback: if structured outputs/plugins fail (provider/model routing quirks), it retries with a “return only JSON” system hint.
  - Normalizes outputs:
    - `doctype`, `expediteur` → ASCII lowercase “slug”
    - `date`, `google_calendar` → `dd/mm/yyyy` (or safe defaults)

### Chat service (user-facing assistant)
- `app/services/chat/chat_service.py`
  - Implements non-streaming (`/chat`) and streaming (`/chat/stream`) chat via OpenRouter.
  - Streaming returns raw SSE lines from OpenRouter (the backend does not re-chunk tokens itself).

---

## 4) The `/upload` flow (step-by-step)

File: `app/main.py` (`POST /upload`)

1. Receive a multipart upload (`file`).
2. Detect content type:
   - if `image/*`:
     - save to `storage/<TEMP_STORAGE>/<uuid>.jpg`
     - call `DocumentAnalyzer.analyze_image_paths([file_path])`
   - else:
     - read bytes and decode to text
     - call `DocumentAnalyzer.analyze_text(raw_text)`
3. The analyzer calls OpenRouter with:
   - `model = OPENROUTER_MODEL_DOC` (default `google/gemini-3-flash-preview`)
   - multimodal `messages` content:
     - text instruction first
     - then image parts (`{ type: "image_url", image_url: { url: "data:image/jpeg;base64,..." } }`)
   - strict JSON schema response format (when supported)
4. Extract and return the legacy-compatible subset:
   - `doctype`, `date`, `expediteur`, `recapitulatif`, `google_calendar`
5. Persist the `Document` row in Postgres.
6. Full mode only: if `raw_text` exists, chunk and write to Chroma (metadata type `"raw_text"`).

Result returned to the mobile app stays compatible:
```json
{
  "doc_id": "<uuid>",
  "extracted_info": {
    "doctype": "...",
    "date": "dd/mm/yyyy",
    "expediteur": "...",
    "recapitulatif": "...",
    "google_calendar": null
  }
}
```

---

## 5) The `/validate` flow (step-by-step)

File: `app/main.py` (`POST /validate`)

1. Mobile sends `{ doc_id, extracted_info }` (user-edited values).
2. Backend updates the DB record and moves the image to:
   - `storage/<user_id>/<doctype>/<expediteur>/<date>.jpg`
3. Full mode only:
   - stores the validated JSON in Chroma (metadata type `"chatgpt"` — legacy label kept)
   - creates a Google Calendar event **only if** `google_calendar` is non-empty

---

## 6) The chat flows

### `/chat` (non-streaming)
- `POST /chat` with:
  - `{"messages":[{"role":"user","content":"..."}]}`
- Backend prepends a system prompt if you didn’t include one, calls OpenRouter, returns:
  - `{ "message": { "role": "assistant", "content": "..." } }`

### `/chat/stream` (streaming SSE)
- `POST /chat/stream` with the same payload.
- Backend returns `text/event-stream` and passes through OpenRouter’s SSE lines.

Note: the mobile app currently does not call these endpoints yet; they’re “backend-ready” for the next UI brick.

---

## 7) Configuration (env vars)

Defined in `app/core/config.py` and wired into `docker-compose.yml`.

Required for full mode:
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL_DOC` (default `google/gemini-3-flash-preview`)
- `OPENROUTER_MODEL_CHAT` (default `google/gemini-3-flash-preview`)

Still required today (legacy RAG):
- `OPENAI_API_KEY` (used by Chroma embeddings in `app/services/chroma_db/db.py`)
- `ADMIN` (Chroma basic auth)

Optional privacy/routing knobs:
- `OPENROUTER_ZDR=true`
- `OPENROUTER_DATA_COLLECTION=deny`
- `OPENROUTER_HTTP_REFERER=...`
- `OPENROUTER_X_TITLE=Maya`

Optional calendar:
- `GOOGLE_SA_CREDENTIALS=/path/to/service-account.json`

---

## 8) How to switch models/providers later

### Switch Gemini model (same provider)
- Change:
  - `OPENROUTER_MODEL_DOC`
  - `OPENROUTER_MODEL_CHAT`

### Add a new provider client later
- Keep app logic calling:
  - `DocumentAnalyzer` / `ChatService`
- Add another `LLMClient` implementation in `app/services/llm/` and swap `get_openrouter_client()` usage behind a factory (future refactor).

---

## 9) Quick manual API checks (examples)

Non-streaming chat:
```bash
curl -sS -X POST 'http://localhost:8000/chat' \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

Streaming chat:
```bash
curl -N -X POST 'http://localhost:8000/chat/stream' \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Stream a short answer"}]}'
```

Upload an image:
```bash
curl -sS -X POST 'http://localhost:8000/upload' \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/scan.jpg;type=image/jpeg"
```

