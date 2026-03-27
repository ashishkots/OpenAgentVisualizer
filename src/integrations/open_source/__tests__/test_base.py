import pytest
from unittest.mock import patch, MagicMock
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

def test_base_tracer_init():
    tracer = OAVBaseTracer(endpoint="http://localhost:4318", api_key="test-key", source="langchain")
    assert tracer.endpoint == "http://localhost:4318"
    assert tracer.source == "langchain"

def test_span_to_otlp_dict():
    span = OAVSpan(
        agent_id="agent-1",
        operation="llm_call",
        input_tokens=100,
        output_tokens=50,
        latency_ms=1200,
        model="gpt-4o",
        cost_usd=0.0042,
        source="langchain",
    )
    d = span.to_otlp()
    assert d["name"] == "llm_call"
    assert d["attributes"]["oav.agent_id"] == "agent-1"
    assert d["attributes"]["oav.input_tokens"] == 100
    assert d["attributes"]["oav.cost_usd"] == pytest.approx(0.0042)

def test_base_tracer_send_span():
    tracer = OAVBaseTracer(endpoint="http://localhost:4318", api_key="key", source="test")
    span = OAVSpan(agent_id="a1", operation="op", input_tokens=10, output_tokens=5,
                   latency_ms=100, model="claude-3", cost_usd=0.001, source="test")
    with patch("requests.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=200)
        tracer.send(span)
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args
        assert "v1/traces" in call_kwargs[0][0]
