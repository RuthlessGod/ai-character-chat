import json
import requests
from config import Config


def generate_location_description(character, prompt=""):
    """Generate a simple location name appropriate for the character"""
    
    system_prompt = f"""You are a location name generator for a roleplaying app.
    Given a character description, generate a simple, appropriate location name where this character
    might be found or would frequent. Keep it brief - 1-3 words only.
    
    Your response should be a JSON object with a single field:
    - "location": A short location name that clearly indicates where the character is
    
    Examples:
    - "location": "Dusty Library"
    - "location": "Space Station"
    - "location": "Medieval Tavern"
    - "location": "Beachside Cafe"
    """
    
    # Character information to inform the location
    user_prompt = f"""
    Character Information:
    - Name: {character['name']}
    - Description: {character.get('description', 'No description provided')}
    - Personality: {character.get('personality', 'No personality provided')}
    - Category: {character.get('category', 'fantasy')}
    """
    
    # Add the user prompt if provided
    if prompt:
        user_prompt += f"\nDesired location type: {prompt}"
    
    try:
        # Use the same API endpoint chosen by the user
        if Config.DEFAULT_MODEL == "local":
            data = {
                "prompt": f"{system_prompt}\n\n{user_prompt}\n\nAssistant: ",
                "max_tokens": 100,
                "temperature": 0.7
            }
            
            response = requests.post(Config.LOCAL_MODEL_URL, json=data)
            
            if response.status_code != 200:
                return {"location": "Nondescript Room"}
            
            location_text = response.json().get("response", "")
        else:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}"
            }
            
            data = {
                "model": Config.DEFAULT_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7
            }
            
            response = requests.post("https://openrouter.ai/api/v1/chat/completions", 
                                   headers=headers, 
                                   json=data)
            
            if response.status_code != 200:
                return {"location": "Nondescript Room"}
            
            location_text = response.json()["choices"][0]["message"]["content"]
        
        # Extract the JSON from the response
        try:
            import re
            json_match = re.search(r'(\{.*\})', location_text, re.DOTALL)
            if json_match:
                location_json = json.loads(json_match.group(1))
                return location_json
            else:
                # If no JSON found, extract text that might be a location
                location_match = re.search(r'"location":\s*"([^"]+)"', location_text)
                if location_match:
                    return {"location": location_match.group(1)}
                    
                # Last resort, use any text as location
                return {"location": location_text.strip()}
        except:
            # If JSON parsing fails, provide a simple response
            return {"location": "Nondescript Room"}
            
    except Exception as e:
        print(f"Error generating location: {str(e)}")
        return {"location": "Nondescript Room"}

def generate_scene_description(character, character_response, user_message, is_player_action=False, action_success=None):
    """Generate a novelist-style scene description based on the character's response"""
    
    system_prompt = f"""You are a skilled novelist writing a scene between the character {character["name"]} and a user.
    Your task is to create a vivid, engaging scene description that captures the interaction. 
    
    The scene should include:
    = user action towards {character["name"]} in visual details.
    - Environmental details of the location
    - The character's actions, expressions, and body language
    - The mood and atmosphere of the scene
    - The character's dialogue (which MUST be included word for word)
    """
    
    # Add player action context if applicable
    if is_player_action:
        system_prompt += f"""
        - The user's action and its outcome ({"success" or "failure"})
        - How the environment and situation changes as a result of the action
        - visually describe an action sequence with the user taking action
        - how {character["name"]} reacted, as the action is taking place.
        - use vulgar wording and details if action is sexual
        """
    
    system_prompt += """
    Write in third-person perspective, present tense. Focus on showing rather than telling.
    Make the scene feel like a paragraph from a novel, with sensory details and emotional nuance.
    
    DO NOT create new dialogue for the character; use exactly what they said.
    DO NOT create dialogue for the user; only mention their presence and actions.
    Format your response as a JSON object with a single field named 'scene_description'.
    """
    
    # Prepare the user message context
    if is_player_action:
        try:
            # Try to parse action data
            action_data = json.loads(user_message)
            action_text = action_data["action"]
            user_context = f"Player attempts to {action_text}" + (f" and succeeds" if action_success else f" but fails")
        except:
            user_context = f"Player action: {user_message}, " + (f"Success" if action_success else f"Failure")
    else:
        user_context = f"User says: \"{user_message}\""
    
    prompt = f"""
    Character's name: {character["name"]}
    Character's description: {character.get("description", "A mysterious individual")}
    Character's personality: {character.get("personality", "Enigmatic and thoughtful")}
    Location: {character_response.get("location", "current location")}
    Character's action: {character_response.get("action", "standing still")}
    Character's mood: {character_response.get("mood", "neutral")}
    Character's emotions: {str(character_response.get("emotions", {}))}
    
    {user_context}
    Character's dialogue: "{character_response["text"]}"
    
    Create a novelist-style scene description that incorporates all these elements.
    """
    
    try:
        # Use the same API endpoint chosen by the user
        if Config.DEFAULT_MODEL == "local":
            data = {
                "prompt": f"{system_prompt}\n\n{prompt}\n\nAssistant: ",
                "max_tokens": 1000,
                "temperature": 0.7
            }
            
            response = requests.post(Config.LOCAL_MODEL_URL, json=data)
            
            if response.status_code != 200:
                return {"scene_description": "The scene unfolds naturally as the conversation continues."}
            
            scene_text = response.json().get("response", "")
        else:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}"
            }
            
            data = {
                "model": Config.DEFAULT_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7
            }
            
            response = requests.post("https://openrouter.ai/api/v1/chat/completions", 
                                   headers=headers, 
                                   json=data)
            
            if response.status_code != 200:
                return {"scene_description": "The scene unfolds naturally as the conversation continues."}
            
            scene_text = response.json()["choices"][0]["message"]["content"]
        
        # Extract the JSON from the response
        try:
            import re
            json_match = re.search(r'(\{.*\})', scene_text, re.DOTALL)
            if json_match:
                scene_json = json.loads(json_match.group(1))
                return scene_json
            else:
                # If no JSON found, wrap the text in our structure
                return {"scene_description": scene_text}
        except:
            # If JSON parsing fails, wrap the text
            return {"scene_description": scene_text}
            
    except Exception as e:
        print(f"Error generating scene description: {str(e)}")
        return {"scene_description": "The scene unfolds naturally as the conversation continues."}