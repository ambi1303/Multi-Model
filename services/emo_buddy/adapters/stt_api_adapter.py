"""
STT API Adapter for EmoBuddy
=============================

This adapter provides a thin wrapper around the unified EmoBuddy core for the STT service.
It handles speech-integrated EmoBuddy sessions and provides pre/post-processing for audio analysis.
"""

import os
import sys
import logging
from typing import Dict, Any, Optional
from datetime import datetime

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from core import (
    get_unified_api, UnifiedEmoBuddyAPI, SessionMode,
    EmoBuddyError, SessionNotFoundError, InvalidSessionError,
    emo_buddy_start_session, emo_buddy_continue_session, emo_buddy_end_session
)

logger = logging.getLogger(__name__)

class STTAPIAdapter:
    """
    Adapter for the STT API that integrates speech analysis with the unified EmoBuddy core
    """
    
    def __init__(self):
        self.unified_api = get_unified_api()
        
    async def start_speech_integrated_session(self, user_id: str, user_token: str, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Start a speech-integrated EmoBuddy session
        
        Args:
            user_id: User UUID
            user_token: User authentication token
            analysis_data: Speech analysis data
            
        Returns:
            Dictionary with session response
        """
        try:
            logger.info(f"Starting speech-integrated EmoBuddy session for user {user_id}")
            
            # Pre-process analysis data for EmoBuddy
            processed_analysis = self._preprocess_analysis_data(analysis_data)
            
            # Use unified API to start speech-integrated session
            response = await self.unified_api.start_speech_integrated_session(user_id, user_token, processed_analysis)
            
            # Post-process response for STT service
            return self._postprocess_response(response, analysis_data)
            
        except Exception as e:
            logger.error(f"Error starting speech-integrated EmoBuddy session: {e}")
            return {
                "error": str(e),
                "session_id": None,
                "emo_buddy_response": "I apologize, but I'm experiencing technical difficulties right now. Your speech analysis was completed successfully.",
                "timestamp": datetime.now().isoformat()
            }
    
    async def continue_speech_session(self, session_id: str, user_id: str, user_token: str, user_input: str) -> Dict[str, Any]:
        """
        Continue a speech-integrated EmoBuddy session
        
        Args:
            session_id: Session identifier
            user_id: User UUID
            user_token: User authentication token
            user_input: User's message
            
        Returns:
            Dictionary with continue response
        """
        try:
            logger.info(f"Continuing speech-integrated EmoBuddy session {session_id} for user {user_id}")
            
            # Use unified API to continue session
            response = await self.unified_api.continue_session(session_id, user_id, user_token, user_input)
            
            # Convert to STT service format
            return {
                "session_id": response.session_id,
                "response": response.response,
                "should_continue": response.should_continue,
                "core_session_uuid": response.core_session_uuid,
                "timestamp": response.timestamp
            }
            
        except SessionNotFoundError:
            logger.error(f"Session {session_id} not found")
            return {
                "error": f"Session {session_id} not found",
                "session_id": session_id,
                "response": "I'm sorry, but I can't find our conversation. The speech analysis was completed, but the conversation session has ended.",
                "should_continue": False,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error continuing speech-integrated EmoBuddy session: {e}")
            return {
                "error": str(e),
                "session_id": session_id,
                "response": "I'm having trouble processing your message right now. Please try again.",
                "should_continue": True,
                "timestamp": datetime.now().isoformat()
            }
    
    async def end_speech_session(self, session_id: str, user_id: str, user_token: str) -> Dict[str, Any]:
        """
        End a speech-integrated EmoBuddy session
        
        Args:
            session_id: Session identifier
            user_id: User UUID
            user_token: User authentication token
            
        Returns:
            Dictionary with end response
        """
        try:
            logger.info(f"Ending speech-integrated EmoBuddy session {session_id} for user {user_id}")
            
            # Use unified API to end session
            response = await self.unified_api.end_session(session_id, user_id, user_token)
            
            # Convert to STT service format
            return {
                "session_id": response.session_id,
                "summary": response.summary,
                "total_messages": response.total_messages,
                "duration_minutes": response.session_duration_minutes,
                "core_session_uuid": response.core_session_uuid,
                "timestamp": datetime.now().isoformat()
            }
            
        except SessionNotFoundError:
            logger.error(f"Session {session_id} not found")
            return {
                "error": f"Session {session_id} not found",
                "session_id": session_id,
                "summary": "Session not found.",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error ending speech-integrated EmoBuddy session: {e}")
            return {
                "error": str(e),
                "session_id": session_id,
                "summary": "Session ended due to technical difficulties.",
                "timestamp": datetime.now().isoformat()
            }
    
    def _preprocess_analysis_data(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Pre-process analysis data for EmoBuddy consumption
        
        Args:
            analysis_data: Raw speech analysis data
            
        Returns:
            Processed analysis data
        """
        try:
            # Normalize field names for EmoBuddy
            processed = {}
            
            # Handle transcription field variations
            transcription = (
                analysis_data.get('transcribed_text') or 
                analysis_data.get('transcription') or 
                analysis_data.get('text', '')
            )
            processed['transcribed_text'] = transcription
            
            # Handle sentiment data
            sentiment = analysis_data.get('sentiment', {})
            if isinstance(sentiment, dict):
                processed['sentiment'] = {
                    'label': sentiment.get('label', 'neutral'),
                    'confidence': sentiment.get('confidence', 0.0),
                    'polarity': sentiment.get('polarity', 0.0),
                    'subjectivity': sentiment.get('subjectivity', 0.0)
                }
            else:
                processed['sentiment'] = {'label': 'neutral', 'confidence': 0.0}
            
            # Handle emotions data
            emotions = analysis_data.get('emotions', [])
            if isinstance(emotions, list):
                processed['emotions'] = emotions
            elif isinstance(emotions, dict):
                # Convert dict format to list format
                processed['emotions'] = [
                    {'emotion': emotion, 'confidence': confidence}
                    for emotion, confidence in emotions.items()
                ]
            else:
                processed['emotions'] = []
            
            # Add additional metadata
            processed['audio_duration_seconds'] = analysis_data.get('audio_duration_seconds', 0.0)
            processed['session_id'] = analysis_data.get('session_id')
            processed['timestamp'] = analysis_data.get('timestamp', datetime.now().isoformat())
            
            # Add any AI insights
            processed['gen_ai_insights'] = analysis_data.get('gen_ai_insights') or analysis_data.get('genAIInsights')
            processed['technical_report'] = analysis_data.get('technical_report') or analysis_data.get('technicalReport')
            
            return processed
            
        except Exception as e:
            logger.error(f"Error preprocessing analysis data: {e}")
            # Return minimal fallback data
            return {
                'transcribed_text': analysis_data.get('transcribed_text', ''),
                'sentiment': {'label': 'neutral', 'confidence': 0.0},
                'emotions': [],
                'timestamp': datetime.now().isoformat()
            }
    
    def _postprocess_response(self, response: Any, original_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Post-process EmoBuddy response for STT service
        
        Args:
            response: EmoBuddy response object
            original_analysis: Original analysis data
            
        Returns:
            Formatted response for STT service
        """
        try:
            # Create STT-compatible response
            result = {
                "session_id": response.session_id,
                "emo_buddy_response": response.response,
                "core_session_uuid": response.core_session_uuid,
                "timestamp": response.timestamp
            }
            
            # Add speech analysis context
            result["speech_analysis_context"] = {
                "transcription": original_analysis.get('transcribed_text', ''),
                "sentiment": original_analysis.get('sentiment', {}),
                "emotions": original_analysis.get('emotions', []),
                "duration": original_analysis.get('audio_duration_seconds', 0.0)
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error postprocessing response: {e}")
            return {
                "session_id": getattr(response, 'session_id', None),
                "emo_buddy_response": getattr(response, 'response', "I'm here to help with your emotional wellbeing."),
                "timestamp": datetime.now().isoformat()
            }
    
    def get_session_status(self, session_id: str) -> Dict[str, Any]:
        """
        Get session status
        
        Args:
            session_id: Session identifier
            
        Returns:
            Dictionary with session status
        """
        try:
            status = self.unified_api.get_session_status(session_id)
            # Add STT-specific context
            if status.get("exists") and status.get("mode") == SessionMode.SPEECH_INTEGRATED.value:
                status["is_speech_integrated"] = True
            else:
                status["is_speech_integrated"] = False
            return status
        except Exception as e:
            logger.error(f"Error getting session status: {e}")
            return {"exists": False, "active": False, "is_speech_integrated": False, "error": str(e)}
    
    def health_check(self) -> Dict[str, Any]:
        """
        Perform health check
        
        Returns:
            Dictionary with health status
        """
        try:
            core_health = self.unified_api.health_check()
            return {
                "status": "healthy" if core_health["status"] == "healthy" else "unhealthy",
                "service": "EmoBuddy STT Integration",
                "timestamp": datetime.now().isoformat(),
                "core_status": core_health,
                "speech_integrated_sessions": self._count_speech_sessions()
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "service": "EmoBuddy STT Integration",
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }
    
    def _count_speech_sessions(self) -> int:
        """
        Count active speech-integrated sessions
        
        Returns:
            Number of active speech-integrated sessions
        """
        try:
            # This would ideally be implemented in the unified API
            # For now, return a placeholder
            return 0
        except Exception:
            return 0

# Global instance
_stt_adapter = None

def get_stt_adapter() -> STTAPIAdapter:
    """
    Get singleton STT adapter instance
    
    Returns:
        STTAPIAdapter instance
    """
    global _stt_adapter
    if _stt_adapter is None:
        _stt_adapter = STTAPIAdapter()
    return _stt_adapter

# === Integration Functions for STT Service ===

async def integrate_emobuddy_with_speech_analysis(user_id: str, user_token: str, analysis_result: Dict[str, Any]) -> str:
    """
    Integrate EmoBuddy with speech analysis results
    
    Args:
        user_id: User UUID
        user_token: User authentication token
        analysis_result: Speech analysis results
        
    Returns:
        EmoBuddy response string
    """
    try:
        adapter = get_stt_adapter()
        response = await adapter.start_speech_integrated_session(user_id, user_token, analysis_result)
        return response.get("emo_buddy_response", "I'm here to help with your emotional wellbeing.")
    except Exception as e:
        logger.error(f"Error integrating EmoBuddy with speech analysis: {e}")
        return "I'm experiencing technical difficulties right now, but your speech analysis was completed successfully."

async def continue_speech_emobuddy_session(session_id: str, user_id: str, user_token: str, user_input: str) -> Dict[str, Any]:
    """
    Continue a speech-integrated EmoBuddy session
    
    Args:
        session_id: Session identifier
        user_id: User UUID
        user_token: User authentication token
        user_input: User's message
        
    Returns:
        Dictionary with continue response
    """
    adapter = get_stt_adapter()
    return await adapter.continue_speech_session(session_id, user_id, user_token, user_input)

async def end_speech_emobuddy_session(session_id: str, user_id: str, user_token: str) -> Dict[str, Any]:
    """
    End a speech-integrated EmoBuddy session
    
    Args:
        session_id: Session identifier
        user_id: User UUID
        user_token: User authentication token
        
    Returns:
        Dictionary with end response
    """
    adapter = get_stt_adapter()
    return await adapter.end_speech_session(session_id, user_id, user_token) 