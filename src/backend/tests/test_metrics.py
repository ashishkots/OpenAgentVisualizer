import pytest
from app.services.cost_service import CostService


def test_gpt4_cost_calculation():
    svc = CostService()
    cost = svc.calculate_cost(model="gpt-4o", prompt_tokens=1000, completion_tokens=500)
    assert cost > 0


def test_unknown_model_returns_zero():
    svc = CostService()
    cost = svc.calculate_cost(model="unknown-model", prompt_tokens=1000, completion_tokens=500)
    assert cost == 0.0
