from fastapi import FastAPI, File, UploadFile, Form, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import requests
import logging
from pydantic import BaseModel, Field
from typing import Literal
import pandas as pd
import pickle
import os
from datetime import datetime
import tempfile
import subprocess
import wave
from vosk import Model, KaldiRecognizer
from textblob import TextBlob
import json
import aiohttp
from aiohttp import ClientSession
import asyncio
from functools import lru_cache
from cachetools import TTLCache, cached

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
@cached(cache)
async def analyze_video(file: UploadFile = File(...)):
    files = {"file": (file.filename, await file.read(), file.content_type)}
    async with session.post(VIDEO_BACKEND_URL, files=files) as resp:
        try:
            data = await resp.json()
        except Exception as e:
            logger.error(f"Error decoding JSON from video backend: {e}")
            data = {"error": "Invalid JSON from video backend"}
        logger.info(f"Video backend response: {data}")
        return JSONResponse(content=data, status_code=resp.status)

@app.post("/analyze-speech")
async def analyze_speech(audio_file: UploadFile = File(...)):
    temp_audio_path = None
    wav_path = None
    wf = None
    try:
        # Save uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            content = await audio_file.read()
            temp_audio.write(content)
            temp_audio_path = temp_audio.name
        # Convert WebM to WAV
        wav_path = temp_audio_path.replace('.webm', '.wav')
        if not convert_webm_to_wav(temp_audio_path, wav_path):
            return {"error": "Failed to convert audio format"}
        # Process audio with Vosk
        wf = wave.open(wav_path, "rb")
        if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
            return {"error": "Audio file must be WAV format mono PCM."}
        if vosk_model is None:
            return {"error": "Vosk model not loaded on server."}
        recognizer = KaldiRecognizer(vosk_model, wf.getframerate())
        recognizer.SetWords(True)
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            recognizer.AcceptWaveform(data)
        result = json.loads(recognizer.FinalResult())
        transcribed_text = result.get("text", "")
        if not transcribed_text:
            return {"text": "", "sentiment": "N/A", "confidence": 0.0, "error": "No text was transcribed."}
        # Sentiment analysis
        analysis = TextBlob(transcribed_text)
        sentiment_score = analysis.sentiment.polarity
        if sentiment_score > 0:
            sentiment = "POSITIVE"
        elif sentiment_score < 0:
            sentiment = "NEGATIVE"
        else:
            sentiment = "NEUTRAL"
        return {
            "text": transcribed_text,
            "sentiment": sentiment,
            "confidence": abs(sentiment_score)
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        if wf:
            wf.close()
        try:
            if temp_audio_path and os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)
            if wav_path and os.path.exists(wav_path):
                os.unlink(wav_path)
        except Exception as e:
            print(f"Error cleaning up temporary files: {str(e)}")

@app.post("/analyze-chat")
@cached(cache)
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
@cached(cache)
async def analyze_survey():
    async with session.post(SURVEY_BACKEND_URL) as resp:
        return JSONResponse(content=await resp.json(), status_code=resp.status)

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

@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(employee: EmployeeData):
    """
    Predict burnout rate for an employee using the trained model.
    """
    try:
        # Convert input to DataFrame
        input_data = {
            'Designation': employee.Designation,
            'Resource Allocation': employee.Resource_Allocation,
            'Mental Fatigue Score': employee.Mental_Fatigue_Score,
            'Company Type': employee.Company_Type,
            'WFH Setup Available': employee.WFH_Setup_Available,
            'Gender': employee.Gender
        }
        input_df = pd.DataFrame([input_data])

        # One-hot encode categorical columns
        input_df = pd.get_dummies(input_df, columns=['Company Type', 'WFH Setup Available', 'Gender'], drop_first=True)

        # Ensure the input has the same columns as the model was trained on
        trained_features = ['Designation', 'Resource Allocation', 'Mental Fatigue Score', 
                          'Company Type_Service', 'WFH Setup Available_Yes', 'Gender_Male']
        for col in trained_features:
            if col not in input_df.columns:
                input_df[col] = 0
        input_df = input_df[trained_features]

        # Load scaler and model
        model_dir = os.path.join(os.path.dirname(__file__), 'models')
        scaler_path = os.path.join(model_dir, 'scaler.pkl')
        model_path = os.path.join(model_dir, 'linear_regression.pkl')
        if not os.path.exists(scaler_path) or not os.path.exists(model_path):
            return JSONResponse(content={"error": "Models not trained yet. Please add scaler.pkl and linear_regression.pkl to the models directory."}, status_code=400)

        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
        with open(model_path, 'rb') as f:
            model = pickle.load(f)

        # Scale the input
        input_scaled = scaler.transform(input_df)

        # Predict
        prediction = model.predict(input_scaled)[0]

        # Determine stress level based on burn rate
        if prediction < 0.3:
            stress_level = "Low Stress"
        elif prediction < 0.5:
            stress_level = "Medium Stress"
        elif prediction < 0.7:
            stress_level = "High Stress"
        else:
            stress_level = "Very High Stress"

        response = {
            "burn_rate": prediction,
            "stress_level": stress_level,
            "model_used": "Linear Regression",
            "prediction_time": datetime.now().isoformat()
        }
        return response

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500) 