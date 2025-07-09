import os
import requests
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class DatabaseClient:
    """Client for storing service results in the centralized database"""
    
    def __init__(self, db_service_url: str = None):
        self.db_service_url = db_service_url or os.getenv('DB_SERVICE_URL', 'http://localhost:8000')
        self.timeout = 10
        self.auth_token = None
        self.current_user_email = None
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers"""
        if self.auth_token:
            return {"Authorization": f"Bearer {self.auth_token}"}
        return {}
    
    def _authenticate_as_user(self, email: str, password: str = "default123") -> bool:
        """Authenticate and get token for a user"""
        try:
            login_data = {"email": email, "password": password}
            response = requests.post(
                f"{self.db_service_url}/auth/login",
                json=login_data,  # Send as JSON, not form data
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.auth_token = token_data.get("access_token")
                self.current_user_email = email
                logger.info(f"Successfully authenticated as {email}")
                return True
            else:
                logger.error(f"Authentication failed for {email}: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return False
        
    def store_chat_analysis(self, user_id: int, analysis_data: Dict[str, Any]) -> bool:
        """Store chat analysis results"""
        try:
            # Map to the schema that the database expects
            payload = {
                "user_id": user_id,
                "raw_messages": {
                    "message_text": analysis_data.get("transcription", ""),
                    "sentiment_score": analysis_data.get("sentiment_score", 0.0),
                    "emotions_detected": analysis_data.get("emotions", []),
                    "mental_state": analysis_data.get("mental_state", "neutral"),
                    "message_metadata": analysis_data.get("message_metadata", {}),
                    "timestamp": datetime.now().isoformat(),
                    "service": "chat"
                },
                "summary": {
                    "primary_emotion": analysis_data.get("emotions", [{}])[0].get("emotion", "neutral") if analysis_data.get("emotions") else "neutral",
                    "emotion_confidence": analysis_data.get("emotions", [{}])[0].get("confidence", 0.0) if analysis_data.get("emotions") else 0.0,
                    "sentiment_score": analysis_data.get("sentiment_score", 0.0),
                    "mental_state": analysis_data.get("mental_state", "neutral"),
                    "analysis_timestamp": datetime.now().isoformat()
                }
            }
            
            response = requests.post(
                f"{self.db_service_url}/chat-analysis/", 
                json=payload, 
                headers=self._get_auth_headers(),
                timeout=self.timeout
            )
            response.raise_for_status()
            logger.info(f"Chat analysis stored successfully for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store chat analysis: {str(e)}")
            return False
    
    def store_stt_analysis(self, user_id: int, analysis_data: Dict[str, Any]) -> bool:
        """Store STT analysis results"""
        try:
            # Map to the schema that the database expects
            sentiment_data = analysis_data.get("sentiment", {})
            emotions_data = analysis_data.get("emotions", [])
            
            # Extract prominent emotion
            prominent_emotion = "neutral"
            emotion_score = 0.0
            if emotions_data:
                # Get the emotion with highest confidence
                max_emotion = max(emotions_data, key=lambda x: x.get("confidence", 0))
                prominent_emotion = max_emotion.get("emotion", "neutral")
                emotion_score = max_emotion.get("confidence", 0.0)
            
            payload = {
                "user_id": user_id,
                "overall_sentiment": sentiment_data.get("label", "neutral"),
                "confidence": sentiment_data.get("confidence", 0.0),
                "prominent_emotion": prominent_emotion,
                "emotion_score": emotion_score,
                "raw_json": {
                    "transcription": analysis_data.get("transcription", ""),
                    "sentiment": sentiment_data,
                    "emotions": emotions_data,
                    "genAIInsights": analysis_data.get("genAIInsights", ""),
                    "technicalReport": analysis_data.get("technicalReport", ""),
                    "analysis_timestamp": datetime.now().isoformat(),
                    "service": "stt"
                }
            }
            
            response = requests.post(
                f"{self.db_service_url}/stt-analysis/", 
                json=payload, 
                headers=self._get_auth_headers(),
                timeout=self.timeout
            )
            response.raise_for_status()
            logger.info(f"STT analysis stored successfully for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store STT analysis: {str(e)}")
            return False
    
    def store_video_analysis(self, user_id: int, analysis_data: Dict[str, Any]) -> bool:
        """Store video analysis results"""
        try:
            # Map to the schema that the database expects
            payload = {
                "user_id": user_id,
                "dominant_emotion": analysis_data.get("dominantEmotion", "neutral"),
                "average_confidence": analysis_data.get("averageConfidence", 0.0),
                "analysis_details": {
                    "emotions_detected": analysis_data.get("emotions", []),
                    "face_features": analysis_data.get("analysis_details", {}),
                    "processing_info": analysis_data.get("processing_info", {}),
                    "analysis_timestamp": datetime.now().isoformat(),
                    "service": "video"
                },
                "frame_emotions": analysis_data.get("frame_emotions", {}),
                "timestamp": int(datetime.now().timestamp())
            }
            
            response = requests.post(
                f"{self.db_service_url}/video-analysis/", 
                json=payload, 
                headers=self._get_auth_headers(),
                timeout=self.timeout
            )
            response.raise_for_status()
            logger.info(f"Video analysis stored successfully for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store video analysis: {str(e)}")
            return False
    
    def store_emo_buddy_session(self, user_id: int, session_data: Dict[str, Any]) -> bool:
        """Store EmoBuddy session results"""
        try:
            # Map to the schema that the database expects
            from datetime import timedelta
            
            # Convert duration string to timedelta if possible
            duration_obj = None
            duration_str = session_data.get("duration", "")
            if duration_str:
                try:
                    # Assume duration is in minutes for now
                    duration_minutes = float(duration_str.replace("min", "").strip())
                    duration_obj = timedelta(minutes=duration_minutes)
                except:
                    duration_obj = None
            
            payload = {
                "user_id": user_id,
                "duration": duration_obj,
                "interactions": session_data.get("interactions_count", 0),
                "emotions": {
                    "emotions_discussed": session_data.get("emotions_tracked", []),
                    "emotion_trends": session_data.get("emotion_trends", []),
                    "primary_emotions": session_data.get("primary_emotions", [])
                },
                "techniques": {
                    "techniques_used": session_data.get("techniques_used", []),
                    "therapeutic_methods": session_data.get("therapeutic_methods", []),
                    "crisis_interventions": session_data.get("crisis_flags", [])
                },
                "recommendations": session_data.get("recommendations", ""),
                "next_steps": session_data.get("next_steps", ""),
                "summary_content": session_data.get("summary", "")
            }
            
            response = requests.post(
                f"{self.db_service_url}/emo-buddy-sessions/", 
                json=payload, 
                headers=self._get_auth_headers(),
                timeout=self.timeout
            )
            response.raise_for_status()
            logger.info(f"EmoBuddy session stored successfully for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store EmoBuddy session: {str(e)}")
            return False
    
    def store_survey_results(self, user_id: int, survey_data: Dict[str, Any]) -> bool:
        """Store survey analysis results"""
        try:
            # Map to the schema that the database expects
            burnout_score = survey_data.get("burn_rate", 0.0)
            stress_level = survey_data.get("stress_level", "low")
            
            # Calculate burnout percentage
            burnout_percentage = f"{int(burnout_score * 100)}%" if burnout_score else "0%"
            
            # Check if this is comprehensive survey data (includes survey questions)
            is_comprehensive = "survey_responses" in survey_data
            survey_type = survey_data.get("analysis_type", "basic_burnout_assessment")
            
            # Prepare base raw_json structure
            raw_json_data = {
                "survey_type": survey_type,
                "employee_data": survey_data.get("employee_data", {}),
                "burn_rate": burnout_score,
                "stress_level": stress_level,
                "model_used": survey_data.get("model_used", ""),
                "prediction_time": survey_data.get("prediction_time", ""),
                "recommendations": survey_data.get("recommendations", []),
                "analysis_timestamp": datetime.now().isoformat(),
                "service": "survey"
            }
            
            # Add comprehensive survey data if available
            if is_comprehensive:
                raw_json_data.update({
                    # Survey Questions (last 10 questions) - Individual responses
                    "survey_responses": survey_data.get("survey_responses", {}),
                    
                    # Survey Scoring - Total score out of 50
                    "survey_total_score": survey_data.get("survey_total_score", 0),
                    "survey_max_score": survey_data.get("survey_max_score", 50),
                    "survey_risk_level": survey_data.get("survey_risk_level", "Unknown"),
                    
                    # Additional analysis from AI
                    "mental_health_summary": survey_data.get("mental_health_summary", ""),
                    "analysis_source": survey_data.get("analysis_source", ""),
                    
                    # Question labels for reference
                    "question_labels": {
                        "q1": "I feel happy and relaxed while doing my job",
                        "q2": "I frequently feel anxious or stressed because of my work",
                        "q3": "I feel emotionally exhausted at the end of my workday",
                        "q4": "I feel motivated and excited about my work",
                        "q5": "I feel a sense of accomplishment and purpose in my role",
                        "q6": "I find myself feeling detached or indifferent about my work",
                        "q7": "My workload is manageable within my regular working hours",
                        "q8": "I have control over how I organize and complete my tasks",
                        "q9": "My manager and team provide support when I face challenges",
                        "q10": "I feel my personal time and work-life balance are respected by the organization"
                    },
                    
                    # Scoring guide for reference
                    "scoring_guide": {
                        "scale": "1-5 Likert Scale (1=Strongly Disagree, 5=Strongly Agree)",
                        "total_range": "10-50 points",
                        "risk_levels": {
                            "Low": "10-17 points",
                            "Medium": "18-34 points", 
                            "High": "35-50 points"
                        }
                    }
                })
            
            payload = {
                "user_id": user_id,
                "burnout_score": burnout_score,
                "burnout_percentage": burnout_percentage,
                "raw_json": raw_json_data
            }
            
            response = requests.post(
                f"{self.db_service_url}/survey-results/", 
                json=payload, 
                headers=self._get_auth_headers(),
                timeout=self.timeout
            )
            response.raise_for_status()
            
            if is_comprehensive:
                logger.info(f"Comprehensive survey results stored successfully for user {user_id} (Score: {survey_data.get('survey_total_score', 0)}/50, Risk: {survey_data.get('survey_risk_level', 'Unknown')})")
            else:
                logger.info(f"Basic survey results stored successfully for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store survey results: {str(e)}")
            return False
    
    def get_or_create_user(self, email: str, name: str = "Anonymous User") -> Optional[int]:
        """Get existing user or create new one, returns user_id"""
        password = "default123"  # Default password for service users
        
        try:
            # First try to authenticate (if user exists)
            if self._authenticate_as_user(email, password):
                # Get user info after successful auth
                response = requests.get(
                    f"{self.db_service_url}/auth/me",
                    headers=self._get_auth_headers(),
                    timeout=self.timeout
                )
                if response.status_code == 200:
                    user_data = response.json()
                    return user_data.get("id")
            
            # If authentication failed, try to create new user
            payload = {
                "email": email,
                "name": name,
                "password": password,
                "role_id": 1,  # Default user role
                "department_id": 1,  # Default department
                "is_active": True
            }
            
            create_response = requests.post(
                f"{self.db_service_url}/auth/register",
                json=payload,
                timeout=self.timeout
            )
            
            if create_response.status_code == 200:
                user_data = create_response.json()
                logger.info(f"Created new user: {email}")
                # Authenticate with the newly created user
                if self._authenticate_as_user(email, password):
                    return user_data.get("id")
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get/create user {email}: {str(e)}")
            return None
    
    def log_audit_event(self, user_id: int, action: str, details: Dict[str, Any]) -> bool:
        """Log audit event"""
        try:
            payload = {
                "user_id": user_id,
                "action": action,
                "details": details,
                "ip_address": "127.0.0.1",  # Default for service calls
                "user_agent": "Service Integration"
            }
            
            response = requests.post(
                f"{self.db_service_url}/audit-logs/", 
                json=payload, 
                timeout=self.timeout
            )
            response.raise_for_status()
            return True
            
        except Exception as e:
            logger.error(f"Failed to log audit event: {str(e)}")
            return False


# Convenience function for services to use
def get_db_client() -> DatabaseClient:
    """Get a database client instance"""
    return DatabaseClient()


# Helper functions for common patterns
def safe_store_analysis(store_func, user_id: int, data: Dict[str, Any], service_name: str) -> bool:
    """Safely store analysis data with error handling"""
    try:
        return store_func(user_id, data)
    except Exception as e:
        logger.error(f"Error storing {service_name} analysis: {str(e)}")
        return False


def get_user_id_from_request(request_data: Dict[str, Any]) -> int:
    """Extract or create user ID from request data"""
    db_client = get_db_client()
    
    # Try to get user info from request
    email = request_data.get("user_email", "anonymous@example.com")
    name = request_data.get("user_name", "Anonymous User")
    
    user_id = db_client.get_or_create_user(email, name)
    return user_id or 1  # Default to user ID 1 if creation fails 