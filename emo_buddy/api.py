# NOTE: This file must be run as a module: python -m emo_buddy.api from the project root.
# Do NOT run as python api.py or with direct script execution.

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import uuid
from datetime import datetime
from dotenv import load_dotenv
from emo_buddy.emo_buddy_agent import EmoBuddyAgent
import os

# Explicitly load .env from the emo_buddy directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI(title="Emo Buddy Standalone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store
sessions: Dict[str, EmoBuddyAgent] = {}

class StartSessionRequest(BaseModel):
    user_message: str

class ContinueSessionRequest(BaseModel):
    session_id: str
    user_message: str

class EndSessionRequest(BaseModel):
    session_id: str

@app.get("/health")
def health():
    return {"status": "ok", "service": "emo_buddy", "version": "1.0.0"}

def create_simulated_analysis(message: str) -> Dict[str, Any]:
    # (Logic adapted from standalone_chat.py)
    emotion_keywords = {
        'sadness': ['sad', 'low', 'down', 'depressed', 'unhappy', 'disappointed', 'deflated'],
        'stress': ['stressed', 'overwhelmed', 'pressure', 'tense', 'burden', 'strain'],
        'anxiety': ['anxious', 'worried', 'nervous', 'panic', 'fearful', 'concerned'],
        'exhaustion': ['tired', 'exhausted', 'drained', 'burnt out', 'weary', 'fatigued'],
        'frustration': ['frustrated', 'annoyed', 'irritated', 'angry', 'mad', 'upset'],
        'demotivation': ["unmotivated", "don't feel like", "no energy", "can't", "won't"],
        'joy': ['happy', 'good', 'great', 'wonderful', 'excited', 'amazing', 'love'],
        'confidence': ['confident', 'capable', 'strong', 'ready', 'motivated', 'determined']
    }
    workplace_indicators = ['manager', 'boss', 'work', 'job', 'office', 'meeting', 'project', 'deadline', 'client', 'scolded', 'feedback', 'coding', 'analysis', 'overtime', 'hours']
    message_lower = message.lower()
    detected_emotions = []
    for emotion, keywords in emotion_keywords.items():
        matches = sum(1 for keyword in keywords if keyword in message_lower)
        if matches > 0:
            confidence = min(0.3 + (matches * 0.2), 0.9)
            detected_emotions.append({"emotion": emotion, "confidence": confidence, "matches": matches})
    detected_emotions.sort(key=lambda x: x['confidence'], reverse=True)
    negative_emotions = ['sadness', 'stress', 'anxiety', 'exhaustion', 'frustration', 'demotivation']
    positive_emotions = ['joy', 'confidence']
    if detected_emotions:
        primary_emotion = detected_emotions[0]['emotion']
        if primary_emotion in negative_emotions:
            sentiment_label = "NEGATIVE"
            sentiment_confidence = detected_emotions[0]['confidence']
        elif primary_emotion in positive_emotions:
            sentiment_label = "POSITIVE"
            sentiment_confidence = detected_emotions[0]['confidence']
        else:
            sentiment_label = "NEUTRAL"
            sentiment_confidence = 0.6
    else:
        sentiment_label = "NEUTRAL"
        sentiment_confidence = 0.5
        primary_emotion = "neutral"
        detected_emotions = [{"emotion": "neutral", "confidence": 0.5, "matches": 0}]
    workplace_present = any(indicator in message_lower for indicator in workplace_indicators)
    if workplace_present:
        sentiment_confidence = min(sentiment_confidence + 0.2, 0.95)
    final_emotions = []
    for i, emotion_data in enumerate(detected_emotions[:3]):
        if i == 0:
            final_emotions.append({
                "emotion": emotion_data['emotion'],
                "confidence": emotion_data['confidence']
            })
        else:
            final_emotions.append({
                "emotion": emotion_data['emotion'],
                "confidence": max(emotion_data['confidence'] - 0.2, 0.1)
            })
    while len(final_emotions) < 3:
        final_emotions.append({"emotion": "neutral", "confidence": 0.1})
    if sentiment_confidence >= 0.8:
        intensity = "high"
    elif sentiment_confidence >= 0.6:
        intensity = "moderate"
    else:
        intensity = "low"
    return {
        "transcription": message,
        "sentiment": {
            "label": sentiment_label,
            "confidence": sentiment_confidence,
            "intensity": intensity
        },
        "emotions": final_emotions,
        "source": "standalone_chat",
        "timestamp": datetime.now().isoformat(),
        "workplace_context": workplace_present
    }

@app.post("/start-session")
def start_session(req: StartSessionRequest):
    try:
        analysis = create_simulated_analysis(req.user_message)
        agent = EmoBuddyAgent()
        bot_response = agent.start_session(analysis)
        session_id = str(uuid.uuid4())
        sessions[session_id] = agent
        return {"session_id": session_id, "response": bot_response, "status": "started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start session: {e}")

@app.post("/continue-session")
def continue_session(req: ContinueSessionRequest):
    agent = sessions.get(req.session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found")
    try:
        response, should_continue = agent.continue_conversation(req.user_message)
        return {"session_id": req.session_id, "response": response, "should_continue": should_continue, "status": "active"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to continue session: {e}")

@app.post("/end-session")
def end_session(req: EndSessionRequest):
    agent = sessions.pop(req.session_id, None)
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found")
    try:
        summary = agent.end_session()
        return {"session_id": req.session_id, "summary": summary, "status": "ended"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end session: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("emo_buddy.api:app", host="0.0.0.0", port=8005, reload=True) 