"""
EmoBuddy Core Package
====================

This package contains the unified core logic for EmoBuddy that can be used by both
the standalone chat API and the integrated speech analysis API.

Architecture:
- session_manager: Unified session management and database operations
- chatbot_engine: Core EmoBuddy agent and conversation logic
- models: Database models and schemas
- utils: Shared utilities and helpers
"""

from .session_manager import EmoBuddySessionManager
from .chatbot_engine import EmoBuddyChatbotEngine
from .models import EmoBuddySession, EmoBuddyMessage, SessionMode
from .utils import EmoBuddyError, SessionNotFoundError, InvalidSessionError
from .unified_api import (
    UnifiedEmoBuddyAPI, get_unified_api, 
    emo_buddy_start_session, emo_buddy_continue_session, emo_buddy_end_session
)

__all__ = [
    # Core classes
    'EmoBuddySessionManager',
    'EmoBuddyChatbotEngine',
    
    # Unified API
    'UnifiedEmoBuddyAPI',
    'get_unified_api',
    
    # Models
    'EmoBuddySession',
    'EmoBuddyMessage',
    'SessionMode',
    
    # Exceptions
    'EmoBuddyError',
    'SessionNotFoundError',
    'InvalidSessionError',
    
    # Utility functions
    'emo_buddy_start_session',
    'emo_buddy_continue_session',
    'emo_buddy_end_session',
]

__version__ = "1.0.0" 