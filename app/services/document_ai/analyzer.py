from __future__ import annotations

import base64
import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime
from io import BytesIO
from typing import Any, Dict, List, Optional, Sequence

from PIL import Image, ImageOps

from core.config import settings
from services.llm.base import LLMError
from services.llm.openrouter_client import get_openrouter_client


def _to_data_url(path: str) -> str:
    # For LLM vision calls we optimize payload size while keeping text legible:
    # - normalize EXIF orientation
    # - convert to RGB JPEG
    # - downscale if needed
    max_side_px = 2000
    jpeg_quality = 85

    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img).convert("RGB")
        width, height = img.size
        longest = max(width, height)
        if longest > max_side_px:
            scale = max_side_px / float(longest)
            new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
            resampling = getattr(Image, "Resampling", Image).LANCZOS
            img = img.resize(new_size, resample=resampling)

        buf = BytesIO()
        img.save(buf, format="JPEG", quality=jpeg_quality, optimize=True)
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    return f"data:image/jpeg;base64,{b64}"


_DATE_RE = re.compile(r"^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}$")


def _format_date_ddmmyyyy(dt: datetime) -> str:
    return dt.strftime("%d/%m/%Y")


def _normalize_slug(value: Optional[str], *, default: str) -> str:
    raw = (value or "").strip().lower()
    raw = unicodedata.normalize("NFKD", raw).encode("ascii", "ignore").decode("ascii")
    raw = raw.replace("/", "-")
    raw = re.sub(r"[^a-z0-9._-]+", "-", raw)
    raw = raw.strip("-._")
    return raw or default


def _coerce_date(value: Optional[str], *, fallback: str) -> str:
    if not value:
        return fallback
    value = value.strip()
    if _DATE_RE.match(value):
        return value
    return fallback


def _coerce_deadline(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    if _DATE_RE.match(value):
        return value
    return None


DOCUMENT_ANALYSIS_JSON_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "doctype": {
            "type": "string",
            "description": "Normalized document type slug (lowercase, ascii, no spaces).",
        },
        "date": {
            "type": "string",
            "description": "Document date in dd/mm/yyyy. If unknown, use today's date.",
        },
        "expediteur": {
            "type": "string",
            "description": "Sender/issuer slug (lowercase, ascii). For contraventions: recipient.",
        },
        "recapitulatif": {
            "type": "string",
            "description": "Concise summary for semantic search (1-3 sentences).",
        },
        "google_calendar": {
            "anyOf": [
                {"type": "string", "description": "Deadline date in dd/mm/yyyy."},
                {"type": "null"},
            ],
        },
        "raw_text": {
            "anyOf": [
                {"type": "string", "description": "OCR-like transcription of the visible text."},
                {"type": "null"},
            ],
        },
        "language": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "entities": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "type": {"type": "string"},
                    "value": {"type": "string"},
                    "confidence": {"anyOf": [{"type": "number"}, {"type": "null"}]},
                    "context": {"anyOf": [{"type": "string"}, {"type": "null"}]},
                },
                "required": ["type", "value", "confidence", "context"],
            },
        },
        "amounts": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "value": {"type": "number"},
                    "currency": {"anyOf": [{"type": "string"}, {"type": "null"}]},
                    "context": {"anyOf": [{"type": "string"}, {"type": "null"}]},
                },
                "required": ["value", "currency", "context"],
            },
        },
        "warnings": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "doctype",
        "date",
        "expediteur",
        "recapitulatif",
        "google_calendar",
        "raw_text",
        "language",
        "entities",
        "amounts",
        "warnings",
    ],
}


@dataclass(frozen=True)
class DocumentAnalyzer:
    model: str

    def analyze_text(
        self,
        text: str,
        *,
        received_at: Optional[datetime] = None,
        locale: str = "fr-FR",
    ) -> Dict[str, Any]:
        received_at = received_at or datetime.utcnow()
        today = _format_date_ddmmyyyy(received_at)

        system_prompt = (
            "You are Maya Document AI.\n"
            "Task: Given document text, extract structured metadata.\n"
            "Rules:\n"
            "- Output MUST be valid JSON matching the provided JSON schema.\n"
            "- Do not include markdown, code fences, or extra keys.\n"
            "- Normalize `doctype` and `expediteur` to lowercase ASCII slugs (no accents, no spaces, no '/').\n"
            "- `date` must be dd/mm/yyyy. If not found, use today's date.\n"
            "- `google_calendar` is a deadline date in dd/mm/yyyy if a deadline exists, else null.\n"
            "- `raw_text` must contain the provided input text (or a cleaned version).\n"
        )
        user_text = (
            f"Locale: {locale}\n"
            f"Today's date: {today}\n"
            "Here is the document text:\n"
            f"{text}\n"
            "Return the JSON object."
        )
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_text}]
        return self._analyze_messages(messages, today=today)

    def analyze_image_paths(
        self,
        image_paths: Sequence[str],
        *,
        received_at: Optional[datetime] = None,
        locale: str = "fr-FR",
    ) -> Dict[str, Any]:
        if not image_paths:
            raise ValueError("image_paths is empty")

        received_at = received_at or datetime.utcnow()
        today = _format_date_ddmmyyyy(received_at)

        system_prompt = (
            "You are Maya Document AI.\n"
            "Task: Given one or more scanned document images, do OCR and extract structured metadata.\n"
            "Rules:\n"
            "- Output MUST be valid JSON matching the provided JSON schema.\n"
            "- Do not include markdown, code fences, or extra keys.\n"
            "- Normalize `doctype` and `expediteur` to lowercase ASCII slugs (no accents, no spaces, no '/').\n"
            "- `date` must be dd/mm/yyyy. If not found, use today's date.\n"
            "- `google_calendar` is a deadline date in dd/mm/yyyy if a deadline exists, else null.\n"
            "- `raw_text` is the OCR-like transcription of visible text (best effort, but keep it reasonably sized).\n"
            "- If uncertain, include a warning in `warnings` and choose safe defaults.\n"
        )
        user_text = (
            f"Locale: {locale}\n"
            f"Today's date: {today}\n"
            "Analyze the document image(s) and return the JSON object."
        )

        content_parts: List[Dict[str, Any]] = [{"type": "text", "text": user_text}]
        for p in image_paths:
            content_parts.append({"type": "image_url", "image_url": {"url": _to_data_url(p)}})
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": content_parts}]
        return self._analyze_messages(messages, today=today)

    def _analyze_messages(self, messages: List[Dict[str, Any]], *, today: str) -> Dict[str, Any]:
        payload = {
            "model": self.model,
            "messages": messages,
            "response_format": {
                "type": "json_schema",
                "json_schema": {"name": "document_analysis", "strict": True, "schema": DOCUMENT_ANALYSIS_JSON_SCHEMA},
            },
            "temperature": 0,
            "plugins": [{"id": "response-healing"}],
        }

        try:
            completion = get_openrouter_client().chat_completions(payload)
        except LLMError:
            # Fallback when strict schema/plugins are not supported by the routed provider.
            payload.pop("response_format", None)
            payload.pop("plugins", None)
            payload["messages"] = self._force_json_messages(messages)
            completion = get_openrouter_client().chat_completions(payload)

        content = (completion.choices[0].message.content if completion.choices else None) or "{}"
        analysis = _loads_json(content)

        normalized = dict(analysis or {})
        normalized["doctype"] = _normalize_slug(normalized.get("doctype"), default="document")
        normalized["expediteur"] = _normalize_slug(normalized.get("expediteur"), default="unknown")
        normalized["date"] = _coerce_date(normalized.get("date"), fallback=today)
        normalized["google_calendar"] = _coerce_deadline(normalized.get("google_calendar"))

        # Ensure required keys exist even if the provider ignored schema settings.
        normalized.setdefault("recapitulatif", "")
        normalized.setdefault("raw_text", None)
        normalized.setdefault("language", None)
        normalized.setdefault("entities", [])
        normalized.setdefault("amounts", [])
        normalized.setdefault("warnings", [])

        return normalized

    @staticmethod
    def _force_json_messages(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        hint = (
            "Return ONLY a single JSON object matching this schema (no markdown, no extra keys):\n"
            f"{DOCUMENT_ANALYSIS_JSON_SCHEMA}"
        )
        if not messages:
            return [{"role": "system", "content": hint}]
        out = list(messages)
        if out[0].get("role") == "system":
            out[0] = {"role": "system", "content": f"{hint}\n\n{out[0].get('content') or ''}"}
            return out
        return [{"role": "system", "content": hint}] + out


def get_document_analyzer() -> DocumentAnalyzer:
    return DocumentAnalyzer(model=settings.OPENROUTER_MODEL_DOC)


def _loads_json(content: Any) -> Any:
    if content is None:
        return None
    if isinstance(content, (dict, list)):
        return content
    if not isinstance(content, str):
        return None
    try:
        return __import__("json").loads(content)
    except Exception:
        return None
