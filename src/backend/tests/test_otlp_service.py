from app.services.otlp_service import decode_otlp_http_json


def test_otlp_json_span_decoded():
    payload = {
        "resourceSpans": [{
            "resource": {"attributes": [{"key": "workspace.id", "value": {"stringValue": "ws1"}}]},
            "scopeSpans": [{
                "spans": [{
                    "traceId": "abc123",
                    "spanId": "def456",
                    "name": "agent.task",
                    "startTimeUnixNano": "1700000000000000000",
                    "endTimeUnixNano": "1700000001000000000",
                    "status": {"code": 1},
                    "attributes": [],
                }]
            }]
        }]
    }
    spans = decode_otlp_http_json(payload)
    assert len(spans) == 1
    assert spans[0]["trace_id"] == "abc123"
    assert spans[0]["name"] == "agent.task"
    assert spans[0]["workspace_id"] == "ws1"
