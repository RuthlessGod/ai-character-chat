from flask import jsonify, request
import json
import os
import uuid
from datetime import datetime
from config import Config

def register_chat_instance_routes(app):
    """Register chat instance management routes with the Flask app"""

    @app.route('/api/chats', methods=['GET'])
    def get_chat_instances():
        """Get list of all chat instances"""
        chat_instances = []
        
        # Ensure chat instances directory exists
        os.makedirs(Config.CHAT_INSTANCES_FOLDER, exist_ok=True)
        
        for filename in os.listdir(Config.CHAT_INSTANCES_FOLDER):
            if filename.endswith('.json'):
                chat_path = os.path.join(Config.CHAT_INSTANCES_FOLDER, filename)
                with open(chat_path, 'r') as f:
                    chat_instance = json.load(f)
                    chat_instances.append(chat_instance)
                    
        # Sort by updated_at in descending order (newest first)
        chat_instances.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
        
        return jsonify(chat_instances)

    @app.route('/api/chats/<chat_id>', methods=['GET'])
    def get_chat_instance(chat_id):
        """Get a specific chat instance by ID"""
        chat_path = os.path.join(Config.CHAT_INSTANCES_FOLDER, f"{chat_id}.json")
        if os.path.exists(chat_path):
            with open(chat_path, 'r') as f:
                chat_instance = json.load(f)
            return jsonify(chat_instance)
        return jsonify({"error": "Chat instance not found"}), 404

    @app.route('/api/chats', methods=['POST'])
    def create_chat_instance():
        """Create a new chat instance"""
        data = request.json
        character_id = data.get("character_id")
        
        if not character_id:
            return jsonify({"error": "Character ID is required"}), 400
            
        # Get character data to extract name and initial state
        character_path = os.path.join(Config.CHARACTERS_FOLDER, f"{character_id}.json")
        if not os.path.exists(character_path):
            return jsonify({"error": "Character not found"}), 404
            
        with open(character_path, 'r') as f:
            character = json.load(f)
        
        # Create a new chat instance
        chat_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        # Initialize with custom location if provided, otherwise use character's default
        chat_location = data.get("location") or character.get("location", "a nondescript room")
        
        chat_instance = {
            "id": chat_id,
            "character_id": character_id,
            "title": f"Chat with {character['name']}",
            "created_at": timestamp,
            "updated_at": timestamp,
            "location": chat_location,
            "conversations": [],
            "character_state": {
                "mood": character.get("mood", "neutral"),
                "emotions": character.get("emotions", {}),
                "opinion_of_user": character.get("opinion_of_user", "neutral"),
                "action": character.get("action", "standing idly")
            }
        }
        
        # Add a greeting message if character has one
        if character.get("greeting"):
            chat_instance["conversations"].append({
                "timestamp": timestamp,
                "user_message": None,  # No user message for greeting
                "character_response": character["greeting"],
                "mood": character.get("mood", "neutral"),
                "emotions": character.get("emotions", {}),
                "action": character.get("action", "greeting you warmly"),
                "location": chat_location,
                "scene_description": f"{character['name']} stands in {chat_location}, ready to engage in conversation."
            })
        
        # Save the chat instance
        chat_path = os.path.join(Config.CHAT_INSTANCES_FOLDER, f"{chat_id}.json")
        os.makedirs(os.path.dirname(chat_path), exist_ok=True)
        
        with open(chat_path, 'w') as f:
            json.dump(chat_instance, f, indent=2)
        
        return jsonify(chat_instance)

    @app.route('/api/chats/<chat_id>', methods=['PUT'])
    def update_chat_instance(chat_id):
        """Update a chat instance (title, location, etc.)"""
        data = request.json
        chat_path = os.path.join(Config.CHAT_INSTANCES_FOLDER, f"{chat_id}.json")
        
        if not os.path.exists(chat_path):
            return jsonify({"error": "Chat instance not found"}), 404
        
        with open(chat_path, 'r') as f:
            chat_instance = json.load(f)
        
        # Update allowed fields
        if "title" in data:
            chat_instance["title"] = data["title"]
            
        if "location" in data:
            chat_instance["location"] = data["location"]
            
        chat_instance["updated_at"] = datetime.now().isoformat()
        
        with open(chat_path, 'w') as f:
            json.dump(chat_instance, f, indent=2)
        
        return jsonify(chat_instance)

    @app.route('/api/chats/<chat_id>', methods=['DELETE'])
    def delete_chat_instance(chat_id):
        """Delete a chat instance"""
        chat_path = os.path.join(Config.CHAT_INSTANCES_FOLDER, f"{chat_id}.json")
        
        if os.path.exists(chat_path):
            os.remove(chat_path)
            return jsonify({"success": True})
        
        return jsonify({"error": "Chat instance not found"}), 404
        
    @app.route('/api/generate-location', methods=['POST'])
    def generate_location():
        """Generate a simple location name based on character type and prompt"""
        data = request.json
        character_id = data.get("character_id")
        prompt = data.get("prompt", "")
        
        if not character_id:
            return jsonify({"error": "Character ID is required"}), 400
            
        # Get character data for context
        character_path = os.path.join(Config.CHARACTERS_FOLDER, f"{character_id}.json")
        if not os.path.exists(character_path):
            return jsonify({"error": "Character not found"}), 404
            
        with open(character_path, 'r') as f:
            character = json.load(f)
            
        # Import functions from scene_generation module
        from .scene_generation import generate_location_description
        
        # Generate simple location
        location_data = generate_location_description(character, prompt)
        
        return jsonify(location_data)