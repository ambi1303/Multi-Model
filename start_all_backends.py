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

def wait_for_port(port, timeout=60):
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

def python_executable(venv_dir):
    if sys.platform == 'win32':
        return os.path.join(venv_dir, 'Scripts', 'python.exe')
    else:
        return os.path.join(venv_dir, 'bin', 'python')

def uvicorn_executable(venv_dir):
    if sys.platform == 'win32':
        return os.path.join(venv_dir, 'Scripts', 'uvicorn.exe')
    else:
        return os.path.join(venv_dir, 'bin', 'uvicorn')

def start_backend(path, venv_dir, module, app, port, extra_env=None):
    if not os.path.exists(venv_dir):
        print(f"Error: Virtual environment not found at {venv_dir}")
        return None

    if is_port_in_use(port):
        print(f"Port {port} is in use. Attempting to kill existing process...")
        kill_process_on_port(port)
        time.sleep(2)

    uvicorn_exec = uvicorn_executable(venv_dir)
    command = [uvicorn_exec, f'{module}:{app}', '--port', str(port)]

    try:
        env = os.environ.copy()
        if extra_env:
            env.update(extra_env)
        process = subprocess.Popen(
            command,
            cwd=path,
            env=env
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
    for port in [8001, 8002, 8003, 8004, 8005, 9000]:
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
    ("services/video/emp_face", "venv", "api", "app", 8001),
    ("services/stt/api", "venv", "main", "app", 8002),
    ("services/chat/chat/mental_state_analyzer", "venv", "api", "app", 8003),
    ("services/survey/survey", "venv", "backend", "app", 8004),
    ("services/emo_buddy", "venv", "api", "app", 8005),
    ("services/integrated/backend", "venv", "main", "app", 9000)
]

# Launch all processes in parallel
for rel_path, venv_folder, module, app, port in models:
    full_path = os.path.join(base, rel_path)
    venv_path = os.path.join(full_path, venv_folder)
    
    # Check for venv existence before starting
    if not os.path.exists(venv_path):
        print(f"Error: Virtual environment not found at {venv_path}. Please run setup script.")
        continue

    # Kill existing process if port is in use
    if is_port_in_use(port):
        print(f"Port {port} is in use. Attempting to kill existing process...")
        kill_process_on_port(port)
        time.sleep(2)

    python_exec = python_executable(venv_path)
    
    # Special handling for emo_buddy to run as a module
    if "emo_buddy" in rel_path:
        # Run from the 'services' directory to treat 'emo_buddy' as a top-level package
        run_cwd = os.path.join(base, "services")
        # The module string refers to the package and file directly
        module_str = f"emo_buddy.api:{app}"
    else:
        run_cwd = full_path
        module_str = f"{module}:{app}"

    command = [python_exec, '-m', 'uvicorn', module_str, '--port', str(port)]
    
    env = os.environ.copy()

    try:
        process = subprocess.Popen(
            command,
            cwd=run_cwd,
            env=env
        )
        print(f"Launching '{module_str.split(':')[0]}' on port {port}...")
        processes.append((process, module, port))
    except Exception as e:
        print(f"Error starting {module}: {e}")

# Wait for all processes to be ready
print("\nWaiting for all services to become ready...")
all_ready = True
for process, module, port in processes:
    if not wait_for_port(port):
        print(f"Warning: {module} did not start on port {port} in time.")
        all_ready = False

if all_ready:
    print("\nAll backends started successfully! Press Ctrl+C to stop all servers.")
else:
    print("\nSome backends may not have started correctly. Please check the logs. Press Ctrl+C to stop all servers.")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    handle_interrupt(None, None)