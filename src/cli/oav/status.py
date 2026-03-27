import click
import requests
from oav import config as cfg_module

def show() -> None:
    endpoint = cfg_module.get("endpoint", "http://localhost:8000")
    api_key = cfg_module.get("api_key", "")
    try:
        r = requests.get(f"{endpoint}/api/integrations",
            headers={"Authorization": f"Bearer {api_key}"}, timeout=3)
        if not r.ok:
            click.echo(f"✗ OAV backend error {r.status_code}")
            return
        integrations = r.json()
        click.echo("\n⬡ OAV Integration Status\n")
        for item in integrations:
            icon = "●" if item["status"] == "connected" else "○"
            last = f"  Last: {item['last_seen'][:19]}" if item.get("last_seen") else ""
            click.echo(f"  {icon} {item['name']:<30} {item['status']:<15} {item.get('event_count_24h', 0):>5} events/24h{last}")
        click.echo("")
    except Exception as e:
        click.echo(f"✗ Cannot reach OAV backend at {endpoint}: {e}")
        click.echo("  Run: oav config set endpoint <url>")
