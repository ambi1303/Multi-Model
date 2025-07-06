@echo off
echo Starting Survey Analysis Service...

REM Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Start the service
echo Starting Survey Analysis Service on port 8004...
python -m uvicorn backend:app --host 0.0.0.0 --port 8004

pause 