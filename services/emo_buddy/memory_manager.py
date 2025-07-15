import os
import json
import pickle
import logging
from datetime import datetime
from typing import List, Dict, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import httpx # Import httpx for API calls
import uuid
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from typing import Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedChatMessageHistory:
    """
    Extended ChatMessageHistory with additional methods for EmoBuddy compatibility
    """
    
    def __init__(self):
        self._chat_history = ChatMessageHistory()
        self.emotion_patterns = {}
        self.context_history = []
        self.stored_sessions = []  # Store session summaries
        
    @property
    def messages(self):
        """Proxy to the internal chat history messages"""
        return self._chat_history.messages
        
    def add_user_message(self, message: str):
        """Add a user message to the history"""
        self._chat_history.add_user_message(message)
        
    def add_ai_message(self, message: str):
        """Add an AI message to the history"""
        self._chat_history.add_ai_message(message)
        
    def clear(self):
        """Clear the chat history"""
        self._chat_history.clear()
        self.emotion_patterns.clear()
        self.context_history.clear()
        
    def store_session(self, session_data: Dict, summary: str):
        """
        Store a completed session with its summary
        
        Args:
            session_data: Dictionary containing session information
            summary: Generated session summary
        """
        try:
            stored_session = {
                "session_id": str(uuid.uuid4()),
                "timestamp": datetime.now().isoformat(),
                "summary": summary,
                "duration": session_data.get("start_time", datetime.now()),
                "message_count": len(session_data.get("messages", [])),
                "emotions_tracked": session_data.get("emotions_tracked", []),
                "techniques_used": session_data.get("techniques_used", []),
                "crisis_flags": session_data.get("crisis_flags", []),
                "user_id": session_data.get("user_id")
            }
            
            self.stored_sessions.append(stored_session)
            
            # Keep only last 10 sessions to prevent memory bloat
            if len(self.stored_sessions) > 10:
                self.stored_sessions = self.stored_sessions[-10:]
                
            logger.info(f"Stored session summary for user {session_data.get('user_id', 'unknown')}")
            
        except Exception as e:
            logger.error(f"Error storing session: {e}")
        
    def get_relevant_context(self, query: str) -> List[Dict]:
        """
        Get relevant context from chat history based on query
        For now, returns recent messages as relevant context
        """
        recent_messages = []
        for message in self.messages[-10:]:  # Get last 10 messages
            recent_messages.append({
                "role": "user" if message.type == "human" else "assistant",
                "content": message.content,
                "timestamp": getattr(message, 'timestamp', datetime.now().isoformat())
            })
        return recent_messages
    
    def get_emotion_patterns(self) -> Dict:
        """
        Get emotion patterns from the conversation history
        """
        return self.emotion_patterns
    
    def update_emotion_patterns(self, emotions: List[Dict]):
        """
        Update emotion patterns based on new emotions
        """
        for emotion in emotions:
            emotion_name = emotion.get('emotion', 'unknown')
            confidence = emotion.get('confidence', 0.0)
            
            if emotion_name not in self.emotion_patterns:
                self.emotion_patterns[emotion_name] = {
                    'count': 0,
                    'total_confidence': 0.0,
                    'avg_confidence': 0.0
                }
            
            self.emotion_patterns[emotion_name]['count'] += 1
            self.emotion_patterns[emotion_name]['total_confidence'] += confidence
            self.emotion_patterns[emotion_name]['avg_confidence'] = (
                self.emotion_patterns[emotion_name]['total_confidence'] / 
                self.emotion_patterns[emotion_name]['count']
            )

# In-memory store for user chat histories
STORE: Dict[str, EnhancedChatMessageHistory] = {}

def get_memory_manager(user_id: str) -> EnhancedChatMessageHistory:
    """
    Retrieves the chat message history for a given user.
    If no history exists for the user, a new one is created and stored.
    """
    if user_id not in STORE:
        STORE[user_id] = EnhancedChatMessageHistory()
    return STORE[user_id]


class ConversationMemory:
    """
    Legacy wrapper for backward compatibility with older memory system.
    This class wraps the current langchain-based memory system.
    """
    
    def __init__(self, user_id: str = None):
        self.user_id = user_id or str(uuid.uuid4())
        self.memory = get_memory_manager(self.user_id)
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.vector_store = None
        self.memory_index = None
        self.memory_metadata = []
        self.conversation_history = []
        
    def get_relevant_context(self, query: str) -> List[Dict]:
        """Proxy method to memory's get_relevant_context"""
        return self.memory.get_relevant_context(query)
        
    def get_emotion_patterns(self) -> Dict:
        """Proxy method to memory's get_emotion_patterns"""
        return self.memory.get_emotion_patterns()
        
    def update_emotion_patterns(self, emotions: List[Dict]):
        """Proxy method to memory's update_emotion_patterns"""
        return self.memory.update_emotion_patterns(emotions)
        
    def add_message(self, role: str, content: str, metadata: Dict = None):
        """Add a message to the conversation history"""
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        self.conversation_history.append(message)
        
        # Add to langchain memory
        if role == "user":
            self.memory.add_user_message(content)
        else:
            self.memory.add_ai_message(content)
            
    def get_conversation_history(self) -> List[Dict]:
        """Get the full conversation history"""
        return self.conversation_history
        
    def clear_memory(self):
        """Clear all memory"""
        self.conversation_history.clear()
        self.memory.clear()
        
    def get_memory_stats(self) -> Dict:
        """Get memory statistics"""
        return {
            "total_messages": len(self.conversation_history),
            "user_messages": len([m for m in self.conversation_history if m["role"] == "user"]),
            "ai_messages": len([m for m in self.conversation_history if m["role"] == "assistant"]),
            "memory_size": len(self.memory.messages)
        }