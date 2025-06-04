import subprocess
import sys
import os
import time
from pathlib import Path

def start_service(name, command, port):
    print(f"Starting {name} service on port {port}...")
    try:
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print(f"{name} service started successfully!")
        return process
    except Exception as e:
        print(f"Error starting {name} service: {str(e)}")
        return None

def main():
    # Get the project root directory
    project_root = Path(__file__).parent.parent.parent

    # Start video analysis service
    video_cmd = f"cd {project_root}/video && uvicorn app.main:app --host 0.0.0.0 --port 8001"
    video_process = start_service("Video Analysis", video_cmd, 8001)

    # Start STT service
    stt_cmd = f"cd {project_root}/stt && uvicorn app.main:app --host 0.0.0.0 --port 8002"
    stt_process = start_service("Speech-to-Text", stt_cmd, 8002)

    # Start chat service
    chat_cmd = f"cd {project_root}/chat/chat/services/backend && uvicorn app.main:app --host 0.0.0.0 --port 8003"
    chat_process = start_service("Chat Analysis", chat_cmd, 8003)

    # Start survey service
    survey_cmd = f"cd {project_root}/survey && uvicorn app.main:app --host 0.0.0.0 --port 8004"
    survey_process = start_service("Survey Analysis", survey_cmd, 8004)

    # Start integrated backend
    integrated_cmd = f"cd {project_root}/integrated/backend && uvicorn main:app --host 0.0.0.0 --port 9000"
    integrated_process = start_service("Integrated Backend", integrated_cmd, 9000)

    print("\nAll services started! Press Ctrl+C to stop all services.")
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping all services...")
        for process in [video_process, stt_process, chat_process, survey_process, integrated_process]:
            if process:
                process.terminate()
        print("All services stopped.")

if __name__ == "__main__":
    main() 