import ast
import asyncio
import operator
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from app.schemas import AgentResult

SESSIONS: dict[str, list[dict[str, str]]] = {}
JOBS: dict[str, dict[str, Any]] = {}

_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
}


def calculate(expression: str) -> float:
    def evaluate(node: ast.AST) -> float:
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return float(node.value)
        if isinstance(node, ast.BinOp) and type(node.op) in _OPERATORS:
            return _OPERATORS[type(node.op)](evaluate(node.left), evaluate(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in _OPERATORS:
            return _OPERATORS[type(node.op)](evaluate(node.operand))
        raise ValueError("Only basic arithmetic is supported.")

    return evaluate(ast.parse(expression, mode="eval").body)


def run_agent(prompt: str, session_id: str | None = None) -> tuple[str, AgentResult]:
    resolved_session = session_id or str(uuid4())
    history = SESSIONS.setdefault(resolved_session, [])
    tools_used: list[str] = []
    data: dict[str, Any] = {}
    answer = f"I prepared a structured response for: {prompt}"

    if prompt.lower().startswith("calculate:"):
        value = calculate(prompt.split(":", 1)[1].strip())
        tools_used.append("calculator")
        data["result"] = value
        answer = f"The result is {value:g}."
    elif "time" in prompt.lower():
        value = datetime.now(UTC).isoformat()
        tools_used.append("current_time")
        data["utc"] = value
        answer = f"The current UTC time is {value}."

    history.extend(({"role": "user", "content": prompt}, {"role": "assistant", "content": answer}))
    result = AgentResult(answer=answer, summary=answer[:160], tools_used=tools_used, data=data)
    return resolved_session, result


async def stream_agent(prompt: str, session_id: str | None = None) -> AsyncIterator[dict[str, Any]]:
    resolved_session, result = run_agent(prompt, session_id)
    yield {"type": "session", "session_id": resolved_session}
    for tool in result.tools_used:
        yield {"type": "tool", "name": tool, "status": "completed"}
    for word in result.answer.split():
        yield {"type": "token", "value": f"{word} "}
        await asyncio.sleep(0.02)
    yield {"type": "result", "value": result.model_dump()}


async def process_job(job_id: str) -> None:
    JOBS[job_id]["status"] = "running"
    await asyncio.sleep(0.15)
    task = JOBS[job_id]["task"]
    source = JOBS[job_id]["input"]
    JOBS[job_id].update(status="completed", result={"task": task, "summary": source[:240]})
