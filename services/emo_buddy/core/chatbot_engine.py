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

# Import check flag for lazy loading
IMPORTS_SUCCESSFUL = None

def _check_imports():
    """Check if EmoBuddy components can be imported (lazy check)"""
    global IMPORTS_SUCCESSFUL
    if IMPORTS_SUCCESSFUL is None:
        try:
            # Try multiple import patterns to be more robust
            try:
                # Try absolute import first
                from services.emo_buddy.emo_buddy_agent import EmoBuddyAgent
                from services.emo_buddy.memory_manager import get_memory_manager
                from services.emo_buddy.therapeutic_techniques import get_technique
                from services.emo_buddy.crisis_detector import CrisisDetector
                from services.emo_buddy.corporate_context import get_corporate_context
            except ImportError:
                # Try relative import (when running from emo_buddy directory)
                from emo_buddy_agent import EmoBuddyAgent
                from memory_manager import get_memory_manager
                from therapeutic_techniques import get_technique
                from crisis_detector import CrisisDetector
                from corporate_context import get_corporate_context
                
            logger.info("Successfully imported EmoBuddy components")
            IMPORTS_SUCCESSFUL = True
        except ImportError as e:
            logger.warning(f"Could not import existing EmoBuddy components: {e}")
            IMPORTS_SUCCESSFUL = False
    return IMPORTS_SUCCESSFUL

def _get_emo_buddy_agent():
    """Lazy import of EmoBuddyAgent"""
    if _check_imports():
        try:
            # Try absolute import first
            from services.emo_buddy.emo_buddy_agent import EmoBuddyAgent
            return EmoBuddyAgent
        except ImportError:
            # Try relative import
            from emo_buddy_agent import EmoBuddyAgent
            return EmoBuddyAgent
    else:
        # Fallback implementation
        class EmoBuddyAgentFallback:
            def __init__(self, user_id: str = None):
                self.user_id = user_id
                
            def start_session(self, analysis_report):
                return "EmoBuddy is currently unavailable due to missing dependencies."
                
            def continue_conversation(self, user_input):
                return "EmoBuddy service is temporarily unavailable.", False
                
            def end_session(self):
                return "Session ended due to missing dependencies."
        
        return EmoBuddyAgentFallback

def _get_crisis_detector():
    """Lazy import of CrisisDetector"""
    if _check_imports():
        try:
            # Try absolute import first
            from services.emo_buddy.crisis_detector import CrisisDetector
            return CrisisDetector()
        except ImportError:
            # Try relative import
            from crisis_detector import CrisisDetector
            return CrisisDetector()
    else:
        # Fallback implementation
        class CrisisDetectorFallback:
            def assess_crisis_level(self, text, sentiment, emotions):
                return 0
        return CrisisDetectorFallback()

def _get_corporate_context():
    """Lazy import of corporate context"""
    if _check_imports():
        try:
            # Try absolute import first
            from services.emo_buddy.corporate_context import get_corporate_context
            return get_corporate_context()
        except ImportError:
            # Try relative import
            from corporate_context import get_corporate_context
            return get_corporate_context()
    else:
        return None

class EmoBuddyChatbotEngine:
    """Unified chatbot engine for EmoBuddy responses"""
    
    def __init__(self):
        self.agents: Dict[str, Any] = {}  # session_id -> agent (using Any to avoid import issues)
        self._crisis_detector = None
        
    @property
    def crisis_detector(self):
        """Lazy-loaded crisis detector"""
        if self._crisis_detector is None:
            self._crisis_detector = _get_crisis_detector()
        return self._crisis_detector
        
    def start_session(self, session: EmoBuddySession, analysis_data: Optional[Dict[str, Any]] = None):
        """Start a new chatbot session and return a response stream."""
        try:
            EmoBuddyAgent = _get_emo_buddy_agent()
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
                logger.info(f"Creating new EmoBuddyAgent for session {session.session_id}")
                EmoBuddyAgent = _get_emo_buddy_agent()
                agent = EmoBuddyAgent(user_id=session.user_id)
                self.agents[session.session_id] = agent
                logger.info(f"Agent type: {type(agent)}")
                logger.info(f"Agent class: {agent.__class__}")
            
            # Check for crisis indicators
            crisis_level = self._assess_crisis_level(user_message, session)
            
            # Continue the conversation
            response, should_continue = agent.continue_conversation(user_message)
            
            # Create and add message objects to session
            from .models import EmoBuddyMessage
            from uuid import uuid4
            
            # Add user message
            user_msg = EmoBuddyMessage(
                id=str(uuid4()),
                session_id=session.session_id,
                content=user_message,
                is_user_message=True,
                timestamp=datetime.now()
            )
            session.add_message(user_msg)
            
            # Add bot response
            bot_msg = EmoBuddyMessage(
                id=str(uuid4()),
                session_id=session.session_id,
                content=response,
                is_user_message=False,
                timestamp=datetime.now()
            )
            session.add_message(bot_msg)
            
            return response, should_continue
            
        except Exception as e:
            log_error(e, {"operation": "continue_conversation", "session_id": session.session_id})
            return self._get_fallback_response(), True
    
    def continue_conversation_stream(self, session: EmoBuddySession, user_message: str) -> tuple[Any, bool]:
        """Continue an existing conversation with streaming response"""
        try:
            agent = self.agents.get(session.session_id)
            if not agent:
                agent = _get_emo_buddy_agent()(user_id=session.user_id)
                self.agents[session.session_id] = agent
            
            # Check for crisis indicators
            crisis_level = self._assess_crisis_level(user_message, session)
            
            # Get response from agent - note: this now returns a string, not a stream
            response, should_continue = agent.continue_conversation(user_message)
            
            # Create and add message objects to session
            from .models import EmoBuddyMessage
            from uuid import uuid4
            
            # Add user message
            user_msg = EmoBuddyMessage(
                id=str(uuid4()),
                session_id=session.session_id,
                content=user_message,
                is_user_message=True,
                timestamp=datetime.now()
            )
            session.add_message(user_msg)
            
            # Add bot response
            bot_msg = EmoBuddyMessage(
                id=str(uuid4()),
                session_id=session.session_id,
                content=response,
                is_user_message=False,
                timestamp=datetime.now()
            )
            session.add_message(bot_msg)
            
            # Create a simple generator that yields the full response
            def response_generator():
                yield response
            
            return response_generator(), should_continue
            
        except Exception as e:
            log_error(e, {"operation": "continue_conversation_stream", "session_id": session.session_id})
            def fallback_stream():
                yield self._get_fallback_response()
            return fallback_stream(), True

    def end_session(self, session: EmoBuddySession) -> str:
        """End a chatbot session and provide summary"""
        try:
            agent = self.agents.get(session.session_id)
            if agent:
                summary = agent.end_session()
                # Clean up agent
                del self.agents[session.session_id]
                return summary
            else:
                return "Session ended successfully."
                
        except Exception as e:
            log_error(e, {"operation": "end_session", "session_id": session.session_id})
            return "Session ended due to technical difficulties."
    
    def _assess_crisis_level(self, user_message: str, session: EmoBuddySession) -> int:
        """Assess crisis level in user message"""
        try:
            if is_crisis_message(user_message):
                crisis_level = self.crisis_detector.assess_crisis_level(
                    user_message, 
                    {"label": "negative", "confidence": 0.8},
                    [{"emotion": "sadness", "confidence": 0.8}]
                )
                
                if crisis_level > 0:
                    logger.warning(f"Crisis detected in session {session.session_id}: level {crisis_level}")
                    
                return crisis_level
            return 0
            
        except Exception as e:
            log_error(e, {"operation": "assess_crisis_level", "session_id": session.session_id})
            return 0
    
    def _generate_speech_integrated_response(self, agent: Any, analysis_data: Dict[str, Any]) -> str:
        """Generate response based on speech analysis data"""
        try:
            # Extract key information from analysis
            analysis_summary = extract_analysis_summary(analysis_data)
            
            # Use existing agent to generate response
            if hasattr(agent, 'start_session'):
                return agent.start_session(analysis_data)
            else:
                return f"I can see you're feeling {analysis_summary.get('primary_emotion', 'mixed emotions')}. How can I help you today?"
                
        except Exception as e:
            log_error(e, {"operation": "generate_speech_integrated_response", "analysis_data": analysis_data})
            return "I'm here to listen and support you. What's on your mind?"
    
    def _generate_welcome_response(self, agent: Any) -> str:
        """Generate a welcome response for new sessions"""
        try:
            if hasattr(agent, 'start_session'):
                # Use a minimal analysis for standalone sessions
                minimal_analysis = {
                    "transcription": "New session started",
                    "sentiment": {"label": "neutral", "confidence": 0.5},
                    "emotions": [{"emotion": "neutral", "confidence": 0.5}]
                }
                return agent.start_session(minimal_analysis)
            else:
                return "Hello! I'm EmoBuddy, your therapeutic companion. I'm here to listen and support you. What would you like to talk about today?"
                
        except Exception as e:
            log_error(e, {"operation": "generate_welcome_response"})
            return "Hello! I'm EmoBuddy. How can I support you today?"
    
    def _get_fallback_response(self) -> str:
        """Get a fallback response when there are technical issues"""
        return "I apologize, but I'm experiencing some technical difficulties right now. Please try again in a moment, or if this persists, please contact support."
    
    def _generate_default_summary(self, session: EmoBuddySession) -> str:
        """Generate a default session summary"""
        return f"""Session Summary:
        - Duration: {session.total_messages} messages exchanged
        - Started: {session.started_at.strftime('%Y-%m-%d %H:%M:%S')}
        - Mode: {session.mode.value}
        
        Thank you for using EmoBuddy. Take care of yourself!"""
    
    def _track_conversation_pattern(self, session: EmoBuddySession, user_message: str, bot_response: str):
        """Track conversation patterns for insights"""
        try:
            # Simple pattern tracking
            logger.debug(f"Conversation pattern tracked for session {session.session_id}")
        except Exception as e:
            log_error(e, {"operation": "track_conversation_pattern", "session_id": session.session_id})
    
    def cleanup_session(self, session_id: str):
        """Clean up resources for a specific session"""
        try:
            if session_id in self.agents:
                del self.agents[session_id]
                logger.debug(f"Cleaned up chatbot engine resources for session {session_id}")
        except Exception as e:
            log_error(e, {"operation": "cleanup_session", "session_id": session_id})
            logger.debug(f"Cleaned up chatbot engine resources for session {session_id}")

    def get_session_stats(self, session_id: str) -> Dict[str, Any]:
        """Get statistics for a specific session"""
        try:
            agent = self.agents.get(session_id)
            if agent and hasattr(agent, 'current_session'):
                session_data = agent.current_session
                return {
                    "total_messages": len(session_data.get("messages", [])),
                    "emotions_tracked": session_data.get("emotions_tracked", []),
                    "techniques_used": session_data.get("techniques_used", []),
                    "crisis_flags": session_data.get("crisis_flags", []),
                    "duration": (datetime.now() - session_data.get("start_time", datetime.now())).total_seconds()
                }
            else:
                return {"error": "Session not found or agent unavailable"}
                
        except Exception as e:
            log_error(e, {"operation": "get_session_stats", "session_id": session_id})
            return {"error": f"Failed to get session stats: {str(e)}"}
    
    def health_check(self) -> Dict[str, Any]:
        """Perform health check on the chatbot engine"""
        try:
            imports_ok = _check_imports()
            active_sessions = len(self.agents)
            
            return {
                "status": "healthy" if imports_ok else "degraded",
                "imports_successful": imports_ok,
                "active_sessions": active_sessions,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            log_error(e, {"operation": "health_check"})
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

# Global instance
_chatbot_engine = None

def get_chatbot_engine() -> EmoBuddyChatbotEngine:
    """Get singleton chatbot engine instance"""
    global _chatbot_engine
    if _chatbot_engine is None:
        logger.info(f"Creating new EmoBuddyChatbotEngine")
        _chatbot_engine = EmoBuddyChatbotEngine()
        logger.info(f"Chatbot engine created: {_chatbot_engine}")
    return _chatbot_engine 