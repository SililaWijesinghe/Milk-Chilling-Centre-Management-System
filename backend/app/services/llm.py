"""Groq LLM integration service."""
from functools import lru_cache
from typing import Any, Generator, Sequence

from groq import Groq

from app.core.config import get_settings


@lru_cache
def get_groq_client() -> Groq:
    """Return a cached instance of the Groq client."""
    settings = get_settings()
    api_key = settings.groq_api_key.get_secret_value()
    if api_key:
        return Groq(api_key=api_key)
    return Groq()


def stream_chat_completion(
    messages: Sequence[dict[str, Any]],
    model: str | None = None,
    temperature: float = 1.0,
    max_completion_tokens: int = 2048,
    top_p: float = 1.0,
    reasoning_effort: str = "medium",
    stop: Any = None,
) -> Generator[str, None, None]:
    """Stream chat completions from Groq using the configured model."""
    settings = get_settings()
    client = get_groq_client()
    selected_model = model or settings.groq_model

    completion = client.chat.completions.create(
        model=selected_model,
        messages=list(messages),
        temperature=temperature,
        max_completion_tokens=max_completion_tokens,
        top_p=top_p,
        reasoning_effort=reasoning_effort,
        stream=True,
        stop=stop,
    )

    for chunk in completion:
        delta = chunk.choices[0].delta.content if chunk.choices else None
        if delta:
            yield delta


def create_chat_completion(
    messages: Sequence[dict[str, Any]],
    model: str | None = None,
    temperature: float = 1.0,
    max_completion_tokens: int = 2048,
    top_p: float = 1.0,
    reasoning_effort: str = "medium",
    stop: Any = None,
) -> str:
    """Non-streaming chat completion from Groq."""
    settings = get_settings()
    client = get_groq_client()
    selected_model = model or settings.groq_model

    completion = client.chat.completions.create(
        model=selected_model,
        messages=list(messages),
        temperature=temperature,
        max_completion_tokens=max_completion_tokens,
        top_p=top_p,
        reasoning_effort=reasoning_effort,
        stream=False,
        stop=stop,
    )

    return completion.choices[0].message.content or ""
