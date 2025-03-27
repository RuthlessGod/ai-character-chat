# This file marks the modules directory as a Python package
# It can be left empty or used to re-export important functions

# Import key functions to make them available when importing the package
from .player_actions import handle_player_action_prompt
from .memory_management import create_system_prompt, summarize_conversations
from .scene_generation import generate_scene_description
from .ai_integration import get_openrouter_response, get_local_model_response, process_llm_response

# Export commonly used functions
__all__ = [
    'handle_player_action_prompt',
    'create_system_prompt',
    'summarize_conversations',
    'generate_scene_description',
    'get_openrouter_response',
    'get_local_model_response',
    'process_llm_response'
]