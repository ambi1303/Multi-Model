# Survey Analysis Service

This service analyzes employee surveys and predicts burnout rates using machine learning.

## Overview

The Survey Analysis Service is part of the multi-model emotion analysis system. It provides:

1. Employee burnout prediction using machine learning models
2. Survey response analysis with mental health recommendations
3. Integration with the main backend system
4. Prometheus metrics for monitoring

## Architecture

The service is implemented as a FastAPI application with the following components:

- REST API endpoints for prediction and analysis
- Linear regression model for burnout prediction
- Survey scoring and risk assessment
- Optional integration with Gemini AI for personalized recommendations

## API Endpoints

- `POST /predict`: Predict burnout for a single employee
- `POST /predict/batch`: Predict burnout for multiple employees
- `POST /analyze`: Integration endpoint for common backend
- `POST /analyze-survey`: Analyze survey responses with recommendations
- `GET /predictions/history`: Get prediction history
- `GET /models/metrics`: Get model performance metrics
- `GET /health`: Health check endpoint
- `GET /metrics`: Prometheus metrics endpoint

## Running the Service

```bash
cd survey/survey
python -m uvicorn backend:app --host 0.0.0.0 --port 8004
```

## Testing

```bash
cd survey/survey
python test_api.py
```

## Integration

This service is integrated with the main backend at port 9000, which forwards requests to this service on port 8004. 