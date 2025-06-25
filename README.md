# Integrated Multi-Modal Emotion & Mental State Analyzer

This project is an integrated platform for analyzing emotion and mental state using multiple modalities:
- **Video Emotion Recognition**: Real-time emotion detection from webcam or uploaded images
- **Speech-to-Text Emotion Analyzer**: Voice recording analysis with transcription and sentiment detection
- **Chat Mental State Analyzer**: Mental state analysis from chat messages
- **Employee Burnout Prediction Survey**: Structured survey for burnout prediction

## Features

- **Video Analysis**: Real-time emotion detection using DeepFace
- **Speech Analysis**: 
  - Speech-to-text conversion using Vosk
  - Sentiment analysis using TextBlob
  - Emotion detection from transcribed text
- **Chat Analysis**: Mental state analysis from chat messages
- **Survey Analysis**: Employee burnout prediction using machine learning models
- **Performance Monitoring**:
  - Prometheus metrics for all services
  - Health check endpoints
  - Profiling capabilities
  - Load testing tools

## Project Structure

```
.
├── integrated/
│   ├── backend/         # Unified FastAPI backend (API gateway)
│   └── frontend/        # Unified React frontend
├── stt/                 # Speech-to-text service
├── survey/             # Survey service
├── video/              # Video service
├── chat/               # Chat service
├── setup.sh            # Setup script for all services
└── README.md           # This file
```

## Prerequisites

- Python 3.8+
- Node.js 16+
- ffmpeg (for audio processing)
- Git

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-name>
   ```

2. **Run the setup script:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   This script will:
   - Create virtual environments for all Python services
   - Install all required dependencies
   - Download necessary models
   - Set up the frontend

3. **Start all services:**
   ```bash
   python start_all_backends.py
   ```
   This will start:
   - Video backend (port 8001)
   - STT backend (port 8002)
   - Chat backend (port 8003)
   - Survey backend (port 8004)
   - Integrated backend (port 9000)

4. **Access the application:**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Manual Setup (Alternative)

If you prefer to set up services manually:

### 1. Set Up Python Virtual Environments

For each service (video, stt, chat, survey):

```bash
cd <service_directory>
python -m venv venv
source venv/bin/activate  # On Linux/Mac
# or
venv\Scripts\activate     # On Windows
pip install -r requirements.txt
```

### 2. Set Up Frontend

```bash
cd integrated/frontend
npm install
```

### 3. Start Services

Start each backend service in a separate terminal:

```bash
# Video Backend
cd video/emp_face
source venv/bin/activate
uvicorn api:app --reload --port 8001

# STT Backend
cd stt/stt/api
source venv/bin/activate
uvicorn main:app --reload --port 8002

# Chat Backend
cd chat/chat/mental_state_analyzer
source venv/bin/activate
uvicorn api:app --reload --port 8003

# Survey Backend
cd survey/survey
source venv/bin/activate
uvicorn backend:app --reload --port 8004

# Integrated Backend
cd integrated/backend
source venv/bin/activate
uvicorn main:app --reload --port 9000

# Frontend
cd integrated/frontend
npm start
```

## Usage

1. **Video Analysis**:
   - Allow camera access when prompted
   - Click "Start Camera" to begin real-time emotion detection
   - Upload an image for static analysis

2. **Speech Analysis**:
   - Click "Start Recording" to begin voice recording
   - Speak clearly into your microphone
   - Click "Stop Recording" to analyze the speech
   - View transcription, sentiment, and emotion results

3. **Chat Analysis**:
   - Enter your message in the chat input
   - Click "Analyze" to get mental state analysis
   - View sentiment and emotion breakdown

4. **Survey Analysis**:
   - Fill out the employee survey form
   - Submit to get burnout prediction and stress level analysis

## Performance Monitoring

The system includes comprehensive performance monitoring and profiling capabilities:

### Prometheus Metrics

All services expose Prometheus metrics at the `/metrics` endpoint:
- Request counts by endpoint
- Processing time histograms
- Error counts by type
- Memory and CPU usage

Example:
```
curl http://localhost:9000/metrics
```

### Health Checks

All services provide health check endpoints at `/health`:
- Service status
- Backend availability (for integrated service)
- System resource usage

Example:
```
curl http://localhost:9000/health
```

### Profiling

The STT service includes profiling capabilities:

1. **On-demand profiling** for individual requests:
```
curl -X POST "http://localhost:8002/analyze-speech?profile=true" -F "audio_file=@your_audio.wav"
```

2. **System-wide profiling report**:
```
curl http://localhost:8002/profile-report
```

### Load Testing

The integrated backend includes a load testing endpoint for performance testing:

```
curl -X POST http://localhost:9000/load-test -H "Content-Type: application/json" -d '{"test_type": "all", "iterations": 5}'
```

Options for `test_type`:
- `all`: Test all services
- `video`: Test only video service
- `speech`: Test only speech service
- `chat`: Test only chat service
- `survey`: Test only survey service

## Troubleshooting

1. **Camera/Microphone Access**:
   - Ensure your browser has permission to access camera/microphone
   - Check if other applications are using these devices

2. **Port Conflicts**:
   - Ensure no other services are using ports 8001-8004 and 9000
   - Check if all backend services are running

3. **Model Loading Issues**:
   - Verify that all model files are downloaded correctly
   - Check the logs for specific error messages

4. **CORS Errors**:
   - Ensure all backend services are running
   - Check browser console for specific CORS error messages

5. **Monitoring Issues**:
   - Ensure all services have the required dependencies (prometheus_client, psutil)
   - Check if the metrics endpoints are accessible
   - Verify that the integrated backend can reach all service health endpoints

## Development

- Each service has its own virtual environment for isolation
- Backend services use FastAPI for API endpoints
- Frontend uses React with Material-UI components
- All services communicate through the integrated backend
- Performance monitoring is integrated into all services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Support

For issues and feature requests, please create an issue in the repository. 