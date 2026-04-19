from typing import Dict, List
from textblob import TextBlob
from transformers import pipeline
import torch
import os

class EmotionDetector:
    def __init__(self):
        os.environ['TOKENIZERS_PARALLELISM'] = 'false'
        
        local_model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
        if os.path.isdir(local_model_path) and os.path.exists(os.path.join(local_model_path, 'pytorch_model.bin')):
            model_source = local_model_path
            print(f"[EmotionDetector] Loading model from local path: {local_model_path}")
        else:
            model_source = "j-hartmann/emotion-english-distilroberta-base"
            print(f"[EmotionDetector] Local model not found, downloading from HuggingFace")
        
        self.emotion_classifier = pipeline(
            "text-classification",
            model=model_source,
            top_k=None,
            device=-1,
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
        try:
            analysis = TextBlob(text)
            return analysis.sentiment.polarity
        except Exception as e:
            print(f"[WARNING] Sentiment analysis failed: {e}")
            return 0.0  # Neutral fallback
        
    def detect_emotion(self, text: str) -> List[Dict]:
        """Detect emotions using the transformer model."""
        try:
            if len(text) > 512:
                text = text[:512]
            
            results = self.emotion_classifier(text)
            # top_k=None returns List[List[Dict]] for single input
            if results and isinstance(results[0], list):
                return results[0]
            return results
        except Exception as e:
            print(f"[WARNING] Emotion detection failed: {e}")
            return [{'label': 'neutral', 'score': 1.0}]
        
    def get_mental_state(self, text: str) -> Dict:
        """Analyze text and return mental state analysis."""
        if not text or not text.strip():
            return {
                'sentiment_score': 0.0,
                'primary_emotion': 'neutral',
                'emotion_score': 0.5,
                'mental_state': 'Neutral'
            }
        
        sentiment_score = self.analyze_sentiment(text)
        
        emotions = self.detect_emotion(text)
        primary_emotion = max(emotions, key=lambda x: x['score'])
        
        mental_state = self.emotion_to_state.get(
            primary_emotion['label'].lower(),
            'Neutral'
        )
        
        result = {
            'sentiment_score': sentiment_score,
            'primary_emotion': primary_emotion['label'],
            'emotion_score': primary_emotion['score'],
            'mental_state': mental_state
        }
        print(f"[EmotionDetector] Input: '{text[:60]}...' -> emotion={primary_emotion['label']} score={primary_emotion['score']:.3f} sentiment={sentiment_score:.3f} state={mental_state}")
        return result
        
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