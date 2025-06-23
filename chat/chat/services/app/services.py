import asyncio
from typing import Dict, Any
from models.emotion import analyze_emotion
from models.sentiment import analyze_sentiment
from models.mental_state import analyze_mental_state

async def run_all_models(text: str = None, person_id: str = "user_api") -> Dict[str, Any]:
    """
    Run all models (emotion, sentiment, mental state) on the given text.
    Returns a dictionary with analysis results.
    """
    if not text:
        raise ValueError("Text is required for analysis")
    
    try:
        # Run emotion and sentiment analysis concurrently
        emotion_task = analyze_emotion(text)
        sentiment_task = analyze_sentiment(text)
        
        emotion_result = await emotion_task
        sentiment_score = await sentiment_task
        
        # Analyze mental state based on emotion and sentiment
        mental_state = analyze_mental_state(text, sentiment_score, emotion_result)
        
        # Prepare the response
        response = {
            "text": text,
            "person_id": person_id,
            "primary_emotion": emotion_result['primary_emotion'],
            "emotion_score": emotion_result['score'],
            "sentiment_score": sentiment_score,
            "mental_state": mental_state,
            "timestamp": None  # Will be set by the API endpoint
        }
        
        return response
        
    except Exception as e:
        raise Exception(f"Error in model analysis: {str(e)}")

# For backward compatibility
def run_all_models_sync(text: str = None, person_id: str = "user_api") -> Dict[str, Any]:
    """
    Synchronous wrapper for run_all_models.
    """
    return asyncio.run(run_all_models(text, person_id)) 