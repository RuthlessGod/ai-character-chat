from flask import jsonify, request
import json
import os
import uuid
from datetime import datetime
from config import Config

def register_character_routes(app):
    """Register character management routes with the Flask app"""

    @app.route('/api/characters', methods=['GET'])
    def get_characters():
        """Get list of all saved characters"""
        characters = []
        for filename in os.listdir(Config.CHARACTERS_FOLDER):
            if filename.endswith('.json'):
                character_path = os.path.join(Config.CHARACTERS_FOLDER, filename)
                with open(character_path, 'r') as f:
                    character = json.load(f)
                    characters.append(character)
        return jsonify(characters)

    @app.route('/api/characters/<character_id>', methods=['GET'])
    def get_character(character_id):
        """Get a specific character by ID"""
        character_path = os.path.join(Config.CHARACTERS_FOLDER, f"{character_id}.json")
        if os.path.exists(character_path):
            with open(character_path, 'r') as f:
                character = json.load(f)
            return jsonify(character)
        return jsonify({"error": "Character not found"}), 404

    @app.route('/api/characters', methods=['POST'])
    def create_character():
        """Create a new character"""
        data = request.json
        character_id = str(uuid.uuid4())
        
        character = {
            "id": character_id,
            "name": data.get("name", "New Character"),
            "description": data.get("description", ""),
            "personality": data.get("personality", ""),
            "greeting": data.get("greeting", ""),
            "category": data.get("category", "fantasy"),
            "appearance": data.get("appearance", ""),
            "speaking_style": data.get("speaking_style", ""),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "mood": "neutral",
            "emotions": {},
            "opinion_of_user": "neutral",
            "action": "standing idly",
            "location": "a nondescript room"
        }
        
        character_path = os.path.join(Config.CHARACTERS_FOLDER, f"{character_id}.json")
        with open(character_path, 'w') as f:
            json.dump(character, f, indent=2)
        
        # Initialize memory file for this character
        memory_path = os.path.join(Config.MEMORY_FOLDER, f"{character_id}.json")
        with open(memory_path, 'w') as f:
            json.dump({"memories": [], "conversations": []}, f, indent=2)
        
        return jsonify(character)

    @app.route('/api/characters/<character_id>', methods=['PUT'])
    def update_character(character_id):
        """Update an existing character"""
        data = request.json
        character_path = os.path.join(Config.CHARACTERS_FOLDER, f"{character_id}.json")
        
        if not os.path.exists(character_path):
            return jsonify({"error": "Character not found"}), 404
        
        with open(character_path, 'r') as f:
            character = json.load(f)
        
        # Update all fields
        character["name"] = data.get("name", character["name"])
        character["description"] = data.get("description", character["description"])
        character["personality"] = data.get("personality", character["personality"])
        character["greeting"] = data.get("greeting", character.get("greeting", ""))
        character["category"] = data.get("category", character.get("category", "fantasy"))
        character["appearance"] = data.get("appearance", character.get("appearance", ""))
        character["speaking_style"] = data.get("speaking_style", character.get("speaking_style", ""))
        character["updated_at"] = datetime.now().isoformat()
        
        with open(character_path, 'w') as f:
            json.dump(character, f, indent=2)
        
        return jsonify(character)

    @app.route('/api/characters/<character_id>', methods=['DELETE'])
    def delete_character(character_id):
        """Delete a character"""
        character_path = os.path.join(Config.CHARACTERS_FOLDER, f"{character_id}.json")
        memory_path = os.path.join(Config.MEMORY_FOLDER, f"{character_id}.json")
        
        if os.path.exists(character_path):
            os.remove(character_path)
        
        if os.path.exists(memory_path):
            os.remove(memory_path)
        
        return jsonify({"success": True})

    # Route to ensure our field generation feature works
    @app.route('/api/generate-field', methods=['POST'])
    def generate_field_fallback():
        """
        Fallback route for field-specific generation.
        This ensures that if the AI blueprint route is not registered properly,
        the feature will still work.
        """
        from modules.ai_integration import generate_field
        return generate_field()