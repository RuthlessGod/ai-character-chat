import json

def handle_player_action_prompt(system_prompt, message, action_success):
    """Modify the system prompt to handle player actions"""
    try:
        # Parse the action data from message
        action_data = json.loads(message)
        action_text = action_data["action"]
        relevant_stat = action_data.get("relevantStat", "strength")
        roll_value = action_data.get("rollValue", 0)
        difficulty_class = action_data.get("difficultyClass", 10)
        details = action_data.get("details", "")
    except:
        # If parsing fails, use defaults
        action_text = message
        relevant_stat = "strength"
        roll_value = 0
        difficulty_class = 10
        details = ""
    
    # Build player action context
    player_action_context = f"""
    The user is attempting to perform an action rather than speaking. Respond accordingly.
    
    Player Action: {action_text}
    Action Outcome: {"Success" if action_success else "Failure"}
    Relevant Ability: {relevant_stat.capitalize()}
    Action Difficulty (DC): {difficulty_class}
    Roll Result: {roll_value}
    Details: {details}
    
    Please respond to this action attempt based on the outcome. If the action was successful,
    describe how it succeeds and the positive consequences. If it failed, describe how it fails
    and any negative consequences. Be realistic but dramatic in your description.
    
    Your response should acknowledge the player's action and its outcome, then describe your
    character's reaction to it. Stay in character and maintain appropriate emotional reactions.
    
    In addition to your regular response, please include:
    - 'action': A brief description of what you're physically doing in reaction to the player's action
    - 'location': Where you currently are (be specific, and maintain consistency with previous locations)
    
    IMPORTANT LOCATION INSTRUCTIONS:
    - If the your roleplay character's action involves moving to a new location AND the action is successful, UPDATE the location field to reflect this new location.
    - If the your roleplay character tries to move somewhere but fails, keep the location the same.
    - If the your roleplay character's action doesn't involve movement, keep the location the same.
    - Never use "current location" as the value - always specify the actual location name.
    
    Your response should include:
    1. A description of the outcome of the player's action (success or failure)
    2. Your character's reaction to the action
    3. How this affects the ongoing situation
    
    Format your response as a JSON object as follows:
    {{
    "text": "Your actual response to the user - this should be what you want to say directly",
    "mood": "your current mood (happy, sad, angry, confused, etc.)",
    "emotions": {{"joy": 0.8, "curiosity": 0.6}},
    "opinion_of_user": "your opinion of the user (positive, negative, neutral, etc.)",
    "action": "what you're physically doing as you speak",
    "location": "where you currently are (specific location name)"
    }}
    
    Important: For "text", include ONLY what you want to say to the user, not any descriptions or metadata.
    DO NOT include JSON syntax in the "text" field itself. The "text" field should contain only your natural dialogue.
    """
    
    # Append to the existing system prompt
    enhanced_prompt = system_prompt + "\n\n" + player_action_context
    
    return enhanced_prompt