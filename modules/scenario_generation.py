"""
Scenario generation module for the AI Character Chat application.
This module contains API routes and helper functions for generating scenarios.
"""

from flask import Blueprint, request, jsonify
import json
import re
from modules.ai_integration import get_openrouter_response, validate_json_response

# Create the blueprint for scenario routes
scenario_bp = Blueprint('scenario', __name__)

# =============================================================================
# API Routes
# =============================================================================

@scenario_bp.route('/api/generate-scenario', methods=['POST'])
def generate_scenario():
    """
    Generate a complete scenario based on parameters.
    
    Expects JSON with:
    - genre (optional): The genre of the scenario
    - theme (optional): The theme of the scenario
    - setting (optional): The setting of the scenario
    - world_size (optional): Size of the world (small, medium, large)
    
    Returns:
    - JSON with scenario data
    """
    try:
        data = request.get_json()
        
        genre = data.get('genre', '')
        theme = data.get('theme', '')
        setting = data.get('setting', '')
        world_size = data.get('world_size', 'medium')
        
        # Create the prompt for the scenario
        prompt = generate_scenario_prompt(genre, theme, setting, world_size)
        
        # Get response from AI
        response = get_openrouter_response(
            system_prompt="You are a creative world-building expert.",
            user_message=prompt,
            temperature=0.8
        )
        
        # Attempt to parse the JSON response
        try:
            scenario_data = validate_json_response(response)
            return jsonify(scenario_data)
        except ValueError as e:
            return jsonify({
                "error": f"Failed to parse AI response: {str(e)}",
                "raw_response": response
            }), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scenario_bp.route('/api/generate-scenario-from-prompt', methods=['POST'])
def generate_scenario_from_prompt():
    """
    Generate a scenario from a primary prompt.
    
    Expects JSON with:
    - primary_prompt: The main prompt for the scenario
    - world_size (optional): Size of the world (small, medium, large)
    
    Returns:
    - JSON with scenario data
    """
    try:
        data = request.get_json()
        
        if not data or 'primary_prompt' not in data:
            return jsonify({"error": "Primary prompt is required"}), 400
            
        primary_prompt = data.get('primary_prompt')
        world_size = data.get('world_size', 'medium')
        
        # Create the prompt for the scenario
        prompt = f"""Based on the following primary prompt, create a detailed scenario for an AI-driven RPG:
        
Primary Prompt: "{primary_prompt}"

World Size: {world_size}

Please structure your response as a JSON object with the following fields:
- title: A catchy title for the scenario
- description: A 2-3 sentence overview of the scenario
- world_size: The size of the world ({world_size})
- starting_location: A detailed description of where the player starts
- world_rules: 3-5 important rules or mechanics of this world
- locations: Array of 2-5 important locations (each with name, description)
- npcs: Array of 2-5 important NPCs (each with name, description, motivation)

Your response should ONLY include the JSON object with no additional commentary."""
        
        # Get response from AI
        response = get_openrouter_response(
            system_prompt="You are a creative world-building expert.",
            user_message=prompt,
            temperature=0.8
        )
        
        # Attempt to parse the JSON response
        try:
            scenario_data = validate_json_response(response)
            return jsonify(scenario_data)
        except ValueError as e:
            return jsonify({
                "error": f"Failed to parse AI response: {str(e)}",
                "raw_response": response
            }), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scenario_bp.route('/api/generate-field-content', methods=['POST'])
def generate_field_content():
    """
    Generate content for a specific field in the scenario.
    
    Expects JSON with:
    - field_name: The name of the field to generate content for
    - context: Current context/content of the scenario
    
    Returns:
    - JSON with generated content
    """
    try:
        data = request.get_json()
        
        if not data or 'field_name' not in data:
            return jsonify({"error": "Field name is required"}), 400
            
        field_name = data.get('field_name')
        context = data.get('context', {})
        
        # Generate the appropriate prompt
        prompt = generate_field_prompt(field_name, context)
        
        # Get response from AI
        response = get_openrouter_response(
            system_prompt="You are a creative content generator for RPG scenarios.",
            user_message=prompt,
            temperature=0.8
        )
        
        # Process the response based on the field
        content = process_field_response(field_name, response)
        
        return jsonify({"content": content})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scenario_bp.route('/api/generate-entities', methods=['POST'])
def generate_entities():
    """
    Generate multiple entities for a scenario.
    
    Expects JSON with:
    - entity_type: Type of entity to generate (location, npc, conflict)
    - count: Number of entities to generate
    - context: Current context/content of the scenario
    - existing_entities: List of existing entities of the same type
    
    Returns:
    - JSON with generated entities
    """
    try:
        data = request.get_json()
        
        if not data or 'entity_type' not in data:
            return jsonify({"error": "Entity type is required"}), 400
            
        entity_type = data.get('entity_type')
        count = int(data.get('count', 1))
        context = data.get('context', {})
        existing_entities = data.get('existing_entities', [])
        name = data.get('name', '')
        primary_description = data.get('primary_description', '')
        
        # Validate entity type
        if entity_type not in ['location', 'npc', 'conflict']:
            return jsonify({"error": f"Invalid entity type: {entity_type}"}), 400
        
        # Generate the appropriate prompt
        prompt = generate_entity_prompt(
            entity_type, 
            count, 
            context, 
            existing_entities,
            name,
            primary_description
        )
        
        # Get response from AI
        response = get_openrouter_response(
            system_prompt="You are a creative content generator for RPG scenarios.",
            user_message=prompt,
            temperature=0.8
        )
        
        # Process the response
        try:
            if count == 1 and name and primary_description:
                # For a single entity with name and description, return full details
                entity_data = validate_json_response(response)
                return jsonify(entity_data)
            else:
                # For multiple entities or when name/description aren't provided
                entities = validate_json_response(response)
                if not isinstance(entities, list):
                    entities = [entities]
                return jsonify(entities)
        except ValueError as e:
            return jsonify({
                "error": f"Failed to parse AI response: {str(e)}",
                "raw_response": response
            }), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =============================================================================
# Helper Functions
# =============================================================================

def generate_scenario_prompt(genre='', theme='', setting='', world_size='medium'):
    """
    Generate a prompt for scenario creation.
    
    Args:
        genre (str): Genre of the scenario
        theme (str): Theme of the scenario
        setting (str): Setting of the scenario
        world_size (str): Size of the world (small, medium, large)
        
    Returns:
        str: The prompt for the AI
    """
    # Base instructions
    prompt = f"""Create a detailed scenario for an AI-driven RPG with the following parameters:
    
Genre: {genre or 'Any suitable genre'}
Theme: {theme or 'Any suitable theme'}
Setting: {setting or 'Any interesting setting'}
World Size: {world_size}

"""

    # Add specific instructions based on world size
    if world_size == 'small':
        prompt += """For a small world:
- Create a focused, contained environment (like a village, small town, or single dungeon)
- Include 2-3 key locations
- Include 2-3 important NPCs
- Create a simple, straightforward plot
"""
    elif world_size == 'large':
        prompt += """For a large world:
- Create a vast, open world with multiple regions or areas
- Include 4-5 key locations across different regions
- Include 4-5 important NPCs with interconnected relationships
- Create a complex plot with multiple potential paths or storylines
"""
    else:  # medium (default)
        prompt += """For a medium world:
- Create a moderately sized environment (like a small city, region, or several connected areas)
- Include 3-4 key locations
- Include 3-4 important NPCs
- Create a plot with some complexity and a few branches
"""

    # Output format instructions
    prompt += """
Please structure your response as a JSON object with the following fields:
- title: A catchy title for the scenario
- description: A 2-3 sentence overview of the scenario
- world_size: The size of the world you specified
- starting_location: A detailed description of where the player starts
- world_rules: 3-5 important rules or mechanics of this world
- locations: Array of location objects (each with name, description)
- npcs: Array of NPC objects (each with name, description, motivation)

Your response should ONLY include the JSON object with no additional commentary."""

    return prompt

def generate_field_prompt(field_name, context):
    """
    Generate a prompt for a specific field.
    
    Args:
        field_name (str): The name of the field to generate content for
        context (dict): Current context/content of the scenario
        
    Returns:
        str: The prompt for the AI
    """
    # Extract relevant context
    scenario_title = context.get('title', 'the scenario')
    scenario_description = context.get('description', '')
    world_size = context.get('world_size', 'medium')
    
    # Base prompt
    prompt = f"""Based on the following scenario information:

Title: {scenario_title}
Description: {scenario_description}
World Size: {world_size}
"""

    # Add specific instructions based on the field
    if field_name == 'title':
        prompt += """
Generate a catchy, evocative title for this scenario. The title should:
- Be concise (2-5 words)
- Capture the essence of the scenario
- Be memorable and intriguing

Return ONLY the title text with no additional commentary or explanation."""

    elif field_name == 'description':
        prompt += """
Generate a brief description of this scenario. The description should:
- Be 2-3 sentences long
- Provide an overview of the world and central conflict
- Entice players to explore the scenario further

Return ONLY the description text with no additional commentary or explanation."""

    elif field_name == 'starting_location':
        prompt += """
Generate a detailed description of the starting location for this scenario. The description should:
- Be 2-4 sentences long
- Establish the initial atmosphere
- Provide a clear sense of place
- Include sensory details (sights, sounds, smells)

Return ONLY the starting location description with no additional commentary or explanation."""

    elif field_name == 'world_rules':
        prompt += """
Generate 3-5 important rules or mechanics that define how this world works. These might include:
- Magic systems or technology limitations
- Social structures or taboos
- Physical laws that differ from our reality
- Economic or political systems

Format the response as a list of rules, with each rule being 1-2 sentences.
Return ONLY the world rules with no additional commentary or explanation."""

    elif field_name == 'history':
        prompt += """
Generate a brief history of this world/scenario. The history should:
- Be 3-5 paragraphs
- Outline key historical events that shaped the current situation
- Mention any important historical figures
- Explain how the current conflicts arose

Return ONLY the history text with no additional commentary or explanation."""

    else:
        prompt += f"""
Generate appropriate content for the '{field_name}' field of this scenario.
The content should be detailed, creative, and fit well with the existing information.

Return ONLY the content with no additional commentary or explanation."""

    return prompt

def generate_entity_prompt(entity_type, count, context, existing_entities=None, name='', primary_description=''):
    """
    Generate a prompt for entity creation.
    
    Args:
        entity_type (str): Type of entity to generate (location, npc, conflict)
        count (int): Number of entities to generate
        context (dict): Current context/content of the scenario
        existing_entities (list): List of existing entities of the same type
        name (str): Name for a single entity (if provided)
        primary_description (str): Primary description for a single entity (if provided)
        
    Returns:
        str: The prompt for the AI
    """
    existing_entities = existing_entities or []
    
    # Extract relevant context
    scenario_title = context.get('title', 'the scenario')
    scenario_description = context.get('description', '')
    world_size = context.get('world_size', 'medium')
    
    # Base prompt
    prompt = f"""Based on the following scenario information:

Title: {scenario_title}
Description: {scenario_description}
World Size: {world_size}

"""

    # Add information about existing entities if available
    if existing_entities:
        prompt += f"Existing {entity_type}s:\n"
        for entity in existing_entities:
            entity_name = entity.get('name', 'Unnamed')
            entity_desc = entity.get('description', '')
            prompt += f"- {entity_name}: {entity_desc}\n"
        prompt += "\n"

    # Add specific instructions based on entity type
    if entity_type == 'location':
        if name and primary_description:
            prompt += f"""Generate complete details for a location named "{name}" with the primary description: "{primary_description}"

Include the following information:
- name: "{name}"
- description: Expanded from "{primary_description}" (2-3 sentences)
- points_of_interest: 2-3 interesting features or areas within this location
- inhabitants: Who or what can be found here
- secrets: 1-2 hidden aspects or secrets about this location
- connections: How this location connects to other areas or the overall narrative

Return the information as a JSON object with these fields."""
        else:
            prompt += f"""Generate {count} unique and interesting locations for this scenario.

For each location, include:
- name: A descriptive name
- description: 1-2 sentences describing the location
- type: The type of location (city, dungeon, forest, etc.)

Return the locations as a JSON array of objects containing these fields."""

    elif entity_type == 'npc':
        if name and primary_description:
            prompt += f"""Generate complete details for an NPC named "{name}" with the primary description: "{primary_description}"

Include the following information:
- name: "{name}"
- description: Expanded from "{primary_description}" (2-3 sentences)
- personality: Key personality traits and behaviors
- motivation: What drives this character
- abilities: Special skills or powers
- role: Their role in the scenario/story

Return the information as a JSON object with these fields."""
        else:
            prompt += f"""Generate {count} unique and interesting NPCs for this scenario.

For each NPC, include:
- name: A name appropriate to the setting
- description: 1-2 sentences describing their appearance and demeanor
- role: Their role in the scenario (ally, antagonist, neutral, etc.)

Return the NPCs as a JSON array of objects containing these fields."""

    elif entity_type == 'conflict':
        if name and primary_description:
            prompt += f"""Generate complete details for a conflict titled "{name}" with the primary description: "{primary_description}"

Include the following information:
- name: "{name}"
- description: Expanded from "{primary_description}" (2-3 sentences)
- stakes: What's at risk in this conflict
- parties: The main parties or factions involved
- resolution_options: 2-3 possible ways this conflict could be resolved
- complications: 1-2 factors that make this conflict more complex

Return the information as a JSON object with these fields."""
        else:
            prompt += f"""Generate {count} unique and interesting conflicts for this scenario.

For each conflict, include:
- name: A descriptive title for the conflict
- description: 1-2 sentences describing the nature of the conflict
- type: The type of conflict (personal, political, environmental, etc.)

Return the conflicts as a JSON array of objects containing these fields."""

    # Add output format instructions
    prompt += """

Your response should ONLY include the JSON with no additional commentary."""

    return prompt

def process_field_response(field_name, response):
    """
    Process and format the AI's response for a specific field.
    
    Args:
        field_name (str): The field name the response is for
        response (str): The raw response from the AI
        
    Returns:
        str or list: The processed content
    """
    # Clean up the response (remove quotes, trim whitespace)
    content = response.strip()
    if content.startswith('"') and content.endswith('"'):
        content = content[1:-1]
    
    # Handle specific fields that need special formatting
    if field_name == 'world_rules':
        # Try to convert to list if it's not already
        if not content.startswith('['):
            # Split by numbered points, bullets, or newlines
            rules = re.split(r'\d+\.\s*|\n+|\*\s*', content)
            rules = [rule.strip() for rule in rules if rule.strip()]
            return rules
        else:
            try:
                return json.loads(content)
            except:
                # Fall back to returning the raw content
                return content
    
    # Return the content as is for other fields
    return content

# =============================================================================
# Blueprint Registration
# =============================================================================

def register_scenario_generation_routes(app):
    """
    Register the scenario generation routes with the Flask app.
    
    Args:
        app: The Flask application instance
    """
    app.register_blueprint(scenario_bp)
    
    # Log registration
    print(f"Registered scenario generation routes with blueprint: {scenario_bp.name}")
    
    # Return the blueprint in case it's needed elsewhere
    return scenario_bp