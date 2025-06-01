@echo off
REM Start Video Backend
start cmd /k "cd /d %~dp0video\emp_face && call venv\Scripts\activate.bat && uvicorn api:app --reload --port 8001"
REM Start STT Backend
start cmd /k "cd /d %~dp0stt\stt\api && call ..\venv\Scripts\activate.bat && uvicorn main:app --reload --port 8002"
REM Start Chat Backend
start cmd /k "cd /d %~dp0chat\chat\mental_state_analyzer && call venv\Scripts\activate.bat && uvicorn api:app --reload --port 8003"
REM Uncomment and adjust the next line if you have a survey backend:
REM start cmd /k "cd /d %~dp0survey\services\backend\app && call ..\..\venv\Scripts\activate.bat && uvicorn main:app --reload --port 8004"
REM Start Integrated Backend
start cmd /k "cd /d %~dp0integrated\backend && uvicorn main:app --reload --port 9000" 