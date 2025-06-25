@echo off
REM Start Video Backend
start cmd /k "cd /d %~dp0video\emp_face && call venv\Scripts\activate.bat && python api.py"
REM Start STT Backend
start cmd /k "cd /d %~dp0stt\api && call ..\sttvenv\Scripts\activate.bat && uvicorn main:app --reload --port 8002"
REM Start Chat Backend
start cmd /k "cd /d %~dp0chat\chat\mental_state_analyzer && call venvChat\Scripts\activate.bat && uvicorn api:app --reload --port 8003"
REM Start Survey Backend
start cmd /k "cd /d %~dp0survey\survey && call venv\Scripts\activate.bat && uvicorn backend:app --reload --port 8004"
REM Start Integrated Backend
start cmd /k "cd /d %~dp0integrated\backend && call venv\Scripts\activate.bat && uvicorn main:app --reload --port 9000"

echo All backends started!
echo Press Ctrl+C in each window to stop the services. 