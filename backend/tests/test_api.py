import json

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_mock_chat_stream() -> None:
    response = client.post(
        "/api/v1/chat/stream",
        json={"messages": [{"role": "user", "content": "Hello"}]},
    )
    assert response.status_code == 200
    tokens = []
    for event in response.text.split("\n\n"):
        if event.startswith("data: "):
            tokens.append(json.loads(event[6:]).get("token", ""))
    assert "built-in demo provider" in "".join(tokens)
    assert '"done": true' in response.text
