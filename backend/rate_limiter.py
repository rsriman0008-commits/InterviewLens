"""
Rate Limiting Module for InterviewLens API.

Uses slowapi (built on top of the `limits` library) to enforce request-rate
limits per client IP.  Each endpoint can have its own limit, with a global
fallback.

Limits are defined as strings understood by the `limits` library:
  "10/minute"   → 10 requests per minute
  "100/hour"    → 100 requests per hour
  "5 per second" → 5 requests per second

Custom 429 handler returns a structured JSON response with Retry-After header.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from logger import log_rate_limit, app_logger
import time

# ──────────────────────────────────────────────
# Per-endpoint rate limits
# ──────────────────────────────────────────────
RATE_LIMITS = {
    # AI-heavy endpoints (expensive) – stricter limits
    "/api/generate-question": "12/minute",
    "/api/evaluate-code": "10/minute",
    "/api/generate-feedback": "6/minute",
    "/api/run-code": "15/minute",

    # TTS / STT – moderate limits
    "/api/text-to-speech": "20/minute",
    "/api/speech-to-text": "20/minute",

    # Health / lightweight – generous limits
    "/api/health": "60/minute",
}

# Global default: 30 requests/minute per IP
DEFAULT_RATE_LIMIT = "30/minute"


# ──────────────────────────────────────────────
# Key function: extract client IP
# ──────────────────────────────────────────────
def _get_client_ip(request: Request) -> str:
    """Get real client IP, respecting proxies (X-Forwarded-For)."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ──────────────────────────────────────────────
# Limiter instance
# ──────────────────────────────────────────────
limiter = Limiter(
    key_func=_get_client_ip,
    default_limits=[DEFAULT_RATE_LIMIT],
    storage_uri="memory://",       # In-memory for single-instance; swap to Redis for multi-instance
    strategy="fixed-window",
)


# ──────────────────────────────────────────────
# Custom 429 handler
# ──────────────────────────────────────────────
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Return a structured JSON 429 response and log the event."""
    client_ip = _get_client_ip(request)
    endpoint = request.url.path

    log_rate_limit(
        client_ip=client_ip,
        endpoint=endpoint,
        rate_limit_key=f"{client_ip}:{endpoint}",
    )

    # Parse retry window from the limit string
    retry_after = 60  # default
    limit_detail = str(exc.detail) if exc.detail else ""

    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please slow down.",
            "error": "RATE_LIMIT_EXCEEDED",
            "limit": limit_detail,
            "retry_after_seconds": retry_after,
            "endpoint": endpoint,
        },
        headers={
            "Retry-After": str(retry_after),
            "X-RateLimit-Limit": limit_detail,
        },
    )


# ──────────────────────────────────────────────
# Attach to FastAPI app
# ──────────────────────────────────────────────
def setup_rate_limiting(app: FastAPI) -> None:
    """Attach the rate limiter to the FastAPI application."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
    app_logger.info("✓ Rate limiting enabled", extra={
        "default_limit": DEFAULT_RATE_LIMIT,
        "endpoint_limits": RATE_LIMITS,
    })
