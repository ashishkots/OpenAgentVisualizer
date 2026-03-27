"""Middleware that generates/propagates a correlation ID for every request."""
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


CORRELATION_HEADER = "X-Correlation-ID"


class CorrelationIDMiddleware(BaseHTTPMiddleware):
    """Attach a correlation ID to every request and response.

    Reads the X-Correlation-ID header from the incoming request.
    If absent, generates a new UUID4. The ID is bound to structlog
    contextvars so all log entries within the request carry it, and is
    echoed back in the response header.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        correlation_id = request.headers.get(CORRELATION_HEADER, str(uuid.uuid4()))
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(correlation_id=correlation_id)

        response = await call_next(request)
        response.headers[CORRELATION_HEADER] = correlation_id
        return response
