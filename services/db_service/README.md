# Mental Health Analytics Database Service

A centralized PostgreSQL database service for storing and retrieving mental health analytics data from multiple services (Chat Analysis, STT, Video Analysis, EmoBuddy, Survey Results).

## 🏗️ Architecture

This service provides a unified data layer with:
- **FastAPI** REST API with automatic OpenAPI documentation
- **PostgreSQL** database with **SQLAlchemy** ORM
- **JWT Authentication** with role-based access
- **Comprehensive CRUD operations** for all data types
- **Analytics endpoints** for dashboard and reporting
- **Audit logging** for all operations

## 📁 Project Structure

```
services/db_service/
├── main.py              # FastAPI application with all endpoints
├── models.py            # SQLAlchemy database models
├── schemas.py           # Pydantic request/response schemas
├── database.py          # Database connection and session management
├── crud.py              # Database operations (Create, Read, Update, Delete)
├── auth.py              # JWT authentication and password hashing
├── requirements.txt     # Python dependencies
├── setup_database.py    # Database initialization script
├── test_api.py          # API testing script
├── .env.template        # Environment variables template
└── README.md           # This file
```

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file with your database credentials:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@your-neon-endpoint/database_name

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```

### 2. Install Dependencies

```bash
cd services/db_service
pip install -r requirements.txt
```

### 3. Initialize Database

```bash
# Set up database with default data
python setup_database.py

# Or reset database (WARNING: deletes all data)
python setup_database.py --reset
```

### 4. Start the API Server

```bash
python main.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 5. Test the API

```bash
python test_api.py
```

## 🔐 Authentication

The API uses JWT token-based authentication:

1. **Register** a new user: `POST /auth/register`
2. **Login** to get token: `POST /auth/login`
3. Include token in requests: `Authorization: Bearer <token>`

**Default Admin Credentials:**
- Email: `admin@mentalhealth.com`
- Password: `admin123`

## 📊 Database Schema

### Core Tables
- **users** - User accounts with department associations
- **departments** - Organizational departments
- **roles** & **user_roles** - Role-based access control

### Analytics Tables
- **chat_analysis** - Chat conversation analysis results
- **stt_analysis** - Speech-to-text emotion analysis
- **video_analysis** - Facial emotion recognition results
- **emo_buddy_sessions** - EmoBuddy therapeutic session data
- **emo_buddy_phrases** - Individual phrases from sessions
- **survey_results** - Burnout survey responses

### Audit & Reporting
- **audit_logs** - System activity tracking
- **report_snapshots** - Monthly report snapshots
- **aggregated_metrics** - Department-level analytics

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Data Storage (Service Integration)
- `POST /chat-analysis` - Store chat analysis results
- `POST /stt-analysis` - Store speech analysis results
- `POST /video-analysis` - Store video analysis results
- `POST /emo-buddy-sessions` - Store EmoBuddy session data
- `POST /survey-results` - Store survey results

### Data Retrieval
- `GET /chat-analysis/user/{user_id}` - Get user's chat analyses
- `GET /stt-analysis/user/{user_id}/emotion-trends` - Get emotion trends
- `GET /video-analysis/user/{user_id}/emotion-distribution` - Get emotion distribution
- `GET /emo-buddy-sessions/user/{user_id}/statistics` - Get EmoBuddy stats
- `GET /survey-results/user/{user_id}/burnout-trend` - Get burnout trend

### Analytics & Dashboard
- `GET /analytics/user/{user_id}/summary` - User analytics summary
- `GET /analytics/dashboard/overview` - Dashboard overview data
- `GET /departments/{dept_id}/analytics` - Department analytics

## 🔗 Service Integration

### From Chat Service
```python
import requests

# Store chat analysis results
data = {
    "user_id": "user-uuid",
    "raw_messages": {"messages": [...]},
    "summary": {"sentiment": "positive", "topics": [...]}
}
response = requests.post("http://db-service:8000/chat-analysis", json=data)
```

### From STT Service
```python
# Store speech analysis results
data = {
    "user_id": "user-uuid",
    "overall_sentiment": "positive",
    "confidence": 0.85,
    "prominent_emotion": "happy",
    "emotion_score": 0.9,
    "raw_json": {...}
}
response = requests.post("http://db-service:8000/stt-analysis", json=data)
```

### From Video Service
```python
# Store video analysis results
data = {
    "user_id": "user-uuid",
    "dominant_emotion": "neutral",
    "average_confidence": 0.75,
    "analysis_details": {...},
    "frame_emotions": {...}
}
response = requests.post("http://db-service:8000/video-analysis", json=data)
```

## 📈 Dashboard Integration

### Frontend Data Fetching
```javascript
// Get user analytics summary
const response = await fetch('/api/analytics/user/USER_ID/summary', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const summary = await response.json();

// Get dashboard overview
const overview = await fetch('/api/analytics/dashboard/overview');
const dashboardData = await overview.json();
```

## 🛠️ Development

### Adding New Endpoints

1. **Add Model** in `models.py`
2. **Add Schema** in `schemas.py`
3. **Add CRUD operations** in `crud.py`
4. **Add API endpoints** in `main.py`

### Database Migrations

For schema changes, use Alembic:

```bash
pip install alembic
alembic init alembic
alembic revision --autogenerate -m "Add new table"
alembic upgrade head
```

### Testing

Run the test suite:
```bash
python test_api.py
```

Add new tests for your endpoints in `test_api.py`.

## 🐳 Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

## 📊 Performance Considerations

- **Database Indexing**: All foreign keys and frequently queried fields are indexed
- **Connection Pooling**: SQLAlchemy handles connection pooling
- **Async Support**: Ready for async/await if needed
- **Pagination**: All list endpoints support pagination
- **Efficient Queries**: Uses select loading for relationships

## 🔒 Security Features

- **JWT Authentication** with expiration
- **Password Hashing** with bcrypt
- **Role-based Access Control**
- **SQL Injection Protection** via SQLAlchemy ORM
- **CORS Configuration** for frontend integration
- **Audit Logging** for security monitoring

## 📝 Monitoring & Logs

- **Health Check Endpoint**: `/health`
- **Audit Logs**: All operations logged with user tracking
- **Error Handling**: Comprehensive error responses
- **Request Validation**: Pydantic schema validation

## 🤝 Contributing

1. Follow the existing code structure
2. Add appropriate tests for new features
3. Update documentation for API changes
4. Ensure all tests pass before submitting

## 📄 License

This project is part of the Mental Health Analytics platform. 