import sys
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import numpy as np
import ffmpeg
from emotion_analyzer import analyze_text, get_gen_ai_insights, transcribe_audio, load_models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the ML models
    logger.info("Application startup: Loading models...")
    load_models()
    logger.info("Application startup: Models loaded successfully.")
    yield
    # Clean up the models and release the resources
    logger.info("Application shutdown: Cleaning up...")


app = FastAPI(lifespan=lifespan)

# CORS Middleware
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "STT Analysis Backend is running"}


@app.post("/analyze-speech")
async def analyze_speech(audio_file: UploadFile = File(...)):
    import tempfile
    import shutil
    logger.info(f"Received audio file: {audio_file.filename}")
    
    temp_webm_path = None
    temp_wav_path = None
    try:
        # 1. Save the uploaded WebM file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_webm:
            shutil.copyfileobj(audio_file.file, temp_webm)
            temp_webm_path = temp_webm.name
        
        # 2. Convert WebM to WAV using ffmpeg
        temp_wav_path = temp_webm_path + ".wav"
        logger.info(f"Converting {temp_webm_path} to {temp_wav_path}...")
        try:
            (
                ffmpeg
                .input(temp_webm_path)
                .output(temp_wav_path, acodec='pcm_s16le', ac=1, ar='16000')
                .run(capture_stdout=True, capture_stderr=True, overwrite_output=True)
            )
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg conversion error: {e.stderr.decode()}")
            raise HTTPException(status_code=500, detail="Failed to convert audio file.")

        logger.info(f"Audio file converted and saved to {temp_wav_path}")

        # 3. Transcribe the converted WAV file
        transcription = transcribe_audio(temp_wav_path)

        if not transcription:
            raise HTTPException(status_code=400, detail="Could not transcribe audio. Speech may be unclear or silent.")

        analysis_report = analyze_text(transcription)
        
        logger.info("Generating AI insights...")
        gen_ai_insights = get_gen_ai_insights(analysis_report)
        
        # Build a more detailed and formatted technical report string
        s = analysis_report['sentiment']
        e = analysis_report['emotions']

        technical_report_str = (
            f"TRANSCRIPTION\n"
            f"------------------------------------\n"
            f"{analysis_report['transcription']}\n\n"
            f"SENTIMENT\n"
            f"------------------------------------\n"
            f"  - Label: {s['label'].capitalize()}\n"
            f"  - Confidence: {s['confidence']:.2f}\n"
            f"  - Polarity: {s['polarity']:.2f} (Negative < 0 < Positive)\n"
            f"  - Subjectivity: {s['subjectivity']:.2f} (Objective < 0.5 < Subjective)\n"
            f"  - Intensity: {s['intensity']}\n\n"
            f"TOP EMOTIONS\n"
            f"------------------------------------\n"
            + "\n".join([f"  - {emo['emotion'].capitalize()}: {emo['confidence']:.2f}" for emo in e])
        )

        return {
            "transcription": analysis_report["transcription"],
            "sentiment": analysis_report["sentiment"],
            "emotions": analysis_report["emotions"],
            "genAIInsights": gen_ai_insights,
            "technicalReport": technical_report_str
        }

    except Exception as e:
        logger.error(f"Error during speech analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # 4. Clean up both temporary files
        if temp_webm_path and os.path.exists(temp_webm_path):
            os.remove(temp_webm_path)
            logger.info(f"Cleaned up temporary file: {temp_webm_path}")
        if temp_wav_path and os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)
            logger.info(f"Cleaned up temporary file: {temp_wav_path}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 