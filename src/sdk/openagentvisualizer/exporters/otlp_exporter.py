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
            for k, v in (event.extra_data or {}).items():
                if isinstance(v, (str, int, float, bool)):
                    span.set_attribute("oav.{}".format(k), v)
