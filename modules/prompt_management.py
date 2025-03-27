from flask import jsonify, request
import json
import os
from config import Config

def register_prompt_routes(app):
    """Register prompt template management routes with the Flask app"""

    @app.route('/api/prompts', methods=['GET'])
    def get_prompts():
        """Get all prompt templates"""
        # Ensure templates directory exists
        os.makedirs(Config.TEMPLATES_FOLDER, exist_ok=True)
        
        # Get templates file path
        templates_path = os.path.join(Config.TEMPLATES_FOLDER, "prompt_templates.json")
        
        # If templates file doesn't exist, create it with defaults
        if not os.path.exists(templates_path):
            with open(templates_path, 'w') as f:
                json.dump(Config.DEFAULT_TEMPLATES, f, indent=2)
        
        # Read templates from file
        with open(templates_path, 'r') as f:
            templates = json.load(f)
        
        return jsonify(templates)

    @app.route('/api/prompts/default', methods=['GET'])
    def get_default_prompts():
        """Get default prompt templates"""
        return jsonify(Config.DEFAULT_TEMPLATES)

    @app.route('/api/prompts', methods=['PUT'])
    def update_prompts():
        """Update prompt templates"""
        data = request.json
        
        # Ensure templates directory exists
        os.makedirs(Config.TEMPLATES_FOLDER, exist_ok=True)
        
        # Get templates file path
        templates_path = os.path.join(Config.TEMPLATES_FOLDER, "prompt_templates.json")
        
        # Save updated templates
        with open(templates_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        return jsonify({"success": True, "message": "Prompt templates updated successfully"})

    @app.route('/api/prompts/reset', methods=['POST'])
    def reset_prompts():
        """Reset prompt templates to default"""
        # Ensure templates directory exists
        os.makedirs(Config.TEMPLATES_FOLDER, exist_ok=True)
        
        # Get templates file path
        templates_path = os.path.join(Config.TEMPLATES_FOLDER, "prompt_templates.json")
        
        # Save default templates
        with open(templates_path, 'w') as f:
            json.dump(Config.DEFAULT_TEMPLATES, f, indent=2)
        
        return jsonify({"success": True, "message": "Prompt templates reset to default"})