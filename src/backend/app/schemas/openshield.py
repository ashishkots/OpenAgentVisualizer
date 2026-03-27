"""Pydantic schemas for OpenShield security integration API responses."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SecurityPostureView(BaseModel):
    """Workspace-level security posture summary."""

    workspace_id: str
    compliance_score: float  # 0–100
    pii_exposure_count: int
    violation_count: int
    threat_count: int
    updated_at: datetime


class AgentSecurityView(BaseModel):
    """Per-agent security posture summary."""

    agent_id: str
    compliance_score: float
    grade: str  # A | B | C | D | F
    violation_count: int
    last_violation_at: Optional[datetime] = None


class ViolationView(BaseModel):
    """A single security violation event."""

    violation_id: str
    agent_id: str
    policy_name: str
    severity: str  # critical | high | medium | low
    description: str
    occurred_at: datetime
    remediation: Optional[str] = None
