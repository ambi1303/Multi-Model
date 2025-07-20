import subprocess
import os
import sys
import socket
import time
import signal
import psutil
import platform
import threading
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
from pathlib import Path
import json
import hashlib

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(levelname)s] - %(message)s')
logger = logging.getLogger(__name__)

# --- Service Configuration ---
SERVICE_CONFIG = [
    ("Core Service", "services/core", "main", "app", 8000),
    ("Video Service", "services/video/emp_face", "api", "app", 8001),
    ("STT Service", "services/stt/api", "main", "app", 8002),
    ("Chat Service", "services/chat/chat/mental_state_analyzer", "api", "app", 8003),
    ("Survey Service", "services/survey/survey", "backend", "app", 8004),
    ("Emo-Buddy Service", "services/emo_buddy", "api", "app", 8005),
    ("Integrated Backend", "services/integrated/backend", "main", "app", 9000),
]

class OptimizedServiceManager:
    def __init__(self, service_configs):
        self.service_configs = service_configs
        self.processes = {}
        self.threads = []
        self.project_root = Path(os.path.abspath(os.path.dirname(__file__)))
        self.debug_mode = "DEBUG_MODE" in os.environ
        self.deps_cache_file = self.project_root / ".deps_cache.json"
        self.startup_timeout = int(os.environ.get("STARTUP_TIMEOUT", "15"))  # Reduced from 30
        
    def log_debug(self, message):
        """Log debug messages if debug mode is enabled"""
        if self.debug_mode:
            logger.debug(f"🔍 {message}")

    def get_requirements_hash(self, requirements_path):
        """Get hash of requirements file for caching"""
        if not requirements_path.exists():
            return None
        with open(requirements_path, 'r') as f:
            content = f.read()
        return hashlib.md5(content.encode()).hexdigest()

    def load_deps_cache(self):
        """Load dependency installation cache"""
        if self.deps_cache_file.exists():
            try:
                with open(self.deps_cache_file, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}

    def save_deps_cache(self, cache):
        """Save dependency installation cache"""
        with open(self.deps_cache_file, 'w') as f:
            json.dump(cache, f)

    def batch_kill_ports(self, ports):
        """Kill all processes on specified ports in parallel"""
        def kill_port(port):
            if not self.is_port_in_use(port):
                return
            logger.info(f"🔪 Killing process on port {port}")
            try:
                for conn in psutil.net_connections():
                    if (conn.laddr and conn.laddr.port == port and 
                        conn.status == psutil.CONN_LISTEN):
                        process = psutil.Process(conn.pid)
                        process.terminate()
                        try:
                            process.wait(timeout=2)
                        except psutil.TimeoutExpired:
                            process.kill()
            except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
                self.log_debug(f"Process cleanup for port {port}: {e}")

        # Kill all ports in parallel
        ports_in_use = [port for _, _, _, _, port in self.service_configs 
                        if self.is_port_in_use(port)]
        
        if ports_in_use:
            logger.info(f"Cleaning up {len(ports_in_use)} ports in parallel...")
            with ThreadPoolExecutor(max_workers=len(ports_in_use)) as executor:
                list(executor.map(kill_port, ports_in_use))
            time.sleep(0.5)  # Brief pause for OS cleanup

    def is_port_in_use(self, port):
        """Check if a port is currently in use"""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.1)  # Quick timeout
            return s.connect_ex(('localhost', port)) == 0

    def find_python_executable(self, service_path):
        """Find the best Python executable for the service"""
        venv_scripts = "Scripts" if platform.system() == "Windows" else "bin"
        service_full_path = self.project_root / service_path
        
        for venv_name in ["venv", ".venv", "env"]:
            python_name = "python.exe" if platform.system() == "Windows" else "python"
            python_path = service_full_path / venv_name / venv_scripts / python_name
            if python_path.exists():
                self.log_debug(f"Found venv Python for '{service_path}': {python_path}")
                return str(python_path)
        
        return sys.executable

    def install_dependencies_optimized(self, service_name, service_path, python_exec):
        """Install dependencies with caching to avoid redundant installs"""
        requirements_file = self.project_root / service_path / "requirements.txt"
        if not requirements_file.exists():
            return True
        
        # Check cache
        cache = self.load_deps_cache()
        current_hash = self.get_requirements_hash(requirements_file)
        cache_key = f"{service_path}:{current_hash}"
        
        if cache.get(cache_key) == "installed":
            self.log_debug(f"[{service_name}] 📦 Dependencies already up to date (cached)")
            return True
        
        logger.info(f"[{service_name}] 📦 Installing dependencies...")
        try:
            # Use --quiet and --no-warn-script-location for faster, cleaner output
            cmd = [python_exec, "-m", "pip", "install", "-r", str(requirements_file), 
                   "--quiet", "--no-warn-script-location"]
            
            subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            
            # Update cache
            cache[cache_key] = "installed"
            self.save_deps_cache(cache)
            
            logger.info(f"[{service_name}] ✅ Dependencies installed")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"[{service_name}] ❌ Dependency installation failed")
            return False

    async def check_service_health(self, port, timeout=15):
        """Asynchronously check if service is responding on port"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=1)) as session:
                    async with session.get(f"http://localhost:{port}/") as response:
                        if response.status < 500:  # Accept any non-server-error status
                            return True
            except:
                pass
            await asyncio.sleep(0.2)  # Check every 200ms instead of 500ms
        return False

    def start_single_service_optimized(self, service_config):
        """Start a single service with optimizations"""
        name, path, module, app, port = service_config
        full_path = self.project_root / path

        if not full_path.exists():
            logger.error(f"[{name}] ❌ Path not found: {full_path}")
            return {'name': name, 'status': 'failed', 'error': 'Path not found'}

        logger.info(f"🚀 Starting [{name}] on port {port}")

        # Find Python and install dependencies
        python_exec = self.find_python_executable(path)
        if not self.install_dependencies_optimized(name, path, python_exec):
            return {'name': name, 'status': 'failed', 'error': 'Dependencies failed'}

        # Set up environment
        env = os.environ.copy()
        env["PYTHONPATH"] = os.pathsep.join([str(self.project_root), env.get("PYTHONPATH", "")])
        
        # Add performance environment variables
        env.update({
            "PYTHONUNBUFFERED": "1",
            "UVICORN_LOG_LEVEL": "warning",  # Reduce log noise
        })

        # Start with optimized uvicorn settings
        cmd = [
            python_exec, "-m", "uvicorn", f"{module}:{app}",
            "--host", "0.0.0.0", "--port", str(port),
            "--workers", "1",  # Single worker for faster startup
            "--access-log", "false",  # Disable access logs for performance
        ]
        
        process = subprocess.Popen(
            cmd, cwd=str(full_path), env=env,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, bufsize=1
        )
        self.processes[name] = process

        # Simplified logging - only log errors to reduce overhead
        def log_errors():
            for line in process.stderr:
                if "ERROR" in line or "CRITICAL" in line:
                    logger.error(f"[{name}] {line.strip()}")
        
        error_thread = threading.Thread(target=log_errors, daemon=True)
        error_thread.start()

        return {'name': name, 'status': 'starting', 'port': port, 'process': process}

    async def wait_for_all_services(self, service_results):
        """Wait for all services to become ready asynchronously"""
        async def wait_for_service(result):
            if result['status'] != 'starting':
                return result
            
            name = result['name']
            port = result['port']
            
            if await self.check_service_health(port, self.startup_timeout):
                logger.info(f"[{name}] ✅ Ready at http://localhost:{port}")
                return {**result, 'status': 'running'}
            else:
                logger.error(f"[{name}] ❌ Failed to start within {self.startup_timeout}s")
                self.cleanup_process(name)
                return {**result, 'status': 'failed', 'error': 'Startup timeout'}

        # Wait for all services concurrently
        tasks = [wait_for_service(result) for result in service_results]
        return await asyncio.gather(*tasks)

    def start_all_services_optimized(self):
        """Start all services with maximum parallelization"""
        start_time = time.time()
        
        # 1. Batch cleanup ports
        logger.info("🧹 Cleaning up existing processes...")
        self.batch_kill_ports([config[4] for config in self.service_configs])
        
        # 2. Start all services in parallel (preparation phase)
        logger.info("🚀 Starting all services in parallel...")
        results = []
        with ThreadPoolExecutor(max_workers=len(self.service_configs)) as executor:
            futures = [executor.submit(self.start_single_service_optimized, config) 
                      for config in self.service_configs]
            for future in as_completed(futures):
                try:
                    results.append(future.result())
                except Exception as e:
                    logger.error(f"Service startup error: {e}", exc_info=True)

        # 3. Wait for all services to be ready (async)
        logger.info("⏳ Waiting for services to become ready...")
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            final_results = loop.run_until_complete(self.wait_for_all_services(results))
        finally:
            loop.close()

        # 4. Report results
        elapsed = time.time() - start_time
        successful = [r for r in final_results if r['status'] == 'running']
        failed = [r for r in final_results if r['status'] == 'failed']
        
        print("\n" + "="*60)
        print(f"🚀 STARTUP COMPLETE in {elapsed:.1f}s 🚀")
        print("="*60)
        
        if successful:
            logger.info(f"✅ {len(successful)} services running:")
            for s in successful:
                print(f"  🟢 {s['name']} → http://localhost:{s['port']}")
        
        if failed:
            logger.error(f"❌ {len(failed)} services failed:")
            for f in failed:
                print(f"  🔴 {f['name']}: {f.get('error', 'Unknown error')}")
        
        print(f"\n⚡ Total startup time: {elapsed:.1f} seconds")
        print("="*60)
        
        return len(successful) == len(self.service_configs)

    def cleanup_process(self, name):
        """Clean up a single process"""
        if name in self.processes:
            process = self.processes[name]
            if process.poll() is None:
                try:
                    parent = psutil.Process(process.pid)
                    for child in parent.children(recursive=True):
                        child.terminate()
                    parent.terminate()
                    process.wait(timeout=2)
                except (psutil.NoSuchProcess, psutil.TimeoutExpired):
                    pass
            del self.processes[name]

    def cleanup(self):
        """Gracefully shut down all services"""
        logger.info("🛑 Shutting down all services...")
        for name in list(self.processes.keys()):
            self.cleanup_process(name)
        logger.info("✅ All services shut down")

def main():
    manager = OptimizedServiceManager(SERVICE_CONFIG)

    def signal_handler(sig, frame):
        logger.warning("Shutdown signal received")
        manager.cleanup()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    success = manager.start_all_services_optimized()
    
    if success:
        logger.info("🎉 All services started successfully!")
    else:
        logger.warning("⚠️ Some services failed to start")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)

if __name__ == "__main__":
    main()