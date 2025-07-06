from typing import Dict, List
from textblob import TextBlob
from transformers import pipeline
import torch

class EmotionDetector:
    def __init__(self):
        # Initialize the emotion classifier
        self.emotion_classifier = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            return_all_scores=True
        )
        
        # Define emotion to mental state mapping
        self.emotion_to_state = {
            'sadness': 'Stressed',
            'anger': 'Stressed',
            'fear': 'Anxious',
            'joy': 'Positive',
            'love': 'Positive',
            'surprise': 'Neutral',
            'neutral': 'Neutral'
        }
        
    def analyze_sentiment(self, text: str) -> float:
        """Analyze sentiment using TextBlob."""
        analysis = TextBlob(text)
        return analysis.sentiment.polarity
        
    def detect_emotion(self, text: str) -> List[Dict]:
        """Detect emotions using the transformer model."""
        results = self.emotion_classifier(text)[0]
        return results
        
    def get_mental_state(self, text: str) -> Dict:
        """Analyze text and return mental state analysis."""
        # Get sentiment
        sentiment_score = self.analyze_sentiment(text)
        
        # Get emotions
        emotions = self.detect_emotion(text)
        primary_emotion = max(emotions, key=lambda x: x['score'])
        
        # Map to mental state
        mental_state = self.emotion_to_state.get(
            primary_emotion['label'].lower(),
            'Neutral'
        )
        
        return {
            'sentiment_score': sentiment_score,
            'primary_emotion': primary_emotion['label'],
            'emotion_score': primary_emotion['score'],
            'mental_state': mental_state
        }
        
    def analyze_messages(self, messages: List[Dict]) -> List[Dict]:
        """Analyze a list of messages and return their mental states."""
        analyzed_messages = []
        
        for msg in messages:
            analysis = self.get_mental_state(msg['text'])
            analyzed_msg = {
                'timestamp': msg['timestamp'],
                'text': msg['text'],
                'person_id': msg['person_id'],
                **analysis
            }
            analyzed_messages.append(analyzed_msg)
            
        return analyzed_messages 