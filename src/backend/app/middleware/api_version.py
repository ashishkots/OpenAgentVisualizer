"""Middleware that adds API version headers and rewrites /api/v1/ paths.

ADR-009: Both /api/ and /api/v1/ serve identical handlers. The v1 rewrite
middleware transparently maps GET /api/v1/agents -> /api/agents so existing
router definitions remain unchanged while clients can use either prefix.

The X-API-Version response header is added to every API response so consumers
can confirm the version served without inspecting the URL.
"""
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


_V1_PREFIX = "/api/v1"
_LEGACY_PREFIX = "/api"


class APIVersionMiddleware(BaseHTTPMiddleware):
    """Rewrite /api/v1/* to /api/* and add X-API-Version header.

    Path rewriting is done at the ASGI scope level before any routing so
    the existing router tree (which registers paths starting with /api/)
    can serve both the legacy and versioned prefixes without duplication.

    The header X-API-Version: 1 is appended to every API response.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Rewrite /api/v1/... -> /api/...
        path: str = request.scope.get("path", "")
        if path.startswith(_V1_PREFIX + "/") or path == _V1_PREFIX:
            new_path = _LEGACY_PREFIX + path[len(_V1_PREFIX):]
            request.scope["path"] = new_path
            # Also rewrite raw_path bytes for compatibility with some ASGI servers
            request.scope["raw_path"] = new_path.encode("utf-8")

        response = await call_next(request)

        # Attach version header to all /api/ responses
        resp_path: str = path  # use original path for header decision
        if resp_path.startswith("/api"):
            response.headers["X-API-Version"] = "1"

        return response
