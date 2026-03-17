import pytest
import respx
import httpx
from openagentvisualizer.exporters.rest_exporter import RESTExporter
from openagentvisualizer.core.event import OAVEvent


@respx.mock
def test_rest_exporter_sends_event():
    route = respx.post("http://localhost:8000/api/events").mock(
        return_value=httpx.Response(201, json={"id": "e1"})
    )
    exporter = RESTExporter(api_key="oav_test_key_12345678901234567890", endpoint="http://localhost:8000")
    event = OAVEvent("agent.task.started", "ws1", "a1")
    exporter.export_sync(event)
    assert route.called
    payload = route.calls[0].request
    assert b"agent.task.started" in payload.content


@respx.mock
def test_rest_exporter_does_not_raise_on_server_error():
    respx.post("http://localhost:8000/api/events").mock(return_value=httpx.Response(500))
    exporter = RESTExporter(api_key="oav_test_key_12345678901234567890", endpoint="http://localhost:8000")
    event = OAVEvent("agent.task.started", "ws1", "a1")
    exporter.export_sync(event)  # should not raise
