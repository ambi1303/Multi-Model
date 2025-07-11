#!/usr/bin/env python3
"""
Comprehensive test script for all CRUD endpoints
"""
import asyncio
import json
import requests
from typing import Dict, Any
from uuid import uuid4

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_CREDENTIALS = {
    "email": "admin@company.com", 
    "password": "AdminPass123!"
}

class EndpointTester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.session = requests.Session()
    
    def authenticate(self) -> bool:
        """Authenticate and get access token"""
        try:
            response = self.session.post(
                f"{BASE_URL}/auth/login",
                json=ADMIN_CREDENTIALS
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                self.session.headers.update({
                    "Authorization": f"Bearer {self.token}"
                })
                
                # Get user profile
                profile_response = self.session.get(f"{BASE_URL}/auth/me")
                if profile_response.status_code == 200:
                    self.user_id = profile_response.json()["id"]
                    print(f"✅ Authenticated as user: {self.user_id}")
                    return True
            
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def test_health_endpoints(self):
        """Test health check endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        endpoints = [
            "/health",
            "/health/database", 
            "/health/redis"
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"{BASE_URL}{endpoint}")
                print(f"  {'✅' if response.status_code == 200 else '❌'} {endpoint}: {response.status_code}")
            except Exception as e:
                print(f"  ❌ {endpoint}: Error - {e}")
    
    def test_chat_analysis_crud(self):
        """Test chat analysis CRUD operations"""
        print("\n💬 Testing Chat Analysis CRUD...")
        
        # Create chat analysis
        chat_data = {
            "user_id": self.user_id,
            "session_id": f"test_session_{uuid4()}",
            "message_text": "I'm feeling quite happy today!",
            "message_count": 1,
            "sentiment": "positive",
            "sentiment_score": 0.8,
            "dominant_emotion": "happy",
            "mental_state": "calm"
        }
        
        try:
            # CREATE
            response = self.session.post(f"{BASE_URL}/analyses/chat", json=chat_data)
            if response.status_code == 200:
                analysis_id = response.json()["id"]
                print(f"  ✅ Created chat analysis: {analysis_id}")
                
                # READ by ID
                get_response = self.session.get(f"{BASE_URL}/analyses/chat/{analysis_id}")
                print(f"  {'✅' if get_response.status_code == 200 else '❌'} Get by ID: {get_response.status_code}")
                
                # UPDATE
                update_data = {"sentiment": "neutral", "sentiment_score": 0.5}
                update_response = self.session.put(f"{BASE_URL}/analyses/chat/{analysis_id}", json=update_data)
                print(f"  {'✅' if update_response.status_code == 200 else '❌'} Update: {update_response.status_code}")
                
                # READ user analyses
                user_response = self.session.get(f"{BASE_URL}/analyses/chat/user/{self.user_id}")
                print(f"  {'✅' if user_response.status_code == 200 else '❌'} Get user analyses: {user_response.status_code}")
                
                # Analytics endpoints
                trend_response = self.session.get(f"{BASE_URL}/analyses/chat/user/{self.user_id}/sentiment-trend")
                print(f"  {'✅' if trend_response.status_code == 200 else '❌'} Sentiment trend: {trend_response.status_code}")
                
                emotion_response = self.session.get(f"{BASE_URL}/analyses/chat/user/{self.user_id}/emotion-distribution")
                print(f"  {'✅' if emotion_response.status_code == 200 else '❌'} Emotion distribution: {emotion_response.status_code}")
                
                # DELETE (soft delete)
                delete_response = self.session.delete(f"{BASE_URL}/analyses/chat/{analysis_id}")
                print(f"  {'✅' if delete_response.status_code == 200 else '❌'} Delete: {delete_response.status_code}")
                
            else:
                print(f"  ❌ Failed to create chat analysis: {response.status_code}")
                print(f"  Response: {response.text}")
                
        except Exception as e:
            print(f"  ❌ Chat analysis test error: {e}")
    
    def test_speech_analysis_crud(self):
        """Test speech analysis CRUD operations"""
        print("\n🎤 Testing Speech Analysis CRUD...")
        
        speech_data = {
            "user_id": self.user_id,
            "session_id": f"speech_session_{uuid4()}",
            "audio_duration_seconds": 30.5,
            "transcribed_text": "I am speaking clearly and confidently.",
            "sentiment": "positive",
            "dominant_emotion": "confident",
            "speaking_rate": 150.0
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/analyses/speech", json=speech_data)
            if response.status_code == 200:
                analysis_id = response.json()["id"]
                print(f"  ✅ Created speech analysis: {analysis_id}")
                
                # Test other endpoints
                get_response = self.session.get(f"{BASE_URL}/analyses/speech/{analysis_id}")
                print(f"  {'✅' if get_response.status_code == 200 else '❌'} Get by ID: {get_response.status_code}")
                
                user_response = self.session.get(f"{BASE_URL}/analyses/speech/user/{self.user_id}")
                print(f"  {'✅' if user_response.status_code == 200 else '❌'} Get user analyses: {user_response.status_code}")
                
                patterns_response = self.session.get(f"{BASE_URL}/analyses/speech/user/{self.user_id}/speaking-patterns")
                print(f"  {'✅' if patterns_response.status_code == 200 else '❌'} Speaking patterns: {patterns_response.status_code}")
                
            else:
                print(f"  ❌ Failed to create speech analysis: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Speech analysis test error: {e}")
    
    def test_video_analysis_crud(self):
        """Test video analysis CRUD operations"""
        print("\n📹 Testing Video Analysis CRUD...")
        
        video_data = {
            "user_id": self.user_id,
            "session_id": f"video_session_{uuid4()}",
            "video_duration_seconds": 45.0,
            "frame_count": 1125,
            "fps": 25.0,
            "dominant_emotion": "happy",
            "faces_detected": 1
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/analyses/video", json=video_data)
            if response.status_code == 200:
                analysis_id = response.json()["id"]
                print(f"  ✅ Created video analysis: {analysis_id}")
                
                # Test other endpoints
                get_response = self.session.get(f"{BASE_URL}/analyses/video/{analysis_id}")
                print(f"  {'✅' if get_response.status_code == 200 else '❌'} Get by ID: {get_response.status_code}")
                
                timeline_response = self.session.get(f"{BASE_URL}/analyses/video/user/{self.user_id}/emotion-timeline")
                print(f"  {'✅' if timeline_response.status_code == 200 else '❌'} Emotion timeline: {timeline_response.status_code}")
                
            else:
                print(f"  ❌ Failed to create video analysis: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Video analysis test error: {e}")
    
    def test_emobuddy_endpoints(self):
        """Test EmoBuddy session endpoints"""
        print("\n🤖 Testing EmoBuddy Endpoints...")
        
        try:
            # Create session
            session_response = self.session.post(f"{BASE_URL}/emo-buddy/sessions")
            if session_response.status_code == 200:
                session_uuid = session_response.json()["session_uuid"]
                print(f"  ✅ Created EmoBuddy session: {session_uuid}")
                
                # Add message
                message_data = {
                    "message_text": "Hello, I need some help today.",
                    "is_user_message": True,
                    "sentiment": "neutral"
                }
                
                message_response = self.session.post(
                    f"{BASE_URL}/emo-buddy/sessions/{session_uuid}/messages",
                    json=message_data
                )
                print(f"  {'✅' if message_response.status_code == 200 else '❌'} Added message: {message_response.status_code}")
                
                # Get session
                get_session_response = self.session.get(f"{BASE_URL}/emo-buddy/sessions/{session_uuid}")
                print(f"  {'✅' if get_session_response.status_code == 200 else '❌'} Get session: {get_session_response.status_code}")
                
                # Get messages
                messages_response = self.session.get(f"{BASE_URL}/emo-buddy/sessions/{session_uuid}/messages")
                print(f"  {'✅' if messages_response.status_code == 200 else '❌'} Get messages: {messages_response.status_code}")
                
                # Get user sessions
                user_sessions_response = self.session.get(f"{BASE_URL}/emo-buddy/sessions/user/{self.user_id}")
                print(f"  {'✅' if user_sessions_response.status_code == 200 else '❌'} Get user sessions: {user_sessions_response.status_code}")
                
                # Get statistics
                stats_response = self.session.get(f"{BASE_URL}/emo-buddy/user/{self.user_id}/statistics")
                print(f"  {'✅' if stats_response.status_code == 200 else '❌'} Get statistics: {stats_response.status_code}")
                
                # End session
                end_response = self.session.put(f"{BASE_URL}/emo-buddy/sessions/{session_uuid}/end")
                print(f"  {'✅' if end_response.status_code == 200 else '❌'} End session: {end_response.status_code}")
                
            else:
                print(f"  ❌ Failed to create EmoBuddy session: {session_response.status_code}")
                
        except Exception as e:
            print(f"  ❌ EmoBuddy test error: {e}")
    
    def test_survey_endpoints(self):
        """Test survey response endpoints"""
        print("\n📋 Testing Survey Endpoints...")
        
        survey_data = {
            "user_id": self.user_id,
            "survey_type": "burnout_assessment",
            "responses": {
                "question_1": "Sometimes",
                "question_2": "Rarely",
                "burnout_score": 0.3
            },
            "burnout_score": 0.3,
            "stress_level": "low"
        }
        
        try:
            # Create survey response
            response = self.session.post(f"{BASE_URL}/surveys/responses", json=survey_data)
            if response.status_code == 200:
                response_id = response.json()["id"]
                print(f"  ✅ Created survey response: {response_id}")
                
                # Get by ID
                get_response = self.session.get(f"{BASE_URL}/surveys/responses/{response_id}")
                print(f"  {'✅' if get_response.status_code == 200 else '❌'} Get by ID: {get_response.status_code}")
                
                # Get user responses
                user_responses = self.session.get(f"{BASE_URL}/surveys/responses/user/{self.user_id}")
                print(f"  {'✅' if user_responses.status_code == 200 else '❌'} Get user responses: {user_responses.status_code}")
                
                # Get latest by type
                latest_response = self.session.get(f"{BASE_URL}/surveys/responses/user/{self.user_id}/latest?survey_type=burnout_assessment")
                print(f"  {'✅' if latest_response.status_code == 200 else '❌'} Get latest by type: {latest_response.status_code}")
                
                # Get burnout trend
                trend_response = self.session.get(f"{BASE_URL}/surveys/responses/user/{self.user_id}/burnout-trend")
                print(f"  {'✅' if trend_response.status_code == 200 else '❌'} Burnout trend: {trend_response.status_code}")
                
            else:
                print(f"  ❌ Failed to create survey response: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Survey test error: {e}")
    
    def test_analytics_endpoints(self):
        """Test analytics and dashboard endpoints"""
        print("\n📊 Testing Analytics Endpoints...")
        
        try:
            # User analytics summary
            summary_response = self.session.get(f"{BASE_URL}/analytics/user/{self.user_id}/summary")
            print(f"  {'✅' if summary_response.status_code == 200 else '❌'} User analytics summary: {summary_response.status_code}")
            
            # Dashboard overview
            dashboard_response = self.session.get(f"{BASE_URL}/analytics/dashboard/overview")
            print(f"  {'✅' if dashboard_response.status_code == 200 else '❌'} Dashboard overview: {dashboard_response.status_code}")
            
        except Exception as e:
            print(f"  ❌ Analytics test error: {e}")
    
    def test_audit_endpoints(self):
        """Test audit log endpoints"""
        print("\n🔍 Testing Audit Endpoints...")
        
        try:
            # Get audit logs
            logs_response = self.session.get(f"{BASE_URL}/audit/logs")
            print(f"  {'✅' if logs_response.status_code == 200 else '❌'} Get audit logs: {logs_response.status_code}")
            
            # Get logs by user
            user_logs_response = self.session.get(f"{BASE_URL}/audit/logs?user_id={self.user_id}")
            print(f"  {'✅' if user_logs_response.status_code == 200 else '❌'} Get user audit logs: {user_logs_response.status_code}")
            
        except Exception as e:
            print(f"  ❌ Audit test error: {e}")
    
    def test_system_endpoints(self):
        """Test system health monitoring endpoints"""
        print("\n⚙️ Testing System Endpoints...")
        
        try:
            # System health history
            health_response = self.session.get(f"{BASE_URL}/system/health/history")
            print(f"  {'✅' if health_response.status_code == 200 else '❌'} System health history: {health_response.status_code}")
            
        except Exception as e:
            print(f"  ❌ System test error: {e}")
    
    def run_all_tests(self):
        """Run all endpoint tests"""
        print("🚀 Starting Comprehensive CRUD Endpoint Tests")
        print("=" * 50)
        
        # Test server availability
        self.test_health_endpoints()
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Cannot proceed without authentication")
            return
        
        # Run all tests
        self.test_chat_analysis_crud()
        self.test_speech_analysis_crud() 
        self.test_video_analysis_crud()
        self.test_emobuddy_endpoints()
        self.test_survey_endpoints()
        self.test_analytics_endpoints()
        self.test_audit_endpoints()
        self.test_system_endpoints()
        
        print("\n" + "=" * 50)
        print("🎉 All tests completed!")

if __name__ == "__main__":
    tester = EndpointTester()
    tester.run_all_tests() 