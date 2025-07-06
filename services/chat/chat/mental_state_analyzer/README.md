# Mental State Analyzer

A service for analyzing emotions, sentiment, and mental states from chat messages.

## Features

- Emotion detection using transformer models
- Sentiment analysis using TextBlob
- Mental state mapping based on emotions and sentiment
- Visualization of mental states and sentiment trends
- REST API with FastAPI
- Prometheus metrics for monitoring

## Installation

1. Clone the repository:
```bash
git clone https://github.com/arush-gitcodes/emp_chats
cd mental_state_analyzer
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Run the API server

```bash
uvicorn api:app --host 0.0.0.0 --port 8003 --reload
```

### Test the API

```bash
python test_api.py
```

### Run load test

```bash
python test_api.py --load-test 50
```

## API Endpoints

- `POST /analyze/single`: Analyze a single chat message
- `POST /analyze-complete`: Analyze a complete chat history file
- `GET /health`: Health check endpoint
- `GET /metrics`: Prometheus metrics endpoint

## Project Structure

- `api.py`: FastAPI application and endpoints
- `src/`: Core functionality
  - `data_loader.py`: JSON data loading and preprocessing
  - `emotion_detector.py`: Emotion and sentiment analysis
  - `visualizer.py`: Visualization and summary generation
- `outputs/`: Generated visualizations and results
- `test_api.py`: API testing script

## Integration

This service is integrated with the main backend at port 9000, which forwards requests to this service on port 8003. 