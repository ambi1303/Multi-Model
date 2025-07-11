import subprocess
import os
import sys
import socket
import time
import signal
import psutil
import platform
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(levelname)s] - %(message)s')
logger = logging.getLogger(__name__)

# --- Service Configuration ---
# Moved to a class-level variable for clarity.
# Each tuple: (Name, Path, Main Module File, FastAPI App Name, Port)
SERVICE_CONFIG = [
    ("Core Service", "services/core", "main", "app", 8000),
    ("Video Service", "services/video/emp_face", "api", "app", 8001),
    ("STT Service", "services/stt/api", "main", "app", 8002),
    ("Chat Service", "services/chat/chat/mental_state_analyzer", "api", "app", 8003),
    ("Survey Service", "services/survey/survey", "backend", "app", 8004),
    ("Emo-Buddy Service", "services/emo_buddy", "api", "app", 8005),
    ("Integrated Backend", "services/integrated/backend", "main", "app", 9000),
]

class ServiceManager:
    def __init__(self, service_configs):
        self.service_configs = service_configs
        self.processes = {}
        self.threads = []
        self.project_root = os.path.abspath(os.path.dirname(__file__))
        self.debug_mode = "DEBUG_MODE" in os.environ

    def log_debug(self, message):
        """Log debug messages if debug mode is enabled"""
        if self.debug_mode:
            logger.debug(f"🔍 {message}")

    def is_port_in_use(self, port):
        """Check if a port is currently in use"""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('localhost', port)) == 0

    def kill_process_on_port(self, port):
        """Find and kill any process using the specified port."""
        if not self.is_port_in_use(port):
            return
        logger.info(f"Port {port} is in use. Attempting to terminate the existing process.")
        try:
            for conn in psutil.net_connections():
                if conn.laddr and conn.laddr.port == port and conn.status == psutil.CONN_LISTEN:
                    process = psutil.Process(conn.pid)
                    logger.info(f"🔪 Killing process '{process.name()}' (PID: {conn.pid}) on port {port}.")
                    process.terminate()
                    process.wait(timeout=3)
        except psutil.NoSuchProcess:
            pass
        except psutil.TimeoutExpired:
            logger.warning(f"Process {conn.pid} did not terminate gracefully. Forcing kill.")
            process.kill()
        except Exception as e:
            logger.error(f"Error killing process on port {port}: {e}")
        time.sleep(1) # Give the OS a moment to release the port

    def find_python_executable(self, service_path):
        """Find the best Python executable for the service, prioritizing virtual environments."""
        venv_scripts = "Scripts" if platform.system() == "Windows" else "bin"
        for venv_name in ["venv", ".venv", "env"]:
            python_path = os.path.join(self.project_root, service_path, venv_name, venv_scripts, "python.exe" if platform.system() == "Windows" else "python")
            if os.path.exists(python_path):
                self.log_debug(f"Found venv Python for '{service_path}': {python_path}")
                return python_path
        
        logger.warning(f"⚠️ No virtual environment found for '{service_path}'. Falling back to system Python: '{sys.executable}'")
        return sys.executable

    def install_dependencies(self, service_name, service_path, python_exec):
        """Install dependencies from requirements.txt if it exists."""
        requirements_file = os.path.join(self.project_root, service_path, "requirements.txt")
        if not os.path.exists(requirements_file):
            self.log_debug(f"No requirements.txt for '{service_name}'. Skipping dependency installation.")
            return True
        
        logger.info(f"[{service_name}] 📦 Installing/verifying dependencies...")
        try:
            subprocess.check_call([python_exec, "-m", "pip", "install", "-r", requirements_file],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            logger.info(f"[{service_name}] ✅ Dependencies are up to date.")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"[{service_name}] ❌ Failed to install dependencies from {requirements_file}.")
            logger.error(f"Error: {e}")
            return False

    def stream_logs(self, process_name, process):
        """Stream logs from a subprocess in a dedicated thread."""
        def reader(pipe, pipe_name):
            try:
                with pipe:
                    for line in iter(pipe.readline, ''):
                        logger.info(f"[{process_name}] {line.strip()}")
            except Exception as e:
                logger.debug(f"Log stream for {process_name} ({pipe_name}) closed: {e}")

        # Start threads to read stdout and stderr
        stdout_thread = threading.Thread(target=reader, args=[process.stdout, "stdout"], daemon=True)
        stderr_thread = threading.Thread(target=reader, args=[process.stderr, "stderr"], daemon=True)
        stdout_thread.start()
        stderr_thread.start()
        self.threads.extend([stdout_thread, stderr_thread])

    def start_single_service(self, service_config):
        """Start a single service, including dependency checks and logging."""
        name, path, module, app, port = service_config
        full_path = os.path.join(self.project_root, path)

        if not os.path.exists(full_path):
            logger.error(f"[{name}] ❌ Path not found: {full_path}")
            return {'name': name, 'status': 'failed', 'error': 'Path not found'}

        logger.info(f"--- Starting [{name}] on port {port} ---")

        # 1. Clean up port if necessary
        self.kill_process_on_port(port)

        # 2. Find Python executable and install dependencies
        python_exec = self.find_python_executable(path)
        if not self.install_dependencies(name, path, python_exec):
            return {'name': name, 'status': 'failed', 'error': 'Dependency installation failed'}

        # 3. Set up environment
        # The PYTHONPATH is modified here to include the project root. This is
        # necessary because some services use absolute imports like `from services.stt...`
        # which would fail otherwise, as they are not installed as packages.
        env = os.environ.copy()
        env["PYTHONPATH"] = os.pathsep.join([self.project_root, env.get("PYTHONPATH", "")])

        # 4. Construct and run the command
        cmd = [python_exec, "-m", "uvicorn", f"{module}:{app}", "--host", "0.0.0.0", "--port", str(port)]
        self.log_debug(f"Executing for '{name}': {' '.join(cmd)}")
        
        process = subprocess.Popen(
            cmd,
            cwd=full_path,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        self.processes[name] = process
        self.stream_logs(name, process)

        # 5. Wait for the service to be available
        logger.info(f"[{name}] ⏳ Waiting for service to become available...")
        if self.wait_for_service(port):
            logger.info(f"[{name}] ✅ Service is running and available at http://localhost:{port}")
            return {'name': name, 'status': 'running', 'port': port}
        else:
            logger.error(f"[{name}] ❌ Service failed to start on port {port} within timeout.")
            self.cleanup_process(name)
            return {'name': name, 'status': 'failed', 'error': 'Timeout waiting for port'}

    def wait_for_service(self, port, timeout=30):
        """Wait for a service to become available on the given port."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            if self.is_port_in_use(port):
                return True
            time.sleep(0.5)
        return False

    def start_all_services(self):
        """Start all configured services in parallel and report status."""
        results = []
        with ThreadPoolExecutor(max_workers=len(self.service_configs)) as executor:
            futures = [executor.submit(self.start_single_service, config) for config in self.service_configs]
            for future in as_completed(futures):
                try:
                    results.append(future.result())
                except Exception as e:
                    logger.error(f"An unexpected error occurred while starting a service: {e}", exc_info=True)

        # Final status report
        successful = [r for r in results if r and r['status'] == 'running']
        failed = [r for r in results if r and r['status'] == 'failed']
        
        print("\n" + "="*50)
        print("🚀 STARTUP COMPLETE 🚀")
        print("="*50)
        logger.info(f"✅ Successfully started {len(successful)} service(s):")
        for s in successful:
            print(f"  - {s['name']} on port {s['port']}")

        if failed:
            logger.error(f"❌ Failed to start {len(failed)} service(s):")
            for f in failed:
                print(f"  - {f['name']}: {f.get('error', 'Unknown error')}")
            print("\nCheck the logs above for detailed error messages.")
        print("="*50)

    def cleanup_process(self, name):
        """Clean up a single process."""
        if name in self.processes:
            process = self.processes[name]
            if process.poll() is None: # Check if process is still running
                logger.info(f"Terminating process for '{name}' (PID: {process.pid})")
                try:
                    parent = psutil.Process(process.pid)
                    for child in parent.children(recursive=True):
                        child.terminate()
                    parent.terminate()
                    process.wait(timeout=3)
                except (psutil.NoSuchProcess, psutil.TimeoutExpired):
                    pass # Process may have already exited
            del self.processes[name]

    def cleanup(self):
        """Gracefully shut down all running service processes."""
        logger.info("\nShutting down all services...")
        names = list(self.processes.keys())
        for name in names:
            self.cleanup_process(name)
        
        for thread in self.threads:
            thread.join(timeout=1)
            
        logger.info("All services have been shut down.")

def main():
    manager = ServiceManager(SERVICE_CONFIG)

    # Set up a signal handler for graceful shutdown
    def signal_handler(sig, frame):
        logger.warning("Shutdown signal received.")
        manager.cleanup()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    manager.start_all_services()
    
    try:
        # Keep the main thread alive to listen for shutdown signals
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)

if __name__ == "__main__":
    main()