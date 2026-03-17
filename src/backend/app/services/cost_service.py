# Per-million-token pricing (USD) — approximate early 2026 rates
COST_TABLE = {
    "gpt-4o": {"prompt": 2.50, "completion": 10.00},
    "gpt-4-turbo": {"prompt": 10.00, "completion": 30.00},
    "gpt-3.5-turbo": {"prompt": 0.50, "completion": 1.50},
    "claude-opus-4": {"prompt": 15.00, "completion": 75.00},
    "claude-sonnet-4": {"prompt": 3.00, "completion": 15.00},
    "claude-haiku-4": {"prompt": 0.80, "completion": 4.00},
    "gemini-1.5-pro": {"prompt": 3.50, "completion": 10.50},
}


class CostService:
    def calculate_cost(
        self, model: str, prompt_tokens: int, completion_tokens: int
    ) -> float:
        """Calculate USD cost for a given model and token counts.

        Returns 0.0 for unknown models.
        """
        rates = COST_TABLE.get(model)
        if not rates:
            return 0.0
        return (
            prompt_tokens / 1_000_000 * rates["prompt"]
            + completion_tokens / 1_000_000 * rates["completion"]
        )
