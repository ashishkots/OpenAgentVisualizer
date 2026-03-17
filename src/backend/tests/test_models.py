def test_all_models_importable():
    from app.models.user import User, Workspace, WorkspaceMember, APIKey
    from app.models.agent import Agent, Task
    from app.models.event import Event, Span, Session
    from app.models.metrics import MetricsRaw, MetricsAgg
    from app.models.gamification import XPTransaction, Alert
    from app.models.audit import AuditLog
    assert User.__tablename__ == "users"
    assert Agent.__tablename__ == "agents"
