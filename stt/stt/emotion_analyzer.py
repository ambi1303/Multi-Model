import os
import sounddevice as sd
import numpy as np
import json
import logging
import speech_recognition as sr
from transformers import pipeline
from vosk import Model, KaldiRecognizer
import wave
import pyaudio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SAMPLE_RATE = 16000
CHANNELS = 1
CHUNK_SIZE = 8000

def record_audio(duration=10):
    logger.info("Recording audio for %d seconds...", duration)
    
    # Initialize PyAudio
    p = pyaudio.PyAudio()
    stream = p.open(format=pyaudio.paInt16,
                   channels=CHANNELS,
                   rate=SAMPLE_RATE,
                   input=True,
                   frames_per_buffer=CHUNK_SIZE)
    
    logger.info("Speak now...")
    frames = []
    
    # Record audio
    for i in range(0, int(SAMPLE_RATE / CHUNK_SIZE * duration)):
        data = stream.read(CHUNK_SIZE)
        frames.append(data)
    
    logger.info("Recording complete")
    
    # Stop and close the stream
    stream.stop_stream()
    stream.close()
    p.terminate()
    
    # Save to temporary WAV file
    temp_file = "temp_recording.wav"
    wf = wave.open(temp_file, 'wb')
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(pyaudio.paInt16))
    wf.setframerate(SAMPLE_RATE)
    wf.writeframes(b''.join(frames))
    wf.close()
    
    return temp_file

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
        # Initialize Vosk model
        model = Model("vosk-model-small-en-us-0.15")
        wf = wave.open(audio_file, "rb")
        
        # Create recognizer
        rec = KaldiRecognizer(model, wf.getframerate())
        rec.SetWords(True)
        
        # Read audio data
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                pass
        
        # Get final result
        result = json.loads(rec.FinalResult())
        text = result.get("text", "")
        
        # Clean up
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
    
    # Clean up the temporary file
    try:
        os.remove(audio_file)
    except Exception as e:
        logger.error(f"Error removing temporary file: {str(e)}")
    
    return text if text is not None else ""

def main():
    # Step 1: Load models
    logger.info("Loading sentiment and emotion models...")
    sentiment_model = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
    emotion_model = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")
    logger.info("All models loaded successfully")

    while True:
        input("\nPress Enter to start recording (10 seconds) or Ctrl+C to exit...")
        try:
            # Step 2: Record audio
            audio_file = record_audio(duration=10)

            # Step 3: Transcribe
            text = transcribe_audio(audio_file)

            # Step 4: Analyze
            if text:
                sentiment = sentiment_model(text)[0]
                emotion = emotion_model(text)[0]
                print(f"\n🎤 Transcribed Text: {text}")
                print(f"🧠 Sentiment: {sentiment['label']} (Confidence: {sentiment['score']:.2f})")
                print(f"💬 Emotion: {emotion['label']} (Confidence: {emotion['score']:.2f})")
            else:
                print("⚠️ No speech recognized. Try speaking louder or closer to the microphone.")
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            print("An error occurred. Try again or press Ctrl+C to exit.")

if __name__ == "__main__":
    main()
