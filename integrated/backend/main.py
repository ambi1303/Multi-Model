from fastapi import FastAPI, File, UploadFile, Form, Body, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import requests
import logging
from pydantic import BaseModel, Field
from typing import Literal
import pandas as pd
import pickle
import os
from datetime import datetime, timedelta
import tempfile
import subprocess
import wave
from vosk import Model, KaldiRecognizer
from textblob import TextBlob
import json
import aiohttp
from aiohttp import ClientSession, FormData
import asyncio
from functools import lru_cache
from cachetools import TTLCache, cached
from fastapi import APIRouter

app = FastAPI()

# Configure CORS with more permissive settings
origins = [
    "http://localhost:3000",  # React frontend
    "http://localhost:8000",  # Default FastAPI port
    "http://localhost:8001",  # Video model
    "http://localhost:8002",  # STT model
    "http://localhost:8003",  # Chat model
    "http://localhost:8004",  # Survey model
    "http://localhost:9000",  # Integrated backend
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8001",
    "http://127.0.0.1:8002",
    "http://127.0.0.1:8003",
    "http://127.0.0.1:8004",
    "http://127.0.0.1:9000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Config: URLs of the existing model backends
VIDEO_BACKEND_URL = "http://localhost:8001/analyze-emotion"
STT_BACKEND_URL = "http://localhost:8002/analyze-speech"
CHAT_BACKEND_URL = "http://localhost:8003/analyze/single"
SURVEY_BACKEND_URL = "http://localhost:8004/analyze"

# Create a session pool for HTTP requests
session = None

# Create a TTL cache with 5 minutes expiration
cache = TTLCache(maxsize=100, ttl=300)

@app.on_event("startup")
async def startup_event():
    global session
    session = ClientSession()
    logger.info("Application started with in-memory caching")

@app.on_event("shutdown")
async def shutdown_event():
    if session:
        await session.close()

# Data model for burnout prediction
class EmployeeData(BaseModel):
    Designation: float = Field(..., ge=1, le=5, description="Employee designation level (1-5, 1 being lowest)")
    Resource_Allocation: float = Field(..., ge=1, le=10, description="Resource allocation score (1-10)")
    Mental_Fatigue_Score: float = Field(..., ge=1, le=10, description="Mental fatigue score (1-10)")
    Company_Type: Literal["Service", "Product"] = Field(..., description="Type of company")
    WFH_Setup_Available: Literal["Yes", "No"] = Field(..., description="Whether WFH setup is available")
    Gender: Literal["Male", "Female"] = Field(..., description="Gender of the employee")

class PredictionResponse(BaseModel):
    burn_rate: float
    stress_level: str
    model_used: str
    prediction_time: str

# Initialize Vosk model (global, so it's loaded once)
VOSK_MODEL_PATH = os.path.join(os.path.dirname(__file__), "vosk-model-small-en-us-0.15")
vosk_model = None
if os.path.exists(VOSK_MODEL_PATH):
    vosk_model = Model(VOSK_MODEL_PATH)
else:
    print(f"Vosk model not found at {VOSK_MODEL_PATH}")

def convert_webm_to_wav(input_path, output_path):
    try:
        command = [
            'ffmpeg', '-i', input_path,
            '-acodec', 'pcm_s16le',
            '-ac', '1',
            '-ar', '16000',
            '-y',
            output_path
        ]
        subprocess.run(command, check=True, capture_output=True)
        return True
    except Exception as e:
        print(f"Error converting audio: {e}")
        return False

@app.get("/")
def health_check():
    return {"status": "ok"}

# Cache frequently accessed data
@lru_cache(maxsize=100)
def get_cached_model(model_name: str):
    # Implement model caching logic here
    pass

@app.post("/analyze-video")
async def analyze_video(file: UploadFile = File(...)):
    file_bytes = await file.read()
    form = FormData()
    form.add_field(
        name="file",
        value=file_bytes,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream"
    )
    async with session.post(VIDEO_BACKEND_URL, data=form) as resp:
        try:
            data = await resp.json()
        except Exception as e:
            logger.error(f"Error decoding JSON from video backend: {e}")
            data = {"error": "Invalid JSON from video backend"}
        logger.info(f"Video backend response: {data}")
        return JSONResponse(content=data, status_code=resp.status)

@app.post("/analyze-speech")
async def analyze_speech(audio_file: UploadFile = File(...)):
    # Proxy the audio file to the STT backend (port 8002)
    stt_url = "http://localhost:8002/analyze-speech"
    try:
        # Read the uploaded file
        file_bytes = await audio_file.read()
        form = FormData()
        form.add_field(
            name="audio_file",
            value=file_bytes,
            filename=audio_file.filename,
            content_type=audio_file.content_type or "application/octet-stream"
        )
        async with session.post(stt_url, data=form) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
    except Exception as e:
        logger.error(f"Error proxying to STT backend: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/analyze-chat")
async def analyze_chat(request: Request):
    try:
        payload = await request.json()
        logger.info(f"Parsed JSON payload: {payload}")
    except Exception as e:
        logger.error(f"Failed to parse JSON: {e}")
        return JSONResponse(content={"error": "Invalid JSON body"}, status_code=400)

    text = payload.get("text")
    if not text or not isinstance(text, str) or not text.strip():
        return JSONResponse(content={"error": "Field 'text' is required and must be a non-empty string."}, status_code=422)

    chat_payload = {
        "text": text,
        "person_id": payload.get("person_id") or "user_api"
    }
    headers = {"Content-Type": "application/json"}
    logger.info(f"Forwarding to {CHAT_BACKEND_URL} with payload: {chat_payload}")
    
    async with session.post(CHAT_BACKEND_URL, json=chat_payload, headers=headers) as resp:
        logger.info(f"Chat backend response: {resp.status} {await resp.text()}")
        return JSONResponse(content=await resp.json(), status_code=resp.status)

@app.post("/analyze-survey")
async def analyze_survey(employee: EmployeeData):
    try:
        logger.info(f"Forwarding survey data to backend: {employee.dict()}")
        async with session.post(SURVEY_BACKEND_URL, json=employee.dict()) as resp:
            if resp.status != 200:
                error_detail = await resp.text()
                logger.error(f"Survey backend error: {error_detail}")
                raise HTTPException(status_code=resp.status, detail=error_detail)
            
            try:
                response_data = await resp.json()
                logger.info(f"Survey analysis completed successfully: {response_data}")
                return JSONResponse(content=response_data, status_code=resp.status)
            except Exception as e:
                logger.error(f"Error parsing survey response: {str(e)}")
                raise HTTPException(status_code=500, detail="Error parsing survey response")
    except aiohttp.ClientError as e:
        logger.error(f"Connection error in analyze-survey: {str(e)}")
        raise HTTPException(status_code=503, detail="Survey service unavailable")
    except Exception as e:
        logger.error(f"Error in analyze-survey: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-all")
async def analyze_all(file: UploadFile = File(None), audio_file: UploadFile = File(None), text: str = Form(None), person_id: str = Form(None)):
    results = {}
    tasks = []
    
    if file:
        files = {"file": (file.filename, await file.read(), file.content_type)}
        tasks.append(session.post(VIDEO_BACKEND_URL, files=files))
    
    if audio_file:
        files = {"audio_file": (audio_file.filename, await audio_file.read(), audio_file.content_type)}
        tasks.append(session.post(STT_BACKEND_URL, files=files))
    
    if text:
        data = {"text": text}
        if person_id:
            data["person_id"] = person_id
        tasks.append(session.post(CHAT_BACKEND_URL, json=data))
    
    # Survey is assumed to not require input
    tasks.append(session.post(SURVEY_BACKEND_URL))
    
    # Execute all requests concurrently
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Process responses
    for i, resp in enumerate(responses):
        if isinstance(resp, Exception):
            logger.error(f"Error in request {i}: {str(resp)}")
            continue
            
        try:
            data = await resp.json()
            if i == 0 and file:
                results["video"] = data
            elif i == 1 and audio_file:
                results["speech"] = data
            elif i == 2 and text:
                results["chat"] = data
            elif i == 3:
                results["survey"] = data
        except Exception as e:
            logger.error(f"Error processing response {i}: {str(e)}")
    
    return results

# Debug endpoint to echo payload
@app.post("/debug/echo")
async def debug_echo(request: Request):
    body = await request.body()
    try:
        json_body = await request.json()
    except Exception:
        json_body = None
    return {"raw_body": body.decode(), "json_body": json_body}

@app.get("/dashboard-stats")
async def dashboard_stats():
    # In a real app, fetch these from a database or analytics service
    import random
    today = datetime.now()
    trend = []
    for i in range(7):
        day = today - timedelta(days=6-i)
        trend.append({
            "date": day.strftime("%b %d"),
            "stress": random.randint(60, 80)
        })
    return {
        "work_hours": 8,
        "meeting_load": 0,
        "stress_score": random.randint(0, 100),
        "work_life_balance": 100,
        "stress_trend": trend
    } 