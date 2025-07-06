#!/usr/bin/env python3
"""
Test script for the Emo Buddy API endpoints
"""

import requests
import json
import time
import sys
import os

# Add the parent directory to the path to import modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

API_BASE_URL = "http://localhost:8002"

def test_health_check():
    """Test the health check endpoint"""
    print("Testing health check...")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_emo_buddy_endpoints():
    """Test the Emo Buddy endpoints"""
    print("\nTesting Emo Buddy endpoints...")
    
    # Sample analysis report for testing
    sample_analysis = {
        "transcription": "I'm feeling really stressed about work and I don't know what to do",
        "sentiment": {
            "label": "negative",
            "confidence": 0.85,
            "scores": {
                "negative": 0.85,
                "neutral": 0.1,
                "positive": 0.05
            },
            "polarity": -0.6,
            "subjectivity": 0.8,
            "intensity": "high"
        },
        "emotions": [
            {"emotion": "anxiety", "confidence": 0.92},
            {"emotion": "stress", "confidence": 0.88},
            {"emotion": "overwhelm", "confidence": 0.75}
        ]
    }
    
    try:
        # Test starting an Emo Buddy session
        print("1. Testing start session endpoint...")
        start_response = requests.post(
            f"{API_BASE_URL}/start-emo-buddy",
            json={"analysis_report": sample_analysis}
        )
        
        if start_response.status_code == 200:
            print("✅ Start session endpoint works")
            session_data = start_response.json()
            session_id = session_data["session_id"]
            print(f"   Session ID: {session_id}")
            print(f"   Initial response: {session_data['response'][:100]}...")
            
            # Test continuing the conversation
            print("2. Testing continue conversation endpoint...")
            continue_response = requests.post(
                f"{API_BASE_URL}/continue-emo-buddy",
                json={
                    "session_id": session_id,
                    "user_input": "I'm worried about my performance at work"
                }
            )
            
            if continue_response.status_code == 200:
                print("✅ Continue conversation endpoint works")
                continue_data = continue_response.json()
                print(f"   Response: {continue_data['response'][:100]}...")
                print(f"   Should continue: {continue_data['should_continue']}")
                
                # Test session status
                print("3. Testing session status endpoint...")
                status_response = requests.get(f"{API_BASE_URL}/emo-buddy-status/{session_id}")
                
                if status_response.status_code == 200:
                    print("✅ Session status endpoint works")
                    status_data = status_response.json()
                    print(f"   Session active: {status_data['active']}")
                    print(f"   Messages count: {status_data['session_info']['messages_count']}")
                    
                    # Test active sessions
                    print("4. Testing active sessions endpoint...")
                    active_response = requests.get(f"{API_BASE_URL}/active-sessions")
                    
                    if active_response.status_code == 200:
                        print("✅ Active sessions endpoint works")
                        active_data = active_response.json()
                        print(f"   Active sessions count: {active_data['active_sessions_count']}")
                        
                        # Test ending the session
                        print("5. Testing end session endpoint...")
                        end_response = requests.post(
                            f"{API_BASE_URL}/end-emo-buddy",
                            json={"session_id": session_id}
                        )
                        
                        if end_response.status_code == 200:
                            print("✅ End session endpoint works")
                            end_data = end_response.json()
                            print(f"   Session summary: {end_data['summary'][:100]}...")
                            return True
                        else:
                            print(f"❌ End session failed: {end_response.status_code}")
                            return False
                    else:
                        print(f"❌ Active sessions failed: {active_response.status_code}")
                        return False
                else:
                    print(f"❌ Session status failed: {status_response.status_code}")
                    return False
            else:
                print(f"❌ Continue conversation failed: {continue_response.status_code}")
                return False
        else:
            print(f"❌ Start session failed: {start_response.status_code}")
            print(f"   Error: {start_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Emo Buddy endpoint test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Emo Buddy API Integration")
    print("=" * 50)
    
    # Check if API is running
    if not test_health_check():
        print("\n❌ API is not running. Please start the API first:")
        print("   cd stt/api && python main.py")
        return
    
    # Test Emo Buddy endpoints
    if test_emo_buddy_endpoints():
        print("\n✅ All Emo Buddy API tests passed!")
    else:
        print("\n❌ Some Emo Buddy API tests failed.")
        print("   Make sure you have:")
        print("   - Set GEMINI_API_KEY environment variable")
        print("   - Set GROQ_API_KEY environment variable")
        print("   - All required dependencies installed")

if __name__ == "__main__":
    main() 