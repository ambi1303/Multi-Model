# Multi-Modal Emotion & Mental State Analyzer

A next-generation, enterprise-ready platform for analyzing emotion and mental state using video, speech, chat, and survey data. Built with a modular microservices architecture and a modern React frontend with integrated AI therapeutic companion.

## 🚀 Features

### Core Analysis Modules
- **🎥 Video Emotion Recognition**: Real-time emotion detection from webcam or uploaded images using advanced computer vision
- **🎤 Speech-to-Text Emotion Analyzer**: Voice recording analysis with transcription, sentiment, and emotion detection
- **💬 Chat Mental State Analyzer**: Mental state and sentiment analysis from chat messages with batch processing
- **📊 Employee Burnout Prediction Survey**: Structured survey for burnout and stress prediction with ML models
- **🤖 AI Companion (Emo-Buddy)**: Conversational AI for emotional support, crisis detection, and therapeutic guidance

### Advanced Features
- **🔄 Integrated Analysis**: Unified API gateway for seamless multi-modal analysis
- **📈 Real-time Analytics**: Live dashboard with comprehensive emotion and mental state metrics
- **🛡️ Crisis Detection**: Automatic crisis identification with immediate support resources
- **💾 Session Management**: Persistent conversation history and user context
- **🔐 Authentication & Security**: JWT-based authentication with role-based access control
- **📊 Performance Monitoring**: Prometheus metrics, health checks, and load testing tools

## 🏗️ Architecture

### Project Structure
```
multi-model/
├── apps/
│   └── frontend/              # React (Vite + MUI) frontend application
│       ├── src/
│       │   ├── components/    # Reusable UI components
│       │   ├── pages/         # Application pages
│       │   ├── services/      # API service layers
│       │   ├── hooks/         # Custom React hooks
│       │   └── contexts/      # React context providers
│       └── public/            # Static assets
├── services/
│   ├── core/                  # Core database and authentication service
│   ├── integrated/            # API gateway and unified backend
│   ├── video/                 # Video emotion recognition service
│   ├── stt/                   # Speech-to-text and emotion analysis
│   ├── chat/                  # Chat mental state analyzer
│   ├── survey/                # Burnout survey analysis
│   └── emo_buddy/             # AI therapeutic companion
├── setup.sh                   # Automated setup script
├── start_all_backends.py      # Service orchestration script
└── docker-compose.yml         # Container orchestration
```

### Service Architecture
- **Core Service** (Port 8000): Database, authentication, and user management
- **Integrated Backend** (Port 9000): API gateway with request routing and aggregation
- **Video Service** (Port 8001): Computer vision-based emotion detection
- **STT Service** (Port 8002): Speech processing with emotion analysis
- **Chat Service** (Port 8003): Text-based mental state analysis
- **Survey Service** (Port 8004): Burnout prediction and assessment
- **Emo-Buddy Service** (Port 8005): AI therapeutic companion
- **Frontend** (Port 5173): React application with modern UI

## 🛠️ Prerequisites

- **Python 3.8+** (3.9+ recommended)
- **Node.js 16+** (18+ recommended)
- **PostgreSQL 12+** (for core database)
- **Redis 6+** (for caching and sessions)
- **ffmpeg** (for audio processing)
- **Git** (for version control)

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd multi-model
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Create Python virtual environments for all services
- Install all dependencies and required packages
- Download ML models and language models
- Set up the frontend with all dependencies
- Create necessary configuration files

### 2. Environment Configuration
Create a `.env` file in the `services/emo_buddy/` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Start All Services
```bash
# Start all backend services
python start_all_backends.py

# In a new terminal, start the frontend
cd apps/frontend
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:9000
- **Core Service**: http://localhost:8000

## 📋 Manual Setup (Alternative)

### Backend Services Setup
```bash
# Core Service (Database & Auth)
cd services/core
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Repeat for each service:
# - services/integrated/backend
# - services/video/emp_face
# - services/stt/api
# - services/chat/chat/mental_state_analyzer
# - services/survey/survey
# - services/emo_buddy
```

### Frontend Setup
```bash
cd apps/frontend
npm install
npm run dev
```

### Start Services Individually
```bash
# Core Service
cd services/core && source venv/bin/activate
uvicorn main:app --reload --port 8000

# Integrated Backend
cd services/integrated/backend && source venv/bin/activate
uvicorn main:app --reload --port 9000

# Video Service
cd services/video/emp_face && source venv/bin/activate
uvicorn api:app --reload --port 8001

# STT Service
cd services/stt/api && source venv/bin/activate
uvicorn main:app --reload --port 8002

# Chat Service
cd services/chat/chat/mental_state_analyzer && source venv/bin/activate
uvicorn api:app --reload --port 8003

# Survey Service
cd services/survey/survey && source venv/bin/activate
uvicorn backend:app --reload --port 8004

# Emo-Buddy Service
cd services/emo_buddy && source venv/bin/activate
uvicorn api:app --reload --port 8005
```

## 🎯 Usage Guide

### 1. Video Analysis
- Navigate to **Video Analysis** page
- Grant camera permissions or upload an image
- Click **Analyze** to detect emotions in real-time
- View detailed emotion breakdown and confidence scores

### 2. Speech Analysis
- Go to **Speech Analysis** page
- Record audio or upload an audio file
- Get transcription, sentiment, and emotion analysis
- Access **EmoBuddy** for therapeutic support based on speech

### 3. Chat Analysis
- Visit **Chat Analysis** page
- Enter text or upload chat files for batch processing
- Analyze mental state and sentiment patterns
- Export results for further analysis

### 4. Survey Assessment
- Complete the **Burnout Survey** for comprehensive assessment
- Get personalized insights and recommendations
- Track progress over time with analytics

### 5. EmoBuddy Therapeutic Support
- Access from any analysis page or directly
- Engage in evidence-based therapeutic conversations
- Receive crisis support and wellness recommendations
- Maintain conversation history and context

## 🔧 API Documentation

### Core Endpoints
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `GET /users/profile` - User profile management

### Analysis Endpoints
- `POST /analyze-video` - Video emotion analysis
- `POST /analyze-speech` - Speech emotion analysis
- `POST /analyze-chat` - Chat mental state analysis
- `POST /analyze-survey` - Survey burnout analysis

### EmoBuddy Endpoints
- `POST /emo-buddy/start` - Start therapeutic session
- `POST /emo-buddy/continue` - Continue conversation
- `POST /emo-buddy/end` - End session with summary

### Analytics Endpoints
- `GET /analytics/overview` - Dashboard statistics
- `GET /analytics/trends` - Emotion and mental state trends
- `GET /health` - Service health checks

## 🧪 Testing

### Run API Tests
```bash
# Test integrated backend
cd services/integrated/backend
python test_api.py

# Test individual services
cd services/video/emp_face && python test_api.py
cd services/stt/api && python test_emo_buddy_api.py
cd services/survey/survey && python test_api.py
```

### Load Testing
```bash
python run_load_test.py
```

## 🐳 Docker Deployment

### Using Docker Compose
```bash
docker-compose up -d
```

### Individual Service Containers
```bash
# Build and run specific services
docker build -t emotion-analyzer-frontend ./apps/frontend
docker build -t emotion-analyzer-backend ./services/integrated/backend
docker run -p 5173:5173 emotion-analyzer-frontend
docker run -p 9000:9000 emotion-analyzer-backend
```

## 🔍 Monitoring & Observability

### Health Checks
- All services expose `/health` endpoints
- Frontend displays real-time service status
- Automatic service discovery and monitoring

### Metrics
- Prometheus metrics at `/metrics` endpoints
- Performance monitoring and alerting
- Request/response time tracking

### Logging
- Structured logging across all services
- Centralized log aggregation
- Error tracking and debugging

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: User permissions and authorization
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-origin request security
- **Data Encryption**: Sensitive data protection

## 🔧 Configuration

### Environment Variables
```env
# Core Service
DATABASE_URL=postgresql://user:password@localhost/emotion_db
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your_jwt_secret

# EmoBuddy Service
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# Frontend
VITE_API_BASE_URL=http://localhost:9000
VITE_ENABLE_ANALYTICS=true
```

## 📊 Recent Updates & Fixes

### Latest Improvements
- ✅ Fixed EmoBuddy session management and memory storage
- ✅ Enhanced speech analysis with automatic EmoBuddy integration
- ✅ Improved accessibility with multiple EmoBuddy access points
- ✅ Added comprehensive error handling and logging
- ✅ Implemented streaming responses for better UX
- ✅ Enhanced crisis detection and support resources

### Performance Optimizations
- ⚡ Optimized bundle size and loading times
- ⚡ Implemented lazy loading for components
- ⚡ Added caching for API responses
- ⚡ Improved database query performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the service-specific README files
- Review the API documentation
- Contact the development team

## 🎯 Roadmap

### Upcoming Features
- [ ] Mobile application support
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration with external therapy platforms
- [ ] Enhanced ML models for better accuracy
- [ ] Real-time collaboration features

---

**Built with ❤️ for mental health and emotional wellbeing**
#   C I / C D   S e t u p   C o m p l e t e  
 