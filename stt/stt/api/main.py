from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import speech_recognition as sr
import tempfile
import os
from textblob import TextBlob
import soundfile as sf
import json
from vosk import Model, KaldiRecognizer
import wave
import subprocess
import time
from transformers import pipeline
import numpy as np
import torch
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS with more explicit settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Explicitly list allowed methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"],  # Expose all headers
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Initialize Vosk model
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "vosk-model-small-en-us-0.15")
if not os.path.exists(MODEL_PATH):
    raise Exception(f"Vosk model not found at {MODEL_PATH}")
model = Model(MODEL_PATH)

# Initialize models with explicit device and NumPy check
logger.info("Loading sentiment and emotion models...")
try:
    # Verify NumPy is available
    logger.info(f"NumPy version: {np.__version__}")
    
    # Initialize models with explicit device
    device = 0 if torch.cuda.is_available() else -1
    sentiment_model = pipeline(
        "sentiment-analysis",
        model="distilbert-base-uncased-finetuned-sst-2-english",
        device=device
    )
    emotion_model = pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
        device=device
    )
    logger.info("All models loaded successfully")
except Exception as e:
    logger.error(f"Error initializing models: {str(e)}")
    raise

def convert_webm_to_wav(input_path, output_path):
    try:
        # Use ffmpeg to convert WebM to WAV
        command = [
            'ffmpeg', '-i', input_path,
            '-acodec', 'pcm_s16le',  # 16-bit PCM
            '-ac', '1',              # mono
            '-ar', '16000',          # 16kHz sample rate
            '-y',                    # overwrite output file if exists
            output_path
        ]
        subprocess.run(command, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Error converting audio: {e.stderr.decode()}")
        return False
    except Exception as e:
        logger.error(f"Error in conversion: {str(e)}")
        return False

def transcribe_with_google(audio_file):
    """Attempt to transcribe using Google Speech Recognition"""
    try:
        recognizer = sr.Recognizer()
        with sr.AudioFile(audio_file) as source:
            audio = recognizer.record(source)
            text = recognizer.recognize_google(audio)
            logger.info("Successfully transcribed with Google Speech Recognition")
            return text
    except sr.UnknownValueError:
        logger.info("Google Speech Recognition could not understand audio")
        return None
    except sr.RequestError as e:
        logger.info(f"Could not request results from Google Speech Recognition; {e}")
        return None
    except Exception as e:
        logger.error(f"Error in Google transcription: {str(e)}")
        return None

def transcribe_with_vosk(audio_file):
    """Transcribe using Vosk as fallback"""
    try:
        wf = wave.open(audio_file, "rb")
        recognizer = KaldiRecognizer(model, wf.getframerate())
        recognizer.SetWords(True)
        
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if recognizer.AcceptWaveform(data):
                pass
        
        result = json.loads(recognizer.FinalResult())
        text = result.get("text", "")
        wf.close()
        
        if text:
            logger.info("Successfully transcribed with Vosk")
            return text
        else:
            logger.info("Vosk could not understand audio")
            return None
            
    except Exception as e:
        logger.error(f"Error in Vosk transcription: {str(e)}")
        return None

def transcribe_audio(audio_file):
    """Main transcription function that tries Google first, then falls back to Vosk"""
    logger.info("Starting transcription process...")
    
    # Try Google Speech Recognition first
    text = transcribe_with_google(audio_file)
    
    # If Google fails, try Vosk
    if text is None:
        logger.info("Falling back to Vosk...")
        text = transcribe_with_vosk(audio_file)
    
    return text if text is not None else ""

@app.post("/analyze-speech")
async def analyze_speech(audio_file: UploadFile = File(...)):
    temp_audio_path = None
    wav_path = None
    wf = None
    
    try:
        logger.info(f"Received audio file: {audio_file.filename}")
        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            content = await audio_file.read()
            temp_audio.write(content)
            temp_audio_path = temp_audio.name

        # Convert WebM to WAV
        wav_path = temp_audio_path.replace('.webm', '.wav')
        if not convert_webm_to_wav(temp_audio_path, wav_path):
            return {"error": "Failed to convert audio format"}

        # Step 1: Transcribe
        text = transcribe_audio(wav_path)
        if not text:
            return {
                "text": "",
                "sentiment": "N/A",
                "emotion": "N/A",
                "error": "No text was transcribed."
            }

        # Step 2: Analyze sentiment and emotion
        sentiment_label = "N/A"
        sentiment_score = 0.0
        emotion_label = "N/A"
        emotion_score = 0.0
        try:
            sentiment_result = sentiment_model(text)
            if sentiment_result and isinstance(sentiment_result, list) and len(sentiment_result) > 0:
                sentiment_label = sentiment_result[0].get('label', 'N/A')
                sentiment_score = float(sentiment_result[0].get('score', 0.0))
        except Exception as e:
            logger.error(f"Sentiment model error: {str(e)}")
        try:
            emotion_result = emotion_model(text)
            if emotion_result and isinstance(emotion_result, list) and len(emotion_result) > 0:
                emotion_label = emotion_result[0].get('label', 'N/A')
                emotion_score = float(emotion_result[0].get('score', 0.0))
        except Exception as e:
            logger.error(f"Emotion model error: {str(e)}")
        logger.info(f"Transcribed text: {text}")
        logger.info(f"Sentiment: {sentiment_label} (Confidence: {sentiment_score:.2f})")
        logger.info(f"Emotion: {emotion_label} (Confidence: {emotion_score:.2f})")
        return {
            "text": text,
            "sentiment": sentiment_label,
            "sentiment_score": sentiment_score,
            "emotion": emotion_label,
            "emotion_score": emotion_score
        }

    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        return {"error": str(e)}
    
    finally:
        # Clean up resources
        if wf:
            wf.close()
        
        # Add a small delay before deleting files
        time.sleep(0.1)
        
        # Clean up temporary files
        try:
            if temp_audio_path and os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)
            if wav_path and os.path.exists(wav_path):
                os.unlink(wav_path)
        except Exception as e:
            logger.error(f"Error cleaning up temporary files: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 