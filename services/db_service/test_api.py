#!/usr/bin/env python3
"""
Test script for the Database Service API
"""

import requests
import json
from datetime import datetime
import uuid

# Configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

class APITester:
    def __init__(self, base_url=BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        
    def test_health_check(self):
        """Test health check endpoint."""
        print("🔍 Testing health check...")
        response = self.session.get(f"{self.base_url}/health")
        assert response.status_code == 200
        print("✅ Health check passed")
        return response.json()
    
    def test_register_user(self):
        """Test user registration."""
        print("🔍 Testing user registration...")
        user_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "dept_id": None
        }
        response = self.session.post(f"{self.base_url}/auth/register", json=user_data)
        
        if response.status_code == 400 and "already registered" in response.text:
            print("⚠️  User already exists, continuing with login...")
            return None
        
        assert response.status_code == 200
        user = response.json()
        self.user_id = user["id"]
        print(f"✅ User registered with ID: {self.user_id}")
        return user
    
    def test_login_user(self):
        """Test user login."""
        print("🔍 Testing user login...")
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
        assert response.status_code == 200
        
        token_data = response.json()
        self.token = token_data["access_token"]
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        print("✅ User logged in successfully")
        return token_data
    
    def test_get_current_user(self):
        """Test getting current user info."""
        print("🔍 Testing get current user...")
        response = self.session.get(f"{self.base_url}/auth/me")
        assert response.status_code == 200
        
        user = response.json()
        if not self.user_id:
            self.user_id = user["id"]
        print(f"✅ Current user retrieved: {user['email']}")
        return user
    
    def test_create_department(self):
        """Test creating a department."""
        print("🔍 Testing department creation...")
        dept_data = {
            "name": f"Test Department {datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }
        response = self.session.post(f"{self.base_url}/departments", json=dept_data)
        assert response.status_code == 200
        
        department = response.json()
        print(f"✅ Department created: {department['name']}")
        return department
    
    def test_chat_analysis(self):
        """Test chat analysis endpoints."""
        print("🔍 Testing chat analysis...")
        
        # Create chat analysis
        analysis_data = {
            "user_id": self.user_id,
            "raw_messages": {"messages": ["Hello", "How are you?"]},
            "summary": {"sentiment": "positive", "topics": ["greeting"]}
        }
        response = self.session.post(f"{self.base_url}/chat-analysis", json=analysis_data)
        assert response.status_code == 200
        
        analysis = response.json()
        print(f"✅ Chat analysis created with ID: {analysis['id']}")
        
        # Get user's chat analyses
        response = self.session.get(f"{self.base_url}/chat-analysis/user/{self.user_id}")
        assert response.status_code == 200
        
        analyses = response.json()
        print(f"✅ Retrieved {len(analyses)} chat analyses")
        return analysis
    
    def test_stt_analysis(self):
        """Test STT analysis endpoints."""
        print("🔍 Testing STT analysis...")
        
        # Create STT analysis
        analysis_data = {
            "user_id": self.user_id,
            "overall_sentiment": "positive",
            "confidence": 0.85,
            "prominent_emotion": "happy",
            "emotion_score": 0.9,
            "raw_json": {"details": "test data"}
        }
        response = self.session.post(f"{self.base_url}/stt-analysis", json=analysis_data)
        assert response.status_code == 200
        
        analysis = response.json()
        print(f"✅ STT analysis created with ID: {analysis['id']}")
        
        # Get emotion trends
        response = self.session.get(f"{self.base_url}/stt-analysis/user/{self.user_id}/emotion-trends")
        assert response.status_code == 200
        
        trends = response.json()
        print(f"✅ Retrieved emotion trends: {len(trends)} entries")
        return analysis
    
    def test_video_analysis(self):
        """Test video analysis endpoints."""
        print("🔍 Testing video analysis...")
        
        # Create video analysis
        analysis_data = {
            "user_id": self.user_id,
            "dominant_emotion": "neutral",
            "average_confidence": 0.75,
            "analysis_details": {"frames_analyzed": 30},
            "frame_emotions": {"frame_1": "happy", "frame_2": "neutral"},
            "timestamp": int(datetime.now().timestamp())
        }
        response = self.session.post(f"{self.base_url}/video-analysis", json=analysis_data)
        assert response.status_code == 200
        
        analysis = response.json()
        print(f"✅ Video analysis created with ID: {analysis['id']}")
        return analysis
    
    def test_emo_buddy_session(self):
        """Test EmoBuddy session endpoints."""
        print("🔍 Testing EmoBuddy session...")
        
        # Create EmoBuddy session
        session_data = {
            "user_id": self.user_id,
            "interactions": 5,
            "emotions": {"primary": "calm", "secondary": "hopeful"},
            "techniques": {"used": ["deep_breathing", "mindfulness"]},
            "recommendations": "Continue with breathing exercises",
            "summary_content": "Positive session with good engagement"
        }
        response = self.session.post(f"{self.base_url}/emo-buddy-sessions", json=session_data)
        assert response.status_code == 200
        
        session = response.json()
        print(f"✅ EmoBuddy session created with ID: {session['session_id']}")
        
        # Get user statistics
        response = self.session.get(f"{self.base_url}/emo-buddy-sessions/user/{self.user_id}/statistics")
        assert response.status_code == 200
        
        stats = response.json()
        print(f"✅ EmoBuddy statistics retrieved: {stats['session_count']} sessions")
        return session
    
    def test_survey_results(self):
        """Test survey results endpoints."""
        print("🔍 Testing survey results...")
        
        # Create survey result
        survey_data = {
            "user_id": self.user_id,
            "burnout_score": 2.5,
            "burnout_percentage": "25%",
            "raw_json": {"q1": 3, "q2": 2, "q3": 3}
        }
        response = self.session.post(f"{self.base_url}/survey-results", json=survey_data)
        assert response.status_code == 200
        
        result = response.json()
        print(f"✅ Survey result created with ID: {result['id']}")
        
        # Get burnout trend
        response = self.session.get(f"{self.base_url}/survey-results/user/{self.user_id}/burnout-trend")
        assert response.status_code == 200
        
        trend = response.json()
        print(f"✅ Burnout trend retrieved: {len(trend)} data points")
        return result
    
    def test_analytics_summary(self):
        """Test analytics summary endpoint."""
        print("🔍 Testing analytics summary...")
        
        response = self.session.get(f"{self.base_url}/analytics/user/{self.user_id}/summary")
        assert response.status_code == 200
        
        summary = response.json()
        print(f"✅ Analytics summary retrieved for user {self.user_id}")
        print(f"   - Chat analyses: {summary['chat_analyses_count']}")
        print(f"   - STT analyses: {summary['stt_analyses_count']}")
        print(f"   - Video analyses: {summary['video_analyses_count']}")
        print(f"   - EmoBuddy sessions: {summary['emo_buddy_sessions_count']}")
        print(f"   - Survey results: {summary['survey_results_count']}")
        return summary
    
    def test_dashboard_overview(self):
        """Test dashboard overview endpoint."""
        print("🔍 Testing dashboard overview...")
        
        response = self.session.get(f"{self.base_url}/analytics/dashboard/overview")
        assert response.status_code == 200
        
        overview = response.json()
        print(f"✅ Dashboard overview retrieved:")
        print(f"   - Active users: {overview['active_users']}")
        print(f"   - Total analyses: {overview['total_analyses']}")
        print(f"   - Avg sentiment: {overview['average_sentiment_score']}")
        return overview
    
    def run_all_tests(self):
        """Run all tests in sequence."""
        print("🚀 Starting API tests...")
        print("=" * 50)
        
        try:
            # Basic tests
            self.test_health_check()
            self.test_register_user()
            self.test_login_user()
            self.test_get_current_user()
            
            # Data creation tests
            self.test_create_department()
            self.test_chat_analysis()
            self.test_stt_analysis()
            self.test_video_analysis()
            self.test_emo_buddy_session()
            self.test_survey_results()
            
            # Analytics tests
            self.test_analytics_summary()
            self.test_dashboard_overview()
            
            print("=" * 50)
            print("🎉 All tests passed successfully!")
            
        except Exception as e:
            print(f"❌ Test failed: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running, starting tests...")
            tester = APITester()
            tester.run_all_tests()
        else:
            print("❌ Server is not responding correctly")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure the API is running on http://localhost:8000")
        print("Run: python main.py")
    except Exception as e:
        print(f"❌ Error: {str(e)}") 