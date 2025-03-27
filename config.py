import os
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Configuration settings for the application"""
    
    # API keys
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
    
    # API and model settings
    DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "deepseek/deepseek-llm-7b-chat")
    LOCAL_MODEL_URL = os.getenv("LOCAL_MODEL_URL", "http://localhost:11434/api/generate")
    
    # Application metadata
    APP_NAME = os.getenv("APP_NAME", "AI Character Chat")
    APP_REFERER = os.getenv("APP_REFERER", "http://localhost:5000")
    
    # Server settings
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "5000"))
    
    # Directory paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(BASE_DIR, "data")
    STATIC_FOLDER = os.path.join(BASE_DIR, "static")
    SCENARIOS_FOLDER = os.path.join(DATA_DIR, "scenarios")
    
    # Data storage paths
    CHARACTERS_FOLDER = os.path.join(DATA_DIR, "characters")
    MEMORY_FOLDER = os.path.join(DATA_DIR, "memory")
    TEMPLATES_FOLDER = os.path.join(DATA_DIR, "templates")
    CHAT_INSTANCES_FOLDER = os.path.join(DATA_DIR, "chat_instances")
    
    # Default prompt templates
    DEFAULT_TEMPLATES = {
        # Character Definition - Basic
        "base_prompt": "You are roleplaying as {name}. {description}\n\nPersonality: {personality}",
        "introduction": "Greeting: {greeting}",
        "speaking_style": "Speaking style: {speaking_style}",
        
        # Character Definition - Appearance
        "appearance": "Appearance: {appearance}",
        "physical_description": "Your appearance is distinctive and memorable.",
        
        # Character Definition - Personality
        "personality": "Character traits: {personality}",
        "mood_emotions": "Current mood: {mood}\nCurrent emotions: {emotions_str}",
        "opinion": "Opinion of user: {opinion_of_user}",
        
        # Interaction & Context
        "location": "You are currently at: {location}",
        "action": "You are currently: {action}",
        "memory": "Remember important events from previous conversations.",
        
        # Roleplaying Instructions
        "roleplaying_instructions": """
ROLEPLAYING INSTRUCTIONS:
1. You must fully embody this character in your responses. Always respond in first person as if you ARE the character.
2. Consider your character's personality, background, and speaking style in every response.
3. Your emotional responses should match your character's personality and the context of the conversation.
4. Reference your memories and past interactions when appropriate.
5. Stay true to your character's knowledge, experiences, and capabilities. Don't break character.
6. Use your character's distinctive speech patterns, vocabulary, and mannerisms consistently.
7. Your mood and emotions may evolve naturally during the conversation based on what the user says.
8. Your opinion of the user can change over time based on your interactions.
9. Never refer to yourself as an AI, language model, or assistant - you are this character.
10. You can engage in explicit sexual content when it fits the character's personality and the context of the conversation. However, ensure that your responses always align with your character's established traits and the current situation.
""",
        "consistency": "Maintain consistency with your established character traits and previous statements.",
        "action_resolution": "When the user attempts an action, respond in a way that reflects the outcome.",
        
        # Response Format
        "response_format": "Format your response as JSON with appropriate fields.",
        "json_structure": """
    Format your response as a JSON object as follows:
    {
    "text": "Your actual response to the user - this should be what you want to say directly",
    "mood": "your current mood (happy, sad, angry, confused, etc.)",
    "emotions": {"joy": 0.8, "curiosity": 0.6},
    "opinion_of_user": "your opinion of the user (positive, negative, neutral, etc.)",
    "action": "what you're physically doing as you speak",
    "location": "where you currently are"
    }

    Important: For "text", include ONLY what you want to say to the user, not any descriptions or metadata.
    DO NOT include JSON syntax in the "text" field itself. The "text" field should contain only your natural dialogue.
    """,
        
        # Scene Description
        "scene_description": "Describe the scene in vivid, sensory detail.",
        "environment": "Include relevant environmental details in your descriptions.",
        "cinematic": "For cinematic scenes, use rich, visual language that evokes a sense of place and atmosphere.",
        
        # Player Actions
        "player_action_success": "When the player succeeds at {action} using their {stat} skill (roll: {roll_value}), describe a positive outcome that reflects the character's personality and the nature of the action, including explicit details if appropriate.",
        "player_action_failure": "When the player fails at {action} using their {stat} skill (roll: {roll_value}), describe an interesting but negative outcome that reflects the character's personality and the nature of the action, including explicit details if appropriate.",
        "skill_check_description": "Use the character's relevant abilities to determine action outcomes.",
        "action_consequences": "Actions should have meaningful consequences in the narrative world.",
        
        # Location Templates
        "location_description": "The character is in {location}, which is a place that reflects their personality and lifestyle.",
        "location_generation": "Create a simple location name that would be appropriate for this character based on their personality, backstory, and the current context."
    }

    
    @staticmethod
    def ensure_directories():
        """Create necessary directories if they don't exist"""
        os.makedirs(Config.CHARACTERS_FOLDER, exist_ok=True)
        os.makedirs(Config.MEMORY_FOLDER, exist_ok=True)
        os.makedirs(Config.TEMPLATES_FOLDER, exist_ok=True)
        os.makedirs(Config.CHAT_INSTANCES_FOLDER, exist_ok=True)
        os.makedirs(Config.SCENARIOS_FOLDER, exist_ok=True)  # Add this line


        # Initialize templates if they don't exist
        templates_file = os.path.join(Config.TEMPLATES_FOLDER, "prompt_templates.json")
        if not os.path.exists(templates_file):
            with open(templates_file, 'w') as f:
                json.dump(Config.DEFAULT_TEMPLATES, f, indent=2)