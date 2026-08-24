# Next.js Python AI Chatbot Kit

A full-stack starter for streaming AI chat products. The frontend is Next.js;
the backend is FastAPI with a provider boundary for OpenAI-compatible APIs.

## Features

- streamed responses over Server-Sent Events
- conversation history passed to the model
- responsive chat UI and mobile conversation drawer
- starter prompts, loading state, and error recovery
- credential-free mock provider for local development
- configurable model, base URL, system prompt, and API key
- Docker Compose and CI-ready checks

## Start locally

```bash
cd frontend && npm install
cd ../backend && python -m pip install -e ".[dev]"
cd .. && npm run dev
```

Open `http://127.0.0.1:3000`. The API and Swagger UI run at
`http://127.0.0.1:8000` and `http://127.0.0.1:8000/docs`.

Mock mode works without an API key. For a real provider, copy
`backend/.env.example` to `backend/.env` and set:

```env
AI_PROVIDER=openai
AI_API_KEY=your-key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4.1-mini
```

Any service implementing the OpenAI chat-completions streaming format can be
used by changing `AI_BASE_URL` and `AI_MODEL`.

## Verify

```bash
npm run check
```

This runs frontend lint/build plus backend Ruff and Pytest.
