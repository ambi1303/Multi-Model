# Critical Fixes Summary - IMMEDIATE ACTION REQUIRED

## 🚨 URGENT FIXES (Fix These First)

### 1. **Port Conflict - EmoBuddy Service**
```python
# File: services/emo_buddy/api.py (Line 305)
# CURRENT (BROKEN):
uvicorn.run("api:app", host="0.0.0.0", port=8004, reload=True)

# FIX TO:
uvicorn.run("api:app", host="0.0.0.0", port=8005, reload=True)
```
**Why**: EmoBuddy and Survey services both run on port 8004, causing conflicts.

### 2. **Service URL Configuration**
```python
# File: services/integrated/backend/config.yaml
# UPDATE:
backend_urls:
  core: http://localhost:8000
  video: http://localhost:8001/analyze-emotion
  stt: http://localhost:8002/analyze-speech
  chat: http://localhost:8003/analyze/single
  survey: http://localhost:8004/analyze
  emo_buddy: http://localhost:8005  # Changed from 8004
```

### 3. **Frontend API Base URL**
```typescript
// File: apps/frontend/src/services/api.ts
// ENSURE:
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';
```

## 🔧 MEDIUM PRIORITY FIXES

### 4. **Authentication Token Forwarding**
```python
# File: services/integrated/backend/main.py
# ENSURE all proxy functions forward tokens like this:
async def proxy_to_service(service_url, payload, token):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    async with session.post(service_url, json=payload, headers=headers) as resp:
        return await resp.json()
```

### 5. **Data Schema Consistency**
```typescript
// File: apps/frontend/src/types/index.ts
// STANDARDIZE field names to match backend:
interface VideoAnalysisResult {
  dominant_emotion: string;      // NOT dominantEmotion
  average_confidence: number;    // NOT averageConfidence
  emotion_timeline: any;         // Add missing fields
}

interface SpeechAnalysisResult {
  transcribed_text: string;      // NOT transcription
  audio_duration_seconds: number; // NOT duration
  session_id: string;            // NOT sessionId
}
```

## 📋 VERIFICATION CHECKLIST

### After Making Fixes:
- [ ] All services can start simultaneously without port conflicts
- [ ] Frontend can reach the integrated gateway (port 9000)
- [ ] Gateway can reach all backend services
- [ ] Authentication tokens are properly forwarded
- [ ] Database connections work from core service
- [ ] All API endpoints return consistent response formats

### Test Commands:
```bash
# 1. Check port conflicts
netstat -tulpn | grep LISTEN

# 2. Test service startup
python start_all_services_fixed.py

# 3. Test API connectivity
curl http://localhost:9000/health
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
curl http://localhost:8004/health
curl http://localhost:8005/health
```

## 🎯 EXPECTED OUTCOME

After implementing these fixes:
- ✅ All services run on unique ports
- ✅ Frontend → Gateway → Services → Database flow works
- ✅ Authentication tokens are properly handled
- ✅ Data schemas are consistent
- ✅ Error handling is standardized
- ✅ System is production-ready

## 🔍 MONITORING COMMANDS

```bash
# Check if all services are running
ps aux | grep python | grep -E "(8000|8001|8002|8003|8004|8005|9000)"

# Check service health
curl -s http://localhost:9000/health | jq .
curl -s http://localhost:8000/health | jq .

# Monitor logs
tail -f services/*/logs/*.log
```

---

**⚠️ CRITICAL**: Do not proceed with production deployment until all urgent fixes are implemented and verified. 