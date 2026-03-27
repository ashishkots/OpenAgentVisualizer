from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from openagentvisualizer.core.event import OAVEvent


class OTLPExporter:
    def __init__(self, api_key: str, endpoint: str = "localhost:4317"):
        resource = Resource(attributes={
            "service.name": "openagentvisualizer-sdk",
            "oav.api_key": api_key,
        })
        provider = TracerProvider(resource=resource)
        otlp_exporter = OTLPSpanExporter(endpoint=endpoint, insecure=True)
        provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
        self._tracer = provider.get_tracer("oav-sdk")

    def export_sync(self, event: OAVEvent) -> None:
        with self._tracer.start_as_current_span(event.event_type) as span:
            span.set_attribute("workspace.id", event.workspace_id)
            if event.agent_id:
                span.set_attribute("agent.id", event.agent_id)
            # session.id is a first-class attribute required for Sprint 2
            # session-room WebSocket routing and event-replay pagination.
            if event.session_id:
                span.set_attribute("session.id", event.session_id)

            extra = event.extra_data or {}

            # Sprint 3: structured attributes required by OpenTrace integration.
            # service.name at the span level allows OpenTrace to correlate spans
            # by logical service when agent_name is known (e.g. "ResearchAgent").
            # Falls back to the resource-level "openagentvisualizer-sdk" when absent.
            agent_name = extra.get("agent_name")
            if agent_name:
                span.set_attribute("service.name", str(agent_name))

            # operation.name is the canonical OpenTrace field for the span's
            # logical operation.  We derive it from event_type so that OpenTrace
            # waterfall rows have a human-readable label
            # (e.g. "agent.task.started") rather than a raw event UUID.
            span.set_attribute("operation.name", event.event_type)

            # agent.name / agent.role — first-class topology attributes consumed
            # by the OpenMesh integration to label nodes in the relationship graph.
            if agent_name:
                span.set_attribute("agent.name", str(agent_name))
            agent_role = extra.get("role")
            if agent_role:
                span.set_attribute("agent.role", str(agent_role))

            # parent_agent_id enables "delegates_to" edge detection in both the
            # OAV relationship graph and the OpenMesh topology feed.
            parent_agent_id = extra.get("parent_agent_id")
            if parent_agent_id:
                span.set_attribute("parent_agent_id", str(parent_agent_id))

            # task_id is the correlation key that links started / completed /
            # failed span pairs into a single logical task in OpenTrace.
            task_id = extra.get("task_id")
            if task_id:
                span.set_attribute("task_id", str(task_id))

            for k, v in extra.items():
                if isinstance(v, (str, int, float, bool)):
                    span.set_attribute("oav.{}".format(k), v)
