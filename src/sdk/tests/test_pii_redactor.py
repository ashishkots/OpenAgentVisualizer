from openagentvisualizer.core.pii_redactor import redact

def test_redacts_email():
    result = redact("Send email to user@example.com about the order")
    assert "user@example.com" not in result
    assert "[EMAIL]" in result

def test_redacts_api_key_pattern():
    result = redact("Use key sk-abc123def456ghi789jkl for auth")
    assert "sk-abc123def456ghi789jkl" not in result
    assert "[API_KEY]" in result

def test_preserves_non_pii():
    result = redact("The agent completed the research task successfully")
    assert result == "The agent completed the research task successfully"

def test_handles_nested_dict():
    data = {"prompt": "email me at test@email.com", "model": "gpt-4o"}
    result = redact(data)
    assert "test@email.com" not in result["prompt"]
    assert result["model"] == "gpt-4o"
