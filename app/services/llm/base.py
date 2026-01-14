from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Literal, Optional


Role = Literal["system", "user", "assistant", "tool"]


@dataclass(frozen=True)
class ChatMessage:
    role: Role
    content: Any


@dataclass(frozen=True)
class ChatCompletionChoice:
    message: ChatMessage


@dataclass(frozen=True)
class ChatCompletion:
    choices: List[ChatCompletionChoice]
    raw: Dict[str, Any]
    model: Optional[str] = None
    usage: Optional[Dict[str, Any]] = None


class LLMError(RuntimeError):
    def __init__(self, message: str, *, status_code: Optional[int] = None, payload: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload


class LLMClient:
    def chat_completions(self, payload: Dict[str, Any]) -> ChatCompletion:
        raise NotImplementedError

    def chat_completions_stream(self, payload: Dict[str, Any]) -> Iterable[bytes]:
        raise NotImplementedError

