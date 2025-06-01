import subprocess
import os
import sys

def venv_python(venv_dir):
    if sys.platform == 'win32':
        return os.path.join(venv_dir, 'Scripts', 'python.exe')
    else:
        return os.path.join(venv_dir, 'bin', 'python')

def start_backend(path, venv_dir, module, app, port):
    python_exec = venv_python(venv_dir)
    command = f'"{python_exec}" -m uvicorn {module}:{app} --reload --port {port}'
    if sys.platform == 'win32':
        subprocess.Popen(f'start cmd /k "{command}"', cwd=path, shell=True)
    else:
        subprocess.Popen(command, cwd=path, shell=True)

base = os.path.abspath(os.path.dirname(__file__))

# Video model
start_backend(
    os.path.join(base, 'video', 'emp_face'),
    os.path.join(base, 'video', 'emp_face', 'venv'),
    'api', 'app', 8001
)
# STT model
start_backend(
    os.path.join(base, 'stt', 'stt', 'api'),
    os.path.join(base, 'stt', 'stt', 'venv'),
    'main', 'app', 8002
)
# Chat model
start_backend(
    os.path.join(base, 'chat', 'chat', 'mental_state_analyzer'),
    os.path.join(base, 'chat', 'chat', 'mental_state_analyzer', 'venv'),
    'api', 'app', 8003
)
# Survey model
start_backend(
    os.path.join(base, 'survey', 'survey'),
    os.path.join(base, 'survey', 'survey', 'venv'),
    'api', 'app', 8004
)
# Integrated backend
start_backend(
    os.path.join(base, 'integrated', 'backend'),
    os.path.join(base, 'integrated', 'backend', 'venv'),  # If you have a venv for integrated
    'main', 'app', 9000
)

print("All backends started! Press Ctrl+C to stop this script (servers will keep running).") 