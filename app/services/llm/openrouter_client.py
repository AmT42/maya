from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Dict, Iterable, Optional

import httpx

from core.config import settings
from services.llm.base import ChatCompletion, ChatCompletionChoice, ChatMessage, LLMClient, LLMError

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class OpenRouterPrivacy:
    zdr: bool = True
    data_collection: str = "deny"


class OpenRouterClient(LLMClient):
    def __init__(
        self,
        *,
        api_key: str,
        base_url: str,
        http_referer: str = "",
        x_title: str = "",
        timeout_s: float = 120.0,
        privacy: Optional[OpenRouterPrivacy] = None,
    ) -> None:
        if not api_key:
            raise LLMError("OPENROUTER_API_KEY is not set")
        self._client = httpx.Client(
            base_url=base_url.rstrip("/"),
            timeout=httpx.Timeout(timeout_s),
            headers=self._build_headers(api_key, http_referer=http_referer, x_title=x_title),
        )
        self._privacy = privacy or OpenRouterPrivacy()

    @staticmethod
    def _build_headers(api_key: str, *, http_referer: str, x_title: str) -> Dict[str, str]:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        if http_referer:
            headers["HTTP-Referer"] = http_referer
        if x_title:
            headers["X-Title"] = x_title
        return headers

    def _inject_provider(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        provider: Dict[str, Any] = dict(payload.get("provider") or {})
        provider.setdefault("zdr", self._privacy.zdr)
        if self._privacy.data_collection:
            provider.setdefault("data_collection", self._privacy.data_collection)
        if provider:
            payload["provider"] = provider
        return payload

    def chat_completions(self, payload: Dict[str, Any]) -> ChatCompletion:
        payload = self._inject_provider(dict(payload))

        last_error: Optional[Exception] = None
        for attempt in range(3):
            try:
                resp = self._client.post("/chat/completions", json=payload)
                if resp.status_code >= 400:
                    raise LLMError(
                        f"OpenRouter error {resp.status_code}",
                        status_code=resp.status_code,
                        payload=_safe_json(resp),
                    )
                data = resp.json()
                return _parse_chat_completion(data)
            except (httpx.TimeoutException, httpx.NetworkError, LLMError) as e:
                last_error = e
                if isinstance(e, LLMError) and (e.status_code or 0) < 500 and (e.status_code or 0) != 429:
                    break
                sleep_s = min(2 ** attempt, 8)
                time.sleep(sleep_s)
        raise LLMError("OpenRouter request failed", payload=str(last_error))

    def chat_completions_stream(self, payload: Dict[str, Any]) -> Iterable[bytes]:
        payload = self._inject_provider(dict(payload))
        payload["stream"] = True

        try:
            with self._client.stream(
                "POST",
                "/chat/completions",
                json=payload,
                headers={"Accept": "text/event-stream"},
            ) as resp:
                if resp.status_code >= 400:
                    raise LLMError(
                        f"OpenRouter error {resp.status_code}",
                        status_code=resp.status_code,
                        payload=_safe_json(resp),
                    )
                for line in resp.iter_lines():
                    if line == "":
                        yield b"\n"
                    else:
                        yield (line + "\n").encode("utf-8")
                yield b"\n"
        except (httpx.TimeoutException, httpx.NetworkError) as e:
            raise LLMError("OpenRouter streaming request failed", payload=str(e))


def _safe_json(resp: httpx.Response) -> Any:
    try:
        return resp.json()
    except Exception:
        return resp.text


def _parse_chat_completion(data: Dict[str, Any]) -> ChatCompletion:
    choices = []
    for choice in data.get("choices") or []:
        message = choice.get("message") or {}
        choices.append(
            ChatCompletionChoice(
                message=ChatMessage(role=message.get("role") or "assistant", content=message.get("content")),
            )
        )
    return ChatCompletion(choices=choices, raw=data, model=data.get("model"), usage=data.get("usage"))


@lru_cache(maxsize=1)
def get_openrouter_client() -> OpenRouterClient:
    privacy = OpenRouterPrivacy(zdr=settings.OPENROUTER_ZDR, data_collection=settings.OPENROUTER_DATA_COLLECTION)
    return OpenRouterClient(
        api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL,
        http_referer=settings.OPENROUTER_HTTP_REFERER,
        x_title=settings.OPENROUTER_X_TITLE,
        privacy=privacy,
    )
