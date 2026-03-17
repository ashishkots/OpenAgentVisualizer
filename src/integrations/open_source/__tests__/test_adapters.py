"""Smoke tests: every adapter must have the right class name, accept standard args, expose a tracer."""
import pytest
import importlib

ADAPTERS = [
    ("src.integrations.open_source.crewai",          "OAVCrewObserver"),
    ("src.integrations.open_source.autogen",          "OAVAutoGenLogger"),
    ("src.integrations.open_source.openai_agents",    "OAVOpenAITracer"),
    ("src.integrations.open_source.anthropic",        "OAVAnthropicTracer"),
    ("src.integrations.open_source.haystack",         "OAVHaystackTracer"),
    ("src.integrations.open_source.llamaindex",       "OAVLlamaIndexCallback"),
    ("src.integrations.open_source.semantic_kernel",  "OAVSKPlugin"),
    ("src.integrations.open_source.dspy",             "OAVDSPyLogger"),
    ("src.integrations.open_source.pydantic_ai",      "OAVPydanticAITracer"),
    ("src.integrations.open_source.smolagents",       "OAVSmolagentsCallback"),
]

@pytest.mark.parametrize("module_path,class_name", ADAPTERS)
def test_adapter_importable(module_path, class_name):
    mod = importlib.import_module(module_path)
    cls = getattr(mod, class_name)
    assert cls is not None

@pytest.mark.parametrize("module_path,class_name", ADAPTERS)
def test_adapter_instantiable(module_path, class_name):
    mod = importlib.import_module(module_path)
    cls = getattr(mod, class_name)
    instance = cls(endpoint="http://localhost:4318", api_key="key", agent_id="test-agent")
    assert hasattr(instance, "tracer")
    assert instance.tracer is not None
