from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime


class AlertRead(BaseModel):
    id: str
    workspace_id: str
    agent_id: Optional[str]
    alert_type: str
    severity: str
    message: str
    extra_data: Optional[Dict[str, Any]] = None
    resolved: bool
    created_at: datetime

    model_config = {"from_attributes": True}
