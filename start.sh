#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Change to the script directory
cd "$SCRIPT_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating one..."
    python3 -m venv venv
    echo "Virtual environment created."
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ".env file not found. Creating from sample..."
    if [ -f ".env.sample" ]; then
        cp ".env.sample" ".env"
        echo "Created .env file from sample. Please edit it with your API keys."
    else
        echo ".env.sample file not found. Creating a basic .env file..."
        cat > .env << EOL
# API Keys
OPENROUTER_API_KEY=

# Model settings
DEFAULT_MODEL=openai/gpt-3.5-turbo
LOCAL_MODEL_URL=http://localhost:11434/api/generate

# Flask settings
DEBUG=True
HOST=0.0.0.0
PORT=5000
EOL
        echo "Created a basic .env file. Please edit it with your API keys."
    fi
    echo
    echo "Press Enter to continue..."
    read
fi

# Activate virtual environment and install requirements if needed
source venv/bin/activate
if [ ! -d "venv/lib/python*/site-packages/flask" ]; then
    echo "Installing requirements..."
    pip install -r requirements.txt
    echo "Requirements installed."
fi

# Start the application
echo "Starting AI Character Chat..."
python app.py



# Deactivate virtual environment on exit
deactivate