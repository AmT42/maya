from __future__ import annotations

from io import BytesIO


def extract_pdf_text(pdf_bytes: bytes, *, max_chars: int = 80_000) -> str:
    """Extract a best-effort text representation from a PDF.

    Notes:
    - This only works for PDFs that contain embedded text (not purely scanned images).
    - Output is capped to `max_chars` to keep LLM prompts bounded.
    """

    try:
        from pypdf import PdfReader
    except ImportError as e:  # pragma: no cover
        raise RuntimeError("Missing dependency: pypdf") from e

    reader = PdfReader(BytesIO(pdf_bytes))
    chunks: list[str] = []
    total = 0

    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        if not text:
            continue

        remaining = max_chars - total
        if remaining <= 0:
            break

        if len(text) > remaining:
            chunks.append(text[:remaining])
            total = max_chars
            break

        chunks.append(text)
        total += len(text)

    return "\n\n".join(chunks).strip()

