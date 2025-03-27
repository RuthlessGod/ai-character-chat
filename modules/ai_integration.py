"""
AI integration module for interacting with various language models.
This module handles communication with AI services like OpenRouter.
"""

from flask import jsonify, request, Blueprint
import json
import requests
import re
import os
from config import Config

# Create a blueprint for AI-specific routes
ai_bp = Blueprint('ai', __name__)

def register_ai_routes(app):
    """Register AI model-related routes with the Flask app"""
    
    # Register the blueprint
    app.register_blueprint(ai_bp)
    
    # Legacy route registration (can be moved to the blueprint later)
    @app.route('/api/models', methods=['GET'])
    def get_models():
        """Get available models from OpenRouter"""
        try:
            # Only make the API call if we have an API key
            if not Config.OPENROUTER_API_KEY:
                print("No OpenRouter API key found. Returning default models.")
                # Return a minimal default set if no API key is available
                return jsonify({
                    "success": True,
                    "models": [
                        {"id": "openai/gpt-3.5-turbo", "name": "GPT-3.5 Turbo"},
                        {"id": "openai/gpt-4", "name": "GPT-4"},
                        {"id": "anthropic/claude-3-opus", "name": "Claude 3 Opus"},
                        {"id": "anthropic/claude-3-sonnet", "name": "Claude 3 Sonnet"},
                        {"id": "anthropic/claude-3-haiku", "name": "Claude 3 Haiku"},
                        {"id": "local", "name": "Local Model"}
                    ]
                })
            
            print(f"Using OpenRouter API key: {Config.OPENROUTER_API_KEY[:4]}...")
            
            # Make request to OpenRouter
            headers = {
                "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}",
                "HTTP-Referer": "https://localhost:5000",  # Add referer to reduce API errors
                "X-Title": "AI Character Chat",  # Identify your application
                "Content-Type": "application/json"
            }
            
            print("Requesting models from OpenRouter API...")
            response = requests.get("https://openrouter.ai/api/v1/models", headers=headers)
            
            print(f"OpenRouter response status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"Error response from OpenRouter: {response.text}")
                raise Exception(f"OpenRouter API returned status code {response.status_code}: {response.text}")
            
            # Process the response
            response_data = response.json()
            print(f"OpenRouter response keys: {response_data.keys()}")
            openrouter_models = response_data.get("data", [])
            print(f"Found {len(openrouter_models)} models from OpenRouter")
            
            # Format the models
            models = []
            
            # Add each model from OpenRouter
            for model in openrouter_models:
                model_id = model.get("id")
                model_name = model.get("name", model_id)
                print(f"Processing model: {model_id} - {model_name}")
                
                # Modified filtering: Include models that at least have an ID
                # This is less strict than the previous condition
                if model_id:
                    models.append({
                        "id": model_id,
                        "name": model_name,
                        "context_length": model.get("context_length"),
                        "pricing": model.get("pricing", {})
                    })
            
            print(f"Filtered to {len(models)} chat models")
            
            # Always add the local model option
            models.append({
                "id": "local",
                "name": "Local Model"
            })
            
            return jsonify({
                "success": True,
                "models": models
            })
            
        except Exception as e:
            print(f"Error fetching models: {str(e)}")
            import traceback
            traceback.print_exc()
            # Return a default list if there's an error
            return jsonify({
                "success": False,
                "message": f"Error fetching models: {str(e)}",
                "models": [
                    {"id": "openai/gpt-3.5-turbo", "name": "GPT-3.5 Turbo"},
                    {"id": "openai/gpt-4", "name": "GPT-4"},
                    {"id": "anthropic/claude-3-opus", "name": "Claude 3 Opus"},
                    {"id": "anthropic/claude-3-sonnet", "name": "Claude 3 Sonnet"},
                    {"id": "anthropic/claude-3-haiku", "name": "Claude 3 Haiku"},
                    {"id": "local", "name": "Local Model"}
                ]
            })

# New AI Blueprint routes
@ai_bp.route('/api/generate-text', methods=['POST'])
def generate_text():
    """
    General-purpose text generation endpoint.
    
    Expects JSON with:
    - prompt: The prompt to send to the AI
    - system_prompt (optional): The system prompt for the AI
    - temperature (optional): Temperature for generation
    - max_tokens (optional): Maximum tokens to generate
    
    Returns:
    - JSON with generated text
    """
    try:
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({"error": "Prompt is required"}), 400
            
        prompt = data.get('prompt')
        system_prompt = data.get('system_prompt', 'You are a helpful AI assistant.')
        temperature = float(data.get('temperature', 0.7))
        max_tokens = data.get('max_tokens')
        
        # Generate text
        response = get_openrouter_response(
            system_prompt=system_prompt,
            user_message=prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return jsonify({"text": response})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ai_bp.route('/api/generate-json', methods=['POST'])
def generate_json():
    """
    Generate structured JSON data using AI.
    
    Expects JSON with:
    - prompt: The prompt to send to the AI
    - system_prompt (optional): The system prompt for the AI
    - temperature (optional): Temperature for generation
    - max_tokens (optional): Maximum tokens to generate
    
    Returns:
    - JSON with the generated structured data
    """
    try:
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({"error": "Prompt is required"}), 400
            
        prompt = data.get('prompt')
        system_prompt = data.get('system_prompt', 'You are a helpful AI assistant. Respond with valid JSON only.')
        temperature = float(data.get('temperature', 0.7))
        max_tokens = data.get('max_tokens')
        
        # Add instruction to respond with JSON only
        if not prompt.lower().endswith('json'):
            prompt += " Respond with valid JSON only."
        
        # Generate JSON
        response = get_openrouter_response(
            system_prompt=system_prompt,
            user_message=prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # Parse and validate the JSON response
        try:
            json_data = validate_json_response(response)
            return jsonify(json_data)
        except ValueError as e:
            return jsonify({
                "error": f"Failed to parse AI response as JSON: {str(e)}",
                "raw_response": response
            }), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ai_bp.route('/api/generate-field', methods=['POST'])
def generate_field():
    """
    Generate content for a specific character field.
    
    Expects JSON with:
    - prompt: The user's description of what they want
    - field_type: The type of field to generate (name, description, greeting, etc.)
    - use_local_model (optional): Whether to use the local model
    
    Returns:
    - JSON with the generated content
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request data is required"}), 400
            
        if 'prompt' not in data:
            return jsonify({"error": "Prompt is required"}), 400
            
        if 'field_type' not in data:
            return jsonify({"error": "Field type is required"}), 400
        
        prompt = data.get('prompt')
        field_type = data.get('field_type')
        use_local_model = data.get('use_local_model', False)
        
        # Define appropriate system prompts based on field type
        system_prompts = {
            'name': "You are a creative writer specializing in character names. Generate a single name appropriate for the description. Respond with just the name, no explanation.",
            'description': "You are a creative writer specializing in character backgrounds. Create a rich, detailed character description based on the prompt. No meta-commentary.",
            'greeting': "You are a creative writer specializing in character dialogue. Create a greeting message that this character would say when first meeting someone. Make it match their personality. First person perspective only.",
            'appearance': "You are a creative writer specializing in character descriptions. Create a detailed physical description of a character based on the prompt, including their clothing and distinctive features. No meta-commentary.",
            'personality': "You are a creative writer specializing in character development. Create a detailed personality description based on the prompt, including traits, habits, likes and dislikes. No meta-commentary.",
            'speaking-style': "You are a creative writer specializing in dialogue. Describe in detail how this character speaks, including any speech patterns, accents, or phrases they commonly use. No meta-commentary."
        }
        
        # Set system prompt based on field type
        system_prompt = system_prompts.get(field_type, "You are a creative writer. Generate content based on the prompt.")
        
        # Create field-specific prompt
        field_prompts = {
            'name': f"Generate a character name based on this description: {prompt}",
            'description': f"Write a rich character background and description based on: {prompt}",
            'greeting': f"Create a greeting message that this character would say when first meeting someone. Character info: {prompt}",
            'appearance': f"Describe the physical appearance of a character based on: {prompt}",
            'personality': f"Create a detailed personality description for a character based on: {prompt}",
            'speaking-style': f"Describe in detail how this character speaks based on: {prompt}"
        }
        
        formatted_prompt = field_prompts.get(field_type, prompt)
        
        # Generate content using appropriate API
        if use_local_model and Config.LOCAL_MODEL_ENDPOINT:
            content = get_local_model_response(
                system_prompt=system_prompt,
                user_message=formatted_prompt,
                temperature=0.7
            )
        else:
            content = get_openrouter_response(
                system_prompt=system_prompt,
                user_message=formatted_prompt,
                temperature=0.7
            )
        
        # Clean up the response
        if field_type == 'name':
            # Remove quotes and extra spaces for names
            content = content.strip().strip('"\'').strip()
            
            # Limit to reasonable name length
            if len(content) > 50:
                content = content[:50]
        
        return jsonify({
            "success": True,
            "content": content,
            "field_type": field_type
        })
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

def get_openrouter_response(system_prompt, user_message, temperature=0.7, max_tokens=None):
    """
    Get a response from OpenRouter API.
    
    Args:
        system_prompt (str): The system prompt for the AI
        user_message (str): The user message to send to the AI
        temperature (float): Controls randomness in the response
        max_tokens (int): Maximum tokens to generate (default: None)
    
    Returns:
        str: The AI response
    """
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    # Get API key from config
    api_key = Config.OPENROUTER_API_KEY or os.environ.get("OPENROUTER_API_KEY")
    
    if not api_key:
        raise ValueError("OpenRouter API key not found. Please set the OPENROUTER_API_KEY in config.py or environment variables.")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": Config.APP_REFERER,
        "X-Title": Config.APP_NAME
    }
    
    model_name = Config.DEFAULT_MODEL or "openai/gpt-3.5-turbo"
    
    # Build request data
    data = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": temperature
    }
    
    # Add max_tokens if specified
    if max_tokens:
        data["max_tokens"] = max_tokens
    
    try:
        # Make API request
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()  # Raise exception for failed requests
        
        # Parse response
        result = response.json()
        
        # Extract and return the content
        if "choices" in result and len(result["choices"]) > 0:
            content = result["choices"][0]["message"]["content"]
            return content.strip()
        else:
            raise ValueError("No valid response content found in the API response")
    
    except requests.exceptions.RequestException as e:
        error_detail = str(e)
        try:
            error_json = e.response.json()
            if "error" in error_json:
                error_detail = f"{error_json['error'].get('message', 'Unknown error')}"
        except:
            pass
        
        raise Exception(f"OpenRouter API request failed: {error_detail}")

def get_local_model_response(system_prompt, user_message, temperature=0.7, max_tokens=None):
    """
    Get a response from a locally hosted model (if available).
    
    Args:
        system_prompt (str): The system prompt for the AI
        user_message (str): The user message to send to the AI
        temperature (float): Controls randomness in the response
        max_tokens (int): Maximum tokens to generate (default: None)
    
    Returns:
        str: The AI response
    """
    # Check if local model is configured
    if not Config.LOCAL_MODEL_ENDPOINT:
        raise ValueError("Local model not configured. Please set LOCAL_MODEL_ENDPOINT in config.py")
    
    url = Config.LOCAL_MODEL_ENDPOINT
    
    # Build request payload based on the API expected by your local model
    # This is a general example for an Ollama-like API
    data = {
        "model": Config.LOCAL_MODEL_NAME or "llama2",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": temperature
    }
    
    # Add max_tokens if specified and if your API supports it
    if max_tokens:
        data["max_tokens"] = max_tokens
    
    # Set appropriate headers for the local API
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        # Make API request
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()  # Raise exception for failed requests
        
        # Parse response (adjust based on your local model's API response structure)
        result = response.json()
        
        # Extract the content from the response
        # This structure may need to be adjusted based on your local API
        if "choices" in result and len(result["choices"]) > 0:
            content = result["choices"][0]["message"]["content"]
            return content.strip()
        else:
            raise ValueError("No valid response content found in the API response")
    
    except requests.exceptions.RequestException as e:
        error_detail = str(e)
        try:
            error_json = e.response.json()
            if "error" in error_json:
                error_detail = f"{error_json.get('error', 'Unknown error')}"
        except:
            pass
        
        raise Exception(f"Local model API request failed: {error_detail}")

def validate_json_response(response_text):
    """
    Validates and extracts JSON from a text response.
    
    Args:
        response_text (str): The raw text response that may contain JSON
        
    Returns:
        dict: The parsed JSON object
        
    Raises:
        ValueError: If JSON cannot be parsed
    """
    try:
        # First, try direct parsing
        return json.loads(response_text)
    except json.JSONDecodeError:
        # If direct parsing fails, try to extract JSON from the text
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        
        if json_start >= 0 and json_end > json_start:
            try:
                json_str = response_text[json_start:json_end]
                return json.loads(json_str)
            except json.JSONDecodeError:
                # If JSON extraction fails, raise an error
                raise ValueError("Failed to parse or extract valid JSON from the response")
        else:
            raise ValueError("No JSON object found in the response")

def process_llm_response(response_text):
    """Process the response from the LLM to extract structured data"""
    result = {
        "text": response_text,
        "mood": "neutral",
        "emotions": {},
        "opinion_of_user": "neutral",
        "action": "standing still",
        "location": "current location"
    }
    
    try:
        # First, try to parse the entire response as JSON
        try:
            parsed = json.loads(response_text)
            if isinstance(parsed, dict):
                # If it's a complete JSON object with the expected fields
                if "text" in parsed:
                    result["text"] = parsed.get("text", result["text"])
                    result["mood"] = parsed.get("mood", result["mood"])
                    result["emotions"] = parsed.get("emotions", result["emotions"])
                    result["opinion_of_user"] = parsed.get("opinion_of_user", result["opinion_of_user"])
                    result["action"] = parsed.get("action", result["action"])
                    result["location"] = parsed.get("location", result["location"])
                    return result
        except:
            pass  # Not a complete JSON response, try extracting JSON from text
        
        # Look for JSON object inside the text - various patterns
        json_patterns = [
            r'\{[\s\S]*\}',                   # Any JSON object
            r'```json\s*([\s\S]*?)\s*```',    # JSON in code block with json tag
            r'```\s*([\s\S]*?)\s*```',        # JSON in any code block
            r'\{("text"|\'text\')[\s\S]*\}'   # JSON object with text field
        ]
        
        for pattern in json_patterns:
            try:
                matches = re.findall(pattern, response_text)
                for match in matches:
                    # If the match is a capture group (from code block patterns)
                    if isinstance(match, str) and match.strip().startswith('{'):
                        try:
                            parsed = json.loads(match.strip())
                            if isinstance(parsed, dict) and "text" in parsed:
                                # Extract all fields from the parsed JSON
                                result["text"] = parsed.get("text", result["text"])
                                result["mood"] = parsed.get("mood", result["mood"])
                                result["emotions"] = parsed.get("emotions", result["emotions"])
                                result["opinion_of_user"] = parsed.get("opinion_of_user", result["opinion_of_user"])
                                result["action"] = parsed.get("action", result["action"])
                                result["location"] = parsed.get("location", result["location"])
                                return result
                        except:
                            continue
                    # For patterns without capture groups
                    elif not isinstance(match, str):
                        try:
                            parsed = json.loads(match[0])
                            if isinstance(parsed, dict) and "text" in parsed:
                                result["text"] = parsed.get("text", result["text"])
                                result["mood"] = parsed.get("mood", result["mood"])
                                result["emotions"] = parsed.get("emotions", result["emotions"])
                                result["opinion_of_user"] = parsed.get("opinion_of_user", result["opinion_of_user"])
                                result["action"] = parsed.get("action", result["action"])
                                result["location"] = parsed.get("location", result["location"])
                                return result
                        except:
                            continue
            except:
                continue  # Try the next pattern
    except:
        pass  # Fallback to heuristic approach
    
    # If JSON parsing completely failed, extract text fields using regex patterns
    # Remove any JSON-like structures or code blocks from the text
    cleaned_text = re.sub(r'\{[\s\S]*?\}', '', response_text)
    cleaned_text = re.sub(r'```[\s\S]*?```', '', cleaned_text)
    cleaned_text = cleaned_text.strip()
    
    # If we have cleaned text, use it
    if cleaned_text:
        result["text"] = cleaned_text
    
    # Look for actions enclosed in asterisks or parentheses
    action_match = re.search(r'\*(.*?)\*|\((.*?)\)', response_text)
    if action_match:
        action = action_match.group(1) or action_match.group(2)
        if action:
            result["action"] = action.strip()
    
    # Check for location mentions
    location_match = re.search(r'at (the|a) ([^\.]*)', response_text)
    if location_match:
        location = location_match.group(2)
        if location:
            result["location"] = location.strip()
    
    # Infer mood from language
    if re.search(r'laugh|chuckle|grin|smile|happy|joy', response_text, re.IGNORECASE):
        result["mood"] = "happy"
    elif re.search(r'frown|sigh|sad|upset|depress', response_text, re.IGNORECASE):
        result["mood"] = "sad"
    elif re.search(r'angry|furious|mad|rage', response_text, re.IGNORECASE):
        result["mood"] = "angry"
    
    return result