# 🧠 Mental Health Analytics Platform - Professional Backend

A comprehensive, enterprise-grade backend system for mental health analytics and monitoring, built with modern Python technologies and best practices.

## 🏗️ Architecture Overview

This backend implements a **clean architecture** with clear separation of concerns:

```
├── 🎯 API Layer (FastAPI)           → HTTP endpoints, validation, serialization
├── 🛡️ Middleware Layer              → Auth, logging, rate limiting, CORS
├── 🔧 Service Layer                 → Business logic and orchestration  
├── 🗃️ Repository Layer              → Data access abstraction
├── 💾 Database Layer (PostgreSQL)   → Data persistence and transactions
└── ⚡ Cache Layer (Redis)           → Performance optimization
```

## ✨ Key Features

### 🔐 **Enterprise Authentication & Authorization**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Account lockout protection
- Password complexity requirements
- Secure session management

### 📊 **Comprehensive Data Management**
- **Users & Departments**: Complete organizational structure
- **Chat Analysis**: NLP sentiment and emotion analysis
- **Speech Analysis**: Voice emotion detection and transcription
- **Video Analysis**: Facial emotion recognition with confidence scores
- **EmoBuddy Sessions**: Therapeutic AI conversation tracking
- **Survey Responses**: Burnout prediction and mental health assessments

### 🚀 **Professional-Grade Infrastructure**
- **Database Migrations**: Alembic-powered schema versioning
- **Connection Pooling**: Optimized database performance
- **Redis Caching**: High-performance data caching
- **Rate Limiting**: API protection and abuse prevention
- **Health Monitoring**: Comprehensive system health checks
- **Audit Logging**: Complete activity tracking
- **Metrics Collection**: Prometheus-compatible monitoring

### 🛡️ **Security & Reliability**
- SQL injection protection via ORM
- Input validation with Pydantic
- CORS configuration
- Request/response logging
- Error handling and recovery
- Transaction management

## 🚀 Quick Start

### 1. **Environment Setup**

```bash
# Clone the repository
git clone <repository-url>
cd services/core

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. **Database Setup**

```bash
# Set up PostgreSQL database
createdb mental_health_db

# Copy environment configuration
cp env_example.txt .env

# Edit .env with your database credentials
DATABASE_URL=postgresql://username:password@localhost:5432/mental_health_db
AUTH_SECRET_KEY=your-super-secret-key-here
```

### 3. **Database Migrations**

```bash
# Initialize Alembic (if not already done)
alembic init alembic

# Generate initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 4. **Redis Setup**

```bash
# Install and start Redis
redis-server

# Verify Redis connection
redis-cli ping
```

### 5. **Start the Application**

```bash
# Development mode
python -m core.main

# Production mode with Gunicorn
gunicorn core.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

### 6. **Access the API**

- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Metrics**: http://localhost:8000/metrics

## 📡 API Endpoints

### 🔐 Authentication
```
POST   /auth/register          Register new user
POST   /auth/login             User login
GET    /auth/me                Get current user profile
```

### 👥 User Management
```
GET    /users                  List users (paginated)
GET    /users/{user_id}        Get specific user
PUT    /users/{user_id}        Update user profile
```

### 🏢 Department Management
```
GET    /departments            List departments
POST   /departments            Create department (Admin only)
```

### 📊 Analysis Storage
```
POST   /analyses/chat          Store chat analysis results
POST   /analyses/speech        Store speech analysis results
POST   /analyses/video         Store video analysis results
GET    /analyses/chat/user/{user_id}    Get user's chat analyses
```

### 🧠 EmoBuddy Integration
```
POST   /emo-buddy/sessions     Create/get active session
POST   /emo-buddy/sessions/{session_uuid}/messages    Add message
PUT    /emo-buddy/sessions/{session_uuid}/end         End session
```

### 📋 Survey Management
```
POST   /surveys/responses      Store survey response
GET    /surveys/responses/user/{user_id}/burnout-trend    Get burnout trend
```

### 📈 Analytics & Reporting
```
GET    /analytics/user/{user_id}/summary        Comprehensive user analytics
GET    /analytics/dashboard/overview            Dashboard overview data
```

### 🔍 System Monitoring
```
GET    /health                 Comprehensive health check
GET    /health/database        Database-specific health
GET    /health/redis           Redis-specific health
GET    /metrics                Prometheus metrics
```

## 🗃️ Database Schema

### Core Entities
- **Users**: Complete user profiles with security features
- **Departments**: Organizational structure
- **Roles**: Role-based access control

### Analysis Data
- **ChatAnalysis**: Message sentiment, emotions, mental states
- **SpeechAnalysis**: Voice analysis with transcription
- **VideoAnalysis**: Facial emotion detection results
- **EmoBuddySession/Message**: Therapeutic conversation tracking
- **SurveyResponse**: Burnout and mental health assessments

### System Tables
- **AuditLog**: Complete activity tracking
- **SystemHealth**: Service monitoring data

### Key Features
- **UUID Primary Keys** for security
- **Proper Indexes** for performance
- **Constraints & Validation** for data integrity
- **Soft Deletes** with `is_active` flags
- **Timestamping** for all records
- **JSONB Fields** for flexible data storage

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# Authentication
AUTH_SECRET_KEY=your-secret-key
AUTH_ACCESS_TOKEN_EXPIRE_MINUTES=30
AUTH_REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis
REDIS_URL=redis://localhost:6379/0

# Service
SERVICE_NAME=mental-health-analytics
SERVICE_PORT=8000
SERVICE_DEBUG=false

# Rate Limiting
SERVICE_RATE_LIMIT_REQUESTS=100
SERVICE_RATE_LIMIT_WINDOW=60

# Monitoring
SERVICE_ENABLE_METRICS=true
SERVICE_LOG_LEVEL=INFO
```

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=core --cov-report=html

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```

## 📊 Monitoring & Observability

### Health Checks
- **Database connectivity** and response time
- **Redis availability** and performance
- **Service dependencies** status
- **System resources** (CPU, memory)

### Metrics Collection
- **HTTP request** counts and latencies
- **Database query** performance
- **Cache hit/miss** ratios
- **Error rates** by endpoint
- **Active user** sessions

### Logging
- **Structured logging** with request IDs
- **Audit trails** for all operations
- **Error tracking** with stack traces
- **Performance monitoring**

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["gunicorn", "core.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

### Production Considerations

1. **Environment Variables**: Use secure secret management
2. **Database**: Configure connection pooling and monitoring
3. **Redis**: Set up clustering for high availability
4. **Load Balancing**: Use nginx or cloud load balancers
5. **SSL/TLS**: Terminate SSL at the load balancer
6. **Monitoring**: Set up Prometheus + Grafana
7. **Logging**: Use centralized logging (ELK stack)

## 🔒 Security Features

### Authentication Security
- **JWT tokens** with expiration
- **Refresh token** rotation
- **Account lockout** after failed attempts
- **Password complexity** requirements

### API Security
- **Rate limiting** per user/IP
- **Input validation** with Pydantic
- **SQL injection** protection
- **CORS** configuration
- **Security headers**

### Data Protection
- **Password hashing** with bcrypt
- **Audit logging** for compliance
- **Soft deletes** for data recovery
- **Role-based access** control

## 📈 Performance Optimization

### Database
- **Connection pooling** with configurable limits
- **Query optimization** with proper indexes
- **Async operations** for I/O-bound tasks
- **Read replicas** support ready

### Caching
- **Redis caching** for frequently accessed data
- **Query result caching**
- **Session storage** in Redis
- **Cache invalidation** strategies

### API Performance
- **Async/await** throughout the application
- **Request batching** capabilities
- **Pagination** for large datasets
- **Response compression**

## 🤝 Contributing

1. **Code Style**: Follow PEP 8 and use Black formatter
2. **Testing**: Write tests for all new features
3. **Documentation**: Update docs for API changes
4. **Security**: Review security implications
5. **Performance**: Consider performance impact

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **API Documentation**: `/docs` endpoint
- **Health Monitoring**: `/health` endpoint
- **Error Logs**: Check application logs
- **Performance Metrics**: `/metrics` endpoint

---

**Built with ❤️ for mental health analytics and monitoring** 