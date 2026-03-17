from unittest.mock import MagicMock
from openagentvisualizer.adapters.langchain_adapter import OAVCallbackHandler
from openagentvisualizer.core.tracer import OAVTracer


def test_langchain_callback_records_llm_start():
    tracer = OAVTracer(api_key="oav_test_key_12345678901234567890", workspace_id="ws1", export=False)
    handler = OAVCallbackHandler(tracer=tracer, agent_id="a1")
    handler.on_llm_start(serialized={}, prompts=["Hello world"])
    events = tracer.buffer.drain()
    assert any(e.event_type == "agent.llm.started" for e in events)


def test_langchain_callback_records_llm_end():
    tracer = OAVTracer(api_key="oav_test_key_12345678901234567890", workspace_id="ws1", export=False)
    handler = OAVCallbackHandler(tracer=tracer, agent_id="a1")
    mock_response = MagicMock()
    mock_response.llm_output = {
        "token_usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}
    }
    handler.on_llm_end(response=mock_response)
    events = tracer.buffer.drain()
    llm_end = next(e for e in events if e.event_type == "agent.llm.completed")
    assert llm_end.extra_data.get("total_tokens") == 15


def test_langchain_callback_records_tool_start():
    tracer = OAVTracer(api_key="oav_test_key_12345678901234567890", workspace_id="ws1", export=False)
    handler = OAVCallbackHandler(tracer=tracer, agent_id="a1")
    handler.on_tool_start(serialized={"name": "search"}, input_str="query")
    events = tracer.buffer.drain()
    tool_event = next(e for e in events if e.event_type == "agent.tool.started")
    assert tool_event.extra_data.get("tool_name") == "search"
