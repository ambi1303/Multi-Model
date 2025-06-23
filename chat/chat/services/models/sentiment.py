from transformers import pipeline
import torch

# Initialize the sentiment analysis model
sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english",
    device=0 if torch.cuda.is_available() else -1
)

async def analyze_sentiment(text: str) -> float:
    """
    Analyze the sentiment of the given text.
    Returns a score between -1 (negative) and 1 (positive).
    """
    result = sentiment_analyzer(text)[0]
    
    # Convert the model's output to a -1 to 1 scale
    if result['label'] == 'POSITIVE':
        return result['score']
    else:
        return -result['score'] 