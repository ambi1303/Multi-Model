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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
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
    """Format timestamp to ISO format string."""
    if isinstance(dt, datetime):
        return dt.isoformat()
    elif isinstance(dt, str):
        try:
            # Try to parse the string as datetime and convert to ISO format
            return datetime.fromisoformat(dt).isoformat()
        except ValueError:
            # If parsing fails, return the original string
            return dt
    return str(dt)

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