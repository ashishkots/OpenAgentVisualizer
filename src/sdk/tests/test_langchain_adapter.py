"""Tests for the SDK langchain adapter using spec-compliant signature.

OAVCallbackHandler now takes (agent_id, endpoint, api_key) and delegates to
OAVBaseTracer.send(OAVSpan(...)) — matching the src/integrations/open_source/langchain.py
canonical implementation.
"""
from unittest.mock import MagicMock, patch
from src.integrations.open_source.langchain import OAVCallbackHandler


def make_handler() -> OAVCallbackHandler:
    return OAVCallbackHandler(agent_id="a1", endpoint="http://localhost:4318", api_key="key")


def test_langchain_callback_records_llm_end():
    handler = make_handler()
    mock_response = MagicMock()
    mock_response.llm_output = {
        "token_usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}
    }
    with patch.object(handler.tracer, "send") as mock_send:
        handler.on_llm_start({"name": "gpt-4o"}, ["Hello world"])
        handler.on_llm_end(response=mock_response)
        mock_send.assert_called_once()
        span = mock_send.call_args[0][0]
        assert span.input_tokens == 10
        assert span.output_tokens == 5
        assert span.source == "langchain"


def test_langchain_callback_records_llm_start_sets_model():
    handler = make_handler()
    with patch.object(handler.tracer, "send"):
        handler.on_llm_start({"name": "gpt-4o"}, ["Hello"])
        assert handler._model_name == "gpt-4o"


def test_langchain_callback_records_llm_error():
    handler = make_handler()
    with patch.object(handler.tracer, "send") as mock_send:
        handler.on_llm_start({"name": "gpt-4o"}, ["Hello"])
        handler.on_llm_error(Exception("timeout"))
        mock_send.assert_called_once()
        span = mock_send.call_args[0][0]
        assert span.error == "timeout"
        assert span.source == "langchain"
