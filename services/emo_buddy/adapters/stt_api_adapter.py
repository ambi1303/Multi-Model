"""
STT API Adapter for EmoBuddy - Simplified In-Memory Version
===========================================================

Direct integration between STT and EmoBuddy without database dependencies.
The first message sent to EmoBuddy will be the transcribed text.
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

# Also add the services directory if we're running from a subdirectory
services_dir = os.path.dirname(os.path.dirname(parent_dir))
if services_dir not in sys.path and 'services' in os.path.basename(services_dir):
    sys.path.insert(0, services_dir)

try:
    from core import (
        get_unified_api, UnifiedEmoBuddyAPI, SessionMode,
        EmoBuddyError, SessionNotFoundError, InvalidSessionError
    )
except ImportError:
    # Try different import paths
    try:
        from services.emo_buddy.core import (
            get_unified_api, UnifiedEmoBuddyAPI, SessionMode,
            EmoBuddyError, SessionNotFoundError, InvalidSessionError
        )
    except ImportError as e:
        raise ImportError(f"Could not import core modules. Please check your Python path. Error: {e}")

logger = logging.getLogger(__name__)

class STTEmoBuddyAdapter:
    """
    Simplified adapter for STT-EmoBuddy integration without database dependencies
    """
    
    def __init__(self):
        self.unified_api = get_unified_api()
        
    async def start_session(self, user_id: str, analysis_report: Dict[str, Any], session_id: str, token: str) -> Dict[str, Any]:
        """
        Start a new EmoBuddy session from STT service (in-memory only)
        
        Args:
            user_id: User UUID
            analysis_report: Speech analysis report with transcription, sentiment, emotions
            session_id: Unique session identifier
            token: User authentication token
            
        Returns:
            Dictionary with session response and initial EmoBuddy message
        """
        try:
            logger.info(f"Starting EmoBuddy session from STT for user {user_id}")
            
            # Start speech-integrated session
            session_response = await self.unified_api.start_speech_integrated_session(
                user_id=user_id,
                user_token=token,
                analysis_data=analysis_report,
                session_id=session_id
            )
            
            logger.info(f"EmoBuddy session started: {session_response.get('session_id')}")
            
            return {
                "success": True,
                "session_id": session_response["session_id"],
                "emo_buddy_response": session_response["response"],
                "should_continue": session_response.get("should_continue", True),
                "timestamp": session_response.get("timestamp", datetime.now().isoformat())
            }
            
        except Exception as e:
            logger.error(f"Failed to start EmoBuddy session: {e}")
            return {
                "success": False,
                "error": str(e),
                "session_id": session_id,
                "emo_buddy_response": "I'm having trouble starting our conversation right now. Please try again.",
                "timestamp": datetime.now().isoformat()
            }
    
    async def continue_session(self, session_id: str, user_id: str, user_token: str, user_input: str) -> Dict[str, Any]:
        """
        Continue an existing EmoBuddy session
        
        Args:
            session_id: Session identifier
            user_id: User UUID
            user_token: User authentication token
            user_input: User's message (usually transcribed text)
            
        Returns:
            Dictionary with EmoBuddy response
        """
        try:
            logger.info(f"Continuing EmoBuddy session {session_id}")
            
            # Continue session via unified API
            response = await self.unified_api.continue_session(
                session_id=session_id,
                user_id=user_id,
                user_token=user_token,
                user_message=user_input
            )
            
            return {
                "success": True,
                "session_id": session_id,
                "emo_buddy_response": response.response,
                "should_continue": response.should_continue,
                "timestamp": response.timestamp
            }
            
        except Exception as e:
            logger.error(f"Failed to continue EmoBuddy session: {e}")
            return {
                "success": False,
                "error": str(e),
                "session_id": session_id,
                "emo_buddy_response": "I'm having trouble processing your message. Please try again.",
                "should_continue": True,
                "timestamp": datetime.now().isoformat()
            }
    
    async def end_session(self, session_id: str, user_id: str, user_token: str) -> Dict[str, Any]:
        """
        End an EmoBuddy session
        
        Args:
            session_id: Session identifier
            user_id: User UUID
            user_token: User authentication token
            
        Returns:
            Dictionary with session summary
        """
        try:
            logger.info(f"Ending EmoBuddy session {session_id}")
            
            # End session via unified API
            response = await self.unified_api.end_session(
                session_id=session_id,
                user_id=user_id,
                user_token=user_token
            )
            
            return {
                "success": True,
                "session_id": session_id,
                "summary": response.summary,
                "total_messages": response.total_messages,
                "duration_minutes": response.session_duration_minutes,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to end EmoBuddy session: {e}")
            return {
                "success": False,
                "error": str(e),
                "session_id": session_id,
                "summary": "Session ended due to technical difficulties.",
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
            return self.unified_api.get_session_status(session_id)
            
        except Exception as e:
            logger.error(f"Error getting session status: {e}")
            return {
                "exists": False,
                "active": False,
                "error": str(e)
            }
    
    def is_session_active(self, session_id: str) -> bool:
        """
        Check if session is active
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if session is active, False otherwise
        """
        try:
            return self.unified_api.is_session_active(session_id)
            
        except Exception as e:
            logger.error(f"Error checking session status: {e}")
            return False
    
    def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on the STT adapter
        
        Returns:
            Dictionary with health status
        """
        try:
            # Check unified API health
            unified_health = self.unified_api.health_check()
            
            return {
                "adapter": "stt_api",
                "status": "healthy" if unified_health.get("status") == "healthy" else "degraded",
                "unified_api_status": unified_health.get("status", "unknown"),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "adapter": "stt_api",
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

# Global instance
_stt_adapter = None

def get_stt_adapter() -> STTEmoBuddyAdapter:
    """
    Get singleton STT adapter instance
    
    Returns:
        STTEmoBuddyAdapter instance
    """
    global _stt_adapter
    if _stt_adapter is None:
        _stt_adapter = STTEmoBuddyAdapter()
    return _stt_adapter 