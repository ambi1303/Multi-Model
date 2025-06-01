from fastapi import FastAPI, File, UploadFile, Form, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import requests
import logging

app = FastAPI()

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

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.post("/analyze-video")
async def analyze_video(file: UploadFile = File(...)):
    files = {"file": (file.filename, await file.read(), file.content_type)}
    resp = requests.post(VIDEO_BACKEND_URL, files=files)
    try:
        data = resp.json()
    except Exception as e:
        logger.error(f"Error decoding JSON from video backend: {e}")
        data = {"error": "Invalid JSON from video backend"}
    logger.info(f"Video backend response: {data}")
    return JSONResponse(content=data, status_code=resp.status_code)

@app.post("/analyze-speech")
async def analyze_speech(audio_file: UploadFile = File(...)):
    files = {"audio_file": (audio_file.filename, await audio_file.read(), audio_file.content_type)}
    resp = requests.post(STT_BACKEND_URL, files=files)
    return JSONResponse(content=resp.json(), status_code=resp.status_code)

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
    resp = requests.post(CHAT_BACKEND_URL, json=chat_payload, headers=headers)
    logger.info(f"Chat backend response: {resp.status_code} {resp.text}")
    return JSONResponse(content=resp.json(), status_code=resp.status_code)

@app.post("/analyze-survey")
async def analyze_survey():
    resp = requests.post(SURVEY_BACKEND_URL)
    return JSONResponse(content=resp.json(), status_code=resp.status_code)

@app.post("/analyze-all")
async def analyze_all(file: UploadFile = File(None), audio_file: UploadFile = File(None), text: str = Form(None), person_id: str = Form(None)):
    results = {}
    if file:
        files = {"file": (file.filename, await file.read(), file.content_type)}
        resp = requests.post(VIDEO_BACKEND_URL, files=files)
        results["video"] = resp.json()
    if audio_file:
        files = {"audio_file": (audio_file.filename, await audio_file.read(), audio_file.content_type)}
        resp = requests.post(STT_BACKEND_URL, files=files)
        results["speech"] = resp.json()
    if text:
        data = {"text": text}
        if person_id:
            data["person_id"] = person_id
        resp = requests.post(CHAT_BACKEND_URL, json=data)
        results["chat"] = resp.json()
    # Survey is assumed to not require input
    resp = requests.post(SURVEY_BACKEND_URL)
    results["survey"] = resp.json()
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