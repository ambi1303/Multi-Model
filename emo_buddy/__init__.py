"""
Emo Buddy - AI Therapeutic Companion Package

This package provides a comprehensive therapeutic AI companion using
evidence-based therapy techniques (CBT, DBT, ACT) with memory capabilities.

Usage:
    # Way 1: With technical analysis report (integrated mode)
    from emo_buddy import EmoBuddyAgent
    agent = EmoBuddyAgent()
    response = agent.start_session(analysis_report)
    
    # Way 2: Standalone chatbot mode
    python emo_buddy/standalone_chat.py
"""

from .emo_buddy_agent import EmoBuddyAgent
from .memory_manager import ConversationMemory
from .therapeutic_techniques import TherapeuticTechniques
from .crisis_detector import CrisisDetector
from .corporate_context import CorporateContextAnalyzer

__version__ = "1.0.0"
__author__ = "Voice Analysis & Emo Buddy System"
__email__ = "support@emobuddy.ai"

__all__ = [
    "EmoBuddyAgent",
    "ConversationMemory", 
    "TherapeuticTechniques",
    "CrisisDetector",
    "CorporateContextAnalyzer"
] 