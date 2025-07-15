"""
EmoBuddy Chatbot Engine
=======================

Unified chatbot engine that integrates with the existing EmoBuddy agent
and provides consistent response generation for both standalone and speech-integrated sessions.
"""

import os
import sys
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

# Add parent directory to path to import existing components
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from .models import EmoBuddySession, EmoBuddyMessage, SessionMode
from .utils import log_error, is_crisis_message, extract_analysis_summary

logger = logging.getLogger(__name__)

# Import existing EmoBuddy components
try:
    from emo_buddy_agent import EmoBuddyAgent
    from memory_manager import get_memory_manager
    from therapeutic_techniques import get_technique
    from crisis_detector import CrisisDetector
    from corporate_context import get_corporate_context
except ImportError as e:
    logger.warning(f"Could not import existing EmoBuddy components: {e}")
    # Fallback implementation
    class EmoBuddyAgent:
        def __init__(self, user_id: str = None):
            self.user_id = user_id
            
        def start_session(self, analysis_report):
            return "EmoBuddy is currently unavailable due to missing dependencies."
            
        def continue_conversation(self, user_input):
            return "EmoBuddy service is temporarily unavailable.", False
            
        def end_session(self):
            return "Session ended."
    
    def get_memory_manager(user_id):
        return None
    
    def get_technique():
        return None
    
    class CrisisDetector:
        def assess_crisis_level(self, text, sentiment, emotions):
            return 0
    
    def get_corporate_context():
        return None

class EmoBuddyChatbotEngine:
    """Unified chatbot engine for EmoBuddy responses"""
    
    def __init__(self):
        self.agents: Dict[str, EmoBuddyAgent] = {}  # session_id -> agent
        self.crisis_detector = CrisisDetector()
        
    def start_session(self, session: EmoBuddySession, analysis_data: Optional[Dict[str, Any]] = None):
        """Start a new chatbot session and return a response stream."""
        try:
            agent = EmoBuddyAgent(user_id=session.user_id)
            self.agents[session.session_id] = agent
            
            if session.mode == SessionMode.SPEECH_INTEGRATED and analysis_data:
                response_stream = agent.start_session(analysis_data)
            else:
                minimal_analysis = {
                    "transcription": "Starting new therapeutic session",
                    "sentiment": {"label": "neutral", "confidence": 0.5},
                    "emotions": [{"emotion": "neutral", "confidence": 0.5}]
                }
                response_stream = agent.start_session(minimal_analysis)
            
            return response_stream
            
        except Exception as e:
            log_error(e, {"operation": "start_session", "session_id": session.session_id})
            def fallback_stream():
                yield self._get_fallback_response()
            return fallback_stream()
    
    def continue_conversation(self, session: EmoBuddySession, user_message: str) -> tuple[str, bool]:
        """Continue an existing conversation"""
        try:
            agent = self.agents.get(session.session_id)
            if not agent:
                # Recreate agent if not found
                agent = EmoBuddyAgent(user_id=session.user_id)
                self.agents[session.session_id] = agent
            
            # Check for crisis indicators
            crisis_level = self._assess_crisis_level(user_message, session)
            if crisis_level > 3:
                session.crisis_flags.append({
                    "timestamp": datetime.now().isoformat(),
                    "level": crisis_level,
                    "message": user_message[:100] + "..." if len(user_message) > 100 else user_message
                })
            
            # Generate response using the agent
            response, should_continue = agent.continue_conversation(user_message)
            
            # Track conversation patterns
            self._track_conversation_pattern(session, user_message, response)
            
            return response, should_continue
            
        except Exception as e:
            log_error(e, {"operation": "continue_conversation", "session_id": session.session_id})
            return self._get_fallback_response(), True
            
    def continue_conversation_stream(self, session: EmoBuddySession, user_message: str) -> tuple[Any, bool]:
        """Continue a conversation and stream the response."""
        try:
            agent = self.agents.get(session.session_id)
            if not agent:
                agent = EmoBuddyAgent(user_id=session.user_id)
                self.agents[session.session_id] = agent
            
            # The agent's continue_conversation method now needs to be adapted to return a stream
            # For now, let's assume it returns a stream and a boolean
            response_stream, should_continue = agent.continue_conversation(user_message)
            
            # We are not logging the full response here as it's a stream
            # This would need to be handled differently if full logging is required
            
            return response_stream, should_continue
            
        except Exception as e:
            log_error(e, {"operation": "continue_conversation_stream", "session_id": session.session_id})
            # Return a fallback stream
            def fallback_stream():
                yield self._get_fallback_response()
            return fallback_stream(), True

    def end_session(self, session: EmoBuddySession) -> str:
        """End a chatbot session"""
        try:
            agent = self.agents.get(session.session_id)
            if agent:
                summary = agent.end_session()
                del self.agents[session.session_id]
                return summary
            else:
                return self._generate_default_summary(session)
                
        except Exception as e:
            log_error(e, {"operation": "end_session", "session_id": session.session_id})
            return self._generate_default_summary(session)
    
    def _generate_speech_integrated_response(self, agent: EmoBuddyAgent, analysis_data: Dict[str, Any]) -> str:
        """Generate response for speech-integrated sessions"""
        try:
            # Use the existing agent's start_session method with analysis data
            response = agent.start_session(analysis_data)
            
            # If the agent doesn't provide a good response, use our fallback
            if not response or "unavailable" in response.lower():
                return self._generate_fallback_speech_response(analysis_data)
            
            return response
            
        except Exception as e:
            log_error(e, {"operation": "generate_speech_integrated_response"})
            return self._generate_fallback_speech_response(analysis_data)
    
    def _generate_welcome_response(self, agent: EmoBuddyAgent) -> str:
        """Generate welcome response for standalone sessions"""
        try:
            # Create minimal analysis data for the agent
            minimal_analysis = {
                "transcription": "Starting new therapeutic session",
                "sentiment": {"label": "neutral", "confidence": 0.5},
                "emotions": [{"emotion": "neutral", "confidence": 0.5}]
            }
            
            response = agent.start_session(minimal_analysis)
            
            # If the agent doesn't provide a good response, use our fallback
            if not response or "unavailable" in response.lower():
                return self._generate_fallback_welcome_response()
            
            return response
            
        except Exception as e:
            log_error(e, {"operation": "generate_welcome_response"})
            return self._generate_fallback_welcome_response()
    
    def _generate_fallback_speech_response(self, analysis_data: Dict[str, Any]) -> str:
        """Fallback response for speech-integrated sessions"""
        analysis_summary = extract_analysis_summary(analysis_data)
        
        return f"""Hello! I'm EmoBuddy, your therapeutic companion. I've reviewed your recent audio analysis and I'm here to help you process your feelings and thoughts.

Based on what I observed: {analysis_summary}

I'm here to provide you with emotional support and evidence-based therapeutic guidance. Would you like to talk about what's on your mind, or would you prefer I help you explore your feelings further?

Remember, our conversation is confidential and I'm here to support you in whatever way feels most helpful right now."""
    
    def _generate_fallback_welcome_response(self) -> str:
        """Fallback welcome response for standalone sessions"""
        return """Hello! I'm EmoBuddy, your AI therapeutic companion. I'm here to provide emotional support and help you work through any challenges you're facing using evidence-based therapeutic techniques.

I create a safe, confidential space where you can share your thoughts and feelings. Whether you're dealing with stress, anxiety, difficult emotions, or just need someone to talk to, I'm here to listen and support you.

What would you like to talk about today? You can share whatever is on your mind, and I'll do my best to help you process it and find healthy ways to cope."""
    
    def _get_fallback_response(self) -> str:
        """Generic fallback response for errors"""
        return """I'm here to support you, though I'm experiencing some technical difficulties right now. Please know that what you're sharing is important, and I want to help you work through whatever you're experiencing.

Can you tell me more about what's on your mind? Even if my responses aren't perfect, I'm committed to being here for you and providing whatever support I can."""
    
    def _generate_default_summary(self, session: EmoBuddySession) -> str:
        """Generate default session summary"""
        return f"""Thank you for sharing this time with me. During our {session.total_messages} message conversation, I hope you found some value in our discussion.

Remember that the insights and strategies we've discussed are tools you can use whenever you need them. Your emotional wellbeing is important, and I'm glad you took the time to focus on it today.

If you need support in the future, I'm always here to help. Take care of yourself."""
    
    def _track_emotion_state(self, session: EmoBuddySession, analysis_data: Dict[str, Any]):
        """Track emotion state from analysis data"""
        try:
            emotions = analysis_data.get("emotions", [])
            sentiment = analysis_data.get("sentiment", {})
            
            emotion_state = {
                "timestamp": datetime.now().isoformat(),
                "source": "speech_analysis",
                "sentiment": sentiment.get("label", "neutral"),
                "sentiment_confidence": sentiment.get("confidence", 0.0),
                "emotions": emotions[:3] if isinstance(emotions, list) else [],
                "intensity": sentiment.get("intensity", "moderate")
            }
            
            session.emotions_tracked.append(emotion_state)
            
        except Exception as e:
            log_error(e, {"operation": "track_emotion_state", "session_id": session.session_id})
    
    def _track_conversation_pattern(self, session: EmoBuddySession, user_message: str, bot_response: str):
        """Track conversation patterns and techniques used"""
        try:
            # Simple pattern recognition - in full implementation this would be more sophisticated
            patterns = []
            
            # Check for question patterns
            if "?" in user_message:
                patterns.append("questioning")
            
            # Check for emotional language
            emotional_words = ["feel", "sad", "happy", "angry", "anxious", "worried", "excited", "frustrated"]
            if any(word in user_message.lower() for word in emotional_words):
                patterns.append("emotional_expression")
            
            # Check for problem-solving language
            problem_words = ["problem", "issue", "challenge", "difficult", "struggle", "help"]
            if any(word in user_message.lower() for word in problem_words):
                patterns.append("problem_solving")
            
            # Track techniques used in response
            techniques = []
            if "can you tell me more" in bot_response.lower():
                techniques.append("open_ended_questions")
            if "i hear you" in bot_response.lower() or "i understand" in bot_response.lower():
                techniques.append("active_listening")
            if "let's explore" in bot_response.lower():
                techniques.append("exploration")
            
            # Update session tracking
            session.techniques_used.extend(techniques)
            
        except Exception as e:
            log_error(e, {"operation": "track_conversation_pattern", "session_id": session.session_id})
    
    def _assess_crisis_level(self, user_message: str, session: EmoBuddySession) -> int:
        """Assess crisis level of user message"""
        try:
            # Use simple crisis detection
            if is_crisis_message(user_message):
                return 5  # High crisis level
            
            # Use crisis detector if available
            if hasattr(self.crisis_detector, 'assess_crisis_level'):
                # Mock sentiment and emotions for crisis assessment
                mock_sentiment = {"label": "negative", "confidence": 0.8}
                mock_emotions = [{"emotion": "sad", "confidence": 0.7}]
                return self.crisis_detector.assess_crisis_level(user_message, mock_sentiment, mock_emotions)
            
            return 0  # No crisis detected
            
        except Exception as e:
            log_error(e, {"operation": "assess_crisis_level", "session_id": session.session_id})
            return 0
    
    def cleanup_session(self, session_id: str):
        """Clean up session resources"""
        if session_id in self.agents:
            del self.agents[session_id]
            logger.debug(f"Cleaned up chatbot engine resources for session {session_id}")

# Global instance
_chatbot_engine = None

def get_chatbot_engine() -> EmoBuddyChatbotEngine:
    """Get singleton chatbot engine instance"""
    global _chatbot_engine
    if _chatbot_engine is None:
        _chatbot_engine = EmoBuddyChatbotEngine()
    return _chatbot_engine 