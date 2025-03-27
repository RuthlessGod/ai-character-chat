import json
import os
from config import Config

def create_system_prompt(character, memory_data):
    """Create a system prompt for the LLM based on character data, memories, and templates"""
    # Get templates
    templates_path = os.path.join(Config.TEMPLATES_FOLDER, "prompt_templates.json")
    if os.path.exists(templates_path):
        with open(templates_path, 'r') as f:
            templates = json.load(f)
    else:
        templates = Config.DEFAULT_TEMPLATES
    
    # Format base prompt
    prompt = templates["base_prompt"].format(
        name=character['name'],
        description=character.get('description', ''),
        personality=character.get('personality', '')
    ) + "\n\n"
    
    # Add speaking style if available
    if character.get('speaking_style') and "speaking_style" in templates:
        prompt += templates["speaking_style"].format(
            speaking_style=character.get('speaking_style', '')
        ) + "\n\n"
    
    # Add appearance if available
    if character.get('appearance') and "appearance" in templates:
        prompt += templates["appearance"].format(
            appearance=character.get('appearance', '')
        ) + "\n\n"
    
    # Add mood and emotions
    emotions = character.get('emotions', {})
    emotions_str = ""
    if emotions:
        # If emotions is a string, try to convert to dictionary
        if isinstance(emotions, str):
            try:
                emotions = json.loads(emotions)
            except:
                emotions = {}
        
        # Only process if it's a dictionary and not empty
        if isinstance(emotions, dict) and emotions:
            emotions_str = ", ".join([f"{k}: {v}" for k, v in emotions.items()])
    
    if "mood_emotions" in templates:
        prompt += templates["mood_emotions"].format(
            mood=character.get('mood', 'neutral'),
            emotions_str=emotions_str
        ) + "\n"
    
    # Add opinion of user
    if "opinion" in templates:
        prompt += templates["opinion"].format(
            opinion_of_user=character.get('opinion_of_user', 'neutral')
        ) + "\n\n"
    
    # Add action and location if available
    prompt += f"Current action: {character.get('action', 'standing still')}\n"
    prompt += f"Current location: {character.get('location', 'current location')}\n\n"
    
    # Add important memories
    if memory_data.get('memories'):
        prompt += "Important memories:\n"
        for memory in memory_data['memories']:
            prompt += f"- {memory['content']} ({memory['timestamp']})\n"
    
    # Add recent conversations (last 5)
    if memory_data.get('conversations'):
        prompt += "\nRecent conversations:\n"
        recent_convos = memory_data['conversations'][-5:]
        for convo in recent_convos:
            prompt += f"User: {convo['user_message']}\n"
            prompt += f"You ({convo.get('mood', 'neutral')}): {convo['character_response']}\n\n"
    
    # Add roleplaying instructions
    if "roleplaying_instructions" in templates:
        prompt += templates["roleplaying_instructions"]
    
    # Add response format instructions
    if "response_format" in templates:
        prompt += templates["response_format"]
    
    return prompt

def summarize_conversations(memory_data):
    """Summarize older conversations to keep memory manageable"""
    # Keep last 10 conversations as is
    recent = memory_data["conversations"][-10:]
    older = memory_data["conversations"][:-10]
    
    # Group older conversations by day
    by_day = {}
    for convo in older:
        day = convo["timestamp"].split("T")[0]
        if day not in by_day:
            by_day[day] = []
        by_day[day].append(convo)
    
    # Create summaries and track player actions
    for day, convos in by_day.items():
        # Count player actions
        action_count = sum(1 for convo in convos if convo.get("is_player_action", False))
        success_count = sum(1 for convo in convos if convo.get("is_player_action", False) and convo.get("action_success", False))
        
        action_summary = ""
        if action_count > 0:
            action_summary = f" The user attempted {action_count} actions, succeeding on {success_count} of them."
        
        summary = {
            "timestamp": f"{day}T00:00:00Z",
            "summary": f"Summary of {len(convos)} conversations on {day}.{action_summary}",
            "user_message": "Multiple messages",
            "character_response": "Multiple responses",
            "mood": "mixed",
            "emotions": {},
            "action": "various actions",
            "location": "various locations"
        }
        
        # Extract key emotions from the day
        all_emotions = {}
        for convo in convos:
            for emotion, intensity in convo.get("emotions", {}).items():
                if emotion not in all_emotions:
                    all_emotions[emotion] = []
                all_emotions[emotion].append(intensity)
        
        # Average emotions
        for emotion, intensities in all_emotions.items():
            summary["emotions"][emotion] = sum(intensities) / len(intensities)
        
        # Add to memories
        memory_data["memories"].append({
            "timestamp": summary["timestamp"],
            "content": summary["summary"]
        })
    
    # Replace with summarized version
    memory_data["conversations"] = recent
    
    return memory_data