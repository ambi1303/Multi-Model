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
        print(f"Error converting audio: {e.stderr.decode()}")
        return False
    except Exception as e:
        print(f"Error in conversion: {str(e)}")
        return False

@app.get("/")
async def read_root():
    return {"message": "Speech-to-Text API is running"}

@app.post("/analyze-speech")
async def analyze_speech(audio_file: UploadFile = File(...)):
    temp_audio_path = None
    wav_path = None
    wf = None
    
    try:
        print(f"Received audio file: {audio_file.filename}")
        # Save the uploaded file temporarily
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
            print("Audio file must be WAV format mono PCM.")
            return {"error": "Audio file must be WAV format mono PCM."}

        recognizer = KaldiRecognizer(model, wf.getframerate())
        recognizer.SetWords(True)

        # Read audio data
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if recognizer.AcceptWaveform(data):
                pass

        # Get final result
        result = json.loads(recognizer.FinalResult())
        transcribed_text = result.get("text", "")
        print(f"Transcribed text: {transcribed_text}")

        if not transcribed_text:
            print("No text was transcribed.")
            return {"text": "", "sentiment": "N/A", "confidence": 0.0, "error": "No text was transcribed."}

        # Analyze sentiment using TextBlob
        analysis = TextBlob(transcribed_text)
        sentiment_score = analysis.sentiment.polarity
        
        # Convert sentiment score to label
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
        print(f"Error processing audio: {str(e)}")
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
            print(f"Error cleaning up temporary files: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 