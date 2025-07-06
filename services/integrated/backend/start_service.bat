@echo off
echo Starting Integrated Analysis API...
echo.

:: Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate
    echo Installing dependencies...
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)

:: Start the API
echo Starting API server on port 9000...
python -m uvicorn main:app --host 0.0.0.0 --port 9000

:: Keep the window open if there's an error
if %ERRORLEVEL% neq 0 (
    echo.
    echo Error starting the API server.
    pause
) 