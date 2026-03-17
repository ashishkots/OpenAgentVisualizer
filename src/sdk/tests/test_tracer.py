import pytest
from unittest.mock import MagicMock
from openagentvisualizer.core.tracer import OAVTracer


def test_agent_decorator_wraps_sync_function():
    tracer = OAVTracer(api_key="oav_test_key_12345678901234567890", workspace_id="ws1", export=False)

    @tracer.agent(name="TestBot", role="tester")
    def my_func(x):
        return x * 2

    result = my_func(5)
    assert result == 10  # original behavior preserved


@pytest.mark.asyncio
async def test_agent_decorator_wraps_async_function():
    tracer = OAVTracer(api_key="oav_test_key_12345678901234567890", workspace_id="ws1", export=False)

    @tracer.agent(name="AsyncBot", role="async-tester")
    async def my_async_func(x):
        return x + 1

    result = await my_async_func(4)
    assert result == 5


def test_agent_decorator_captures_events():
    tracer = OAVTracer(api_key="oav_test_key_12345678901234567890", workspace_id="ws1", export=False)

    @tracer.agent(name="EventBot", role="worker")
    def my_func():
        return "done"

    my_func()
    events = tracer.buffer.drain()
    event_types = [e.event_type for e in events]
    assert "agent.task.started" in event_types
    assert "agent.task.completed" in event_types


def test_agent_captures_error_event():
    tracer = OAVTracer(api_key="oav_test_key_12345678901234567890", workspace_id="ws1", export=False)

    @tracer.agent(name="ErrBot", role="worker")
    def failing_func():
        raise ValueError("boom")

    with pytest.raises(ValueError):
        failing_func()

    events = tracer.buffer.drain()
    assert any(e.event_type == "agent.task.failed" for e in events)
