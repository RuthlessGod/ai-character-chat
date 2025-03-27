from flask import Flask, send_from_directory
from flask_cors import CORS
import os

# Import configuration
from config import Config

# Import modules
from modules.player_actions import *
from modules.character_management import register_character_routes
from modules.chat_management import register_chat_routes
from modules.character_generation import register_character_generation_routes
from modules.ai_integration import register_ai_routes
from modules.scene_generation import *  
from modules.memory_management import *  
from modules.system_management import register_system_routes
from modules.prompt_management import register_prompt_routes
from modules.chat_instances import register_chat_instance_routes  

from modules.scenario_management import register_scenario_routes
from modules.scenario_generation import register_scenario_generation_routes

print(f"STATIC_FOLDER configured as: {Config.STATIC_FOLDER}")
print(f"Does this path exist? {os.path.exists(Config.STATIC_FOLDER)}")
print(f"Does index.html exist? {os.path.exists(os.path.join(Config.STATIC_FOLDER, 'index.html'))}")

# List files in static folder
if os.path.exists(Config.STATIC_FOLDER):
    print("Files in static folder:")
    for root, dirs, files in os.walk(Config.STATIC_FOLDER):
        level = root.replace(Config.STATIC_FOLDER, '').count(os.sep)
        indent = ' ' * 4 * level
        print(f"{indent}{os.path.basename(root)}/")
        sub_indent = ' ' * 4 * (level + 1)
        for file in files:
            print(f"{sub_indent}{file}")

# Initialize configuration
Config.ensure_directories()

# Create Flask app
app = Flask(__name__, static_folder=Config.STATIC_FOLDER)
CORS(app)  # Enable CORS for all routes

# Set up default route
@app.route('/')
def index():
    return send_from_directory(Config.STATIC_FOLDER, 'index.html')

@app.route('/scenario-creation.html')
def scenario_creation():
    return send_from_directory(Config.STATIC_FOLDER, 'scenario-creation.html')

# Register all routes from modules
register_character_routes(app)
register_chat_routes(app)
register_character_generation_routes(app)
register_ai_routes(app)
register_system_routes(app)
register_prompt_routes(app)
register_chat_instance_routes(app) 
register_scenario_routes(app)
register_scenario_generation_routes(app)

# Main application entry point
if __name__ == '__main__':
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)