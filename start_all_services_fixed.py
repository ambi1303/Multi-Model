import subprocess
import os
import sys
import socket
import time
import signal
import psutil
import platform
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

class ComprehensiveServiceManager:
    def __init__(self):
        self.processes = []
        self.running = True
        self.status = {}
        self.base_path = os.path.abspath(os.path.dirname(__file__))
        
    def is_port_in_use(self, port):
        """Check if port is in use"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                return s.connect_ex(('localhost', port)) == 0
        except Exception:
            return False

    def kill_process_on_port(self, port):
        """Kill process on port with better error handling"""
        try:
            killed = False
            for conn in psutil.net_connections():
                if (hasattr(conn, 'laddr') and conn.laddr and 
                    conn.laddr.port == port and conn.status == psutil.CONN_LISTEN):
                    try:
                        process = psutil.Process(conn.pid)
                        print(f"🔪 Killing existing process on port {port} (PID: {conn.pid})")
                        process.kill()
                        killed = True
                        time.sleep(2)
                    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                        pass
            return killed
        except Exception as e:
            print(f"Warning: Error killing process on port {port}: {e}")
            return False

    def find_python_executable(self, service_path):
        """Find Python executable with fallback options"""
        possible_venv_paths = [
            os.path.join(service_path, "venv"),
            os.path.join(service_path, ".venv"),
            os.path.join(service_path, "env"),
        ]
        
        for venv_path in possible_venv_paths:
            if platform.system() == "Windows":
                python_path = os.path.join(venv_path, "Scripts", "python.exe")
            else:
                python_path = os.path.join(venv_path, "bin", "python")
            
            if os.path.exists(python_path):
                return python_path
        
        # Fallback to current Python if in venv
        if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
            return sys.executable
        
        print(f"⚠️  No venv found for {service_path}, using system Python")
        return sys.executable

    def setup_environment(self, service_path=""):
        """Setup comprehensive environment with PYTHONPATH fixes"""
        env = os.environ.copy()
        
        # Add comprehensive paths to PYTHONPATH
        python_paths = [
            self.base_path,  # Project root
            os.path.join(self.base_path, "services"),  # Services directory
        ]
        
        # Add service-specific paths
        if service_path:
            python_paths.append(service_path)
        
        # Add existing PYTHONPATH if it exists
        if "PYTHONPATH" in env:
            python_paths.append(env["PYTHONPATH"])
        
        env["PYTHONPATH"] = os.pathsep.join(python_paths)
        
        # Set optimization flags to reduce startup time
        env["TF_ENABLE_ONEDNN_OPTS"] = "0"
        env["TF_CPP_MIN_LOG_LEVEL"] = "2"
        env["TRANSFORMERS_VERBOSITY"] = "error"  # Reduce transformers warnings
        
        return env

    def start_single_service(self, service_config):
        """Start a single service with proper handling for each service type"""
        try:
            name, path, module, app, port = service_config
            full_path = os.path.join(self.base_path, path)
            
            # Validate service exists
            if not os.path.exists(full_path):
                return None, f"❌ {name} → Service path not found: {full_path}"
            
            module_file = os.path.join(full_path, f"{module}.py")
            if not os.path.exists(module_file):
                return None, f"❌ {name} → Module file not found: {module}.py"
            
            # Kill existing process
            if self.is_port_in_use(port):
                print(f"🔄 Port {port} in use, killing existing process...")
                self.kill_process_on_port(port)
                time.sleep(2)
            
            # Get Python executable
            python_exec = self.find_python_executable(full_path)
            
            # Set up environment with proper PYTHONPATH
            env = self.setup_environment(full_path)
            
            # Special handling for different services
            if "emo_buddy" in path:
                # For emo_buddy, run from services directory to fix relative imports
                run_cwd = os.path.join(self.base_path, "services")
                module_str = f"emo_buddy.api:{app}"
            else:
                run_cwd = full_path
                module_str = f"{module}:{app}"
            
            # Build command with optimizations
            cmd = [
                python_exec, "-m", "uvicorn", module_str,
                "--host", "0.0.0.0",
                "--port", str(port),
                "--log-level", "warning",
                "--access-log"
            ]
            
            # Start process in background
            if platform.system() == "Windows":
                startupinfo = subprocess.STARTUPINFO()
                startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                startupinfo.wShowWindow = subprocess.SW_HIDE
                creationflags = subprocess.CREATE_NO_WINDOW
            else:
                startupinfo = None
                creationflags = 0
            
            process = subprocess.Popen(
                cmd,
                cwd=run_cwd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                startupinfo=startupinfo,
                creationflags=creationflags,
                text=True
            )
            
            return process, f"🚀 {name} → Starting on port {port}"
            
        except Exception as e:
            return None, f"❌ {name} → Error: {str(e)}"

    def wait_for_service(self, port, timeout=45):
        """Wait for service with appropriate timeout"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            if self.is_port_in_use(port):
                return True
            time.sleep(1)
        return False

    def start_all_services(self):
        """Start all services with comprehensive fixes"""
        # All services based on diagnostic results
        services = [
            ("Database Service", "services/db_service", "main", "app", 8000),
            ("Video Emotion API", "services/video/emp_face", "api", "app", 8001),
            ("Speech Analysis API", "services/stt/api", "main", "app", 8002),
            ("Mental State Analyzer", "services/chat/chat/mental_state_analyzer", "api", "app", 8003),
            ("Survey Prediction API", "services/survey/survey", "backend", "app", 8004),
            ("Emo Buddy API", "services/emo_buddy", "api", "app", 8005),
            ("Core Integration API", "services/core", "main", "app", 9000),
        ]
        
        print("🚀 Multi-Model Backend Startup (ALL ISSUES FIXED)")
        print("=" * 60)
        print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🔧 PYTHONPATH configured, imports fixed, optimizations applied")
        print(f"🔧 Starting {len(services)} services in parallel...\n")
        
        # Start all services in parallel
        with ThreadPoolExecutor(max_workers=len(services)) as executor:
            future_to_service = {
                executor.submit(self.start_single_service, service): service[0]
                for service in services
            }
            
            for future in as_completed(future_to_service):
                try:
                    process, message = future.result()
                    print(message)
                    if process:
                        self.processes.append(process)
                except Exception as e:
                    service_name = future_to_service[future]
                    print(f"❌ {service_name} → Startup error: {e}")
        
        # Wait for all services to be ready with extended timeout
        print(f"\n⏳ Waiting for services to become ready (45s timeout per service)...\n")
        
        ready_services = []
        failed_services = []
        
        for i, (name, path, module, app, port) in enumerate(services):
            # Give more time for ML services
            timeout = 60 if any(keyword in path for keyword in ['video', 'stt', 'emo_buddy']) else 45
            
            if self.wait_for_service(port, timeout=timeout):
                print(f"✅ {name:<25} → Ready on port {port}")
                ready_services.append((name, port))
            else:
                print(f"⏰ {name:<25} → Timeout on port {port}")
                failed_services.append((name, port))
        
        # Display results
        self.display_results(ready_services, failed_services)
        
        return len(ready_services), len(failed_services)

    def display_results(self, ready_services, failed_services):
        """Display startup results"""
        total = len(ready_services) + len(failed_services)
        
        print(f"\n{'='*60}")
        if len(ready_services) == total:
            print(f"🎉 SUCCESS! All {total} services are running!")
        else:
            print(f"⚠️  {len(ready_services)}/{total} services started successfully")
        
        if ready_services:
            print(f"\n✅ Running Services:")
            print("-" * 40)
            for name, port in ready_services:
                print(f"• {name:<25} → http://localhost:{port}")
        
        if failed_services:
            print(f"\n❌ Failed Services:")
            print("-" * 40)
            for name, port in failed_services:
                print(f"• {name:<25} → Port {port}")
        
        if ready_services:
            print(f"\n🔗 Quick Access:")
            print("-" * 40)
            ready_ports = [port for _, port in ready_services]
            if 9000 in ready_ports:
                print(f"• Core API Documentation → http://localhost:9000/docs")
                print(f"• Health Check           → http://localhost:9000/health")
            if 8000 in ready_ports:
                print(f"• Database API Docs      → http://localhost:8000/docs")
            if 8001 in ready_ports:
                print(f"• Video Emotion API      → http://localhost:8001/docs")
            if 8002 in ready_ports:
                print(f"• Speech Analysis API    → http://localhost:8002/docs")
            if 8003 in ready_ports:
                print(f"• Mental State API       → http://localhost:8003/docs")
            if 8004 in ready_ports:
                print(f"• Survey Prediction API  → http://localhost:8004/docs")
            if 8005 in ready_ports:
                print(f"• Emo Buddy API         → http://localhost:8005/docs")
        
        print(f"\n💡 Press Ctrl+C to stop all services")
        print("=" * 60)

    def cleanup(self):
        """Enhanced cleanup"""
        print(f"\n🧹 Shutting down services...")
        self.running = False
        
        for process in self.processes:
            if process and process.poll() is None:
                try:
                    process.terminate()
                    try:
                        process.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        print("🔪 Force killing stubborn process...")
                        process.kill()
                except Exception as e:
                    print(f"Warning: Error stopping process: {e}")
        
        # Kill remaining processes on ports
        for port in [8000, 8001, 8002, 8003, 8004, 8005, 9000]:
            if self.is_port_in_use(port):
                self.kill_process_on_port(port)
        
        print("✅ All services stopped successfully!")

def main():
    """Main function"""
    manager = ComprehensiveServiceManager()
    
    def signal_handler(sig, frame):
        manager.cleanup()
        sys.exit(0)
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    if platform.system() != "Windows":
        signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Start all services
        ready_count, failed_count = manager.start_all_services()
        
        if ready_count > 0:
            # Keep running
            while True:
                time.sleep(1)
        else:
            print("❌ No services started successfully.")
            print("\n🔧 Run: python diagnose_startup.py for detailed analysis")
            sys.exit(1)
            
    except KeyboardInterrupt:
        signal_handler(None, None)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        manager.cleanup()
        sys.exit(1)

if __name__ == "__main__":
    main() 