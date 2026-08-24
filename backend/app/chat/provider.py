import asyncio
import json
from collections.abc import AsyncIterator

import httpx

from app.config import Settings
from app.schemas import ChatMessage


async def stream_mock(messages: list[ChatMessage]) -> AsyncIterator[str]:
    prompt = messages[-1].content
    response = (
        "This is the built-in demo provider. Your message was: "
        f'“{prompt}”\n\nAdd an AI_API_KEY and set AI_PROVIDER=openai to use a real model.'
    )
    for word in response.split(" "):
        yield f"{word} "
        await asyncio.sleep(0.035)


async def stream_openai(messages: list[ChatMessage], settings: Settings) -> AsyncIterator[str]:
    if not settings.ai_api_key:
        raise RuntimeError("AI_API_KEY is required when AI_PROVIDER=openai.")

    payload = {
        "model": settings.ai_model,
        "stream": True,
        "messages": [
            {"role": "system", "content": settings.ai_system_prompt},
            *[message.model_dump() for message in messages],
        ],
    }
    headers = {"Authorization": f"Bearer {settings.ai_api_key}"}

    async with httpx.AsyncClient(timeout=60) as client:
        async with client.stream(
            "POST",
            f"{settings.ai_base_url.rstrip('/')}/chat/completions",
            headers=headers,
            json=payload,
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data = line[6:]
                if data == "[DONE]":
                    break
                event = json.loads(data)
                token = event["choices"][0].get("delta", {}).get("content")
                if token:
                    yield token


def stream_chat(messages: list[ChatMessage], settings: Settings) -> AsyncIterator[str]:
    if settings.ai_provider.lower() == "openai":
        return stream_openai(messages, settings)
    return stream_mock(messages)
