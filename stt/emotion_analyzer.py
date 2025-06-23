import os
import sounddevice as sd
import numpy as np
import json
import logging
import speech_recognition as sr
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from vosk import Model, KaldiRecognizer
import wave
import pyaudio
from textblob import TextBlob
from collections import Counter
import re
import torch
from groq import Groq

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SAMPLE_RATE = 16000
CHANNELS = 1
CHUNK_SIZE = 8000

# Create a dictionary to hold the models
models = {}

def load_models():
    """Load all models and store them in the global models dictionary."""
    if models:
        logger.info("Models already loaded.")
        return

    logger.info("Loading sentiment and emotion models...")
    # Initialize sentiment model
    models['sentiment_tokenizer'] = AutoTokenizer.from_pretrained("cardiffnlp/twitter-roberta-base-sentiment")
    models['sentiment_model'] = AutoModelForSequenceClassification.from_pretrained("cardiffnlp/twitter-roberta-base-sentiment")

    # Initialize emotion model
    models['emotion_tokenizer'] = AutoTokenizer.from_pretrained("SamLowe/roberta-base-go_emotions")
    models['emotion_model'] = AutoModelForSequenceClassification.from_pretrained("SamLowe/roberta-base-go_emotions")

    # Initialize Vosk model
    vosk_model_path = "../vosk-model-small-en-us-0.15"
    if not os.path.exists(vosk_model_path):
        vosk_model_path = "vosk-model-small-en-us-0.15" # Fallback for different CWD
    models['vosk_model'] = Model(vosk_model_path)

    logger.info("All models loaded successfully")

def get_sentiment(text):
    """Get detailed sentiment analysis using RoBERTa"""
    sentiment_tokenizer = models['sentiment_tokenizer']
    sentiment_model = models['sentiment_model']
    inputs = sentiment_tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    outputs = sentiment_model(**inputs)
    scores = torch.nn.functional.softmax(outputs.logits, dim=1)
    
    # Get the label and score
    label_map = {0: "negative", 1: "neutral", 2: "positive"}
    scores = scores[0].tolist()
    max_score = max(scores)
    label = label_map[scores.index(max_score)]
    
    return {
        "label": label,
        "confidence": max_score,
        "scores": {
            "negative": scores[0],
            "neutral": scores[1],
            "positive": scores[2]
        }
    }

def get_emotions(text):
    """Get detailed emotion analysis using RoBERTa"""
    emotion_tokenizer = models['emotion_tokenizer']
    emotion_model = models['emotion_model']
    inputs = emotion_tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    outputs = emotion_model(**inputs)
    scores = torch.nn.functional.sigmoid(outputs.logits)
    
    # Get emotion labels
    emotion_labels = emotion_model.config.id2label
    
    # Get top emotions with scores
    scores = scores[0].tolist()
    emotion_scores = [(emotion_labels[i], score) for i, score in enumerate(scores)]
    emotion_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Return top 3 emotions with scores
    return [{"emotion": emotion, "confidence": score} for emotion, score in emotion_scores[:3]]

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
        model = models['vosk_model']
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

def analyze_text(text):
    """Perform detailed text analysis"""
    sentiment = get_sentiment(text)
    emotions = get_emotions(text)
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    intensity = "Moderate"
    if abs(polarity) > 0.7:
        intensity = "Strong"
    elif abs(polarity) < 0.3:
        intensity = "Mild"
    
    analysis = {
        "transcription": text,
        "sentiment": {
            "label": sentiment["label"],
            "confidence": sentiment["confidence"],
            "scores": sentiment["scores"],
            "polarity": polarity,
            "subjectivity": subjectivity,
            "intensity": intensity
        },
        "emotions": emotions,
    }
    return analysis

def get_gen_ai_insights(analysis_report):
    """
    Gets wellness advice and a simplified report from a Groq LLM.
    """
    try:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            return "Error: GROQ_API_KEY environment variable not set. Cannot provide AI insights."

        client = Groq(api_key=api_key)
        
        # Prepare the data for the prompt
        text = analysis_report["transcription"]
        sentiment_label = analysis_report["sentiment"]["label"]
        sentiment_conf = analysis_report["sentiment"]["confidence"]
        prominent_emotion = analysis_report["emotions"][0]["emotion"]
        emotion_conf = analysis_report["emotions"][0]["confidence"]

        # Construct the prompt
        prompt = f"""
        **System Prompt:**
        You are a compassionate and empathetic wellness assistant. Your role is to analyze a person's statement and a technical emotional analysis report to provide a simple, easy-to-understand summary and gentle, actionable wellness advice. You should be supportive and encouraging. Do not give medical advice, but you can suggest seeking professional help. Frame your advice as suggestions, not commands.

        **User Data:**
        - **The user said:** \"{text}\"
        - **Technical Analysis:** The user is expressing a '{sentiment_label.upper()}' sentiment with '{prominent_emotion.upper()}' as the most prominent emotion.

        **Your Task:**
        Based on this information, please provide the following in a clear, formatted response:
        1.  **A Simple Summary:** Briefly explain what the analysis suggests about the person's current emotional state in 1-2 sentences. Make it very easy to understand.
        2.  **Wellness Tips:** Offer 3-4 gentle, actionable wellness suggestions tailored to the detected emotions. For example, if sadness is high, you might suggest listening to uplifting music or talking to a friend. If stress is detected, suggest a short meditation. Always include a gentle suggestion to consider talking to a mental health professional if these feelings persist.
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama3-8b-8192", # Or "llama3-70b-8192" for a more powerful model
        )
        return chat_completion.choices[0].message.content

    except Exception as e:
        logger.error(f"Error getting AI insights: {e}")
        return f"An error occurred while generating AI insights: {e}"

def print_full_report(analysis, gen_ai_insights):
    """Print the complete analysis including GenAI insights."""
    print("\n" + "="*50)
    print("🎤 TECHNICAL ANALYSIS REPORT")
    print("="*50)
    
    print(f"\n📝 Transcribed Text: {analysis['transcription']}")
    
    print("\n🧠 SENTIMENT ANALYSIS")
    print("-"*30)
    print(f"• Overall Sentiment: {analysis['sentiment']['label'].upper()}")
    print(f"• Confidence: {analysis['sentiment']['confidence']:.2f}")
    
    prominent_emotion = analysis['emotions'][0]
    print(f"\n💫 PROMINENT EMOTION: {prominent_emotion['emotion'].upper()} ({prominent_emotion['confidence']:.2f})")
    
    print("\n" + "="*50)
    print("🌿 WELLNESS ADVISOR (POWERED BY LLAMA 3)")
    print("="*50)
    print(gen_ai_insights)
    print("\n" + "="*50)

def main():
    while True:
        input("\nPress Enter to start recording (10 seconds) or Ctrl+C to exit...")
        try:
            audio_file = record_audio(duration=10)
            text = transcribe_audio(audio_file)

            if text:
                # Step 1: Perform technical analysis
                analysis = analyze_text(text)
                
                # Step 2: Get insights from Generative AI
                logger.info("Generating AI wellness advice...")
                gen_ai_insights = get_gen_ai_insights(analysis)
                
                # Step 3: Print the combined report
                print_full_report(analysis, gen_ai_insights)
            else:
                print("⚠️ No speech recognized. Try speaking louder or closer to the microphone.")
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            logger.error(f"Error in main loop: {str(e)}")
            print("An error occurred. Try again or press Ctrl+C to exit.")

if __name__ == "__main__":
    main()
