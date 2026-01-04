import logging
from typing import Dict, List, Optional

from fastapi import HTTPException
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from core.config import settings

logger = logging.getLogger(__name__)


def get_allowed_google_audiences() -> List[str]:
    audiences: List[str] = []

    # Preferred explicit vars.
    if getattr(settings, "GOOGLE_WEB_CLIENT_ID", ""):
        audiences.append(settings.GOOGLE_WEB_CLIENT_ID.strip())
    if getattr(settings, "GOOGLE_IOS_CLIENT_ID", ""):
        audiences.append(settings.GOOGLE_IOS_CLIENT_ID.strip())

    # Backward-compat: allow comma-separated list.
    raw = (getattr(settings, "GOOGLE_ID", "") or "").strip()
    if raw:
        audiences.extend([item.strip() for item in raw.split(",") if item.strip()])

    # De-duplicate while keeping order.
    seen = set()
    deduped: List[str] = []
    for aud in audiences:
        if aud and aud not in seen:
            deduped.append(aud)
            seen.add(aud)
    return deduped


def verify_google_id_token(id_token: str) -> Dict:
    audiences = get_allowed_google_audiences()
    if not audiences:
        raise HTTPException(
            status_code=500,
            detail="Google Sign-In is not configured (missing GOOGLE_WEB_CLIENT_ID / GOOGLE_IOS_CLIENT_ID)",
        )

    request = google_requests.Request()
    last_error: Optional[Exception] = None
    for audience in audiences:
        try:
            payload = google_id_token.verify_oauth2_token(id_token, request, audience=audience)
            issuer = payload.get("iss")
            if issuer not in ("accounts.google.com", "https://accounts.google.com"):
                raise HTTPException(status_code=401, detail="Invalid Google token issuer")
            if payload.get("email_verified") is not True:
                raise HTTPException(status_code=401, detail="Google account email not verified")
            return payload
        except HTTPException:
            raise
        except Exception as e:
            last_error = e
            continue

    logger.warning("Failed to verify Google ID token: %s", last_error)
    raise HTTPException(status_code=401, detail="Invalid Google token")
