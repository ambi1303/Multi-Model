# Integrated Analysis Service

This directory contains the Integrated Analysis service for the Multi-Model project. The service acts as a central API gateway that coordinates analysis requests across all the specialized microservices.

## Integrated Backend

This service acts as a gateway to all other models, providing a unified API for the frontend.

It exposes a single FastAPI server that listens for requests and intelligently routes them to the appropriate backend model service.

### Endpoints exposed by this service:

- Video processing
- Speech-to-text and emotion analysis
- Chat/text sentiment analysis
- Burnout survey predictions

### How it works

The frontend sends all API requests to this integrated backend. Based on the request path (e.g., `/video/analyze`, `/text/analyze`), this service then makes a corresponding request to the specific model handling that task.

For example, a request to `/text/analyze` on the integrated backend might be forwarded to the Chat/Text Analysis service running on port 8003.

This abstracts the complexity of the microservice architecture from the client-side application.

## Directory Structure

```
integrated/
├── backend/               # Backend API gateway
│   ├── main.py            # FastAPI application with routing logic
│   ├── config.yaml        # Configuration file
│   ├── requirements.txt   # Python dependencies
│   ├── test_api.py        # Test script for the API
│   ├── start_service.bat  # Startup script
│   └── models/            # Optional local models
├── frontend/              # React frontend application
│   ├── src/               # React source code
│   ├── public/            # Static assets
│   └── package.json       # NPM dependencies
└── README.md              # This file
```

## Features

- API gateway pattern for unified access to all analysis services
- Health check endpoint for monitoring service status
- Prometheus metrics for observability
- Proper error handling and logging
- Dashboard statistics endpoint for frontend visualization
- Caching for improved performance

## Backend API Endpoints

- `POST /analyze-video` - Analyze emotion from video
- `POST /analyze-speech` - Analyze speech audio
- `POST /analyze-chat` - Analyze chat text
- `POST /analyze-survey` - Analyze survey data
- `POST /analyze-all` - Analyze multiple data sources at once
- `GET /dashboard-stats` - Get statistics for the dashboard
- `GET /api/video/analytics` - Get video analytics data
- `GET /health` - Health check endpoint
- `GET /metrics` - Prometheus metrics endpoint

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the service:
```bash
# On Windows
start_service.bat

# On Unix/Linux
python -m uvicorn main:app --host 0.0.0.0 --port 9000
```

The API will be available at http://localhost:9000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at http://localhost:3000

## Testing

Use the provided test script to verify the API functionality:
```bash
cd backend
python test_api.py --url http://localhost:9000 --text "I'm feeling great today!"
```

## Integration with Other Services

This service integrates with the following microservices:
- Video Emotion Analysis (port 8001)
- Speech Analysis (port 8002)
- Chat/Text Analysis (port 8003)
- Survey Analysis (port 8004)

Make sure these services are running before starting the integrated service. 