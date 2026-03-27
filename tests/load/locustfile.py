"""
Load test scenarios for OpenAgentVisualizer.
Run: locust -f tests/load/locustfile.py --host=http://localhost:8000
"""
import json
import random
import uuid
from locust import HttpUser, task, between, events
from locust.exception import StopUser


class OAVUser(HttpUser):
    """Simulates a dashboard user browsing agents, events, and metrics."""

    wait_time = between(1, 3)
    token: str = ""
    workspace_id: str = ""
    agent_ids: list[str] = []

    def on_start(self):
        """Register and login to get JWT token."""
        email = f"loadtest-{uuid.uuid4().hex[:8]}@test.com"
        resp = self.client.post("/api/auth/register", json={
            "email": email,
            "password": "loadtest123",
            "full_name": "Load Tester",
            "workspace_name": f"ws-{uuid.uuid4().hex[:8]}",
        })
        if resp.status_code != 201:
            # Try login if user exists
            resp = self.client.post("/api/auth/login", json={
                "email": email,
                "password": "loadtest123",
            })
        data = resp.json()
        self.token = data.get("access_token", "")
        self.workspace_id = data.get("workspace_id", "")
        if not self.token:
            raise StopUser()

    @property
    def auth_headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def list_agents(self):
        resp = self.client.get(
            "/api/agents?limit=50&offset=0",
            headers=self.auth_headers,
            name="/api/agents",
        )
        if resp.status_code == 200:
            agents = resp.json()
            self.agent_ids = [a["id"] for a in agents[:10]]

    @task(2)
    def get_agent_detail(self):
        if not self.agent_ids:
            return
        agent_id = random.choice(self.agent_ids)
        self.client.get(
            f"/api/agents/{agent_id}/stats",
            headers=self.auth_headers,
            name="/api/agents/:id/stats",
        )

    @task(2)
    def list_events(self):
        self.client.get(
            "/api/events?limit=50&offset=0",
            headers=self.auth_headers,
            name="/api/events",
        )

    @task(1)
    def get_metrics(self):
        self.client.get(
            "/api/metrics/aggregates?interval=hourly",
            headers=self.auth_headers,
            name="/api/metrics/aggregates",
        )

    @task(1)
    def get_leaderboard(self):
        self.client.get(
            "/api/gamification/leaderboard?period=weekly&category=xp&limit=20",
            headers=self.auth_headers,
            name="/api/gamification/leaderboard",
        )

    @task(1)
    def get_alerts(self):
        self.client.get(
            "/api/alerts?limit=20&offset=0",
            headers=self.auth_headers,
            name="/api/alerts",
        )

    @task(1)
    def create_agent(self):
        resp = self.client.post(
            "/api/agents",
            headers=self.auth_headers,
            json={
                "name": f"agent-{uuid.uuid4().hex[:8]}",
                "type": "llm",
                "framework": "langchain",
            },
            name="/api/agents (POST)",
        )
        if resp.status_code == 201:
            self.agent_ids.append(resp.json()["id"])


class EventIngestionUser(HttpUser):
    """Simulates SDK sending events at high throughput."""

    wait_time = between(0.01, 0.05)
    token: str = ""
    workspace_id: str = ""
    agent_ids: list[str] = []

    def on_start(self):
        email = f"ingest-{uuid.uuid4().hex[:8]}@test.com"
        resp = self.client.post("/api/auth/register", json={
            "email": email,
            "password": "loadtest123",
            "full_name": "Ingest Tester",
            "workspace_name": f"ws-{uuid.uuid4().hex[:8]}",
        })
        if resp.status_code != 201:
            resp = self.client.post("/api/auth/login", json={
                "email": email, "password": "loadtest123",
            })
        data = resp.json()
        self.token = data.get("access_token", "")
        self.workspace_id = data.get("workspace_id", "")
        if not self.token:
            raise StopUser()
        # Create 10 agents
        for i in range(10):
            r = self.client.post("/api/agents", headers=self.auth_headers, json={
                "name": f"ingest-agent-{i}",
                "type": "llm",
                "framework": "langchain",
            })
            if r.status_code == 201:
                self.agent_ids.append(r.json()["id"])

    @property
    def auth_headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}

    @task
    def ingest_event(self):
        if not self.agent_ids:
            return
        self.client.post(
            "/api/events",
            headers=self.auth_headers,
            json={
                "agent_id": random.choice(self.agent_ids),
                "event_type": random.choice([
                    "agent.task.started",
                    "agent.task.completed",
                    "agent.llm.call",
                    "agent.tool.invoked",
                ]),
                "extra_data": {
                    "tokens": random.randint(50, 2000),
                    "cost_usd": round(random.uniform(0.001, 0.05), 4),
                    "duration_ms": random.randint(100, 5000),
                },
            },
            name="/api/events (POST)",
        )

    @task
    def ingest_batch(self):
        if not self.agent_ids:
            return
        events_batch = []
        for _ in range(10):
            events_batch.append({
                "agent_id": random.choice(self.agent_ids),
                "event_type": "agent.task.completed",
                "extra_data": {"tokens": random.randint(50, 500)},
            })
        self.client.post(
            "/api/events/batch",
            headers=self.auth_headers,
            json=events_batch,
            name="/api/events/batch (POST)",
        )
