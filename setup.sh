#!/bin/bash

# Function to setup a Python virtual environment
setup_venv() {
    local dir=$1
    local venv_dir="$dir/venv"
    
    echo "Setting up virtual environment in $dir"
    python3 -m venv "$venv_dir"
    source "$venv_dir/bin/activate"
    pip install -r "$dir/requirements.txt"
    deactivate
}

# Setup frontend
echo "Setting up frontend..."
cd integrated/frontend
npm install
cd ../..

# Setup video backend
setup_venv "video/emp_face"

# Setup STT backend
setup_venv "stt/api"

# Setup chat backend
setup_venv "chat/chat/mental_state_analyzer"

# Setup survey backend
setup_venv "survey/survey"

# Setup integrated backend
setup_venv "integrated/backend"

echo "Setup complete! You can now run the project using either:"
echo "1. docker-compose up (for Docker setup)"
echo "2. python start_all_backends.py (for local setup)" 