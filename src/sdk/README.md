# OpenAgentVisualizer Python SDK

Connect any AI agent to OpenAgentVisualizer in 3 lines.

## Quick Start

```python
from openagentvisualizer import OAVTracer

tracer = OAVTracer(api_key="oav_your_key")

@tracer.agent(name="MyAgent", role="researcher")
def my_agent(query: str) -> str:
    # Your agent logic here
    return "result"
```

## Installation

```bash
pip install openagentvisualizer
```
