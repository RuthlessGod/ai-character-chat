from flask import jsonify, request
import json
import os
import requests
from datetime import datetime
from config import Config

def register_system_routes(app):
    """Register system management routes with the Flask app"""

    @app.route('/api/config', methods=['GET'])
    def get_public_config():
        """Get public configuration (no sensitive data)"""
        # Get models from the models endpoint
        # This requires a bit of hackery since we're calling another endpoint
        from .ai_integration import get_models
        models_response = get_models()
        models_data = json.loads(models_response.get_data(as_text=True))
        
        # Extract just the models list
        models = models_data.get("models", [])
        
        # Format for the dropdown
        available_models = []
        for model in models:
            available_models.append(model["id"])
        
        return jsonify({
            "defaultModel": Config.DEFAULT_MODEL,
            "availableModels": available_models
        })

    @app.route('/api/config/test-connection', methods=['POST'])
    def test_connection():
        """Test API connection with provided key"""
        data = request.json
        api_key = data.get("apiKey", "")
        model = data.get("model", "openai/gpt-3.5-turbo")
        
        if not api_key:
            return jsonify({"success": False, "message": "API key is required"}), 400
        
        if model == "local":
            try:
                local_url = data.get("localModelUrl", Config.LOCAL_MODEL_URL)
                test_data = {
                    "prompt": "Say hello",
                    "max_tokens": 5
                }
                response = requests.post(local_url, json=test_data, timeout=5)
                if response.status_code == 200:
                    return jsonify({"success": True, "message": "Successfully connected to local model"})
                else:
                    return jsonify({"success": False, "message": f"Failed to connect to local model: {response.status_code}"}), 400
            except Exception as e:
                return jsonify({"success": False, "message": f"Failed to connect to local model: {str(e)}"}), 400
        else:
            try:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                }
                
                data = {
                    "model": model,
                    "messages": [
                        {"role": "user", "content": "Hello"}
                    ]
                }
                
                response = requests.post("https://openrouter.ai/api/v1/chat/completions", 
                                       headers=headers, 
                                       json=data,
                                       timeout=5)
                
                if response.status_code == 200:
                    return jsonify({"success": True, "message": "API key is valid"})
                else:
                    return jsonify({"success": False, "message": f"API key validation failed: {response.status_code}"}), 400
            except Exception as e:
                return jsonify({"success": False, "message": f"API connection failed: {str(e)}"}), 400

    @app.route('/api/diagnostic', methods=['GET'])
    def get_diagnostic():
        """Get diagnostic information (no sensitive data)"""
        # Check if API key is set
        api_key_status = "Not set" if not Config.OPENROUTER_API_KEY else f"Set ({len(Config.OPENROUTER_API_KEY)} chars)"
        
        # Check if we can connect to OpenRouter
        openrouter_status = "Unknown"
        openrouter_message = ""
        
        if Config.OPENROUTER_API_KEY:
            try:
                headers = {
                    "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}",
                    "HTTP-Referer": "https://localhost:5000",
                    "X-Title": "AI Character Chat",
                    "Content-Type": "application/json"
                }
                
                test_response = requests.get("https://openrouter.ai/api/v1/auth/key", headers=headers, timeout=5)
                
                if test_response.status_code == 200:
                    openrouter_status = "Connected"
                    try:
                        credit_info = test_response.json()
                        openrouter_message = f"Credits: {credit_info.get('credit', 'unknown')}"
                    except:
                        openrouter_message = "Could not parse credit information"
                else:
                    openrouter_status = "Error"
                    openrouter_message = f"Status {test_response.status_code}: {test_response.text}"
            except Exception as e:
                openrouter_status = "Error"
                openrouter_message = str(e)
        
        # Check characters folder
        try:
            character_count = len([f for f in os.listdir(Config.CHARACTERS_FOLDER) if f.endswith('.json')])
            characters_status = f"Found {character_count} characters"
        except Exception as e:
            characters_status = f"Error: {str(e)}"
        
        # Return diagnostic info
        return jsonify({
            "app_status": "Running",
            "config": {
                "api_key": api_key_status,
                "default_model": Config.DEFAULT_MODEL,
                "characters_folder": Config.CHARACTERS_FOLDER,
                "memory_folder": Config.MEMORY_FOLDER,
                "debug_mode": Config.DEBUG
            },
            "openrouter": {
                "status": openrouter_status,
                "message": openrouter_message
            },
            "characters": {
                "status": characters_status
            },
            "server_time": datetime.now().isoformat()
        })