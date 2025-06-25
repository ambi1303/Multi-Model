# Chat Analysis Service

This service analyzes chat messages for emotions, sentiment, and mental states.

## Features

- Single message analysis
- Batch analysis of chat history
- Visualization of mental states and sentiment trends
- Prometheus metrics for monitoring

## API Endpoints

- `POST /analyze/single`: Analyze a single chat message
- `POST /analyze-complete`: Analyze a complete chat history file
- `GET /health`: Health check endpoint
- `GET /metrics`: Prometheus metrics endpoint

## Architecture

The service uses:
- TextBlob for sentiment analysis
- Hugging Face transformers for emotion detection
- Custom mapping for mental state analysis
- FastAPI for the REST API
- Prometheus for monitoring

## Running the Service

```bash
cd chat/chat/mental_state_analyzer
pip install -r requirements.txt
uvicorn api:app --host 0.0.0.0 --port 8003 --reload
```

## Monitoring

The service exposes Prometheus metrics at `/metrics` for:
- Request counts
- Processing time
- Error counts
- Memory usage
- CPU usage

## Integration

This service is integrated with the main backend at port 9000, which forwards requests to this service on port 8003. 