from setuptools import setup, find_packages

setup(
    name="openagentvisualizer",
    version="1.0.0",
    packages=find_packages(),
    install_requires=["click>=8.1", "requests>=2.31"],
    extras_require={
        "langchain": ["langchain-core>=0.2"],
        "crewai": ["crewai>=0.1"],
        "autogen": ["pyautogen>=0.2"],
        "openai": ["openai>=1.0"],
        "anthropic": ["anthropic>=0.25"],
        "haystack": ["haystack-ai>=2.0"],
        "llamaindex": ["llama-index>=0.10"],
        "semantic-kernel": ["semantic-kernel>=1.0"],
        "dspy": ["dspy-ai>=2.0"],
        "pydantic-ai": ["pydantic-ai>=0.0.1"],
        "smolagents": ["smolagents>=1.0"],
    },
    entry_points={"console_scripts": ["oav=oav.cli:cli"]},
)
