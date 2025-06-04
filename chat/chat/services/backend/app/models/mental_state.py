from typing import Dict, Any

def analyze_mental_state(text: str, sentiment_score: float, emotion_result: Dict[str, Any]) -> str:
    """
    Analyze the mental state based on sentiment and emotion analysis.
    Returns a mental state label.
    """
    emotion = emotion_result['primary_emotion']
    emotion_score = emotion_result['score']
    
    # Define thresholds for different mental states
    if sentiment_score < -0.5 and emotion_score > 0.7:
        if emotion == 'Angry':
            return 'Aggressive'
        elif emotion == 'Sad':
            return 'Depressed'
        elif emotion == 'Fearful':
            return 'Anxious'
    
    if sentiment_score > 0.5 and emotion_score > 0.7:
        if emotion == 'Happy':
            return 'Elated'
        elif emotion == 'Surprised':
            return 'Excited'
    
    if abs(sentiment_score) < 0.3 and emotion_score < 0.5:
        return 'Calm'
    
    if sentiment_score < 0 and emotion_score > 0.5:
        return 'Stressed'
    
    if sentiment_score > 0 and emotion_score > 0.5:
        return 'Content'
    
    return 'Neutral' 