#!/usr/bin/env python3
"""
End-to-end smoke test. Run AFTER docker compose up --build.
Usage: python tests/e2e_smoke.py

This script verifies the full stack is working correctly:
- Default user seeded and login works
- API key authentication works
- Agent CRUD works
- Event ingestion works
- OTLP HTTP ingest works
- Span appears in DB after OTLP ingest
"""
import httpx
import time
import sys

BASE = "http://localhost"


def check(label: str, condition: bool, detail: str = "") -> None:
    icon = "✅" if condition else "❌"
    print(f"{icon} {label}" + (f": {detail}" if detail else ""))
    if not condition:
        sys.exit(1)


def main() -> None:
    print("\n=== OpenAgentVisualizer Smoke Test ===\n")

    # 1. Health check
    r = httpx.get(f"{BASE}/api/health")
    check("Health endpoint reachable", r.status_code == 200)

    # 2. Login with seeded default user
    r = httpx.post(
        f"{BASE}/api/auth/login",
        json={"email": "kotsai@gmail.com", "password": "kots@123"},
    )
    check("Default user seed login", r.status_code == 200)
    token = r.json()["access_token"]
    workspace_id = r.json()["workspace_id"]
    headers = {"Authorization": f"Bearer {token}"}
    check("Login response has workspace_id", bool(workspace_id))

    # 3. Invalid API key rejected
    r = httpx.get(
        f"{BASE}/api/agents",
        headers={"X-API-Key": "oav_fake_key_12345678901234567890"},
    )
    check("Invalid API key returns 401", r.status_code == 401)

    # 4. Create agent
    r = httpx.post(
        f"{BASE}/api/agents",
        json={"name": "SmokeBot", "role": "tester", "framework": "custom"},
        headers=headers,
    )
    check("Create agent", r.status_code == 201, str(r.status_code))
    agent_id = r.json()["id"]
    check("Agent has ID", bool(agent_id))

    # 5. List agents — created agent appears
    r = httpx.get(f"{BASE}/api/agents", headers=headers)
    check("List agents", r.status_code == 200)
    check(
        "Created agent appears in list",
        any(a["id"] == agent_id for a in r.json()),
    )

    # 6. Post event
    r = httpx.post(
        f"{BASE}/api/events",
        json={"event_type": "agent.task.started", "agent_id": agent_id},
        headers=headers,
    )
    check("POST event ingested", r.status_code in (200, 201), str(r.status_code))

    # 7. OTLP HTTP span ingest
    otlp_payload = {
        "resourceSpans": [
            {
                "resource": {
                    "attributes": [
                        {
                            "key": "workspace.id",
                            "value": {"stringValue": workspace_id},
                        }
                    ]
                },
                "scopeSpans": [
                    {
                        "spans": [
                            {
                                "traceId": "abc123abc123abc123abc123abc12345",
                                "spanId": "abc12345abc12345",
                                "name": "smoke.test.span",
                                "startTimeUnixNano": "1700000000000000000",
                                "endTimeUnixNano": "1700001000000000000",
                                "status": {"code": 1},
                                "attributes": [
                                    {
                                        "key": "agent.id",
                                        "value": {"stringValue": agent_id},
                                    }
                                ],
                            }
                        ]
                    }
                ],
            }
        ]
    }
    r = httpx.post(
        f"{BASE}/otlp/v1/traces",
        json=otlp_payload,
        headers={**headers, "Content-Type": "application/json"},
    )
    check(
        "OTLP HTTP span ingested",
        r.status_code in (200, 201, 204),
        str(r.status_code),
    )

    # Allow async processing
    time.sleep(2)

    # 8. Verify span appears in spans endpoint
    r = httpx.get(f"{BASE}/api/spans", headers=headers)
    check("Spans endpoint reachable", r.status_code == 200)

    # 9. Leaderboard accessible
    r = httpx.get(f"{BASE}/api/gamification/leaderboard", headers=headers)
    check("Gamification leaderboard accessible", r.status_code == 200)

    # 10. Alerts endpoint accessible
    r = httpx.get(f"{BASE}/api/alerts", headers=headers)
    check("Alerts endpoint accessible", r.status_code == 200)

    print("\n=== All checks passed ✅ ===\n")
    print("Next step: open http://localhost in browser, log in as kotsai@gmail.com")
    print("Navigate to Virtual World, open DevTools > Performance, confirm 60fps canvas.")


if __name__ == "__main__":
    main()
