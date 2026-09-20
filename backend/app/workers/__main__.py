import asyncio

from app.workers.event_worker import run_worker


if __name__ == "__main__":
    asyncio.run(run_worker())