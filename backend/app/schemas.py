from typing import Any, Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=20_000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=50)


class HealthResponse(BaseModel):
    status: str
    provider: str
    model: str


class AgentRunRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=20_000)
    session_id: str | None = None


class AgentResult(BaseModel):
    answer: str
    summary: str
    tools_used: list[str] = Field(default_factory=list)
    data: dict[str, Any] = Field(default_factory=dict)


class BackgroundJobRequest(BaseModel):
    task: Literal["research", "summarize", "extract"]
    input: str = Field(min_length=1, max_length=50_000)
