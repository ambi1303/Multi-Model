import subprocess
import os
import sys
import socket
import time
import signal
import psutil

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def wait_for_port(port, timeout=10):
    start = time.time()
    while time.time() - start < timeout:
        if is_port_in_use(port):
            return True
        time.sleep(0.5)
    return False

def kill_process_on_port(port):
    for conn in psutil.net_connections():
        if conn.laddr.port == port and conn.status == psutil.CONN_LISTEN:
            try:
                psutil.Process(conn.pid).kill()
                time.sleep(1)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

def uvicorn_executable(venv_dir):
    if sys.platform == 'win32':
        return os.path.join(venv_dir, 'Scripts', 'uvicorn.exe')
    else:
        return os.path.join(venv_dir, 'bin', 'uvicorn')

def start_backend(path, venv_dir, module, app, port):
    if not os.path.exists(venv_dir):
        print(f"Error: Virtual environment not found at {venv_dir}")
        return None

    if is_port_in_use(port):
        print(f"Port {port} is in use. Attempting to kill existing process...")
        kill_process_on_port(port)
        time.sleep(2)

    uvicorn_exec = uvicorn_executable(venv_dir)
    command = [uvicorn_exec, f'{module}:{app}', '--reload', '--port', str(port)]

    try:
        process = subprocess.Popen(
            command,
            cwd=path,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
        )
        print(f"Started {module} on port {port}, waiting for readiness...")
        if not wait_for_port(port):
            print(f"Warning: {module} did not start on port {port} in time.")
        return process
    except Exception as e:
        print(f"Error starting {module}: {e}")
        return None

def cleanup(processes):
    print("\nCleaning up...")
    for p in processes:
        try:
            p.terminate()
            p.wait(timeout=5)
        except Exception:
            pass
    for port in [8001, 8002, 8003, 8004, 9000]:
        kill_process_on_port(port)
    print("Cleanup complete.")

# Setup
base = os.path.abspath(os.path.dirname(__file__))
processes = []

def handle_interrupt(sig, frame):
    cleanup(processes)
    sys.exit(0)

signal.signal(signal.SIGINT, handle_interrupt)

# Startup sequence
print("Starting model backends...")

models = [
    ("video/emp_face", "venv", "api", "app", 8001),
    ("stt/api", "venv", "main", "app", 8002),
    ("chat/chat/mental_state_analyzer", "venv", "api", "app", 8003),
    ("survey/survey", "venv", "backend", "app", 8004),
    ("emo_buddy", "venv", "api", "app", 8005),
]

for rel_path, venv_folder, module, app, port in models:
    full_path = os.path.join(base, rel_path)
    venv_path = os.path.join(full_path, venv_folder)
    
    # For emo_buddy, run from project root to handle it as a package
    if "emo_buddy" in rel_path:
        cwd = base
        # The module path should be dot-separated for Python to find it
        module_path = f"{os.path.basename(rel_path)}.{module}"
        process = start_backend(cwd, venv_path, module_path, app, port)
    else:
        process = start_backend(full_path, venv_path, module, app, port)
    
    if process:
        processes.append(process)

# Integrated backend
print("\nStarting Integrated Backend...")
integrated_path = os.path.join(base, 'integrated/backend')
integrated_venv = os.path.join(integrated_path, 'venv')
process = start_backend(integrated_path, integrated_venv, 'main', 'app', 9000)
if process:
    processes.append(process)

print("\nAll backends started! Press Ctrl+C to stop all servers.")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    handle_interrupt(None, None)