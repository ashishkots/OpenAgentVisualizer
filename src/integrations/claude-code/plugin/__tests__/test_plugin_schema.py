import yaml
import pathlib

PLUGIN_DIR = pathlib.Path(__file__).parent.parent

def test_plugin_yaml_valid_and_required_fields():
    data = yaml.safe_load((PLUGIN_DIR / "plugin.yaml").read_text())
    assert data["name"] == "oav"
    assert isinstance(data["skills"], list)
    assert len(data["skills"]) == 6
    assert "SessionStart" in data["hooks"]
    assert "Stop" in data["hooks"]
    assert "statusline" in data

def test_all_skill_files_exist():
    data = yaml.safe_load((PLUGIN_DIR / "plugin.yaml").read_text())
    for skill_path in data["skills"]:
        assert (PLUGIN_DIR / skill_path).exists(), f"Missing skill file: {skill_path}"

def test_hook_scripts_exist():
    data = yaml.safe_load((PLUGIN_DIR / "plugin.yaml").read_text())
    for hook_path in data["hooks"].values():
        assert (PLUGIN_DIR / hook_path).exists(), f"Missing hook script: {hook_path}"
