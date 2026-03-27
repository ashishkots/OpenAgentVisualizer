from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr


class InviteCreate(BaseModel):
    email: EmailStr
    role: Literal["admin", "member", "viewer"] = "member"


class InviteRead(BaseModel):
    id: str
    email: str
    role: str
    status: str
    expires_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class InviteAcceptResponse(BaseModel):
    workspace_id: str
    role: str
