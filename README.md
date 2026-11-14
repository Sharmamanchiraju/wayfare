# Wayfare

AI trip planning for India. Wayfare is a conversational planner: it collects your trip details through chat, then generates a structured, day-by-day itinerary with a map, route, and budget breakdown.

> **Status:** active development. India-first; international trips are planned for a later release.

## Features

- **Conversational slot-filling.** The agent collects destination, departure city, trip type, budget, group size, and duration, asking for one or two missing items at a time.
- **Destination-change handling.** If you change a confirmed destination, the agent asks before discarding your plan.
- **Structured itinerary generation.** Output is validated against a Pydantic schema: flights, hotels, timed stops with coordinates, local transport, and a cost breakdown.
- **Grounded tools.** Geocoding, weather, nearby places (OpenStreetMap/Overpass), and routing (OSRM).
- **Honest failure handling.** Place results are labelled live, cached, or stale instead of silently falling back.
- **Editable plans.** Update the budget breakdown and route stops; routes are recalculated.
- **Accounts and personas.** JWT authentication, saved travel personas, and saved places.

## Architecture

```
┌────────────┐   REST    ┌──────────────────────────────┐    ┌────────────┐
│  Next.js   │ ────────▶ │  FastAPI                     │ ─▶ │ PostgreSQL │
│  (React,   │           │  routes → services → repos   │    └────────────┘
│  Tailwind) │           │                              │
└────────────┘           │  LangGraph agent             │    ┌────────────┐
                         │  extractor → controller →    │ ─▶ │ Groq LLMs  │
                         │  responder                   │    └────────────┘
                         │                              │    ┌────────────┐
                         │  Tools: geocode, weather,    │ ─▶ │ OSM, OSRM, │
                         │  places, route, currency     │    │ weather    │
                         └──────────────────────────────┘    └────────────┘
```

### The agent

The planner in `backend/app/agent/` is a three-node LangGraph pipeline:

1. **Extractor.** A larger model extracts trip details from the latest message only.
2. **Controller.** A deterministic state machine merges those details into a persistent `trip_state`, normalizes values (for example "couple" → 2 travelers, "₹" → INR), detects destination conflicts, and moves the trip through `collecting` → `clarifying` → `ready_to_generate`.
3. **Responder.** A smaller, faster model writes the reply: the next question, a confirmation, or an answer about the existing itinerary.

State reducers guarantee that slots collected in earlier turns are never overwritten by empty values.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, framer-motion, TanStack Query |
| Backend | FastAPI, SQLAlchemy 2 (async), Alembic, Pydantic v2 |
| AI | LangGraph, LangChain, Groq |
| Database | PostgreSQL 15 |
| Infra | Docker, Docker Compose |

## Getting started

### Prerequisites

- Docker and Docker Compose
- A [Groq API key](https://console.groq.com)

### Run with Docker

```bash
git clone https://github.com/Sharmamanchiraju/wayfare.git
cd wayfare
cp .env.example .env
```

Edit `.env`:

- Set `GROQ_API_KEY`.
- Set `JWT_SECRET` to a strong random value: `openssl rand -hex 32`.
- Change `POSTGRES_PASSWORD`.

Then start everything:

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |

Database migrations run automatically when the backend container starts.

### Run locally without Docker

Backend:

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

You need a running PostgreSQL instance, and `DATABASE_URL` in `.env` must point at it (`postgresql+asyncpg://...`).

## Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Async Postgres connection string |
| `JWT_SECRET` | Signing key for access and refresh tokens |
| `JWT_ALGORITHM` | Token algorithm (default `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime |
| `GROQ_API_KEY` | LLM provider key |
| `NEXT_PUBLIC_API_URL` | Backend URL as seen from the browser |

See [.env.example](.env.example) for the full list. Never commit `.env`.

## Project structure

```
backend/
  app/
    agent/         LangGraph pipeline, state, normalizer, model router, tests
    tools/         Tools exposed to the agent
    services/      Business logic (chat, trips, places, weather, flights, auth)
    repositories/  Data access
    routes/        FastAPI routers (auth, personas, trips, chat, saved places)
    db/            Engine, models, Postgres-backed cache / rate limiter / idempotency
    schemas/       Pydantic request and response models
  alembic/         Database migrations
frontend/
  src/app/         Pages (App Router)
  src/components/  UI components
  src/hooks/       Data-fetching and state hooks
  src/lib/         API client
```

## API overview

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `GET /auth/me` |
| Personas | CRUD under `/personas` |
| Trips | CRUD under `/trips`, plus messages, budget, and route updates |
| Chat | `POST /trips/{id}/chat`, `POST /trips/chat` (pre-trip slot filling) |
| Saved places | CRUD under `/saved-places` |

Full interactive docs are at `/docs` when the backend is running.

## Roadmap

- [ ] India-first planning: INR defaults, train/flight/bus/cab options, season and permit advisories, curated destination data
- [ ] Postgres-backed LangGraph checkpointer
- [ ] CI (lint, type-check, tests, image builds)
- [ ] Production deployment configuration
- [ ] International trip mode

## Known limitations

- Hotel, flight, and transport prices are estimates, not live fares. There is no booking.
- The agent checkpointer is in-memory; conversation state is rebuilt from the database on each request.

## License

To be decided.
