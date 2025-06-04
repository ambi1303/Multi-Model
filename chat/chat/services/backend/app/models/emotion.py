from transformers import pipeline
import torch

# Initialize the emotion analysis model
emotion_analyzer = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    device=0 if torch.cuda.is_available() else -1
)

EMOTION_MAPPING = {
    'joy': 'Happy',
    'sadness': 'Sad',
    'anger': 'Angry',
    'fear': 'Fearful',
    'surprise': 'Surprised',
    'neutral': 'Neutral'
}

async def analyze_emotion(text: str) -> dict:
    """
    Analyze the emotion in the given text.
    Returns a dictionary with the primary emotion and its score.
    """
    result = emotion_analyzer(text)[0]
    
    # Map the model's emotion labels to our standardized labels
    emotion = EMOTION_MAPPING.get(result['label'].lower(), 'Neutral')
    
    return {
        'primary_emotion': emotion,
        'score': result['score']
    } 