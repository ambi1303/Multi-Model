# Video Emotion Analysis Service

This directory contains the Video Emotion Analysis microservice for the Multi-Model project.

## Overview

The Video Emotion Analysis service processes images/video frames to detect facial emotions using the DeepFace library. It provides a REST API for analyzing emotions from uploaded images.

## Directory Structure

```
video/
├── emp_face/               # Main service directory
│   ├── api.py              # FastAPI application with emotion analysis endpoints
│   ├── requirements.txt    # Python dependencies
│   ├── test_api.py         # Test script for the API
│   └── README.md           # Service-specific documentation
└── README.md               # This file
```

## Features

- Facial emotion detection from images
- Detailed emotion analysis with confidence scores
- Health check endpoint
- Prometheus metrics for monitoring
- Comprehensive error handling and logging

## API Endpoints

- `POST /analyze-emotion` - Analyze emotion from an uploaded image
- `GET /health` - Health check endpoint
- `GET /metrics` - Prometheus metrics endpoint
- `GET /` - API information

## Getting Started

1. Navigate to the service directory:
```bash
cd emp_face
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
python api.py
```

The API will be available at http://localhost:8001

## Testing

Use the provided test script to verify the API functionality:
```bash
python test_api.py --url http://localhost:8001 --image path/to/test/image.jpg
```

## Integration with Other Services

This service is designed to work with the Multi-Model system and can be integrated with other microservices through its REST API. 