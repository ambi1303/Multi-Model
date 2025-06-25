# Video Emotion Analysis API

This service provides facial emotion analysis from video frames using DeepFace.

## Features

- Real-time emotion detection from uploaded images
- Detailed emotion analysis with confidence scores
- Health check endpoint for monitoring service status
- Prometheus metrics for observability
- Proper error handling and logging

## API Endpoints

- `POST /analyze-emotion` - Analyze emotion from an uploaded image
- `GET /health` - Health check endpoint
- `GET /metrics` - Prometheus metrics endpoint
- `GET /` - API information and available endpoints

## Setup and Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Service

Start the API server:
```bash
python api.py
```

The API will be available at http://localhost:8001

## Testing

Use the provided test script to verify the API functionality:
```bash
python test_api.py --url http://localhost:8001 --image path/to/test/image.jpg
```

## Monitoring

The API includes Prometheus metrics for monitoring:

- `video_requests_total` - Total number of requests by endpoint
- `video_processing_seconds` - Histogram of processing times
- `video_errors_total` - Count of errors by type
- `video_memory_usage_bytes` - Memory usage of the service
- `video_cpu_usage_percent` - CPU usage of the service

You can scrape these metrics from the `/metrics` endpoint.

## Error Handling

The API provides detailed error responses with appropriate HTTP status codes:

- 400 - Bad Request (invalid image format, empty image)
- 404 - Not Found (no faces detected)
- 500 - Internal Server Error (unexpected errors)

All errors are logged with detailed information for troubleshooting. 