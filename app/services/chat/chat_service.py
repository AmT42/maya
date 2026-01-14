from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional

from core.config import settings
from services.llm.openrouter_client import get_openrouter_client


DEFAULT_SYSTEM_PROMPT = (
    "You are Maya, an AI-first document scanning assistant.\n"
    "Be concise and practical. Ask clarifying questions when needed."
)


@dataclass(frozen=True)
class ChatService:
    model: str
    system_prompt: str = DEFAULT_SYSTEM_PROMPT

    def complete(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        payload = {
            "model": self.model,
            "messages": self._with_system(messages),
            "temperature": 0.2,
        }
        completion = get_openrouter_client().chat_completions(payload)
        content = (completion.choices[0].message.content if completion.choices else "") or ""
        return {"role": "assistant", "content": content}

    def stream(self, messages: List[Dict[str, Any]]) -> Iterable[bytes]:
        payload = {
            "model": self.model,
            "messages": self._with_system(messages),
            "temperature": 0.2,
            "stream": True,
            # Favor low latency + resilience.
            "provider": {"sort": "latency", "allow_fallbacks": True},
        }
        return get_openrouter_client().chat_completions_stream(payload)

    def _with_system(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if messages and messages[0].get("role") == "system":
            return messages
        return [{"role": "system", "content": self.system_prompt}] + (messages or [])


def get_chat_service() -> ChatService:
    return ChatService(model=settings.OPENROUTER_MODEL_CHAT)

