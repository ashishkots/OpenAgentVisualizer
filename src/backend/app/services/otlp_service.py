from datetime import datetime, timezone
from typing import Any


def decode_otlp_http_json(payload: dict) -> list:
    """Decode OTLP HTTP JSON spans into normalised span dicts."""
    spans = []
    for rs in payload.get("resourceSpans", []):
        workspace_id = _extract_attr(
            rs.get("resource", {}).get("attributes", []), "workspace.id"
        ) or "unknown"
        for ss in rs.get("scopeSpans", []):
            for span in ss.get("spans", []):
                start_ns = int(span.get("startTimeUnixNano", 0))
                end_ns = int(span.get("endTimeUnixNano", 0))
                spans.append({
                    "workspace_id": workspace_id,
                    "trace_id": span.get("traceId", ""),
                    "span_id": span.get("spanId", ""),
                    "parent_span_id": span.get("parentSpanId"),
                    "name": span.get("name", ""),
                    "start_time": datetime.fromtimestamp(start_ns / 1e9, tz=timezone.utc) if start_ns else None,
                    "end_time": datetime.fromtimestamp(end_ns / 1e9, tz=timezone.utc) if end_ns else None,
                    "status": _status_code(span.get("status", {}).get("code", 0)),
                    "attributes": {a["key"]: _attr_val(a["value"]) for a in span.get("attributes", [])},
                })
    return spans


def _extract_attr(attrs: list, key: str):
    for a in attrs:
        if a["key"] == key:
            return _attr_val(a["value"])
    return None


def _attr_val(v: dict) -> Any:
    for k, val in v.items():
        return val
    return None


def _status_code(code: int) -> str:
    return {0: "unset", 1: "ok", 2: "error"}.get(code, "unset")
