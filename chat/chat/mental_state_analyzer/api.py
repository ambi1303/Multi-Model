from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os
from src.emotion_detector import EmotionDetector
from src.visualizer import Visualizer
from starlette.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Mental State Analyzer API",
    description="API for analyzing mental states from chat messages",
    version="1.0.0"
)

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

# Initialize components
emotion_detector = EmotionDetector()
visualizer = Visualizer()

# Create output directory if it doesn't exist
os.makedirs('outputs', exist_ok=True)

class Message(BaseModel):
    text: str
    person_id: Optional[str] = "user_api"

class MessageResponse(BaseModel):
    timestamp: str
    text: str
    person_id: str
    sentiment_score: float
    primary_emotion: str
    emotion_score: float
    mental_state: str

class AnalysisResponse(BaseModel):
    analyzed_messages: List[MessageResponse]
    summary: dict

def format_timestamp(dt):
    """Format timestamp to human-readable format."""
    if isinstance(dt, datetime):
        return dt.strftime("%B %d, %Y at %I:%M %p")
    elif isinstance(dt, str):
        try:
            # Try to parse the string as datetime and convert to readable format
            parsed_dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
            return parsed_dt.strftime("%B %d, %Y at %I:%M %p")
        except ValueError:
            # If parsing fails, return the original string
            return dt
    return str(dt)

def format_percentage(value):
    """Format decimal values as percentages."""
    if isinstance(value, (int, float)):
        return f"{value * 100:.0f}%"
    return value

@app.post("/analyze/single", response_model=MessageResponse)
async def analyze_single_message(message: Message):
    """Analyze a single message and return the results."""
    try:
        # Create message dict with current timestamp
        current_time = datetime.now()
        msg_dict = {
            'timestamp': current_time,
            'text': message.text,
            'person_id': message.person_id
        }
        
        # Analyze message
        analyzed = emotion_detector.analyze_messages([msg_dict])[0]
        # Format timestamp
        analyzed['timestamp'] = format_timestamp(analyzed['timestamp'])
        return analyzed
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/multiple", response_model=AnalysisResponse)
async def analyze_multiple_messages(messages: List[Message]):
    """Analyze multiple messages and return the results with visualizations."""
    try:
        # Process messages with current timestamps
        processed_messages = []
        for msg in messages:
            processed_messages.append({
                'timestamp': datetime.now(),
                'text': msg.text,
                'person_id': msg.person_id
            })
        
        # Analyze messages
        analyzed_messages = emotion_detector.analyze_messages(processed_messages)
        
        # Format all timestamps
        for msg in analyzed_messages:
            msg['timestamp'] = format_timestamp(msg['timestamp'])
        
        # Create a copy of analyzed messages for visualization
        viz_messages = analyzed_messages.copy()
        
        # Generate visualizations
        visualizer.plot_mental_states(viz_messages, 'outputs/mental_states.png')
        visualizer.plot_sentiment_trend(viz_messages, 'outputs/sentiment_trend.png')
        
        # Generate summary
        summary = visualizer.generate_summary(viz_messages)
        
        # Save results
        results = {
            'analyzed_messages': analyzed_messages,
            'summary': summary
        }
        
        with open('outputs/api_results.json', 'w') as f:
            json.dump(results, f, indent=2, default=format_timestamp)
        
        return AnalysisResponse(
            analyzed_messages=analyzed_messages,
            summary=summary
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/visualizations/mental-states")
async def get_mental_states_visualization():
    """Get the mental states distribution visualization."""
    try:
        return FileResponse('outputs/mental_states.png')
    except Exception as e:
        raise HTTPException(status_code=404, detail="Visualization not found")

@app.get("/visualizations/sentiment-trend")
async def get_sentiment_trend_visualization():
    """Get the sentiment trend visualization."""
    try:
        return FileResponse('outputs/sentiment_trend.png')
    except Exception as e:
        raise HTTPException(status_code=404, detail="Visualization not found")

@app.get("/results/latest")
async def get_latest_results():
    """Get the latest analysis results."""
    try:
        with open('outputs/api_results.json', 'r') as f:
            results = json.load(f)
        return results
    except Exception as e:
        raise HTTPException(status_code=404, detail="Results not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 