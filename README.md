# Multi-Modal Emotion & Mental State Analyzer

A next-generation, enterprise-ready platform for analyzing emotion and mental state using video, speech, chat, and survey data. Built with a modular microservices architecture and a modern React frontend.

## Features

- **Video Emotion Recognition**: Real-time emotion detection from webcam or uploaded images
- **Speech-to-Text Emotion Analyzer**: Voice recording analysis with transcription, sentiment, and emotion detection
- **Chat Mental State Analyzer**: Mental state and sentiment analysis from chat messages and batch uploads
- **Employee Burnout Prediction Survey**: Structured survey for burnout and stress prediction
- **AI Companion (Emo-Buddy)**: Conversational AI for emotional support and crisis detection
- **Performance Monitoring**: Prometheus metrics, health checks, and load testing tools

## Project Structure

```
.
├── apps/
│   └── frontend/           # Modern React (Vite + MUI) frontend
├── services/
│   ├── chat/               # Chat mental state analyzer (FastAPI)
│   ├── emo_buddy/          # AI companion and memory (FastAPI)
│   ├── integrated/         # API gateway and unified backend (FastAPI)
│   ├── stt/                # Speech-to-text and emotion (FastAPI)
│   ├── survey/             # Burnout survey backend (FastAPI)
│   └── video/              # Video emotion recognition backend (FastAPI)
├── setup.sh                # Setup script for all services
├── start_all_backends.py   # Script to launch all backends in parallel
├── docker-compose.yml      # (Optional) Compose for local dev
└── README.md               # This file
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
   This will:
   - Create virtual environments for all Python services
   - Install all dependencies
   - Download required models
   - Set up the frontend

3. **Start all backend services:**
   ```bash
   python start_all_backends.py
   ```
   This will start:
   - Video backend (port 8001)
   - STT backend (port 8002)
   - Chat backend (port 8003)
   - Survey backend (port 8004)
   - Emo-Buddy backend (port 8005)
   - Integrated API gateway (port 9000)

4. **Start the frontend:**
   ```bash
   cd apps/frontend
   npm run dev
   ```
   The app will be available at:
   ```
   http://localhost:5173
   ```

## Manual Setup (Alternative)

### 1. Set Up Python Virtual Environments

For each service in `services/`:
```bash
cd services/<service_name>
python -m venv venv
source venv/bin/activate  # On Linux/Mac
# or
venv\Scripts\activate    # On Windows
pip install -r requirements.txt
```

### 2. Set Up Frontend
```bash
cd apps/frontend
npm install
```

### 3. Start Services
Start each backend service in a separate terminal:
```bash
# Video Backend
cd services/video/emp_face
source ../../venv/bin/activate
uvicorn api:app --reload --port 8001

# STT Backend
cd services/stt/api
source ../../venv/bin/activate
uvicorn main:app --reload --port 8002

# Chat Backend
cd services/chat/chat/mental_state_analyzer
source ../../../venv/bin/activate
uvicorn api:app --reload --port 8003

# Survey Backend
cd services/survey/survey
source ../../venv/bin/activate
uvicorn backend:app --reload --port 8004

# Emo-Buddy Backend
cd services/emo_buddy
source venv/bin/activate
uvicorn api:app --reload --port 8005

# Integrated Backend
cd services/integrated/backend
source ../../venv/bin/activate
uvicorn main:app --reload --port 9000

# Frontend
cd apps/frontend
npm run dev
```

## Usage

- **Video Analysis**: Real-time webcam or image-based emotion detection
- **Speech Analysis**: Record and analyze speech for emotion, sentiment, and transcription
- **Chat Analysis**: Analyze single or batch chat messages for mental state and sentiment
- **Survey Analysis**: Fill out and submit burnout/stress surveys for ML-based prediction
- **Emo-Buddy**: Chat with an AI companion for emotional support and crisis detection

## Monitoring & Health

- **Prometheus Metrics**: All services expose `/metrics` endpoints
- **Health Checks**: All services provide `/health` endpoints
- **Load Testing**: Use `run_load_test.py` for stress testing

## Contributing

Contributions are welcome! Please open issues or submit PRs for improvements, bug fixes, or new features.

## License

[MIT License](LICENSE) 