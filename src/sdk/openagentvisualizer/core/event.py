from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import uuid


@dataclass
class OAVEvent:
    event_type: str
    workspace_id: str
    agent_id: Optional[str] = None
    session_id: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    extra_data: Dict[str, Any] = field(default_factory=dict)
    id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "event_type": self.event_type,
            "workspace_id": self.workspace_id,
            "agent_id": self.agent_id,
            "session_id": self.session_id,
            "timestamp": self.timestamp,
            **self.extra_data,
        }
