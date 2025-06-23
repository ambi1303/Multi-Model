from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os
import tempfile
import base64
from src.emotion_detector import EmotionDetector
from src.data_loader import DataLoader
from src.visualizer import Visualizer
from starlette.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Mental State Analyzer API",
    description="API for analyzing mental states from chat messages - matches main.py flow",
    version="1.0.0"
)

# Configure CORS with more permissive settings
origins = [
    "http://localhost:3000",  # React frontend
    "http://localhost:5173",  # Vite frontend
    "http://localhost:8000",  # Default FastAPI port
    "http://localhost:8001",  # Video model
    "http://localhost:8002",  # STT model
    "http://localhost:8003",  # Chat model
    "http://localhost:8004",  # Survey model
    "http://localhost:9000",  # Integrated backend
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
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

# Initialize components (exactly like main.py)
emotion_detector = EmotionDetector()
visualizer = Visualizer()

# Create output directory if it doesn't exist (exactly like main.py)
os.makedirs('outputs', exist_ok=True)

def image_to_base64(image_path: str) -> str:
    """Convert image to base64 string for frontend display."""
    try:
        with open(image_path, 'rb') as img_file:
            return base64.b64encode(img_file.read()).decode('utf-8')
    except Exception:
        return ""

class CompleteAnalysisResponse(BaseModel):
    # Overall summary (from visualizer.generate_summary)
    summary: dict
    # Table analysis for each message (from emotion_detector.analyze_messages)
    analyzed_messages: List[dict]
    # Chart data for React components
    mental_states_data: List[dict]  # Pie chart data
    sentiment_trend_data: List[dict]  # Line graph data
    success: bool
    message: str

class SingleMessageRequest(BaseModel):
    text: str
    person_id: str = "user_api"

class SingleMessageResponse(BaseModel):
    primary_emotion: str
    sentiment_score: float
    mental_state: str
    emotion_score: float
    success: bool
    message: str

@app.post("/analyze-complete", response_model=CompleteAnalysisResponse)
async def analyze_complete(file: UploadFile = File(...)):
    """
    Complete analysis following the exact main.py flow:
    1. Load JSON file → DataLoader
    2. Analyze messages → EmotionDetector  
    3. Generate summary → Visualizer
    4. Create visualizations → Visualizer
    
    Expected JSON format (same as main.py):
    {
        "person_id": "user_123",
        "messages": [
            {"text": "message", "timestamp": "2024-01-01T10:00:00Z"},
            ...
        ]
    }
    """
    try:
        print(f"[API] Received file: {file.filename}")
        
        # Validate file type
        if not file.filename.endswith('.json'):
            raise HTTPException(status_code=400, detail="Only JSON files are supported")
        
        # Read and parse uploaded file
        contents = await file.read()
        print(f"[API] File size: {len(contents)} bytes")
        
        # Create temporary file for DataLoader (exactly like main.py)
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
            temp_file.write(contents.decode('utf-8'))
            temp_file_path = temp_file.name
        
        try:
            print(f"[API] Created temp file: {temp_file_path}")
            
            # === EXACT MAIN.PY FLOW ===
            
            # 1. Load and preprocess data (exactly like main.py)
            data_loader = DataLoader(temp_file_path)
            raw_data = data_loader.load_data()
            messages = data_loader.preprocess_messages(raw_data)
            print(f"[API] Loaded {len(messages)} messages")
            
            # 2. Analyze messages (exactly like main.py)
            analyzed_messages = emotion_detector.analyze_messages(messages)
            print(f"[API] Analyzed {len(analyzed_messages)} messages")
            
            # 3. Generate visualizations (exactly like main.py)
            mental_states_path = 'outputs/mental_states.png'
            sentiment_trend_path = 'outputs/sentiment_trend.png'
            
            visualizer.plot_mental_states(analyzed_messages, mental_states_path)
            visualizer.plot_sentiment_trend(analyzed_messages, sentiment_trend_path)
            print(f"[API] Generated visualizations")
            
            # 4. Generate summary (exactly like main.py)
            summary = visualizer.generate_summary(analyzed_messages)
            print(f"[API] Generated summary")
            
            # 5. Save results (exactly like main.py)
            results = {
                'analyzed_messages': analyzed_messages,
                'summary': summary
            }
            
            with open('outputs/api_results.json', 'w') as f:
                json.dump(results, f, indent=2, default=str)
            print(f"[API] Saved results to outputs/api_results.json")
            
            # Convert images to base64 for frontend
            mental_states_b64 = image_to_base64(mental_states_path)
            sentiment_trend_b64 = image_to_base64(sentiment_trend_path)
            
            # Format timestamps for JSON serialization
            for msg in analyzed_messages:
                if isinstance(msg.get('timestamp'), datetime):
                    msg['timestamp'] = msg['timestamp'].strftime("%B %d, %Y at %I:%M %p")
            
            print(f"[API] Analysis complete - returning response")
            
            return CompleteAnalysisResponse(
                summary=summary,
                analyzed_messages=analyzed_messages,
                mental_states_data=visualizer.get_mental_states_data(analyzed_messages),
                sentiment_trend_data=visualizer.get_sentiment_trend_data(analyzed_messages),
                success=True,
                message=f"Successfully analyzed {len(analyzed_messages)} messages"
            )
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format in uploaded file")
    except FileNotFoundError:
        raise HTTPException(status_code=400, detail="File processing error")
    except Exception as e:
        print(f"[API] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/analyze/single", response_model=SingleMessageResponse)
async def analyze_single_message(request: SingleMessageRequest):
    """
    Analyze a single message for emotion, sentiment, and mental state.
    This endpoint handles individual messages without requiring file upload.
    """
    try:
        print(f"[API] Single message analysis for: {request.text[:50]}...")
        
        # Create a simple message structure
        message_data = {
            'text': request.text,
            'person_id': request.person_id,
            'timestamp': datetime.now()
        }
        
        # Analyze the single message using the existing get_mental_state method
        analysis = emotion_detector.get_mental_state(request.text)
        
        print(f"[API] Single message analysis complete: {analysis}")
        
        return SingleMessageResponse(
            primary_emotion=analysis.get('primary_emotion', 'neutral'),
            sentiment_score=analysis.get('sentiment_score', 0.0),
            mental_state=analysis.get('mental_state', 'neutral'),
            emotion_score=analysis.get('emotion_score', 0.0),
            success=True,
            message="Single message analysis completed successfully"
        )
        
    except Exception as e:
        print(f"[API] Single message analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Single message analysis failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Mental State Analyzer API is running"}

if __name__ == "__main__":
    import uvicorn
    print("Starting Mental State Analyzer API...")
    print("This API follows the exact main.py flow:")
    print("1. JSON file → DataLoader → preprocess_messages")
    print("2. EmotionDetector → analyze_messages (table)")
    print("3. Visualizer → generate_summary (overall summary)")
    print("4. Visualizer → plot charts (pie + line)")
    uvicorn.run(app, host="0.0.0.0", port=8003) 