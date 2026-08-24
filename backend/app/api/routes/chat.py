import json
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.chat.provider import stream_chat
from app.config import get_settings
from app.schemas import ChatRequest

router = APIRouter(prefix="/api/v1")


async def event_stream(request: ChatRequest) -> AsyncIterator[str]:
    try:
        async for token in stream_chat(request.messages, get_settings()):
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield 'data: {"done": true}\n\n'
    except Exception as error:
        yield f"data: {json.dumps({'error': str(error)})}\n\n"


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest) -> StreamingResponse:
    return StreamingResponse(event_stream(request), media_type="text/event-stream")
