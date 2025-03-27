from flask import jsonify, request
import json
import requests
from config import Config

def register_character_generation_routes(app):
    """Register character generation routes with the Flask app"""

    @app.route('/api/generate-character', methods=['POST'])
    def generate_character():
        """Generate character description and personality based on prompt"""
        data = request.json
        prompt = data.get("prompt", "")
        include_fields = data.get("include_fields", ["description", "personality"])
        
        if not prompt:
            return jsonify({"success": False, "message": "Prompt is required"}), 400
        
        # Build system prompt for character generation
        system_prompt = """You are a creative AI assistant specializing in character creation. 
        Generate a detailed character profile based on the user's prompt.
        Your response should be in JSON format with the following structure:
        {
            "description": "A detailed paragraph describing the character's background, appearance, and role",
            "personality": "A detailed description of the character's personality traits, habits, likes, dislikes, quirks, strengths, and weaknesses"
        """
        
        # Add additional fields as requested
        if "speaking_style" in include_fields:
            system_prompt += """,
            "speaking_style": "A description of how the character speaks, their accent, vocabulary, catch phrases, speech patterns, and verbal mannerisms"
        """
        
        if "appearance" in include_fields:
            system_prompt += """,
            "appearance": "A detailed physical description including height, build, distinctive features, clothing style, and overall visual impression"
        """
        
        if "greeting" in include_fields:
            system_prompt += """,
            "greeting": "A short greeting message that the character would say when first meeting someone, reflecting their personality and speaking style"
        """
        
        # Close the JSON description
        system_prompt += """
        }
        Be creative, detailed, and consistent. Make the character feel like a well-rounded individual."""
        
        try:
            # Decide which API to use
            use_local_model = data.get("use_local_model", False)
            
            if use_local_model:
                # Use local model
                generation_prompt = f"{system_prompt}\n\nUser prompt: {prompt}\n\nOutput JSON:"
                
                generation_data = {
                    "prompt": generation_prompt,
                    "max_tokens": 2000,
                    "temperature": 0.7
                }
                
                response = requests.post(Config.LOCAL_MODEL_URL, json=generation_data, timeout=30)
                
                if response.status_code != 200:
                    return jsonify({"success": False, "message": f"Error generating character with local model: {response.text}"}), 500
                
                result_text = response.json().get("response", "")
            else:
                # Use OpenRouter API
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}"
                }
                
                generation_data = {
                    "model": Config.DEFAULT_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7
                }
                
                response = requests.post("https://openrouter.ai/api/v1/chat/completions",
                                      headers=headers,
                                      json=generation_data,
                                      timeout=30)
                
                if response.status_code != 200:
                    return jsonify({"success": False, "message": f"Error generating character with OpenRouter API: {response.text}"}), 500
                
                result_text = response.json()["choices"][0]["message"]["content"]
            
            # Parse JSON response from the LLM
            try:
                # Extract JSON if the response contains extra text
                json_start = result_text.find('{')
                json_end = result_text.rfind('}') + 1
                
                if json_start >= 0 and json_end > json_start:
                    json_str = result_text[json_start:json_end]
                    result = json.loads(json_str)
                else:
                    # Fallback if proper JSON format not found
                    result = {
                        "description": "Error parsing AI response. Please try again.",
                        "personality": "Error parsing AI response. Please try again."
                    }
                
                # Ensure all requested fields exist (even if empty)
                for field in include_fields:
                    if field not in result:
                        result[field] = ""
                    
                return jsonify({
                    "success": True,
                    "character": result
                })
            except json.JSONDecodeError:
                # Handle case when LLM doesn't provide valid JSON
                # Make a best effort to extract fields
                result = {}
                
                # Try to identify sections based on field names in the text
                for field in include_fields:
                    field_marker = f"{field.replace('_', ' ').title()}:"
                    field_index = result_text.lower().find(field_marker.lower())
                    
                    if field_index >= 0:
                        # Look for the next field marker to determine where this section ends
                        next_field_index = len(result_text)
                        for next_field in include_fields:
                            if next_field != field:
                                next_marker = f"{next_field.replace('_', ' ').title()}:"
                                idx = result_text.lower().find(next_marker.lower(), field_index + len(field_marker))
                                if idx >= 0 and idx < next_field_index:
                                    next_field_index = idx
                        
                        # Extract the content between this field marker and the next
                        content = result_text[field_index + len(field_marker):next_field_index].strip()
                        result[field] = content
                    else:
                        result[field] = ""
                
                # If we couldn't extract anything, provide defaults
                if not result:
                    result = {field: "" for field in include_fields}
                    
                    # Try to split by paragraphs as a last resort
                    paragraphs = result_text.split('\n\n')
                    for i, field in enumerate(include_fields):
                        if i < len(paragraphs):
                            result[field] = paragraphs[i]
                
                return jsonify({
                    "success": True,
                    "character": result
                })
                
        except Exception as e:
            print(f"Error generating character: {str(e)}")
            return jsonify({"success": False, "message": f"Error generating character: {str(e)}"}), 500