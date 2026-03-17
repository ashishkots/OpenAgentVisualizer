import pytest
from unittest.mock import patch, MagicMock
from src.integrations.codex.adapter.codex_adapter import CodexAdapter
from src.integrations.gemini_cli.adapter.gemini_adapter import GeminiAdapter

def test_codex_adapter_init():
    a = CodexAdapter(endpoint="http://localhost:4318", api_key="k")
    assert a.tracer.source == "codex"

def test_codex_adapter_wrap_tool_call():
    a = CodexAdapter(endpoint="http://localhost:4318", api_key="k")
    event = {"tool": "bash", "input": "ls -la", "output": "file1\nfile2", "duration_ms": 120}
    with patch.object(a.tracer, "send") as mock_send:
        a.on_tool_call(event)
        mock_send.assert_called_once()
        span = mock_send.call_args[0][0]
        assert span.operation == "tool:bash"
        assert span.latency_ms == 120

def test_gemini_adapter_init():
    a = GeminiAdapter(endpoint="http://localhost:4318", api_key="k")
    assert a.tracer.source == "gemini-cli"

def test_gemini_adapter_on_tool_call():
    a = GeminiAdapter(endpoint="http://localhost:4318", api_key="k")
    event = {"tool_name": "google_search", "latency_ms": 300, "tokens": {"input": 20, "output": 80}}
    with patch.object(a.tracer, "send") as mock_send:
        a.on_tool_call(event)
        mock_send.assert_called_once()
