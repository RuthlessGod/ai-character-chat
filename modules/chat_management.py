from flask import jsonify, request
import json
import os
from datetime import datetime
from config import Config

# Import from other modules
from .player_actions import handle_player_action_prompt
from .memory_management import create_system_prompt
from .scene_generation import generate_scene_description
from .ai_integration import get_openrouter_response, get_local_model_response, process_llm_response


def register_chat_routes(app):
    """Register chat management routes with the Flask app"""

    @app.route('/api/chat/history/<chat_id>', methods=['GET'])
    def get_chat_history(chat_id):
        """Get the conversation history for a chat instance"""
        chat_path = os.path.join(Config.CHAT_INSTANCES_FOLDER, f"{chat_id}.json")
        if not os.path.exists(chat_path):
            return jsonify({"error": "Chat instance not found"}), 404
        
        with open(chat_path, 'r') as f:
            chat_instance = json.load(f)
        
        return jsonify({"conversations": chat_instance.get("conversations", [])})

    @app.route('/api/chat/<chat_id>', methods=['POST'])
    def chat(chat_id):
        """Send a message to a chat instance and get a response with scene description"""
        data = request.json
        message = data.get("message", "")
        use_local_model = data.get("use_local_model", False)
        
        # Check if this is a player action
        is_player_action = data.get("is_player_action", False)
        action_success = data.get("action_success", True) if is_player_action else None
        
        # Get chat instance data
        chat_path = os.path.join(Config.CHAT_INSTANCES_FOLDER, f"{chat_id}.json")
        if not os.path.exists(chat_path):
            return jsonify({"error": "Chat instance not found"}), 404
        
        with open(chat_path, 'r') as f:
            chat_instance = json.load(f)
        
        # Get character data
        character_id = chat_instance["character_id"]
        character_path = os.path.join(Config.CHARACTERS_FOLDER, f"{character_id}.json")
        if not os.path.exists(character_path):
            return jsonify({"error": "Character not found"}), 404
        
        with open(character_path, 'r') as f:
            character = json.load(f)
        
        # Use character state from chat instance (not the base character)
        character_state = chat_instance.get("character_state", {})
        if character_state:
            # Override character properties with chat-specific state
            character["mood"] = character_state.get("mood", character.get("mood", "neutral"))
            character["emotions"] = character_state.get("emotions", character.get("emotions", {}))
            character["opinion_of_user"] = character_state.get("opinion_of_user", character.get("opinion_of_user", "neutral"))
            character["action"] = character_state.get("action", character.get("action", "standing idly"))
        
        # Use location from chat instance
        character["location"] = chat_instance.get("location", character.get("location", "a nondescript room"))
            
        # Ensure character emotions is a dictionary
        if not isinstance(character.get("emotions"), dict):
            character["emotions"] = {}
        
        # Check if chat has a scenario_id and prepare scenario context
        scenario_id = chat_instance.get("scenario_id")
        scenario_context = ""

        if scenario_id:
            # Get scenario data
            scenario_path = os.path.join(Config.SCENARIOS_FOLDER, f"{scenario_id}.json")
            if os.path.exists(scenario_path):
                with open(scenario_path, 'r') as f:
                    scenario = json.load(f)
                
                # Generate scenario context based on world size
                world_size = scenario.get("world_size", "small")
                
                scenario_context = f"""
This conversation takes place in a scenario called "{scenario.get('title')}".
{scenario.get('description', '')}

You are in {chat_instance.get('location', scenario.get('starting_location', 'an unknown location'))}.

World Information:
"""
                
                # Add locations
                locations = scenario.get("locations", [])
                if locations:
                    scenario_context += "\nLocations in this world:"
                    for loc in locations:
                        if isinstance(loc, dict):
                            scenario_context += f"\n- {loc.get('name', 'Unknown')}: {loc.get('description', '')}"
                        else:
                            scenario_context += f"\n- {loc}"
                
                # Add NPCs
                npcs = scenario.get("npcs", [])
                if npcs:
                    scenario_context += "\n\nPeople in this world:"
                    for npc in npcs:
                        if isinstance(npc, dict):
                            scenario_context += f"\n- {npc.get('name', 'Unknown')}: {npc.get('description', '')}. Role: {npc.get('role', 'Unknown')}"
                        else:
                            scenario_context += f"\n- {npc}"
                
                # Add history for medium and large worlds
                if world_size in ["medium", "large"] and "history" in scenario:
                    scenario_context += f"\n\nHistory: {scenario.get('history', '')}"
                
                # Add additional info for large worlds
                if world_size == "large":
                    if "political_structure" in scenario:
                        scenario_context += f"\n\nPolitical Structure: {scenario.get('political_structure', '')}"
                    
                    if "economy" in scenario:
                        scenario_context += f"\n\nEconomy: {scenario.get('economy', '')}"
                    
                    if "geography" in scenario:
                        scenario_context += f"\n\nGeography: {scenario.get('geography', '')}"
                
                # Add special world rules if any
                if "world_rules" in scenario:
                    scenario_context += f"\n\nSpecial Rules: {scenario.get('world_rules', '')}"
        
        # Create a system prompt based on character data and conversations
        base_system_prompt = create_system_prompt(character, {"memories": [], "conversations": chat_instance.get("conversations", [])})
        
        # Include scenario context in system prompt if available
        if scenario_context:
            system_prompt = scenario_context + "\n\n" + base_system_prompt
        else:
            system_prompt = base_system_prompt
        
        # Modify the system prompt for player actions
        if is_player_action:
            system_prompt = handle_player_action_prompt(system_prompt, message, action_success)
            # Parse the JSON string back to an object to get the actual action text
            try:
                action_data = json.loads(message)
                message = f"*Attempts to {action_data['action']}*" + (" (Success)" if action_success else " (Failure)")
            except:
                # If parsing fails, use the message as-is
                pass
        else:
            # Add instructions for action and location for regular messages
            system_prompt += """\n\nIn addition to your regular response, please include:
            - 'action': A brief description of what you're physically doing as you speak (e.g., "sipping coffee", "pacing nervously")
            - 'location': Where you currently are (be specific, and maintain consistency with previous locations unless you're explicitly moving)
            
            Your action should reflect your personality and current emotional state.
            
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
            """
        
        # Get response from LLM
        if use_local_model:
            response = get_local_model_response(system_prompt, message)
        else:
            response = get_openrouter_response(system_prompt, message)
        
        # Process response to extract mood, emotions, opinions, action, location
        processed_response = process_llm_response(response)
        
        # Log the processed response for debugging
        print(f"Processed response: {json.dumps(processed_response, indent=2)}")
        
        # Make sure text is really just text (not containing JSON)
        text = processed_response.get("text", "")
        # If text still looks like JSON, try to extract just the inner text part
        if text.strip().startswith("{") and text.strip().endswith("}"):
            try:
                json_obj = json.loads(text)
                if isinstance(json_obj, dict) and "text" in json_obj:
                    text = json_obj.get("text", "")
            except:
                # If we can't parse it, leave it as is
                pass
        
        # Make sure we have a valid text response
        if not text or len(text.strip()) == 0:
            text = "I'm not sure what to say right now."
        
        # Update processed_response with cleaned text
        processed_response["text"] = text
        
        # Generate scene description
        scene_description = generate_scene_description(character, processed_response, message, is_player_action, action_success)
        
        # Update character state in chat instance
        chat_instance["character_state"] = {
            "mood": processed_response.get("mood", character["mood"]),
            "emotions": processed_response.get("emotions", character["emotions"]),
            "opinion_of_user": processed_response.get("opinion_of_user", character["opinion_of_user"]),
            "action": processed_response.get("action", character.get("action", "standing still"))
        }
        
        # Update chat location if changed
        new_location = processed_response.get("location")
        if new_location and new_location != "current location" and new_location != character["location"]:
            chat_instance["location"] = new_location
        
        # Update chat instance with this conversation
        timestamp = datetime.now().isoformat()
        conversation_entry = {
            "timestamp": timestamp,
            "user_message": message,
            "character_response": processed_response["text"],
            "mood": processed_response.get("mood", "neutral"),
            "emotions": processed_response.get("emotions", {}),
            "action": processed_response.get("action", "standing still"),
            "location": chat_instance["location"],
            "scene_description": scene_description.get("scene_description", "")
        }
        
        # Add action-specific data to conversation
        if is_player_action:
            try:
                action_data = json.loads(message)
                conversation_entry["is_player_action"] = True
                conversation_entry["player_action"] = action_data["action"]
                conversation_entry["action_success"] = action_success
                conversation_entry["action_details"] = action_data.get("details", "")
            except:
                pass
        
        # Add conversation to chat instance
        if not chat_instance.get("conversations"):
            chat_instance["conversations"] = []
        
        chat_instance["conversations"].append(conversation_entry)
        
        # Update timestamp
        chat_instance["updated_at"] = timestamp
        
        # Save updated chat instance
        with open(chat_path, 'w') as f:
            json.dump(chat_instance, f, indent=2)
        
        # Return processed response
        return jsonify({
            "response": processed_response["text"],
            "mood": processed_response.get("mood", "neutral"),
            "emotions": processed_response.get("emotions", {}),
            "opinion_of_user": processed_response.get("opinion_of_user", "neutral"),
            "action": processed_response.get("action", "standing still"),
            "location": chat_instance["location"],
            "scene_description": scene_description.get("scene_description", "")
        })