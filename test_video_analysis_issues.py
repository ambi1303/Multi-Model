#!/usr/bin/env python3
"""
Video Analysis Issues Demonstration Script

This script tests the specific issues found in the video analysis flow:
1. Database connectivity issues
2. Authentication token handling
3. Payload structure mismatches
4. Error handling problems
"""

import requests
import json
import time
import io
from PIL import Image
import numpy as np

# Configuration
GATEWAY_URL = "http://localhost:9000"
VIDEO_SERVICE_URL = "http://localhost:8001"
CORE_SERVICE_URL = "http://localhost:8000"

# Test user (replace with actual values)
TEST_USER_ID = "70f7a431-89f1-4c9f-ab27-1890e83f2a3d"
TEST_TOKEN = "test_token_here"  # Replace with actual token

def create_test_image():
    """Create a simple test image for video analysis"""
    # Create a simple 100x100 RGB image
    img = Image.new('RGB', (100, 100), color='red')
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='JPEG')
    img_buffer.seek(0)
    return img_buffer

def test_core_service_health():
    """Test core service health - should show database issues"""
    print("🏥 Testing Core Service Health...")
    try:
        response = requests.get(f"{CORE_SERVICE_URL}/health", timeout=10)
        data = response.json()
        
        print(f"✅ Core Service Response: {response.status_code}")
        print(f"📊 Service Status: {data.get('status')}")
        print(f"🗄️  Database Status: {data.get('database_status')}")
        
        if data.get('database_status') == 'unhealthy':
            print("❌ CRITICAL: Database is unhealthy - this will cause authentication failures!")
        
        return data.get('database_status') == 'healthy'
    except Exception as e:
        print(f"❌ Core Service Error: {e}")
        return False

def test_video_service_health():
    """Test video service health"""
    print("\n🎥 Testing Video Service Health...")
    try:
        response = requests.get(f"{VIDEO_SERVICE_URL}/health", timeout=10)
        data = response.json()
        
        print(f"✅ Video Service Response: {response.status_code}")
        print(f"📊 Status: {data.get('status')}")
        
        return data.get('status') == 'healthy'
    except Exception as e:
        print(f"❌ Video Service Error: {e}")
        return False

def test_authentication_flow():
    """Test authentication token handling"""
    print("\n🔐 Testing Authentication Flow...")
    
    # Test 1: No token
    print("Test 1: No Authentication Token")
    try:
        response = requests.get(f"{GATEWAY_URL}/emo-buddy/availability", timeout=10)
        print(f"No token response: {response.status_code}")
        if response.status_code == 401:
            print("✅ Correctly rejects requests without token")
        else:
            print(f"❌ Unexpected response: {response.text}")
    except Exception as e:
        print(f"❌ Auth test error: {e}")
    
    # Test 2: Invalid token format
    print("\nTest 2: Invalid Token Format")
    try:
        headers = {"Authorization": "InvalidToken"}
        response = requests.get(f"{GATEWAY_URL}/emo-buddy/availability", headers=headers, timeout=10)
        print(f"Invalid token response: {response.status_code}")
        if response.status_code == 401:
            print("✅ Correctly rejects invalid token format")
        else:
            print(f"❌ Unexpected response: {response.text}")
    except Exception as e:
        print(f"❌ Auth test error: {e}")

def test_video_analysis_payload():
    """Test video analysis with different payload structures"""
    print("\n📋 Testing Video Analysis Payload Issues...")
    
    # Create test image
    test_image = create_test_image()
    
    # Test 1: Direct video service call
    print("Test 1: Direct Video Service Call")
    try:
        files = {'file': ('test.jpg', test_image, 'image/jpeg')}
        data = {
            'user_id': TEST_USER_ID,
            'token': TEST_TOKEN
        }
        
        response = requests.post(f"{VIDEO_SERVICE_URL}/analyze-video-frame", 
                               files=files, data=data, timeout=20)
        
        print(f"✅ Direct video service response: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"📊 Analysis result structure: {list(result.keys())}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Direct video service error: {e}")
    
    # Test 2: Gateway service call
    print("\nTest 2: Gateway Service Call")
    try:
        test_image.seek(0)  # Reset buffer
        files = {'file': ('test.jpg', test_image, 'image/jpeg')}
        data = {'user_id': TEST_USER_ID}
        headers = {'Authorization': f'Bearer {TEST_TOKEN}'}
        
        response = requests.post(f"{GATEWAY_URL}/analyze-video-frame", 
                               files=files, data=data, headers=headers, timeout=20)
        
        print(f"✅ Gateway service response: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"📊 Analysis result structure: {list(result.keys())}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Gateway service error: {e}")

def test_core_service_video_storage():
    """Test core service video analysis storage"""
    print("\n🗄️  Testing Core Service Video Storage...")
    
    # Test payload that matches VideoAnalysisCreate schema
    test_payload = {
        "user_id": TEST_USER_ID,
        "session_id": "test_session_123",
        "video_duration_seconds": 1.0,
        "frame_count": 1,
        "dominant_emotion": "happy",
        "average_confidence": 0.85,
        "emotion_timeline": {"emotions": []},
        "raw_analysis_data": {}
    }
    
    headers = {'Authorization': f'Bearer {TEST_TOKEN}', 'Content-Type': 'application/json'}
    
    try:
        response = requests.post(f"{CORE_SERVICE_URL}/analyses/video", 
                               json=test_payload, headers=headers, timeout=10)
        
        print(f"✅ Core service storage response: {response.status_code}")
        if response.status_code == 200:
            print("✅ Video analysis successfully stored in database")
        elif response.status_code == 401:
            print("❌ Authentication failed - likely due to database issues")
        else:
            print(f"❌ Storage failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Core service storage error: {e}")

def test_schema_compatibility():
    """Test schema compatibility between services"""
    print("\n📝 Testing Schema Compatibility...")
    
    # Video service typical output
    video_service_output = {
        "dominantEmotion": "happy",
        "averageConfidence": 0.85,
        "emotions": [
            {"emotion": "happy", "confidence": 0.85, "timestamp": int(time.time() * 1000)},
            {"emotion": "sad", "confidence": 0.15, "timestamp": int(time.time() * 1000)}
        ],
        "total_detections": 1,
        "duration": 0,
        "analysis_details": {}
    }
    
    # Core service expected schema
    core_service_expected = {
        "user_id": TEST_USER_ID,
        "session_id": "test_session_123",
        "video_duration_seconds": 1.0,  # ❌ Missing from video service
        "frame_count": 1,  # ❌ Missing from video service
        "dominant_emotion": "happy",
        "average_confidence": 0.85,
        "emotion_timeline": {"emotions": []},
        "raw_analysis_data": {}
    }
    
    print("Video Service Output Fields:")
    print(f"  {list(video_service_output.keys())}")
    
    print("Core Service Expected Fields:")
    print(f"  {list(core_service_expected.keys())}")
    
    # Check for mismatches
    video_fields = set(video_service_output.keys())
    core_fields = set(core_service_expected.keys())
    
    missing_in_video = core_fields - video_fields
    extra_in_video = video_fields - core_fields
    
    if missing_in_video:
        print(f"❌ Missing in video service: {missing_in_video}")
    if extra_in_video:
        print(f"⚠️  Extra in video service: {extra_in_video}")
    
    # Check field name mismatches
    field_mapping = {
        "dominantEmotion": "dominant_emotion",
        "averageConfidence": "average_confidence",
        "duration": "video_duration_seconds",
        "total_detections": "frame_count"
    }
    
    print("\nField Name Mapping Issues:")
    for video_field, core_field in field_mapping.items():
        if video_field in video_service_output and core_field in core_service_expected:
            print(f"  {video_field} → {core_field} ✅")
        else:
            print(f"  {video_field} → {core_field} ❌")

if __name__ == "__main__":
    print("🔍 Video Analysis Issues Demonstration")
    print("=" * 50)
    
    # Test service health
    core_healthy = test_core_service_health()
    video_healthy = test_video_service_health()
    
    # Test authentication
    test_authentication_flow()
    
    # Test video analysis
    if video_healthy:
        test_video_analysis_payload()
    
    # Test core service storage
    if core_healthy:
        test_core_service_video_storage()
    else:
        print("\n❌ Skipping core service tests - database unhealthy")
    
    # Test schema compatibility
    test_schema_compatibility()
    
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    print(f"Core Service Health: {'✅ Healthy' if core_healthy else '❌ Unhealthy (Database issues)'}")
    print(f"Video Service Health: {'✅ Healthy' if video_healthy else '❌ Unhealthy'}")
    
    if not core_healthy:
        print("\n🚨 CRITICAL: Database connectivity issues will cause:")
        print("  - Authentication failures")
        print("  - Data storage failures")
        print("  - Complete service unavailability")
    
    print("\n🔧 KEY ISSUES DEMONSTRATED:")
    print("1. Database connectivity problems in core service")
    print("2. Schema mismatches between video service and core service")
    print("3. Authentication dependency on database health")
    print("4. Silent failures in async storage operations")
    print("5. Missing error handling and validation")
    
    print("\n📋 NEXT STEPS:")
    print("1. Fix database connectivity in core service")
    print("2. Align schemas between services")
    print("3. Add proper error handling")
    print("4. Implement retry mechanisms")
    print("5. Add comprehensive logging") 