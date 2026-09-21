# SignalSnap

Real-time website visitor intelligence and lead scoring platform built with FastAPI, PostgreSQL, Redis Streams, and a lightweight JavaScript tracking SDK.

SignalSnap collects visitor activity, processes events asynchronously, builds visitor/session profiles, calculates intent scores, and identifies potential leads.

## Architecture

```text
Website
   ↓
SignalSnap JS SDK
   ↓
FastAPI /track
   ↓
Redis Streams
   ↓
Background Worker
   ↓
PostgreSQL
   ↓
REST API + Dashboard
```

### Features

* Real-time visitor and session tracking
* Automatic page-view and custom event tracking
* Persistent anonymous visitor IDs
* Redis Streams asynchronous processing
* Visitor/session/event persistence
* Behavioral intent scoring
* Lead detection and status management
* IP-based visitor enrichment
* JWT + OAuth2 authentication
* Analytics dashboard
* Alembic migrations
* Pytest test suite
* Docker Compose support

## Tech Stack

| Component       | Technology            |
| --------------- | --------------------- |
| Backend         | FastAPI, Python       |
| Database        | PostgreSQL            |
| ORM             | SQLAlchemy            |
| Queue           | Redis Streams         |
| Auth            | OAuth2 + JWT          |
| Migrations      | Alembic               |
| SDK             | Vanilla JavaScript    |
| Dashboard       | HTML, CSS, JavaScript |
| Testing         | Pytest                |
| Package Manager | uv                    |
| Deployment      | Docker                |

## Project Structure

```text
signalsnap/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── workers/
│   ├── alembic/
│   └── tests/
├── dashboard/
├── pixel/
├── test-site/
├── docker-compose.prod.yaml
└── README.md
```

## Quick Start

### 1. Clone

```bash
git clone https://github.com/Raghav361-art/signalsnap.git
cd signalsnap
```

### 2. Start PostgreSQL and Redis

```bash
docker compose -f docker-compose.prod.yaml up -d postgres redis
```

### 3. Install backend

```bash
cd backend
uv sync
uv run alembic upgrade head
```

### 4. Start API

```bash
uv run uvicorn app.main:app --reload
```

### 5. Start worker

```bash
uv run python -m app.workers
```

API:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

The SDK maintains a persistent `anonymous_id`, a per-tab `session_id`, batches events, automatically tracks page views, and retries failed requests.

## API

| Endpoint                   | Purpose         |
| -------------------------- | --------------- |
| `POST /auth/register`      | Register user   |
| `POST /auth/token`         | Login / JWT     |
| `POST /track`              | Track events    |
| `GET /visitors`            | List visitors   |
| `GET /visitors/{id}`       | Visitor details |
| `GET /leads`               | List leads      |
| `GET /leads/{id}`          | Lead details    |
| `PATCH /leads/{id}/status` | Update lead     |
| `GET /stats`               | Analytics       |
| `GET /health`              | Health check    |

## Testing

```bash
cd backend
uv run pytest -v
```
