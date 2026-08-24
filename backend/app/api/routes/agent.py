import asyncio
import json
from collections.abc import AsyncIterator
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.agent.runtime import JOBS, SESSIONS, process_job, run_agent, stream_agent
from app.schemas import AgentResult, AgentRunRequest, BackgroundJobRequest

router = APIRouter(prefix="/api/v1")


@router.post("/agent/run", response_model=AgentResult)
async def agent_run(request: AgentRunRequest) -> AgentResult:
    _, result = run_agent(request.prompt, request.session_id)
    return result


async def event_stream(request: AgentRunRequest) -> AsyncIterator[str]:
    async for event in stream_agent(request.prompt, request.session_id):
        yield f"data: {json.dumps(event)}\n\n"


@router.post("/agent/stream")
async def agent_stream(request: AgentRunRequest) -> StreamingResponse:
    return StreamingResponse(event_stream(request), media_type="text/event-stream")


@router.get("/sessions/{session_id}")
async def session_history(session_id: str) -> dict[str, object]:
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"id": session_id, "messages": SESSIONS[session_id]}


@router.post("/jobs", status_code=202)
async def create_job(request: BackgroundJobRequest) -> dict[str, str]:
    job_id = str(uuid4())
    JOBS[job_id] = {"id": job_id, "status": "queued", **request.model_dump()}
    asyncio.create_task(process_job(job_id))
    return {"id": job_id, "status": "queued"}


@router.get("/jobs/{job_id}")
async def get_job(job_id: str) -> dict[str, object]:
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    return JOBS[job_id]
