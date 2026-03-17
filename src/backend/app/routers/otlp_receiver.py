from fastapi import APIRouter, Request, HTTPException
from app.services.otlp_service import decode_otlp_http_json
from app.core.redis_client import get_redis
from app.services.event_pipeline import EventPipeline


router = APIRouter(prefix="/otlp", tags=["otlp"])


@router.post("/v1/traces", status_code=200)
async def receive_otlp_traces(request: Request):
    """Receive OTLP JSON traces from SDK exporters."""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    spans = decode_otlp_http_json(payload)
    if not spans:
        return {"status": "ok", "spans_received": 0}

    redis = await get_redis()
    pipeline = EventPipeline(redis)

    for span in spans:
        event = {
            "workspace_id": span["workspace_id"],
            "event_type": "otlp.span",
            "agent_id": span.get("attributes", {}).get("agent.id"),
            "timestamp": span["start_time"].isoformat() if span.get("start_time") else None,
            "extra_data": {"span": {k: str(v) for k, v in span.items() if k not in ("workspace_id", "start_time", "end_time")}},
        }
        await pipeline.publish(event)

    return {"status": "ok", "spans_received": len(spans)}
