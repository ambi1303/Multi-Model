import subprocess
import os
import sys

def start_backend(path, command):
    if sys.platform == 'win32':
        # On Windows, use 'start' to open a new terminal window
        subprocess.Popen(f'start cmd /k "{command}"', cwd=path, shell=True)
    else:
        # On Unix, run in background
        subprocess.Popen(command, cwd=path, shell=True)

base = os.path.abspath(os.path.dirname(__file__))

start_backend(os.path.join(base, "video", "emp_face"), "uvicorn api:app --reload --port 8001")
start_backend(os.path.join(base, "stt", "stt", "api"), "uvicorn main:app --reload --port 8002")
start_backend(os.path.join(base, "chat", "chat", "mental_state_analyzer"), "uvicorn api:app --reload --port 8003")
# Uncomment and adjust if you have a survey backend:
# start_backend(os.path.join(base, "survey", "services", "backend", "app"), "uvicorn main:app --reload --port 8004")
start_backend(os.path.join(base, "integrated", "backend"), "uvicorn main:app --reload --port 9000")

print("All backends started! Press Ctrl+C to stop this script (servers will keep running).") 