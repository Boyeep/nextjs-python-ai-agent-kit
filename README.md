# Next.js + Python AI Agent Kit

[![npm version](https://img.shields.io/npm/v/%40boyeep%2Fnextjs-python-ai-agent-kit)](https://www.npmjs.com/package/@boyeep/nextjs-python-ai-agent-kit) [![npm downloads](https://img.shields.io/npm/dm/%40boyeep%2Fnextjs-python-ai-agent-kit)](https://www.npmjs.com/package/@boyeep/nextjs-python-ai-agent-kit) [![license](https://img.shields.io/npm/l/%40boyeep%2Fnextjs-python-ai-agent-kit)](https://www.npmjs.com/package/@boyeep/nextjs-python-ai-agent-kit)

Create a project directly from npm:

```bash
npx @boyeep/nextjs-python-ai-agent-kit my-agent
```


A production-minded starter for agentic applications. It combines a Next.js
workspace with a FastAPI agent runtime and remains useful without paid services
through its deterministic demo tools.

## Included

- SSE token, tool, session, and structured-result events
- typed structured output with Pydantic
- safe calculator and current-time example tools
- server-side conversation sessions
- asynchronous job submission and status polling
- OpenAI-compatible streaming chat provider
- responsive Next.js interface, Docker Compose, tests, and CI

## Run

```bash
cd frontend && npm install
cd ../backend && python -m pip install -e ".[dev]"
cd .. && npm run dev
```

Use `POST /api/v1/agent/stream` for interactive runs, `GET
/api/v1/sessions/{id}` for history, and `POST /api/v1/jobs` for work that should
continue outside the request lifecycle. API documentation is available at
`http://127.0.0.1:8000/docs`.

## Verify

```bash
npm run check
```
