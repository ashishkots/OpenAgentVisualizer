"""Sprint 2 SDK compatibility tests.

Validates that all 5 framework adapters and the core OAVTracer produce events
containing the fields required by:
  - WebSocket room routing (session_id for ws:session:{id} channel)
  - Event replay API (/api/events/replay?session_id=...)
  - Agent relationship graph (parent_agent_id, task_id for delegates_to edges;
    session_id for shared_session edges)
  - Analytics continuous aggregates (cost_usd, total_tokens)
  - Gamification achievement evaluation (task_id for correlation, cost_usd for
    ACH-004 "Penny Pincher", duration_seconds for ACH-003 "Speed Demon")
"""

from unittest.mock import MagicMock

import pytest

from openagentvisualizer.adapters.anthropic_adapter import patch_anthropic_client
from openagentvisualizer.adapters.autogen_adapter import patch_autogen_agent
from openagentvisualizer.adapters.crewai_adapter import patch_crewai_agent
from openagentvisualizer.adapters.langchain_adapter import OAVCallbackHandler
from openagentvisualizer.adapters.openai_adapter import patch_openai_client
from openagentvisualizer.core.event import OAVEvent
from openagentvisualizer.core.tracer import OAVTracer

_API_KEY = "oav_test_key_12345678901234567890"
_WS_ID = "ws-sprint2"
_SESSION_ID = "session-abc-123"
_PARENT_AGENT_ID = "parent-agent-xyz"
_AGENT_ID = "child-agent-abc"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_tracer() -> OAVTracer:
    return OAVTracer(api_key=_API_KEY, workspace_id=_WS_ID, export=False)


def _drain(tracer: OAVTracer) -> list:
    return tracer.buffer.drain()


# ===========================================================================
# 1. OAVTracer core — session_id + parent_agent_id propagation
# ===========================================================================

class TestTracerSprint2:
    def test_session_id_propagated_to_task_started(self):
        tracer = _make_tracer()

        @tracer.agent(name="Bot", session_id=_SESSION_ID)
        def do_work():
            return "ok"

        do_work()
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.task.started")
        assert started.session_id == _SESSION_ID

    def test_session_id_propagated_to_task_completed(self):
        tracer = _make_tracer()

        @tracer.agent(name="Bot", session_id=_SESSION_ID)
        def do_work():
            return "ok"

        do_work()
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.task.completed")
        assert completed.session_id == _SESSION_ID

    def test_session_id_propagated_to_task_failed(self):
        tracer = _make_tracer()

        @tracer.agent(name="Bot", session_id=_SESSION_ID)
        def failing():
            raise RuntimeError("boom")

        with pytest.raises(RuntimeError):
            failing()

        events = _drain(tracer)
        failed = next(e for e in events if e.event_type == "agent.task.failed")
        assert failed.session_id == _SESSION_ID

    def test_parent_agent_id_in_task_started_extra_data(self):
        tracer = _make_tracer()

        @tracer.agent(name="ChildBot", session_id=_SESSION_ID,
                      parent_agent_id=_PARENT_AGENT_ID)
        def do_work():
            return "delegated"

        do_work()
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.task.started")
        assert started.extra_data.get("parent_agent_id") == _PARENT_AGENT_ID

    def test_parent_agent_id_absent_when_not_provided(self):
        tracer = _make_tracer()

        @tracer.agent(name="TopBot", session_id=_SESSION_ID)
        def do_work():
            return "top-level"

        do_work()
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.task.started")
        assert "parent_agent_id" not in started.extra_data

    def test_task_id_present_in_started_and_completed(self):
        tracer = _make_tracer()

        @tracer.agent(name="CorrelBot", session_id=_SESSION_ID)
        def do_work():
            return True

        do_work()
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.task.started")
        completed = next(e for e in events if e.event_type == "agent.task.completed")
        assert started.extra_data["task_id"] == completed.extra_data["task_id"]

    def test_duration_seconds_in_completed_event(self):
        tracer = _make_tracer()

        @tracer.agent(name="TimerBot", session_id=_SESSION_ID)
        def do_work():
            return True

        do_work()
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.task.completed")
        assert isinstance(completed.extra_data.get("duration_seconds"), float)

    @pytest.mark.asyncio
    async def test_async_session_id_propagated(self):
        tracer = _make_tracer()

        @tracer.agent(name="AsyncBot", session_id=_SESSION_ID)
        async def do_work():
            return True

        await do_work()
        events = _drain(tracer)
        for e in events:
            assert e.session_id == _SESSION_ID

    @pytest.mark.asyncio
    async def test_async_parent_agent_id_in_started(self):
        tracer = _make_tracer()

        @tracer.agent(name="AsyncChild", session_id=_SESSION_ID,
                      parent_agent_id=_PARENT_AGENT_ID)
        async def do_work():
            return True

        await do_work()
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.task.started")
        assert started.extra_data.get("parent_agent_id") == _PARENT_AGENT_ID


# ===========================================================================
# 2. LangChain adapter — OAVCallbackHandler
# ===========================================================================

class TestLangChainAdapterSprint2:
    def _handler(self, session_id=_SESSION_ID, parent_agent_id=None):
        tracer = _make_tracer()
        handler = OAVCallbackHandler(
            tracer=tracer,
            agent_id=_AGENT_ID,
            session_id=session_id,
            parent_agent_id=parent_agent_id,
        )
        return tracer, handler

    def test_session_id_on_llm_started(self):
        tracer, handler = self._handler()
        handler.on_llm_start(serialized={}, prompts=["Hello"])
        events = _drain(tracer)
        ev = next(e for e in events if e.event_type == "agent.llm.started")
        assert ev.session_id == _SESSION_ID

    def test_session_id_on_llm_completed(self):
        tracer, handler = self._handler()
        mock_resp = MagicMock()
        mock_resp.llm_output = {
            "token_usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
            "model_name": "gpt-3.5-turbo",
        }
        run_id = "run-001"
        handler.on_llm_start(serialized={}, prompts=["hi"], run_id=run_id)
        handler.on_llm_end(response=mock_resp, run_id=run_id)
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert completed.session_id == _SESSION_ID

    def test_task_id_correlated_across_start_end(self):
        tracer, handler = self._handler()
        mock_resp = MagicMock()
        mock_resp.llm_output = {"token_usage": {"total_tokens": 20}, "model_name": "gpt-4o"}
        run_id = "run-corr-001"
        handler.on_llm_start(serialized={}, prompts=["q"], run_id=run_id)
        handler.on_llm_end(response=mock_resp, run_id=run_id)
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert started.extra_data["task_id"] == completed.extra_data["task_id"]

    def test_cost_usd_present_on_llm_completed(self):
        tracer, handler = self._handler()
        mock_resp = MagicMock()
        mock_resp.llm_output = {
            "token_usage": {"prompt_tokens": 100, "completion_tokens": 50, "total_tokens": 150},
            "model_name": "gpt-4o",
        }
        run_id = "run-cost-001"
        handler.on_llm_start(serialized={}, prompts=["q"], run_id=run_id)
        handler.on_llm_end(response=mock_resp, run_id=run_id)
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert "cost_usd" in completed.extra_data
        assert completed.extra_data["cost_usd"] >= 0.0

    def test_cost_usd_nonzero_for_known_model(self):
        tracer, handler = self._handler()
        mock_resp = MagicMock()
        mock_resp.llm_output = {
            "token_usage": {"total_tokens": 1000},
            "model_name": "gpt-4o",
        }
        run_id = "run-cost-002"
        handler.on_llm_start(serialized={}, prompts=["q"], run_id=run_id)
        handler.on_llm_end(response=mock_resp, run_id=run_id)
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        # gpt-4o: 0.005 per 1k tokens => 1000 tokens = 0.005
        assert completed.extra_data["cost_usd"] == pytest.approx(0.005, abs=1e-6)

    def test_parent_agent_id_on_llm_started(self):
        tracer, handler = self._handler(parent_agent_id=_PARENT_AGENT_ID)
        handler.on_llm_start(serialized={}, prompts=["q"])
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")
        assert started.extra_data.get("parent_agent_id") == _PARENT_AGENT_ID

    def test_tool_session_id(self):
        tracer, handler = self._handler()
        handler.on_tool_start(serialized={"name": "search"}, input_str="q")
        events = _drain(tracer)
        tool_ev = next(e for e in events if e.event_type == "agent.tool.started")
        assert tool_ev.session_id == _SESSION_ID

    def test_tool_task_id_in_extra_data(self):
        tracer, handler = self._handler()
        run_id = "run-tool-001"
        handler.on_tool_start(serialized={"name": "calc"}, input_str="1+1", run_id=run_id)
        handler.on_tool_end(output="2", run_id=run_id)
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.tool.started")
        completed = next(e for e in events if e.event_type == "agent.tool.completed")
        assert "task_id" in started.extra_data
        assert started.extra_data["task_id"] == completed.extra_data["task_id"]

    def test_llm_error_session_id(self):
        tracer, handler = self._handler()
        run_id = "run-err-001"
        handler.on_llm_start(serialized={}, prompts=["q"], run_id=run_id)
        handler.on_llm_error(RuntimeError("timeout"), run_id=run_id)
        events = _drain(tracer)
        err_ev = next(e for e in events if e.event_type == "agent.llm.error")
        assert err_ev.session_id == _SESSION_ID


# ===========================================================================
# 3. CrewAI adapter
# ===========================================================================

class TestCrewAIAdapterSprint2:
    def _make_agent(self):
        mock_agent = MagicMock()
        mock_agent.execute_task = MagicMock(return_value="crew result")
        return mock_agent

    def test_session_id_on_task_started(self):
        tracer = _make_tracer()
        agent = self._make_agent()
        patch_crewai_agent(agent, tracer, _AGENT_ID, session_id=_SESSION_ID)
        agent.execute_task("summarise doc")
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.task.started")
        assert started.session_id == _SESSION_ID

    def test_session_id_on_task_completed(self):
        tracer = _make_tracer()
        agent = self._make_agent()
        patch_crewai_agent(agent, tracer, _AGENT_ID, session_id=_SESSION_ID)
        agent.execute_task("summarise doc")
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.task.completed")
        assert completed.session_id == _SESSION_ID

    def test_parent_agent_id_in_task_started(self):
        tracer = _make_tracer()
        agent = self._make_agent()
        patch_crewai_agent(agent, tracer, _AGENT_ID, session_id=_SESSION_ID,
                           parent_agent_id=_PARENT_AGENT_ID)
        agent.execute_task("subtask")
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.task.started")
        assert started.extra_data.get("parent_agent_id") == _PARENT_AGENT_ID

    def test_task_id_correlated(self):
        tracer = _make_tracer()
        agent = self._make_agent()
        patch_crewai_agent(agent, tracer, _AGENT_ID, session_id=_SESSION_ID)
        agent.execute_task("work")
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.task.started")
        completed = next(e for e in events if e.event_type == "agent.task.completed")
        assert started.extra_data["task_id"] == completed.extra_data["task_id"]

    def test_duration_seconds_in_completed(self):
        tracer = _make_tracer()
        agent = self._make_agent()
        patch_crewai_agent(agent, tracer, _AGENT_ID, session_id=_SESSION_ID)
        agent.execute_task("work")
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.task.completed")
        assert isinstance(completed.extra_data.get("duration_seconds"), float)

    def test_cost_usd_present_in_completed(self):
        tracer = _make_tracer()
        agent = self._make_agent()
        patch_crewai_agent(agent, tracer, _AGENT_ID, session_id=_SESSION_ID)
        agent.execute_task("work")
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.task.completed")
        assert "cost_usd" in completed.extra_data

    def test_session_id_on_task_failed(self):
        tracer = _make_tracer()
        agent = MagicMock()
        agent.execute_task = MagicMock(side_effect=ValueError("oops"))
        patch_crewai_agent(agent, tracer, _AGENT_ID, session_id=_SESSION_ID)
        with pytest.raises(ValueError):
            agent.execute_task("work")
        events = _drain(tracer)
        failed = next(e for e in events if e.event_type == "agent.task.failed")
        assert failed.session_id == _SESSION_ID


# ===========================================================================
# 4. AutoGen adapter
# ===========================================================================

class TestAutoGenAdapterSprint2:
    def _make_agent(self, reply=None):
        mock_agent = MagicMock()
        mock_agent.name = "AutoGenWorker"
        if reply is None:
            mock_agent.generate_reply = MagicMock(return_value="reply text")
        else:
            mock_agent.generate_reply = MagicMock(return_value=reply)
        return mock_agent

    def test_session_id_on_llm_started(self):
        tracer = _make_tracer()
        agent = self._make_agent()
        patch_autogen_agent(agent, tracer, _AGENT_ID, session_id=_SESSION_ID)
        agent.generate_reply(messages=[])
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")
        assert started.session_id == _SESSION_ID

    def test_session_id_on_llm_completed(self):
        tracer = _make_tracer()
        agent = self._make_agent()
        patch_autogen_agent(agent, tracer, _AGENT_ID, session_id=_SESSION_ID)
        agent.generate_reply(messages=[])
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert completed.session_id == _SESSION_ID

    def test_parent_agent_id_in_started(self):
        tracer = _make_tracer()
        agent = self._make_agent()
        patch_autogen_agent(agent, tracer, _AGENT_ID, session_id=_SESSION_ID,
                            parent_agent_id=_PARENT_AGENT_ID)
        agent.generate_reply(messages=[])
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")
        assert started.extra_data.get("parent_agent_id") == _PARENT_AGENT_ID

    def test_task_id_correlated(self):
        tracer = _make_tracer()
        agent = self._make_agent()
        patch_autogen_agent(agent, tracer, _AGENT_ID, session_id=_SESSION_ID)
        agent.generate_reply(messages=[])
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert started.extra_data["task_id"] == completed.extra_data["task_id"]

    def test_cost_usd_from_usage_dict(self):
        tracer = _make_tracer()
        reply_with_usage = {"content": "hi", "usage": {"total_tokens": 50, "cost": 0.0025}}
        agent = self._make_agent(reply=reply_with_usage)
        patch_autogen_agent(agent, tracer, _AGENT_ID, session_id=_SESSION_ID)
        agent.generate_reply(messages=[])
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert completed.extra_data["cost_usd"] == pytest.approx(0.0025)
        assert completed.extra_data["total_tokens"] == 50

    def test_cost_usd_zero_for_plain_string_reply(self):
        tracer = _make_tracer()
        agent = self._make_agent(reply="plain string reply")
        patch_autogen_agent(agent, tracer, _AGENT_ID, session_id=_SESSION_ID)
        agent.generate_reply(messages=[])
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert completed.extra_data["cost_usd"] == 0.0

    def test_session_id_on_llm_error(self):
        tracer = _make_tracer()
        agent = MagicMock()
        agent.name = "ErrAgent"
        agent.generate_reply = MagicMock(side_effect=ConnectionError("timeout"))
        patch_autogen_agent(agent, tracer, _AGENT_ID, session_id=_SESSION_ID)
        with pytest.raises(ConnectionError):
            agent.generate_reply(messages=[])
        events = _drain(tracer)
        err_ev = next(e for e in events if e.event_type == "agent.llm.error")
        assert err_ev.session_id == _SESSION_ID


# ===========================================================================
# 5. OpenAI adapter
# ===========================================================================

class TestOpenAIAdapterSprint2:
    def _make_client(self, total_tokens=100, model="gpt-4o"):
        client = MagicMock()
        usage = MagicMock()
        usage.prompt_tokens = 60
        usage.completion_tokens = 40
        usage.total_tokens = total_tokens
        resp = MagicMock()
        resp.usage = usage
        client.chat.completions.create = MagicMock(return_value=resp)
        return client

    def test_session_id_on_llm_started(self):
        tracer = _make_tracer()
        client = self._make_client()
        patch_openai_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID)
        client.chat.completions.create(model="gpt-4o", messages=[])
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")
        assert started.session_id == _SESSION_ID

    def test_session_id_on_llm_completed(self):
        tracer = _make_tracer()
        client = self._make_client()
        patch_openai_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID)
        client.chat.completions.create(model="gpt-4o", messages=[])
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert completed.session_id == _SESSION_ID

    def test_task_id_correlated(self):
        tracer = _make_tracer()
        client = self._make_client()
        patch_openai_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID)
        client.chat.completions.create(model="gpt-4o", messages=[])
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert started.extra_data["task_id"] == completed.extra_data["task_id"]

    def test_cost_usd_populated(self):
        tracer = _make_tracer()
        client = self._make_client(total_tokens=1000)
        patch_openai_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID)
        client.chat.completions.create(model="gpt-4o", messages=[])
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        # gpt-4o: 0.005 per 1k tokens => 1000 tokens = 0.005
        assert completed.extra_data["cost_usd"] == pytest.approx(0.005, abs=1e-6)

    def test_cost_usd_zero_for_unknown_model(self):
        tracer = _make_tracer()
        client = self._make_client(total_tokens=500)
        patch_openai_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID)
        client.chat.completions.create(model="some-unknown-model", messages=[])
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert completed.extra_data["cost_usd"] == 0.0

    def test_parent_agent_id_in_started(self):
        tracer = _make_tracer()
        client = self._make_client()
        patch_openai_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID,
                            parent_agent_id=_PARENT_AGENT_ID)
        client.chat.completions.create(model="gpt-4o", messages=[])
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")
        assert started.extra_data.get("parent_agent_id") == _PARENT_AGENT_ID

    def test_token_counts_in_completed(self):
        tracer = _make_tracer()
        client = self._make_client(total_tokens=100)
        patch_openai_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID)
        client.chat.completions.create(model="gpt-4o", messages=[])
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert completed.extra_data["prompt_tokens"] == 60
        assert completed.extra_data["completion_tokens"] == 40
        assert completed.extra_data["total_tokens"] == 100

    def test_session_id_on_llm_error(self):
        tracer = _make_tracer()
        client = MagicMock()
        client.chat.completions.create = MagicMock(side_effect=TimeoutError("api timeout"))
        patch_openai_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID)
        with pytest.raises(TimeoutError):
            client.chat.completions.create(model="gpt-4o", messages=[])
        events = _drain(tracer)
        err_ev = next(e for e in events if e.event_type == "agent.llm.error")
        assert err_ev.session_id == _SESSION_ID


# ===========================================================================
# 6. Anthropic adapter
# ===========================================================================

class TestAnthropicAdapterSprint2:
    def _make_client(self, input_tokens=80, output_tokens=40, model="claude-3-sonnet"):
        client = MagicMock()
        usage = MagicMock()
        usage.input_tokens = input_tokens
        usage.output_tokens = output_tokens
        resp = MagicMock()
        resp.usage = usage
        client.messages.create = MagicMock(return_value=resp)
        return client, model

    def test_session_id_on_llm_started(self):
        tracer = _make_tracer()
        client, model = self._make_client()
        patch_anthropic_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID)
        client.messages.create(model=model, messages=[])
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")
        assert started.session_id == _SESSION_ID

    def test_session_id_on_llm_completed(self):
        tracer = _make_tracer()
        client, model = self._make_client()
        patch_anthropic_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID)
        client.messages.create(model=model, messages=[])
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert completed.session_id == _SESSION_ID

    def test_task_id_correlated(self):
        tracer = _make_tracer()
        client, model = self._make_client()
        patch_anthropic_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID)
        client.messages.create(model=model, messages=[])
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert started.extra_data["task_id"] == completed.extra_data["task_id"]

    def test_token_counts_in_completed(self):
        tracer = _make_tracer()
        client, model = self._make_client(input_tokens=80, output_tokens=40)
        patch_anthropic_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID)
        client.messages.create(model=model, messages=[])
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert completed.extra_data["input_tokens"] == 80
        assert completed.extra_data["output_tokens"] == 40
        assert completed.extra_data["total_tokens"] == 120

    def test_cost_usd_nonzero_for_known_model(self):
        tracer = _make_tracer()
        client, _ = self._make_client(input_tokens=500, output_tokens=500,
                                      model="claude-3-sonnet")
        patch_anthropic_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID)
        client.messages.create(model="claude-3-sonnet", messages=[])
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        # claude-3-sonnet: 0.003 per 1k; 1000 total tokens = 0.003
        assert completed.extra_data["cost_usd"] == pytest.approx(0.003, abs=1e-6)

    def test_cost_usd_zero_for_unknown_model(self):
        tracer = _make_tracer()
        client, _ = self._make_client(model="claude-unknown-v99")
        patch_anthropic_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID)
        client.messages.create(model="claude-unknown-v99", messages=[])
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.llm.completed")
        assert completed.extra_data["cost_usd"] == 0.0

    def test_parent_agent_id_in_started(self):
        tracer = _make_tracer()
        client, model = self._make_client()
        patch_anthropic_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID,
                               parent_agent_id=_PARENT_AGENT_ID)
        client.messages.create(model=model, messages=[])
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")
        assert started.extra_data.get("parent_agent_id") == _PARENT_AGENT_ID

    def test_session_id_on_llm_error(self):
        tracer = _make_tracer()
        client = MagicMock()
        client.messages.create = MagicMock(side_effect=RuntimeError("rate limit"))
        patch_anthropic_client(client, tracer, _AGENT_ID, session_id=_SESSION_ID)
        with pytest.raises(RuntimeError):
            client.messages.create(model="claude-3-sonnet", messages=[])
        events = _drain(tracer)
        err_ev = next(e for e in events if e.event_type == "agent.llm.error")
        assert err_ev.session_id == _SESSION_ID


# ===========================================================================
# 7. OAVEvent model — session_id field always serialised to to_dict()
# ===========================================================================

class TestOAVEventSprint2:
    def test_session_id_in_to_dict(self):
        ev = OAVEvent(
            event_type="agent.task.started",
            workspace_id="ws1",
            agent_id="a1",
            session_id=_SESSION_ID,
            extra_data={"task_id": "t1"},
        )
        d = ev.to_dict()
        assert d["session_id"] == _SESSION_ID

    def test_session_id_none_serialises_as_none(self):
        ev = OAVEvent(
            event_type="agent.llm.completed",
            workspace_id="ws1",
            agent_id="a1",
        )
        d = ev.to_dict()
        assert d["session_id"] is None

    def test_agent_id_in_to_dict(self):
        ev = OAVEvent("agent.task.started", "ws1", "a1", session_id="s1")
        d = ev.to_dict()
        assert d["agent_id"] == "a1"

    def test_extra_data_merged_into_to_dict(self):
        ev = OAVEvent("agent.llm.started", "ws1", "a1", session_id="s1",
                      extra_data={"task_id": "t99", "cost_usd": 0.005})
        d = ev.to_dict()
        assert d["task_id"] == "t99"
        assert d["cost_usd"] == 0.005


# ===========================================================================
# 8. OTLP exporter — session.id span attribute
# ===========================================================================

class TestOTLPExporterSprint2:
    def test_session_id_set_as_span_attribute(self):
        """Verify OTLPExporter calls span.set_attribute('session.id', ...) when
        the event carries a session_id."""
        from openagentvisualizer.exporters.otlp_exporter import OTLPExporter

        mock_span = MagicMock()
        mock_span.__enter__ = MagicMock(return_value=mock_span)
        mock_span.__exit__ = MagicMock(return_value=False)

        mock_tracer = MagicMock()
        mock_tracer.start_as_current_span = MagicMock(return_value=mock_span)

        exporter = OTLPExporter.__new__(OTLPExporter)
        exporter._tracer = mock_tracer

        event = OAVEvent(
            "agent.task.started", "ws1", "a1",
            session_id=_SESSION_ID,
            extra_data={"task_id": "t1"},
        )
        exporter.export_sync(event)

        calls = {call[0][0]: call[0][1] for call in mock_span.set_attribute.call_args_list}
        assert calls.get("session.id") == _SESSION_ID

    def test_session_id_not_set_when_absent(self):
        from openagentvisualizer.exporters.otlp_exporter import OTLPExporter

        mock_span = MagicMock()
        mock_span.__enter__ = MagicMock(return_value=mock_span)
        mock_span.__exit__ = MagicMock(return_value=False)

        mock_tracer = MagicMock()
        mock_tracer.start_as_current_span = MagicMock(return_value=mock_span)

        exporter = OTLPExporter.__new__(OTLPExporter)
        exporter._tracer = mock_tracer

        event = OAVEvent("agent.llm.completed", "ws1", "a1")
        exporter.export_sync(event)

        attr_names = [call[0][0] for call in mock_span.set_attribute.call_args_list]
        assert "session.id" not in attr_names
