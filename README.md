# SignalSnap

SignalSnap is a real-time website visitor intelligence and lead-scoring platform.

It collects visitor activity from a website, processes events asynchronously through Redis, builds visitor and session profiles, calculates purchase intent, identifies potential leads, and exposes analytics through a FastAPI backend.

## Architecture

```text
Website
   │
   ▼
Tracking Events
   │
   ▼
FastAPI API
   │
   ▼
Redis Streams
   │
   ▼
Background Worker
   │
   ├── Visitor / Session Processing
   ├── Event Processing
   ├── Intent Scoring
   ├── Lead Detection
   └── IP Enrichment
   │
   ▼
PostgreSQL
   │
   ▼
Dashboard / REST API
```

## Tech Stack

* Python
* FastAPI
* PostgreSQL
* SQLAlchemy
* Alembic
* Redis
* Redis Streams
* JWT Authentication
* OAuth2
* Pytest
* Uvicorn
* HTML / CSS / JavaScript

## Project Structure

```text
signalsnap/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   └── workers/
│   ├── alembic/
│   ├── tests/
│   ├── alembic.ini
│   └── pyproject.toml
│
├── dashboard/
│   └── ...
│
└── test-site/
    └── ...
```

# Requirements

Make sure the following are installed:

* Python 3.10+
* `uv`
* PostgreSQL
* Docker
* Git

# Setup

## 1. Create the Database

Open PostgreSQL:

```bash
psql -U postgres
```

Create the SignalSnap database:

```sql
CREATE DATABASE signalsnap;
```

Exit PostgreSQL:

```sql
\q
```

## 2. Run Database Migrations

Move into the backend directory:

```bash
cd backend
```

Run the migrations:

```bash
alembic upgrade head
```

## 3. Start Redis

SignalSnap uses Redis for asynchronous event processing and Redis Streams.

```bash
docker run -d \
  --name signalsnap-redis \
  -p 6379:6379 \
  redis:7
```

Verify Redis is running:

```bash
docker ps
```

## 4. Start the FastAPI Backend

From the `backend` directory:

```bash
uv run uvicorn app.main:app --reload
```

The API will be available at:

```text
http://localhost:8000
```

Swagger API documentation:

```text
http://localhost:8000/docs
```

ReDoc documentation:

```text
http://localhost:8000/redoc
```

## 5. Start the Event Worker

Open another terminal:

```bash
cd backend
```

Start the worker:

```bash
uv run python -m app.workers
```

Keep the worker running while using SignalSnap.

## 6. Start the Dashboard

Open another terminal:

```bash
cd dashboard
```

Start the dashboard:

```bash
python3 -m http.server 5173
```

Open:

```text
http://localhost:5173
```

## 7. Start the Test Website

Open another terminal:

```bash
cd test-site
```

Start the test website:

```bash
python3 -m http.server 3000
```

Open:

```text
http://localhost:3000
```

# Running Tests

From the backend directory:

```bash
uv run pytest -v
```

For more detailed output:

```bash
uv run pytest -vv
```

# Services

Once everything is running:

| Service   | URL                        |
| --------- | -------------------------- |
| Dashboard | http://localhost:5173      |
| Test Site | http://localhost:3000      |
| API       | http://localhost:8000      |
| API Docs  | http://localhost:8000/docs |

# Authentication

SignalSnap uses JWT-based authentication with OAuth2.

The authentication flow is:

```text
User
 │
 ▼
Login
 │
 ▼
OAuth2 Authentication
 │
 ▼
JWT Access Token
 │
 ▼
Protected API Endpoint
```

Protected endpoints require a valid JWT access token.

# Event Processing

SignalSnap separates event collection from event processing.

```text
Visitor
   │
   ▼
Tracking Script
   │
   ▼
/track API
   │
   ▼
Redis Stream
   │
   ▼
Background Worker
   │
   ├── Process Event
   ├── Update Visitor
   ├── Update Session
   ├── Calculate Intent
   └── Detect Lead
   │
   ▼
PostgreSQL
```

This allows tracking events to be accepted by the API and processed asynchronously by the worker.

# Core Features

## Visitor Tracking

Tracks website visitor activity and maintains visitor profiles.

## Session Tracking

Groups visitor activity into sessions.

## Event Tracking

Collects website events such as page views and other visitor interactions.

## Intent Scoring

Calculates purchase-intent scores based on visitor behavior.

## Lead Detection

Identifies visitors who demonstrate behavior associated with potential leads.

## IP Enrichment

Enriches visitor information using IP-based data where supported.

## Real-Time Event Processing

Uses Redis Streams and background workers to process visitor events asynchronously.

## Analytics API

Provides REST endpoints for retrieving visitor, event, lead, and statistics data.

## Dashboard

Provides a visual interface for monitoring visitors, events, leads, and analytics.

# Database Migrations

When database models change, create a new migration:

```bash
alembic revision --autogenerate -m "describe your change"
```

Review the generated migration before applying it.

Apply the migration:

```bash
alembic upgrade head
```

Check the current migration:

```bash
alembic current
```

View migration history:

```bash
alembic history
```

# API Documentation

After starting the backend:

### Swagger UI

```text
http://localhost:8000/docs
```

### ReDoc

```text
http://localhost:8000/redoc
```

These interfaces can be used to explore and test the available REST API endpoints.

# Health Check

Check whether the API is running:

```bash
curl http://localhost:8000/health
```

# Statistics

Retrieve SignalSnap statistics:

```bash
curl http://localhost:8000/stats
```

The response includes information such as visitor and event counts.

# Testing the System

After starting all services:

1. Open the test website:

```text
http://localhost:3000
```

2. Perform actions on the website to generate tracking events.

3. The events are sent to the SignalSnap backend.

4. The backend publishes events to Redis.

5. The background worker consumes and processes the events.

6. Processed data is stored in PostgreSQL.

7. Open the dashboard:

```text
http://localhost:5173
```

8. View the resulting visitor, session, event, intent, and lead information.

# Troubleshooting

## Redis Connection Issues

Check whether Redis is running:

```bash
docker ps
```

If the container exists but is stopped:

```bash
docker start signalsnap-redis
```

## Database Migration Issues

Check the current migration:

```bash
alembic current
```

Then run:

```bash
alembic upgrade head
```

## Backend Import Issues

Make sure you are inside the backend directory:

```bash
cd backend
```

Then run:

```bash
uv run uvicorn app.main:app --reload
```

## Test Failures

Run:

```bash
uv run pytest -v
```

For detailed output:

```bash
uv run pytest -vv
```

# Quick Start

```bash
# Create database
psql -U postgres
```

```sql
CREATE DATABASE signalsnap;
```

Then:

```bash
# Enter backend
cd backend

# Apply migrations
alembic upgrade head

# Start Redis
docker run -d \
  --name signalsnap-redis \
  -p 6379:6379 \
  redis:7

# Start API
uv run uvicorn app.main:app --reload
```

In another terminal:

```bash
cd backend
uv run python -m app.workers
```

In another terminal:

```bash
cd dashboard
python3 -m http.server 5173
```

In another terminal:

```bash
cd test-site
python3 -m http.server 3000
```

Run tests:

```bash
cd backend
uv run pytest -v
```
