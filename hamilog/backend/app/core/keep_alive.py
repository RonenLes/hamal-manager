import asyncio
import logging
import os
from contextlib import suppress

import httpx

logger = logging.getLogger(__name__)

KEEP_ALIVE_INTERVAL_SECONDS = 14 * 60


async def keep_alive_ping_loop() -> None:
    """Ping the deployed service periodically to reduce Render cold starts."""
    keep_alive_url = os.getenv("KEEP_ALIVE_URL", "").strip()
    if not keep_alive_url:
        logger.info("KEEP_ALIVE_URL is not set; keep-alive ping is disabled.")
        return

    timeout = httpx.Timeout(10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        while True:
            await asyncio.sleep(KEEP_ALIVE_INTERVAL_SECONDS)
            try:
                response = await client.get(keep_alive_url)
                logger.info(
                    "Keep-alive ping to %s returned %s.",
                    keep_alive_url,
                    response.status_code,
                )
            except Exception:
                logger.exception("Keep-alive ping to %s failed.", keep_alive_url)


def start_keep_alive_task() -> asyncio.Task:
    """Start the keep-alive background task."""
    return asyncio.create_task(keep_alive_ping_loop())


async def stop_keep_alive_task(task: asyncio.Task | None) -> None:
    """Stop the keep-alive background task."""
    if task is None:
        return

    task.cancel()
    with suppress(asyncio.CancelledError):
        await task
