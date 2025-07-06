# Employee Burnout Prediction

This project predicts employee burnout rates using machine learning models trained on survey data.

## Features

- Employee burnout prediction using machine learning
- Survey analysis with mental health recommendations
- FastAPI REST API with comprehensive endpoints
- Prometheus metrics for monitoring
- Batch prediction capabilities
- Integration with Gemini AI for personalized recommendations

## Setup

1. Install required packages:
```bash
pip install -r requirements.txt
```

2. Make sure you have the following files in your directory:
- train.csv (training data)
- test.csv (test data)
- models/ (directory for saved models)

## Usage

### Start the API server

```bash
# On Windows
start_service.bat

# On Linux/Mac
python -m uvicorn backend:app --host 0.0.0.0 --port 8004
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

- `POST /predict`: Predict burnout for a single employee
- `POST /predict/batch`: Predict burnout for multiple employees
- `POST /analyze`: Integration endpoint for common backend
- `POST /analyze-survey`: Analyze survey responses with recommendations
- `GET /predictions/history`: Get prediction history
- `GET /models/metrics`: Get model performance metrics
- `GET /health`: Health check endpoint
- `GET /metrics`: Prometheus metrics endpoint

## Monitoring

The service exposes Prometheus metrics at `/metrics` for:
- Request counts
- Processing time
- Error counts
- Memory usage
- CPU usage

## Stress Level Thresholds
- Low Stress: 0-30%
- Medium Stress: 30-50%
- High Stress: 50-70%
- Very High Stress: 70-100% 