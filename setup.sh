#!/bin/bash

# Function to set up a virtual environment in a given directory
setup_venv() {
    DIR=$1
    echo "--- Setting up $DIR ---"
    (
        cd "services/$DIR" || { echo "Directory services/$DIR not found!"; exit 1; }
        if [ ! -d "venv" ]; then
            python -m venv venv
        fi
        # Activate venv and install requirements
        if [ -f "venv/bin/activate" ]; then
            # Linux/macOS
            source "venv/bin/activate"
        elif [ -f "venv/Scripts/activate" ]; then
            # Windows
            source "venv/Scripts/activate"
        fi
        pip install -r requirements.txt
        deactivate
    )
    echo "--- Finished $DIR ---"
    echo ""
}

# Setup frontend
echo "Setting up frontend..."
cd integrated/frontend
npm install
cd ../..

# Setup individual backends
setup_venv "video/emp_face"
setup_venv "stt/api"
setup_venv "chat/chat/mental_state_analyzer"
setup_venv "survey/survey"
setup_venv "emo_buddy"
setup_venv "integrated/backend"

echo "Setup complete! You can now run the project using either:"
echo "1. docker-compose up (for Docker setup)"
echo "2. python start_all_backends.py (for local setup)" 