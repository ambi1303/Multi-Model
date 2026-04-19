# Multi-Modal Emotion & Mental State Analyzer

A next-generation, enterprise-ready platform for analyzing emotion and mental state using **video**, **speech**, **chat**, and **survey** data. Built with a modular microservices architecture (Python/FastAPI) and a modern React frontend, featuring an integrated AI therapeutic companion powered by Google Gemini.

## Features

### Core Analysis Modules
- **Video Emotion Recognition** -- Real-time facial emotion detection from webcam using DeepFace with OpenCV
- **Speech-to-Text Emotion Analyzer** -- Voice recording with transcription (Google/Vosk), sentiment analysis, and emotion detection
- **Chat Mental State Analyzer** -- Mental state and sentiment analysis from text using transformer models (RoBERTa) and TextBlob
- **Employee Burnout Prediction Survey** -- Structured burnout and stress prediction survey with ML models (Linear Regression, StandardScaler)
- **AI Companion (Emo-Buddy)** -- Conversational AI for emotional support, crisis detection, and therapeutic guidance via Google Gemini

### Platform Features
- **Unified API Gateway** -- Single entry point (Integrated Backend) that routes requests to all microservices
- **Analytics Dashboard** -- Comprehensive analytics with date-range filtering across all modalities
- **JWT Authentication** -- Role-based access control with secure token management
- **Crisis Detection** -- Automatic crisis identification with support resources
- **Prometheus Monitoring** -- Health checks and metrics endpoints on every service
- **PostgreSQL Storage** -- Neon.tech hosted PostgreSQL for all persistent data

## Architecture

### Project Structure
```
Multi-Model/
├── apps/
│   └── frontend/                          # React 18 + Vite + TailwindCSS + MUI
│       └── src/
│           ├── components/                # Auth, Layout, UI components
│           ├── pages/                     # Analytics, Chat, Speech, Video, Survey, EmoBuddy
│           ├── services/                  # API clients (Axios)
│           ├── hooks/                     # Custom React hooks
│           └── contexts/                  # Auth, Theme contexts
├── services/
│   ├── core/                              # PostgreSQL, Auth, User management
│   ├── integrated/backend/                # API gateway, analytics aggregation
│   ├── video/emp_face/                    # DeepFace emotion recognition
│   ├── stt/api/                           # Speech-to-text + emotion analysis
│   ├── chat/chat/mental_state_analyzer/   # RoBERTa-based text analysis
│   ├── survey/survey/                     # Burnout prediction ML models
│   └── emo_buddy/                         # Gemini-powered AI companion
├── start_all_backends.py                  # Parallel service launcher
└── docker-compose.yml                     # Container orchestration
```

### Service Ports
| Service | Port | Description |
|---------|------|-------------|
| Core Service | 8010 | Database, authentication, user management |
| Video Service | 8001 | DeepFace facial emotion detection |
| STT Service | 8002 | Speech transcription and emotion analysis |
| Chat Service | 8003 | Text-based mental state analysis |
| Survey Service | 8004 | Burnout prediction and assessment |
| Emo-Buddy Service | 8005 | AI therapeutic companion (Gemini) |
| Integrated Backend | 9000 | API gateway, analytics, request routing |
| Frontend | 5173 | React application |

### Tech Stack

**Frontend:** React 18, Vite, TypeScript, TailwindCSS, MUI 5, Zustand, React Query, Chart.js, Framer Motion

**Backend:** Python 3.11+, FastAPI, Uvicorn, SQLAlchemy (async), Pydantic

**ML/AI:** DeepFace, Hugging Face Transformers (RoBERTa), TextBlob, scikit-learn, Google Gemini API

**Database:** PostgreSQL (Neon.tech), asyncpg

**Infrastructure:** Prometheus metrics, Docker Compose, GitHub Actions CI/CD

## Prerequisites

- **Python 3.11+** (3.13 supported)
- **Node.js 18+**
- **PostgreSQL** (Neon.tech cloud instance preconfigured)
- **ffmpeg** (required for speech audio conversion -- see setup below)
- **Git**

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/ambi1303/Multi-Model.git
cd Multi-Model
```

### 2. Set Up Backend Services

Each service uses its own Python virtual environment:

```bash
# Create venvs and install dependencies for each service
# On Windows:
cd services\core && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && deactivate && cd ..\..
cd services\integrated\backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && deactivate && cd ..\..\..
cd services\video\emp_face && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && deactivate && cd ..\..\..
cd services\stt\api && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && deactivate && cd ..\..\..
cd services\chat\chat\mental_state_analyzer && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && deactivate && cd ..\..\..\..
cd services\survey\survey && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && deactivate && cd ..\..\..
cd services\emo_buddy && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && deactivate && cd ..\..
```

Or use the automated setup script (Linux/macOS):
```bash
chmod +x setup.sh
./setup.sh
```

### 3. Install ffmpeg for Speech Analysis

The STT service requires ffmpeg to convert browser audio (`.webm`) to WAV format.

**Windows (winget):**
```bash
winget install Gyan.FFmpeg
```

**Windows (pip, no admin required):**
```bash
# Inside the STT service venv:
cd services\stt\api && venv\Scripts\activate
pip install static-ffmpeg
```
The STT service auto-detects `static-ffmpeg` and adds it to PATH at startup.

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

### 4. Download DeepFace Model (Video Service)

The Video Service needs the DeepFace facial expression model. If auto-download fails (e.g., due to corporate SSL), manually download it:

1. Download from: https://github.com/serengil/deepface_models/releases/download/v1.0/facial_expression_model_weights.h5
2. Place the file at: `~/.deepface/weights/facial_expression_model_weights.h5`

On Windows, that's: `C:\Users\<you>\.deepface\weights\facial_expression_model_weights.h5`

### 5. Environment Configuration

**Core Service** (`services/core/.env`) -- preconfigured with Neon.tech PostgreSQL:
```env
DATABASE__URL=postgresql://user:pass@host/neondb?sslmode=require
AUTH__SECRET_KEY=your-jwt-secret
AUTH__ALGORITHM=HS256
AUTH__ACCESS_TOKEN_EXPIRE_MINUTES=30
SERVICE__PORT=8010
```

**Emo-Buddy Service** (`services/emo_buddy/.env`) -- requires a Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
Get a free API key at: https://aistudio.google.com/apikey

### 6. Start All Services

```bash
# Start all 7 backend services in parallel
python start_all_backends.py

# In a new terminal, start the frontend
cd apps/frontend
npm install
npm run dev
```

### 7. Access the Application
- **Frontend:** http://localhost:5173
- **API Gateway:** http://localhost:9000
- **API Docs (Core):** http://localhost:8010/docs
- **API Docs (Gateway):** http://localhost:9000/docs

## Usage Guide

### Video Analysis
Navigate to the Video Analysis page, grant camera permissions, and start continuous analysis. DeepFace detects emotions (happy, sad, angry, surprise, neutral, fear, disgust) in real-time from your webcam feed.

### Speech Analysis
Go to the Speech Analysis page, record audio using the browser microphone, and receive transcription with sentiment and emotion analysis. Supports Google Speech Recognition with Vosk offline fallback.

### Chat Analysis
Enter text messages for mental state analysis. The service uses RoBERTa-based transformer models for emotion detection and TextBlob for sentiment scoring.

### Survey Assessment
Complete the structured burnout assessment survey. ML models predict burnout risk level and provide personalized recommendations.

### Emo-Buddy (AI Companion)
Start a therapeutic conversation session powered by Google Gemini. Features crisis detection, evidence-based therapeutic techniques, and persistent conversation memory.

## API Endpoints

All endpoints are accessed through the Integrated Backend gateway at `http://localhost:9000`:

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login, returns JWT |
| POST | `/auth/register` | User registration |
| GET | `/auth/me` | Get current user profile |
| POST | `/auth/refresh` | Refresh access token |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze-video-frame` | Analyze a single video frame for emotions |
| POST | `/analyze-speech` | Transcribe and analyze speech audio |
| POST | `/analyze-chat` | Analyze chat text for mental state |
| POST | `/predict` | Submit survey for burnout prediction |

### Emo-Buddy
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/emo-buddy/start` | Start a new therapeutic session |
| POST | `/emo-buddy/continue` | Continue conversation |
| POST | `/emo-buddy/end` | End session with summary |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/unified` | Unified analytics across all modalities |
| GET | `/analytics/overview` | Dashboard overview statistics |
| GET | `/analytics/video` | Video analysis analytics |
| GET | `/analytics/speech` | Speech analysis analytics |
| GET | `/analytics/chat` | Chat analysis analytics |
| GET | `/analytics/survey` | Survey analytics |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/metrics` | Prometheus metrics |

## Docker Deployment

```bash
docker-compose up -d
```

## Testing

```bash
# Integration tests
cd services/integrated/backend && python test_api.py

# Individual service tests
cd services/video/emp_face && python test_api.py
cd services/survey/survey && python test_api.py

# Load testing
python run_load_test.py
```

## Monitoring

- **Health Checks:** Every service exposes `GET /health`
- **Prometheus Metrics:** Available at `GET /metrics` on each service
- **Frontend Status:** Real-time service connectivity indicators in the UI
- **Structured Logging:** All services use Python `logging` with consistent formatting

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `pip install` fails on Python 3.13 | Requirements use `>=` version pins for compatibility |
| DeepFace model download fails | Manually download and place in `~/.deepface/weights/` |
| STT can't convert audio | Install ffmpeg or `pip install static-ffmpeg` in STT venv |
| Emo-Buddy "GEMINI_API_KEY not set" | Create `services/emo_buddy/.env` with your key |
| Gemini 429 quota exceeded | Generate a new API key from a different GCP project |
| "All connection attempts failed" on storage | Verify Core Service is running on port 8010 |
| Analytics shows no data | Check that date range filter encompasses your data timestamps |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built for mental health and emotional wellbeing**
