# 🌐 Integrated Backend - API Gateway

The integrated backend serves as the central API gateway for the Multi-Modal Emotion Analyzer platform, providing unified access to all analysis services and handling request routing, authentication, and response aggregation.

## 🚀 Features

### Core Gateway Functionality
- **🔄 Request Routing**: Intelligent routing to appropriate analysis services
- **🔐 Authentication Proxy**: JWT token validation and user authentication
- **📊 Response Aggregation**: Combining results from multiple services
- **⚡ Load Balancing**: Distributing requests across service instances
- **🛡️ Error Handling**: Comprehensive error handling and recovery
- **📈 Analytics Integration**: Real-time analytics and monitoring

### Service Integration
- **🎥 Video Analysis**: Facial emotion detection integration
- **🎤 Speech Analysis**: Audio transcription and emotion analysis
- **💬 Chat Analysis**: Text-based mental state analysis
- **📊 Survey Analysis**: Burnout prediction and assessment
- **🤖 EmoBuddy Integration**: AI therapeutic companion proxy
- **🏗️ Core Service**: User management and data persistence

## 🏗️ Architecture

### Technology Stack
- **FastAPI** - High-performance async web framework
- **HTTPX** - Async HTTP client for service communication
- **Pydantic** - Data validation and serialization
- **JWT** - Token-based authentication
- **CORS** - Cross-origin resource sharing
- **Prometheus** - Metrics collection and monitoring

### Service Architecture
```
Frontend (5173) → Integrated Backend (9000) → Services
                                          ├── Core Service (8000)
                                          ├── Video Service (8001)
                                          ├── STT Service (8002)
                                          ├── Chat Service (8003)
                                          ├── Survey Service (8004)
                                          └── EmoBuddy Service (8005)
```

## 🛠️ Setup & Installation

### Prerequisites
- **Python 3.8+** (3.9+ recommended)
- **All backend services** running on their respective ports

### Quick Start
```bash
# Navigate to service directory
cd services/integrated/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the service
uvicorn main:app --reload --port 9000
```

### Environment Configuration
```env
# Service URLs
CORE_SERVICE_URL=http://localhost:8000
VIDEO_SERVICE_URL=http://localhost:8001
STT_SERVICE_URL=http://localhost:8002
CHAT_SERVICE_URL=http://localhost:8003
SURVEY_SERVICE_URL=http://localhost:8004
EMOBUDDY_SERVICE_URL=http://localhost:8005

# Gateway Configuration
GATEWAY_PORT=9000
ENABLE_CORS=true
ALLOWED_ORIGINS=["http://localhost:5173"]
LOG_LEVEL=INFO
```

## 🎯 API Endpoints

### Analysis Endpoints
```http
POST /analyze-video      # Video emotion analysis
POST /analyze-speech     # Speech emotion analysis
POST /analyze-chat       # Chat mental state analysis
POST /analyze-survey     # Survey burnout analysis
POST /analyze-all        # Multi-modal analysis
```

### EmoBuddy Proxy Endpoints
```http
POST /emo-buddy/start     # Start therapeutic session
POST /emo-buddy/continue  # Continue conversation
POST /emo-buddy/end       # End session
GET  /emo-buddy/availability  # Check service availability
```

### Analytics Endpoints
```http
GET /analytics/overview   # Dashboard overview
GET /analytics/video      # Video analytics data
GET /analytics/speech     # Speech analytics data
GET /analytics/chat       # Chat analytics data
GET /analytics/survey     # Survey analytics data
```

### Health & Monitoring
```http
GET /health              # Gateway health check
GET /health/services     # All services health status
GET /metrics             # Prometheus metrics
GET /dashboard-stats     # Dashboard statistics
```

## 🔄 Request Flow

### Authentication Flow
1. **Frontend Request** → Integrated Backend
2. **Token Validation** → Core Service
3. **Service Routing** → Target Service
4. **Response Aggregation** → Frontend

### Analysis Flow
1. **Data Validation** → Pydantic models
2. **Service Selection** → Based on analysis type
3. **Request Forwarding** → Target service
4. **Response Processing** → Error handling & formatting
5. **Result Storage** → Core service database

## 📊 Service Monitoring

### Health Checks
```python
@app.get("/health/services")
async def check_all_services():
    services = {
        "core": await check_service_health(CORE_SERVICE_URL),
        "video": await check_service_health(VIDEO_SERVICE_URL),
        "stt": await check_service_health(STT_SERVICE_URL),
        "chat": await check_service_health(CHAT_SERVICE_URL),
        "survey": await check_service_health(SURVEY_SERVICE_URL),
        "emobuddy": await check_service_health(EMOBUDDY_SERVICE_URL)
    }
    return services
```

### Error Handling
- **Service Unavailable**: Graceful degradation
- **Timeout Handling**: Configurable request timeouts
- **Retry Logic**: Automatic retry for transient failures
- **Circuit Breaker**: Prevent cascading failures

## 🚀 Deployment

### Production Setup
```bash
# Using uvicorn with production settings
uvicorn main:app --host 0.0.0.0 --port 9000 --workers 4

# Using gunicorn with uvicorn workers
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:9000
```

### Docker Deployment
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 9000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]
```

## 🧪 Testing

### Run Tests
```bash
# API tests
python test_api.py

# Service integration tests
python -m pytest tests/

# Load testing
python ../../../run_load_test.py
```

---

**Built as the central hub for seamless multi-modal emotion analysis** 