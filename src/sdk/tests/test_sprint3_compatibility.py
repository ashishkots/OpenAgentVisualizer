"""Sprint 3 SDK compatibility tests.

Validates that:
1. OTLP exporter emits all Sprint 3 span attributes required by OpenTrace
   and OpenMesh integrations:
     - service.name  (per-agent name for OpenTrace correlation)
     - operation.name (event_type string for waterfall row labels)
     - agent.name    (OpenMesh topology node label)
     - agent.role    (OpenMesh topology node role)
     - parent_agent_id (delegates_to edge in OpenMesh topology)
     - task_id       (start/completed/failed correlation in OpenTrace)

2. OAVTracer propagates agent_name and role on completed and failed events
   (Sprint 3 ensures every OTLP span type carries context for OpenTrace
   waterfall and OpenMesh topology, not just agent.task.started).

3. CLI client uses the same X-API-Key authentication pattern as the SDK
   RESTExporter (ADR-009).

4. All changes are backward-compatible — existing Sprint 2 tests still pass.
"""

from unittest.mock import MagicMock, call

import pytest
import respx

from openagentvisualizer.adapters.anthropic_adapter import patch_anthropic_client
from openagentvisualizer.adapters.autogen_adapter import patch_autogen_agent
from openagentvisualizer.adapters.crewai_adapter import patch_crewai_agent
from openagentvisualizer.adapters.langchain_adapter import OAVCallbackHandler
from openagentvisualizer.adapters.openai_adapter import patch_openai_client
from openagentvisualizer.core.event import OAVEvent
from openagentvisualizer.core.tracer import OAVTracer
from openagentvisualizer.exporters.otlp_exporter import OTLPExporter

_API_KEY = "oav_test_sprint3_12345678901234"
_WS_ID = "ws-sprint3"
_SESSION_ID = "session-sprint3-abc"
_PARENT_AGENT_ID = "parent-sprint3-xyz"
_AGENT_ID = "child-sprint3-abc"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_tracer() -> OAVTracer:
    return OAVTracer(api_key=_API_KEY, workspace_id=_WS_ID, export=False)


def _drain(tracer: OAVTracer) -> list:
    return tracer.buffer.drain()


def _make_otlp_span_mock() -> tuple:
    """Return (mock_span, mock_tracer_provider) wired up for OTLPExporter testing."""
    mock_span = MagicMock()
    mock_span.__enter__ = MagicMock(return_value=mock_span)
    mock_span.__exit__ = MagicMock(return_value=False)

    mock_tracer = MagicMock()
    mock_tracer.start_as_current_span = MagicMock(return_value=mock_span)

    exporter = OTLPExporter.__new__(OTLPExporter)
    exporter._tracer = mock_tracer
    return exporter, mock_span


def _attr_map(mock_span: MagicMock) -> dict:
    """Collect all set_attribute calls into a {name: value} dict."""
    return {c[0][0]: c[0][1] for c in mock_span.set_attribute.call_args_list}


# ===========================================================================
# 1. OTLP exporter — Sprint 3 span attributes
# ===========================================================================


class TestOTLPExporterSprint3:
    """Verify all attributes required by OpenTrace and OpenMesh are emitted."""

    def test_operation_name_set_from_event_type(self):
        """operation.name must always be set so OpenTrace waterfall rows are labelled."""
        exporter, mock_span = _make_otlp_span_mock()
        event = OAVEvent("agent.task.started", _WS_ID, _AGENT_ID)
        exporter.export_sync(event)
        attrs = _attr_map(mock_span)
        assert attrs.get("operation.name") == "agent.task.started"

    def test_operation_name_set_for_llm_event(self):
        exporter, mock_span = _make_otlp_span_mock()
        event = OAVEvent("agent.llm.completed", _WS_ID, _AGENT_ID,
                         extra_data={"task_id": "t1", "total_tokens": 100, "cost_usd": 0.005})
        exporter.export_sync(event)
        attrs = _attr_map(mock_span)
        assert attrs.get("operation.name") == "agent.llm.completed"

    def test_service_name_set_from_agent_name_in_extra_data(self):
        """service.name at the span level uses agent_name when provided."""
        exporter, mock_span = _make_otlp_span_mock()
        event = OAVEvent("agent.task.started", _WS_ID, _AGENT_ID,
                         extra_data={"agent_name": "ResearchAgent", "role": "worker",
                                     "task_id": "t1"})
        exporter.export_sync(event)
        attrs = _attr_map(mock_span)
        assert attrs.get("service.name") == "ResearchAgent"

    def test_service_name_not_set_when_agent_name_absent(self):
        """When agent_name is absent, service.name span attribute is not emitted;
        the resource-level 'openagentvisualizer-sdk' remains the effective value."""
        exporter, mock_span = _make_otlp_span_mock()
        event = OAVEvent("agent.llm.started", _WS_ID, _AGENT_ID,
                         extra_data={"task_id": "t2", "model": "gpt-4o"})
        exporter.export_sync(event)
        attrs = _attr_map(mock_span)
        assert "service.name" not in attrs

    def test_agent_name_span_attribute_set(self):
        """agent.name must be emitted for OpenMesh topology node labels."""
        exporter, mock_span = _make_otlp_span_mock()
        event = OAVEvent("agent.task.completed", _WS_ID, _AGENT_ID,
                         extra_data={"agent_name": "SummaryBot", "role": "summariser",
                                     "task_id": "t3", "duration_seconds": 0.5})
        exporter.export_sync(event)
        attrs = _attr_map(mock_span)
        assert attrs.get("agent.name") == "SummaryBot"

    def test_agent_role_span_attribute_set(self):
        """agent.role is emitted when role is present in extra_data."""
        exporter, mock_span = _make_otlp_span_mock()
        event = OAVEvent("agent.task.started", _WS_ID, _AGENT_ID,
                         extra_data={"agent_name": "PlannerBot", "role": "planner",
                                     "task_id": "t4"})
        exporter.export_sync(event)
        attrs = _attr_map(mock_span)
        assert attrs.get("agent.role") == "planner"

    def test_agent_role_not_set_when_absent(self):
        exporter, mock_span = _make_otlp_span_mock()
        event = OAVEvent("agent.llm.started", _WS_ID, _AGENT_ID,
                         extra_data={"task_id": "t5"})
        exporter.export_sync(event)
        attrs = _attr_map(mock_span)
        assert "agent.role" not in attrs

    def test_parent_agent_id_set_for_delegates_to_edge(self):
        """parent_agent_id must reach the OTLP span for OpenMesh topology edges."""
        exporter, mock_span = _make_otlp_span_mock()
        event = OAVEvent("agent.task.started", _WS_ID, _AGENT_ID,
                         extra_data={"agent_name": "ChildBot", "role": "worker",
                                     "task_id": "t6",
                                     "parent_agent_id": _PARENT_AGENT_ID})
        exporter.export_sync(event)
        attrs = _attr_map(mock_span)
        assert attrs.get("parent_agent_id") == _PARENT_AGENT_ID

    def test_parent_agent_id_not_set_when_absent(self):
        exporter, mock_span = _make_otlp_span_mock()
        event = OAVEvent("agent.task.started", _WS_ID, _AGENT_ID,
                         extra_data={"agent_name": "TopBot", "role": "supervisor",
                                     "task_id": "t7"})
        exporter.export_sync(event)
        attrs = _attr_map(mock_span)
        assert "parent_agent_id" not in attrs

    def test_task_id_set_as_span_attribute(self):
        """task_id links started/completed/failed spans into one logical trace unit."""
        exporter, mock_span = _make_otlp_span_mock()
        event = OAVEvent("agent.task.started", _WS_ID, _AGENT_ID,
                         extra_data={"task_id": "task-corr-001", "agent_name": "Bot",
                                     "role": "worker"})
        exporter.export_sync(event)
        attrs = _attr_map(mock_span)
        assert attrs.get("task_id") == "task-corr-001"

    def test_task_id_not_set_when_absent(self):
        exporter, mock_span = _make_otlp_span_mock()
        event = OAVEvent("agent.task.failed", _WS_ID, _AGENT_ID,
                         extra_data={"error": "timeout"})
        exporter.export_sync(event)
        attrs = _attr_map(mock_span)
        assert "task_id" not in attrs

    def test_existing_oav_prefixed_attributes_still_set(self):
        """Sprint 3 changes must not remove the oav.* prefix attributes."""
        exporter, mock_span = _make_otlp_span_mock()
        event = OAVEvent("agent.llm.completed", _WS_ID, _AGENT_ID,
                         extra_data={"task_id": "t8", "total_tokens": 200, "cost_usd": 0.01})
        exporter.export_sync(event)
        attrs = _attr_map(mock_span)
        assert attrs.get("oav.total_tokens") == 200
        assert attrs.get("oav.cost_usd") == pytest.approx(0.01)

    def test_workspace_id_and_agent_id_still_set(self):
        """Core Sprint 1/2 attributes must not be removed."""
        exporter, mock_span = _make_otlp_span_mock()
        event = OAVEvent("agent.task.started", _WS_ID, _AGENT_ID,
                         extra_data={"task_id": "t9", "agent_name": "Bot", "role": "w"})
        exporter.export_sync(event)
        attrs = _attr_map(mock_span)
        assert attrs.get("workspace.id") == _WS_ID
        assert attrs.get("agent.id") == _AGENT_ID

    def test_session_id_still_set(self):
        """Sprint 2 session.id must still be emitted (backward-compatibility)."""
        exporter, mock_span = _make_otlp_span_mock()
        event = OAVEvent("agent.task.started", _WS_ID, _AGENT_ID,
                         session_id=_SESSION_ID,
                         extra_data={"task_id": "t10", "agent_name": "Bot", "role": "w"})
        exporter.export_sync(event)
        attrs = _attr_map(mock_span)
        assert attrs.get("session.id") == _SESSION_ID


# ===========================================================================
# 2. OAVTracer — agent_name and role on completed and failed events
# ===========================================================================


class TestTracerSprint3AgentContext:
    """Completed and failed events must carry agent_name and role for OTLP."""

    def test_completed_event_carries_agent_name(self):
        tracer = _make_tracer()

        @tracer.agent(name="SummaryBot", role="summariser")
        def do_work():
            return "done"

        do_work()
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.task.completed")
        assert completed.extra_data.get("agent_name") == "SummaryBot"

    def test_completed_event_carries_role(self):
        tracer = _make_tracer()

        @tracer.agent(name="PlannerBot", role="planner")
        def do_work():
            return "planned"

        do_work()
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.task.completed")
        assert completed.extra_data.get("role") == "planner"

    def test_failed_event_carries_agent_name(self):
        tracer = _make_tracer()

        @tracer.agent(name="ErrorBot", role="worker")
        def broken():
            raise RuntimeError("fail")

        with pytest.raises(RuntimeError):
            broken()

        events = _drain(tracer)
        failed = next(e for e in events if e.event_type == "agent.task.failed")
        assert failed.extra_data.get("agent_name") == "ErrorBot"

    def test_failed_event_carries_role(self):
        tracer = _make_tracer()

        @tracer.agent(name="ErrorBot", role="executor")
        def broken():
            raise ValueError("oops")

        with pytest.raises(ValueError):
            broken()

        events = _drain(tracer)
        failed = next(e for e in events if e.event_type == "agent.task.failed")
        assert failed.extra_data.get("role") == "executor"

    def test_task_id_consistent_across_started_completed_failed(self):
        """All three event types for the same invocation share a task_id."""
        tracer = _make_tracer()

        @tracer.agent(name="CorrelBot", role="worker")
        def do_work():
            return True

        do_work()
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.task.started")
        completed = next(e for e in events if e.event_type == "agent.task.completed")
        assert started.extra_data["task_id"] == completed.extra_data["task_id"]

    @pytest.mark.asyncio
    async def test_async_completed_event_carries_agent_name(self):
        tracer = _make_tracer()

        @tracer.agent(name="AsyncSummaryBot", role="async-summariser")
        async def do_work():
            return "done"

        await do_work()
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.task.completed")
        assert completed.extra_data.get("agent_name") == "AsyncSummaryBot"

    @pytest.mark.asyncio
    async def test_async_failed_event_carries_role(self):
        tracer = _make_tracer()

        @tracer.agent(name="AsyncFailBot", role="async-worker")
        async def broken():
            raise RuntimeError("async fail")

        with pytest.raises(RuntimeError):
            await broken()

        events = _drain(tracer)
        failed = next(e for e in events if e.event_type == "agent.task.failed")
        assert failed.extra_data.get("role") == "async-worker"

    def test_parent_agent_id_on_completed_event_absent_when_not_set(self):
        """parent_agent_id should not bleed into completed events — it was only
        needed on started so the relationship graph can register the edge once."""
        tracer = _make_tracer()

        @tracer.agent(name="ChildBot", role="worker",
                      parent_agent_id=_PARENT_AGENT_ID)
        def do_work():
            return True

        do_work()
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.task.completed")
        assert "parent_agent_id" not in completed.extra_data

    def test_started_event_still_has_parent_agent_id(self):
        """Confirm started event still carries parent_agent_id (backward-compat)."""
        tracer = _make_tracer()

        @tracer.agent(name="DelegatedBot", role="worker",
                      parent_agent_id=_PARENT_AGENT_ID)
        def do_work():
            return True

        do_work()
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.task.started")
        assert started.extra_data.get("parent_agent_id") == _PARENT_AGENT_ID


# ===========================================================================
# 3. CLI ↔ SDK auth compatibility (ADR-009)
# ===========================================================================


class TestCLISDKAuthCompatibility:
    """Both CLI client and SDK RESTExporter authenticate with X-API-Key header.

    This test validates the auth pattern is identical at the field and header
    name level so that a workspace admin using either entry-point can reach the
    same authenticated endpoints without reconfiguration.

    CLI import tests are skipped when oav_cli is not on the Python path
    (i.e. when running only the SDK test suite in isolation).  The authoritative
    CLI auth tests live in src/cli/tests/test_cli_commands.py.
    """

    def test_rest_exporter_uses_x_api_key_header(self):
        """RESTExporter must set X-API-Key header, not Authorization: Bearer."""
        import httpx
        from openagentvisualizer.exporters.rest_exporter import RESTExporter

        exporter = RESTExporter(api_key=_API_KEY, endpoint="http://localhost:8000")
        # Inspect the internal httpx.Client default headers
        assert exporter._client.headers.get("x-api-key") == _API_KEY
        assert "authorization" not in {k.lower() for k in exporter._client.headers}

    @respx.mock
    def test_rest_exporter_api_key_sent_with_event(self):
        """Every event POST must include X-API-Key in the request headers."""
        import httpx
        from openagentvisualizer.exporters.rest_exporter import RESTExporter

        route = respx.post("http://localhost:8000/api/events").mock(
            return_value=httpx.Response(201, json={"id": "e1"})
        )
        exporter = RESTExporter(api_key=_API_KEY, endpoint="http://localhost:8000")
        event = OAVEvent("agent.task.started", _WS_ID, _AGENT_ID)
        exporter.export_sync(event)
        assert route.called
        sent_headers = route.calls[0].request.headers
        assert sent_headers.get("x-api-key") == _API_KEY

    def test_cli_client_config_api_key_field(self):
        """OAVClient must read 'api_key' from config and pass it as X-API-Key.

        Skipped when oav_cli is not importable (SDK-only test run).
        """
        oav_cli_client = pytest.importorskip(
            "oav_cli.client",
            reason="oav_cli not on sys.path — run from src/cli for full auth compat test",
        )
        from unittest.mock import patch as mock_patch

        OAVClient = oav_cli_client.OAVClient
        cfg = {"url": "http://localhost:8000", "api_key": _API_KEY, "workspace_id": "ws1"}
        with mock_patch("oav_cli.client.load_config", return_value=cfg):
            client = OAVClient()

        assert client.api_key == _API_KEY
        assert client._http.headers.get("x-api-key") == _API_KEY

    def test_cli_client_does_not_use_bearer_token(self):
        """CLI must not use Authorization: Bearer — it authenticates via API key only.

        Skipped when oav_cli is not importable (SDK-only test run).
        """
        oav_cli_client = pytest.importorskip(
            "oav_cli.client",
            reason="oav_cli not on sys.path — run from src/cli for full auth compat test",
        )
        from unittest.mock import patch as mock_patch

        OAVClient = oav_cli_client.OAVClient
        cfg = {"url": "http://localhost:8000", "api_key": _API_KEY, "workspace_id": "ws1"}
        with mock_patch("oav_cli.client.load_config", return_value=cfg):
            client = OAVClient()

        assert "authorization" not in {k.lower() for k in client._http.headers}


# ===========================================================================
# 4. End-to-end pipeline trace: SDK event -> OTLP -> OpenTrace attributes
# ===========================================================================


class TestSDKToOpenTracePipeline:
    """Simulate the full data path: tracer decorator -> OAVEvent -> OTLP exporter.

    Verifies that an event produced by the OAVTracer decorator carries every
    attribute that the OTLPExporter needs to produce a valid OpenTrace span.
    """

    def _run_traced_and_collect_attrs(
        self, name: str, role: str, parent_agent_id: str | None = None
    ) -> dict:
        """Run a decorated function and collect all OTLP span attributes."""
        tracer = _make_tracer()

        @tracer.agent(name=name, role=role,
                      parent_agent_id=parent_agent_id, session_id=_SESSION_ID)
        def do_work():
            return "result"

        do_work()
        events = _drain(tracer)

        # Find the started event — it has the richest attribute set
        started = next(e for e in events if e.event_type == "agent.task.started")

        # Pass the event through the OTLP exporter (mocked span)
        exporter, mock_span = _make_otlp_span_mock()
        exporter.export_sync(started)
        return _attr_map(mock_span)

    def test_full_pipeline_opentrace_attributes_present(self):
        attrs = self._run_traced_and_collect_attrs(
            name="ResearchAgent", role="researcher", parent_agent_id=_PARENT_AGENT_ID
        )
        # Core identity
        assert attrs["workspace.id"] == _WS_ID
        assert attrs["agent.id"] == _AGENT_ID
        assert attrs["session.id"] == _SESSION_ID
        # OpenTrace span labelling
        assert attrs["operation.name"] == "agent.task.started"
        assert attrs["service.name"] == "ResearchAgent"
        assert attrs["task_id"]  # truthy UUID
        # OpenMesh topology
        assert attrs["agent.name"] == "ResearchAgent"
        assert attrs["agent.role"] == "researcher"
        assert attrs["parent_agent_id"] == _PARENT_AGENT_ID

    def test_full_pipeline_completed_event_opentrace_attributes(self):
        tracer = _make_tracer()

        @tracer.agent(name="WriterAgent", role="writer", session_id=_SESSION_ID)
        def do_work():
            return "done"

        do_work()
        events = _drain(tracer)
        completed = next(e for e in events if e.event_type == "agent.task.completed")

        exporter, mock_span = _make_otlp_span_mock()
        exporter.export_sync(completed)
        attrs = _attr_map(mock_span)

        assert attrs["operation.name"] == "agent.task.completed"
        assert attrs["service.name"] == "WriterAgent"
        assert attrs["agent.name"] == "WriterAgent"
        assert attrs["agent.role"] == "writer"
        assert attrs["task_id"]
        assert "oav.duration_seconds" in attrs

    def test_full_pipeline_failed_event_opentrace_attributes(self):
        tracer = _make_tracer()

        @tracer.agent(name="FailingAgent", role="executor", session_id=_SESSION_ID)
        def do_work():
            raise RuntimeError("network error")

        with pytest.raises(RuntimeError):
            do_work()

        events = _drain(tracer)
        failed = next(e for e in events if e.event_type == "agent.task.failed")

        exporter, mock_span = _make_otlp_span_mock()
        exporter.export_sync(failed)
        attrs = _attr_map(mock_span)

        assert attrs["operation.name"] == "agent.task.failed"
        assert attrs["service.name"] == "FailingAgent"
        assert attrs["agent.name"] == "FailingAgent"
        assert attrs["agent.role"] == "executor"
        assert "oav.error" in attrs


# ===========================================================================
# 5. OpenMesh topology feed — parent_agent_id in OTLP spans
# ===========================================================================


class TestOpenMeshTopologyAttributesFeed:
    """The OpenMesh service builds agent relationship topology from span data.

    Specifically it requires parent_agent_id to draw 'delegates_to' edges.
    These tests confirm that OTLP spans from multi-agent workflows carry
    that attribute consistently across all adapter types.
    """

    def test_langchain_parent_agent_id_in_otlp_span(self):
        tracer = _make_tracer()
        handler = OAVCallbackHandler(
            tracer=tracer,
            agent_id=_AGENT_ID,
            session_id=_SESSION_ID,
            parent_agent_id=_PARENT_AGENT_ID,
        )
        handler.on_llm_start(serialized={"name": "gpt-4o"}, prompts=["q"])
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")

        exporter, mock_span = _make_otlp_span_mock()
        exporter.export_sync(started)
        attrs = _attr_map(mock_span)
        assert attrs.get("parent_agent_id") == _PARENT_AGENT_ID

    def test_crewai_parent_agent_id_in_otlp_span(self):
        tracer = _make_tracer()
        mock_agent = MagicMock()
        mock_agent.execute_task = MagicMock(return_value="result")
        patch_crewai_agent(mock_agent, tracer, _AGENT_ID, session_id=_SESSION_ID,
                           parent_agent_id=_PARENT_AGENT_ID)
        mock_agent.execute_task("task")
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.task.started")

        exporter, mock_span = _make_otlp_span_mock()
        exporter.export_sync(started)
        attrs = _attr_map(mock_span)
        assert attrs.get("parent_agent_id") == _PARENT_AGENT_ID

    def test_autogen_parent_agent_id_in_otlp_span(self):
        tracer = _make_tracer()
        mock_agent = MagicMock()
        mock_agent.name = "AutoGenWorker"
        mock_agent.generate_reply = MagicMock(return_value="reply")
        patch_autogen_agent(mock_agent, tracer, _AGENT_ID, session_id=_SESSION_ID,
                            parent_agent_id=_PARENT_AGENT_ID)
        mock_agent.generate_reply(messages=[])
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")

        exporter, mock_span = _make_otlp_span_mock()
        exporter.export_sync(started)
        attrs = _attr_map(mock_span)
        assert attrs.get("parent_agent_id") == _PARENT_AGENT_ID

    def test_openai_parent_agent_id_in_otlp_span(self):
        tracer = _make_tracer()
        mock_client = MagicMock()
        usage = MagicMock()
        usage.prompt_tokens = 10
        usage.completion_tokens = 5
        usage.total_tokens = 15
        resp = MagicMock()
        resp.usage = usage
        mock_client.chat.completions.create = MagicMock(return_value=resp)
        patch_openai_client(mock_client, tracer, _AGENT_ID, session_id=_SESSION_ID,
                            parent_agent_id=_PARENT_AGENT_ID)
        mock_client.chat.completions.create(model="gpt-4o", messages=[])
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")

        exporter, mock_span = _make_otlp_span_mock()
        exporter.export_sync(started)
        attrs = _attr_map(mock_span)
        assert attrs.get("parent_agent_id") == _PARENT_AGENT_ID

    def test_anthropic_parent_agent_id_in_otlp_span(self):
        tracer = _make_tracer()
        mock_client = MagicMock()
        usage = MagicMock()
        usage.input_tokens = 50
        usage.output_tokens = 25
        resp = MagicMock()
        resp.usage = usage
        mock_client.messages.create = MagicMock(return_value=resp)
        patch_anthropic_client(mock_client, tracer, _AGENT_ID, session_id=_SESSION_ID,
                               parent_agent_id=_PARENT_AGENT_ID)
        mock_client.messages.create(model="claude-3-sonnet", messages=[])
        events = _drain(tracer)
        started = next(e for e in events if e.event_type == "agent.llm.started")

        exporter, mock_span = _make_otlp_span_mock()
        exporter.export_sync(started)
        attrs = _attr_map(mock_span)
        assert attrs.get("parent_agent_id") == _PARENT_AGENT_ID
