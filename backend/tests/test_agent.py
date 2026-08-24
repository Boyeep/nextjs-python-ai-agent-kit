from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_agent_returns_structured_tool_result() -> None:
    response = client.post("/api/v1/agent/run", json={"prompt": "calculate: 6 * 7"})
    assert response.status_code == 200
    assert response.json() == {
        "answer": "The result is 42.",
        "summary": "The result is 42.",
        "tools_used": ["calculator"],
        "data": {"result": 42.0},
    }


def test_agent_stream_exposes_events() -> None:
    response = client.post("/api/v1/agent/stream", json={"prompt": "What time is it?"})
    assert response.status_code == 200
    assert '"type": "tool"' in response.text
    assert '"type": "result"' in response.text


def test_background_job_lifecycle() -> None:
    created = client.post("/api/v1/jobs", json={"task": "summarize", "input": "Long text"})
    assert created.status_code == 202
    job = client.get(f"/api/v1/jobs/{created.json()['id']}")
    assert job.status_code == 200
    assert job.json()["status"] in {"queued", "running", "completed"}
