# Data Flow Architecture Audit Report

## **CRITICAL ISSUES IDENTIFIED**

### **1. Port Conflicts - URGENT**
**Problem**: Both the integrated backend (gateway) and core service are configured to run on port 9000
- **Current Conflict**: 
  - Core Service: `uvicorn.run(app, host="0.0.0.0", port=9000)` 
  - Integrated Backend: `uvicorn.run(app, host="0.0.0.0", port=9000)`
- **Impact**: Only one service can run, breaking the entire gateway architecture

### **2. Missing Core Service Integration in Gateway**
**Problem**: The integrated backend has NO connection to the core service for database operations
- **Current State**: Only forwards requests to individual services but doesn't coordinate database storage
- **Missing**: No CORE_SERVICE_URL configuration in integrated backend
- **Impact**: Data is processed but not stored in database consistently

### **3. Incorrect Service URL Configurations**
**Problem**: Individual services point to wrong core service ports
```
- STT Service: CORE_SERVICE_URL = "http://localhost:8000" ❌
- EmoBuddy Service: CORE_SERVICE_URL = "http://localhost:8000" ❌  
- Video Service: CORE_SERVICE_URL = "http://localhost:9000" ❌
- Chat Service: CORE_SERVICE_URL = "http://localhost:9000" ❌
```
- **Correct**: Core service should be on a dedicated port (e.g., 8000)

### **4. Broken Data Flow Architecture**
**Current Broken Flow**:
```
Frontend (via API calls) 
    ↓
Integrated Backend (Port 9000) - CONFLICTS WITH CORE SERVICE
    ↓
Individual Services (Ports 8001-8005)
    ↓
Core Service (Port 9000) - SAME PORT AS GATEWAY ❌
    ↓
Database
```

**Required Correct Flow**:
```
Frontend (via API calls)
    ↓  
Integrated Backend/Gateway (Port 9000)
    ↓
Individual Services (Ports 8001-8005) 
    ↓
Core Service (Port 8000) ✅
    ↓
Database
```

## **ARCHITECTURAL REQUIREMENTS**

### **1. Port Allocation**
- **Core Service**: Port 8000 (Database operations)
- **Integrated Backend**: Port 9000 (Gateway/API Gateway)  
- **Video Service**: Port 8001
- **STT Service**: Port 8002
- **Chat Service**: Port 8003
- **Survey Service**: Port 8004
- **EmoBuddy Service**: Port 8005

### **2. Data Flow Coordination**
The integrated backend should:
1. **Receive requests** from frontend
2. **Route requests** to appropriate services
3. **Coordinate database storage** via core service
4. **Aggregate responses** and return to frontend
5. **Handle errors** and service unavailability

### **3. Database Storage Strategy**
**Option A - Gateway Orchestrated (Recommended)**:
```
Frontend → Gateway → Service (processing) → Gateway → Core Service (storage) → Database
```

**Option B - Direct Service Storage (Current)**:
```
Frontend → Gateway → Service (processing + direct storage to core) → Database
```

## **REQUIRED FIXES**

### **Fix 1: Update Core Service Port**
```yaml
# services/core/main.py
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)  # Changed from 9000
```

### **Fix 2: Update start_all_backends.py**
```python
"core": {"port": 8000, "path": "services/core/main.py"},  # Changed from 9000
```

### **Fix 3: Add Core Service Integration to Gateway**
```yaml
# services/integrated/backend/config.yaml
backend_urls:
  core: http://localhost:8000  # Add core service URL
  video: http://localhost:8001/analyze-emotion
  # ... rest
```

### **Fix 4: Update All Service URLs**
```python
# All services should use:
CORE_SERVICE_URL = "http://localhost:8000"
```

### **Fix 5: Implement Database Orchestration**
Add database storage coordination in integrated backend:
```python
# Store analysis results in core database after processing
await store_analysis_result(core_service_url, analysis_data, user_id)
```

## **IMMEDIATE ACTION REQUIRED**

1. **Stop all services**
2. **Fix port conflicts** (core service to 8000)
3. **Update service configurations**
4. **Add database orchestration**
5. **Test complete data flow**

## **TESTING VERIFICATION**

After fixes, verify:
1. ✅ Frontend can reach gateway (port 9000)
2. ✅ Gateway can reach all services (8001-8005)
3. ✅ Services can reach core service (port 8000)
4. ✅ Data is stored in database
5. ✅ Responses flow back to frontend
6. ✅ Error handling works properly

## **IMPACT ASSESSMENT**

**Current State**: 🔴 **BROKEN** - Data is processed but not consistently stored
**After Fixes**: 🟢 **FUNCTIONAL** - Complete data flow with proper database storage 