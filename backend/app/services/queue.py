# app/services/queue.py

from __future__ import annotations

import json
import logging
from collections.abc import Awaitable, Callable
from typing import Any
import asyncio
import redis.asyncio as redis
from redis.exceptions import ConnectionError, TimeoutError

from app.config import settings

logger = logging.getLogger(__name__)

STREAM_NAME = "signalsnap:events"
CONSUMER_GROUP = "signalsnap-workers"
CONSUMER_NAME = "worker-1"


redis_client = redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=10,
)

async def ensure_consumer_group() -> None:
    """
    Create the Redis Stream consumer group if it doesn't exist.
    """

    try:
        await redis_client.xgroup_create(
            name=STREAM_NAME,
            groupname=CONSUMER_GROUP,
            id="0",
            mkstream=True,
        )

        logger.info(
            "[queue] created consumer group %s",
            CONSUMER_GROUP,
        )

    except redis.ResponseError as exc:
        # BUSYGROUP means the group already exists.
        if "BUSYGROUP" not in str(exc):
            raise


async def enqueue_events(events: list[dict[str, Any]]) -> int:
    """
    Add tracking events to the Redis Stream.
    """

    if not events:
        return 0

    for event in events:
        await redis_client.xadd(
            STREAM_NAME,
            {
                "data": json.dumps(event),
            },
        )

    return len(events)


async def consume_events(
    processor: Callable[[dict[str, Any]], Awaitable[None]],
) -> None:
    """
    Continuously consume events from the Redis Stream.

    Events are acknowledged only after successful processing.
    """

    await ensure_consumer_group()

    logger.info(
        "[queue] listening on %s as %s",
        STREAM_NAME,
        CONSUMER_NAME,
    )

    while True:
        try:
            messages = await redis_client.xreadgroup(
                groupname=CONSUMER_GROUP,
                consumername=CONSUMER_NAME,
                streams={
                    STREAM_NAME: ">",
                },
                count=10,
                block=5000,
            )

            if not messages:
                continue

            for _, entries in messages:
                for message_id, fields in entries:
                    try:
                        raw_data = fields.get("data")

                        if not raw_data:
                            logger.error(
                                "[queue] message %s has no data",
                                message_id,
                            )

                            await redis_client.xack(
                                STREAM_NAME,
                                CONSUMER_GROUP,
                                message_id,
                            )
                            continue

                        event = json.loads(raw_data)

                        await processor(event)

                        await redis_client.xack(
                            STREAM_NAME,
                            CONSUMER_GROUP,
                            message_id,
                        )

                        logger.debug(
                            "[queue] processed %s",
                            message_id,
                        )

                    except Exception:
                        logger.exception(
                            "[queue] failed processing message %s",
                            message_id,
                        )

                        # Don't ACK failed events.
                        continue

        except TimeoutError:
            # The blocking read timed out.
            # This is not a fatal worker error.
            continue

        except ConnectionError:
            logger.exception(
                "[queue] Redis connection lost; retrying in 2 seconds"
            )

            await asyncio.sleep(2)

        except Exception:
            logger.exception(
                "[queue] unexpected consumer error; retrying in 2 seconds"
            )

            await asyncio.sleep(2)


async def close_queue() -> None:
    await redis_client.aclose()