import pytest
from unittest.mock import patch, MagicMock
from src.integrations.open_source.langchain import OAVCallbackHandler
from src.integrations.open_source.langgraph import OAVLangGraphTracer

def make_handler():
    return OAVCallbackHandler(endpoint="http://localhost:4318", api_key="key", agent_id="agent-1")

def test_callback_handler_on_llm_end():
    handler = make_handler()
    response = MagicMock()
    response.llm_output = {"token_usage": {"prompt_tokens": 50, "completion_tokens": 20}}
    with patch.object(handler.tracer, "send") as mock_send:
        handler.on_llm_start({"name": "gpt-4o"}, ["hello"])
        handler.on_llm_end(response)
        mock_send.assert_called_once()
        span = mock_send.call_args[0][0]
        assert span.input_tokens == 50
        assert span.output_tokens == 20
        assert span.source == "langchain"

def test_callback_handler_on_llm_error():
    handler = make_handler()
    with patch.object(handler.tracer, "send") as mock_send:
        handler.on_llm_start({"name": "gpt-4o"}, ["hello"])
        handler.on_llm_error(Exception("timeout"))
        mock_send.assert_called_once()
        span = mock_send.call_args[0][0]
        assert span.error == "timeout"

def test_langgraph_tracer_init():
    tracer = OAVLangGraphTracer(endpoint="http://localhost:4318", api_key="key", agent_id="g1")
    assert tracer.agent_id == "g1"
