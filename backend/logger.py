"""
Structured Error Logging Module for InterviewLens API.

Provides JSON-structured logging with:
- Request ID tracking for tracing requests across services
- Severity levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- Rotating file handler (5MB per file, 5 backups)
- Console output with color coding
- Contextual metadata (endpoint, method, user_id, latency, etc.)
"""

import logging
import logging.handlers
import json
import os
import sys
import time
import uuid
import traceback
from datetime import datetime, timezone
from typing import Optional, Any
from contextvars import ContextVar

# ──────────────────────────────────────────────
# Context variable for per-request tracking
# ──────────────────────────────────────────────
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="no-request")

LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

LOG_FILE = os.path.join(LOG_DIR, "app.log")
ERROR_LOG_FILE = os.path.join(LOG_DIR, "errors.log")


# ──────────────────────────────────────────────
# Custom JSON formatter
# ──────────────────────────────────────────────
class StructuredJSONFormatter(logging.Formatter):
    """Formats log records as single-line JSON objects."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", request_id_ctx.get("no-request")),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Attach extra structured fields if present
        for key in ("endpoint", "method", "status_code", "latency_ms",
                     "user_id", "client_ip", "error_type", "error_detail",
                     "stack_trace", "request_body", "response_body",
                     "rate_limit_key", "extra_data"):
            val = getattr(record, key, None)
            if val is not None:
                log_entry[key] = val

        # Attach exception info
        if record.exc_info and record.exc_info[1]:
            log_entry["error_type"] = type(record.exc_info[1]).__name__
            log_entry["error_detail"] = str(record.exc_info[1])
            log_entry["stack_trace"] = traceback.format_exception(*record.exc_info)

        return json.dumps(log_entry, default=str)


class ColorConsoleFormatter(logging.Formatter):
    """Pretty, colored console output for development."""

    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[1;31m",  # Bold Red
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        rid = getattr(record, "request_id", request_id_ctx.get("no-req"))[:8]
        ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]

        base = f"{color}[{ts}] {record.levelname:<8}{self.RESET} [{rid}] {record.getMessage()}"

        extra_parts = []
        for key in ("endpoint", "method", "status_code", "latency_ms",
                     "client_ip", "error_type"):
            val = getattr(record, key, None)
            if val is not None:
                extra_parts.append(f"{key}={val}")
        if extra_parts:
            base += f"  | {', '.join(extra_parts)}"

        if record.exc_info and record.exc_info[1]:
            base += f"\n{''.join(traceback.format_exception(*record.exc_info))}"

        return base


# ──────────────────────────────────────────────
# Logger setup
# ──────────────────────────────────────────────
def setup_logger(name: str = "interviewlens") -> logging.Logger:
    """Create and configure the application logger."""
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger  # Already configured

    logger.setLevel(logging.DEBUG)
    logger.propagate = False

    # 1. Rotating file handler – JSON structured (all levels)
    file_handler = logging.handlers.RotatingFileHandler(
        LOG_FILE,
        maxBytes=5 * 1024 * 1024,  # 5 MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(StructuredJSONFormatter())
    logger.addHandler(file_handler)

    # 2. Error-only file handler – JSON structured
    error_handler = logging.handlers.RotatingFileHandler(
        ERROR_LOG_FILE,
        maxBytes=5 * 1024 * 1024,
        backupCount=3,
        encoding="utf-8",
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(StructuredJSONFormatter())
    logger.addHandler(error_handler)

    # 3. Console handler – colored, human-readable
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(ColorConsoleFormatter())
    logger.addHandler(console_handler)

    return logger


# Singleton logger
app_logger = setup_logger()


# ──────────────────────────────────────────────
# Convenience helpers
# ──────────────────────────────────────────────
def log_request(
    method: str,
    endpoint: str,
    client_ip: str = "",
    user_id: str = "",
    request_body: Any = None,
):
    """Log an incoming API request."""
    app_logger.info(
        f"→ {method} {endpoint}",
        extra={
            "request_id": request_id_ctx.get("no-request"),
            "method": method,
            "endpoint": endpoint,
            "client_ip": client_ip,
            "user_id": user_id,
            "request_body": _safe_truncate(request_body),
        },
    )


def log_response(
    method: str,
    endpoint: str,
    status_code: int,
    latency_ms: float,
    client_ip: str = "",
):
    """Log an outgoing API response."""
    level = logging.INFO if status_code < 400 else logging.WARNING if status_code < 500 else logging.ERROR
    app_logger.log(
        level,
        f"← {method} {endpoint} → {status_code} ({latency_ms:.1f}ms)",
        extra={
            "request_id": request_id_ctx.get("no-request"),
            "method": method,
            "endpoint": endpoint,
            "status_code": status_code,
            "latency_ms": round(latency_ms, 2),
            "client_ip": client_ip,
        },
    )


def log_error(
    message: str,
    error: Optional[Exception] = None,
    endpoint: str = "",
    **extra,
):
    """Log an error with full context."""
    extra_fields = {
        "request_id": request_id_ctx.get("no-request"),
        "endpoint": endpoint,
        "error_type": type(error).__name__ if error else "Unknown",
        "error_detail": str(error) if error else message,
        **extra,
    }
    if error:
        extra_fields["stack_trace"] = traceback.format_exception(
            type(error), error, error.__traceback__
        )
    app_logger.error(message, extra=extra_fields)


def log_rate_limit(
    client_ip: str,
    endpoint: str,
    rate_limit_key: str = "",
):
    """Log a rate-limit hit."""
    app_logger.warning(
        f"⚠ Rate limit exceeded: {client_ip} on {endpoint}",
        extra={
            "request_id": request_id_ctx.get("no-request"),
            "client_ip": client_ip,
            "endpoint": endpoint,
            "rate_limit_key": rate_limit_key,
        },
    )


def generate_request_id() -> str:
    """Generate a unique request ID."""
    return str(uuid.uuid4())


def _safe_truncate(data: Any, max_len: int = 500) -> Any:
    """Truncate large payloads for safe logging."""
    if data is None:
        return None
    s = str(data)
    if len(s) > max_len:
        return s[:max_len] + "... [truncated]"
    return s
