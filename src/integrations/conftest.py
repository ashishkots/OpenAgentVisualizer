import sys
import os

# Add the project src/ directory to sys.path so tests can import src.integrations.*
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
