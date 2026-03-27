from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel


class ActivityRead(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}
