"""
ICMP Ping service for checking device reachability and latency.
Uses subprocess-based ping for cross-platform compatibility (no admin rights needed).
"""
import asyncio
import platform
import re
import time
from typing import Optional, Tuple
from config import PING_TIMEOUT_SECONDS, LATENCY_WARNING_THRESHOLD_MS


async def ping_host(ip_address: str, timeout: int = PING_TIMEOUT_SECONDS) -> Tuple[str, Optional[float]]:
    """
    Ping a host and return (status, latency_ms).

    Returns:
        ('online', latency_ms) - Host reachable with normal latency
        ('warning', latency_ms) - Host reachable but high latency
        ('offline', None) - Host unreachable
    """
    try:
        # Use system ping command (works without admin/root privileges)
        system = platform.system().lower()
        if system == "windows":
            cmd = ["ping", "-n", "1", "-w", str(timeout * 1000), ip_address]
        else:
            cmd = ["ping", "-c", "1", "-W", str(timeout), ip_address]

        start_time = time.monotonic()

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, _ = await asyncio.wait_for(
            process.communicate(),
            timeout=timeout + 2
        )

        elapsed = (time.monotonic() - start_time) * 1000  # ms

        if process.returncode == 0:
            # Try to extract latency from ping output
            output = stdout.decode("utf-8", errors="ignore")
            latency = _extract_latency(output, system)
            if latency is None:
                latency = elapsed

            if latency > LATENCY_WARNING_THRESHOLD_MS:
                return ("warning", round(latency, 1))
            return ("online", round(latency, 1))
        else:
            return ("offline", None)

    except asyncio.TimeoutError:
        return ("offline", None)
    except Exception:
        return ("offline", None)


def _extract_latency(output: str, system: str) -> Optional[float]:
    """Extract latency from ping command output."""
    try:
        if system == "windows":
            # Windows: "Reply from x.x.x.x: bytes=32 time=1ms TTL=64"
            match = re.search(r"time[=<](\d+\.?\d*)ms", output, re.IGNORECASE)
        else:
            # Linux/macOS: "64 bytes from x.x.x.x: icmp_seq=1 ttl=64 time=1.23 ms"
            match = re.search(r"time[=](\d+\.?\d*)\s*ms", output, re.IGNORECASE)

        if match:
            return float(match.group(1))
    except Exception:
        pass
    return None


async def ping_multiple(ip_addresses: list, timeout: int = PING_TIMEOUT_SECONDS) -> dict:
    """
    Ping multiple hosts concurrently.

    Returns dict mapping ip_address -> (status, latency_ms)
    """
    tasks = {ip: ping_host(ip, timeout) for ip in ip_addresses}
    results = {}
    for ip, coro in tasks.items():
        results[ip] = await coro  # Sequential to avoid flooding
    return results


async def ping_multiple_concurrent(ip_addresses: list, max_concurrent: int = 10) -> dict:
    """
    Ping multiple hosts with limited concurrency.
    """
    semaphore = asyncio.Semaphore(max_concurrent)
    results = {}

    async def _ping_with_semaphore(ip: str):
        async with semaphore:
            result = await ping_host(ip)
            results[ip] = result

    await asyncio.gather(*[_ping_with_semaphore(ip) for ip in ip_addresses])
    return results
