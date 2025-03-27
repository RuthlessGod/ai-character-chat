"""
Scenario management module for the AI Character Chat application.
This module contains API routes and helper functions for managing scenarios.
"""

from flask import Blueprint, request, jsonify, send_from_directory
import json
import os
import time
from config import Config

# Create the blueprint for scenario routes
scenario_bp = Blueprint('scenario_mgmt', __name__)

# =============================================================================
# Helper Functions
# =============================================================================

def get_scenarios_directory():
    """
    Get the directory where scenarios are stored.
    
    Returns:
        str: The path to the scenarios directory
    """
    scenarios_dir = os.path.join(Config.DATA_DIRECTORY, 'scenarios')
    os.makedirs(scenarios_dir, exist_ok=True)
    return scenarios_dir

def load_scenario(scenario_id):
    """
    Load a scenario from file.
    
    Args:
        scenario_id (str): The ID of the scenario to load
        
    Returns:
        dict: The scenario data, or None if not found
    """
    scenario_path = os.path.join(get_scenarios_directory(), f"{scenario_id}.json")
    
    if not os.path.exists(scenario_path):
        return None
        
    try:
        with open(scenario_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading scenario {scenario_id}: {str(e)}")
        return None

def save_scenario(scenario_data):
    """
    Save a scenario to file.
    
    Args:
        scenario_data (dict): The scenario data to save
        
    Returns:
        str: The ID of the saved scenario
    """
    scenarios_dir = get_scenarios_directory()
    
    # Generate a new ID if one doesn't exist
    if 'id' not in scenario_data:
        scenario_data['id'] = f"scenario_{int(time.time())}"
    
    # Set created/updated timestamps
    current_time = time.time()
    if 'created_at' not in scenario_data:
        scenario_data['created_at'] = current_time
    scenario_data['updated_at'] = current_time
    
    # Save to file
    scenario_path = os.path.join(scenarios_dir, f"{scenario_data['id']}.json")
    with open(scenario_path, 'w', encoding='utf-8') as f:
        json.dump(scenario_data, f, indent=2)
        
    return scenario_data['id']

def list_scenarios():
    """
    List all available scenarios.
    
    Returns:
        list: A list of scenario metadata
    """
    scenarios_dir = get_scenarios_directory()
    scenarios = []
    
    for filename in os.listdir(scenarios_dir):
        if filename.endswith('.json'):
            scenario_path = os.path.join(scenarios_dir, filename)
            try:
                with open(scenario_path, 'r', encoding='utf-8') as f:
                    scenario_data = json.load(f)
                    
                    # Extract just the metadata to avoid large responses
                    scenarios.append({
                        'id': scenario_data.get('id'),
                        'title': scenario_data.get('title', 'Untitled Scenario'),
                        'description': scenario_data.get('description', ''),
                        'world_size': scenario_data.get('world_size', 'medium'),
                        'created_at': scenario_data.get('created_at'),
                        'updated_at': scenario_data.get('updated_at')
                    })
            except Exception as e:
                print(f"Error loading scenario from {filename}: {str(e)}")
    
    # Sort by updated_at (most recent first)
    scenarios.sort(key=lambda x: x.get('updated_at', 0), reverse=True)
    return scenarios

def delete_scenario(scenario_id):
    """
    Delete a scenario.
    
    Args:
        scenario_id (str): The ID of the scenario to delete
        
    Returns:
        bool: True if deleted successfully, False otherwise
    """
    scenario_path = os.path.join(get_scenarios_directory(), f"{scenario_id}.json")
    
    if not os.path.exists(scenario_path):
        return False
        
    try:
        os.remove(scenario_path)
        return True
    except Exception as e:
        print(f"Error deleting scenario {scenario_id}: {str(e)}")
        return False

# =============================================================================
# API Routes
# =============================================================================

@scenario_bp.route('/api/scenarios', methods=['GET'])
def get_scenarios():
    """
    Get a list of all scenarios.
    
    Returns:
        JSON: List of scenario metadata
    """
    try:
        scenarios = list_scenarios()
        return jsonify({"scenarios": scenarios})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scenario_bp.route('/api/scenarios/<scenario_id>', methods=['GET'])
def get_scenario(scenario_id):
    """
    Get a specific scenario by ID.
    
    Args:
        scenario_id (str): The ID of the scenario to retrieve
        
    Returns:
        JSON: The complete scenario data
    """
    try:
        scenario = load_scenario(scenario_id)
        
        if not scenario:
            return jsonify({"error": "Scenario not found"}), 404
            
        return jsonify(scenario)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scenario_bp.route('/api/scenarios', methods=['POST'])
def create_scenario():
    """
    Create a new scenario.
    
    Expects JSON with scenario data.
    
    Returns:
        JSON: The created scenario with ID
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        if 'title' not in data or not data['title']:
            return jsonify({"error": "Title is required"}), 400
        
        # Save the scenario
        scenario_id = save_scenario(data)
        
        # Return the created scenario
        scenario = load_scenario(scenario_id)
        return jsonify(scenario)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scenario_bp.route('/api/scenarios/<scenario_id>', methods=['PUT'])
def update_scenario(scenario_id):
    """
    Update an existing scenario.
    
    Args:
        scenario_id (str): The ID of the scenario to update
        
    Expects JSON with updated scenario data.
    
    Returns:
        JSON: The updated scenario
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # Check if scenario exists
        existing_scenario = load_scenario(scenario_id)
        if not existing_scenario:
            return jsonify({"error": "Scenario not found"}), 404
            
        # Ensure the ID is preserved
        data['id'] = scenario_id
        
        # Preserve created_at timestamp
        if 'created_at' in existing_scenario:
            data['created_at'] = existing_scenario['created_at']
        
        # Save the updated scenario
        save_scenario(data)
        
        # Return the updated scenario
        updated_scenario = load_scenario(scenario_id)
        return jsonify(updated_scenario)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scenario_bp.route('/api/scenarios/<scenario_id>', methods=['DELETE'])
def delete_scenario_route(scenario_id):
    """
    Delete a scenario.
    
    Args:
        scenario_id (str): The ID of the scenario to delete
        
    Returns:
        JSON: Success message
    """
    try:
        success = delete_scenario(scenario_id)
        
        if not success:
            return jsonify({"error": "Scenario not found or could not be deleted"}), 404
            
        return jsonify({"message": f"Scenario {scenario_id} deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =============================================================================
# Blueprint Registration
# =============================================================================

def register_scenario_routes(app):
    """
    Register the scenario management routes with the Flask app.
    
    Args:
        app: The Flask application instance
    """
    app.register_blueprint(scenario_bp)
    
    # Log registration
    print(f"Registered scenario management routes with blueprint: {scenario_bp.name}")
    
    # Add static route for scenarios page
    @app.route('/scenarios.html')
    def scenarios_page():
        return send_from_directory(Config.STATIC_FOLDER, 'scenarios.html')
    
    @app.route('/scenario.html')
    def scenario_page():
        return send_from_directory(Config.STATIC_FOLDER, 'scenario.html')
    
    # Return the blueprint in case it's needed elsewhere
    return scenario_bp