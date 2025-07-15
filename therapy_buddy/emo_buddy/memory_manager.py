import os
import json
import pickle
import logging
from datetime import datetime
from typing import List, Dict, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConversationMemory:
    """
    Manages conversation memory using vector storage for retrieval-augmented generation
    """
    
    def __init__(self, memory_dir: str = "emo_buddy_memory"):
        self.memory_dir = memory_dir
        self.index_file = os.path.join(memory_dir, "memory_index.faiss")
        self.metadata_file = os.path.join(memory_dir, "memory_metadata.json")
        self.sessions_file = os.path.join(memory_dir, "sessions.json")
        
        # Create memory directory if it doesn't exist
        os.makedirs(memory_dir, exist_ok=True)
        
        # Initialize sentence transformer for embeddings
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.embedding_dim = self.encoder.get_sentence_embedding_dimension()
        
        # Initialize or load FAISS index
        self._initialize_index()
        
        # Load existing metadata and sessions
        self.metadata = self._load_metadata()
        self.sessions = self._load_sessions()
        
        logger.info("ConversationMemory initialized successfully")
    
    def _initialize_index(self):
        """Initialize or load the FAISS index"""
        if os.path.exists(self.index_file):
            self.index = faiss.read_index(self.index_file)
            logger.info(f"Loaded existing memory index with {self.index.ntotal} entries")
        else:
            # Create new index
            self.index = faiss.IndexFlatIP(self.embedding_dim)  # Inner product for similarity
            logger.info("Created new memory index")
    
    def _load_metadata(self) -> List[Dict]:
        """Load memory metadata"""
        if os.path.exists(self.metadata_file):
            with open(self.metadata_file, 'r') as f:
                return json.load(f)
        return []
    
    def _load_sessions(self) -> List[Dict]:
        """Load session history"""
        if os.path.exists(self.sessions_file):
            with open(self.sessions_file, 'r') as f:
                return json.load(f)
        return []
    
    def _save_metadata(self):
        """Save memory metadata"""
        with open(self.metadata_file, 'w') as f:
            json.dump(self.metadata, f, indent=2)
    
    def _save_sessions(self):
        """Save session history"""
        with open(self.sessions_file, 'w') as f:
            json.dump(self.sessions, f, indent=2, default=str)
    
    def _save_index(self):
        """Save FAISS index"""
        faiss.write_index(self.index, self.index_file)
    
    def store_session(self, session_data: Dict, summary: str):
        """
        Store a complete session in memory
        """
        logger.info("Storing session in memory...")
        
        # Prepare session for storage
        session_record = {
            "session_id": len(self.sessions),
            "timestamp": datetime.now().isoformat(),
            "duration": str(session_data.get("start_time", "")),
            "summary": summary,
            "emotions_tracked": session_data.get("emotions_tracked", []),
            "techniques_used": session_data.get("techniques_used", []),
            "crisis_flags": session_data.get("crisis_flags", []),
            "key_phrases": self._extract_key_phrases(session_data),
            "initial_analysis": session_data.get("initial_analysis", {})
        }
        
        # Add to sessions
        self.sessions.append(session_record)
        
        # Create memory entries for key conversation moments
        self._create_memory_entries(session_record)
        
        # Save everything
        self._save_sessions()
        self._save_metadata()
        self._save_index()
        
        logger.info(f"Session stored with ID: {session_record['session_id']}")
    
    def _extract_key_phrases(self, session_data: Dict) -> List[str]:
        """Extract key phrases from the session"""
        key_phrases = []
        
        # From initial analysis
        if "initial_analysis" in session_data:
            transcript = session_data["initial_analysis"].get("transcription", "")
            if transcript:
                key_phrases.append(transcript)
        
        # From conversation messages
        for msg in session_data.get("messages", []):
            if msg["role"] == "user" and len(msg.get("content", "")) > 20:
                key_phrases.append(msg["content"][:200])  # First 200 chars
        
        return key_phrases
    
    def _create_memory_entries(self, session_record: Dict):
        """Create searchable memory entries from session"""
        entries_to_add = []
        
        # Create entry from summary
        summary_entry = {
            "type": "session_summary",
            "content": session_record["summary"],
            "session_id": session_record["session_id"],
            "timestamp": session_record["timestamp"],
            "emotions": [e["emotions"] for e in session_record["emotions_tracked"]],
            "techniques": [t["technique"] for t in session_record["techniques_used"]]
        }
        entries_to_add.append(summary_entry)
        
        # Create entries from key phrases
        for i, phrase in enumerate(session_record["key_phrases"]):
            if len(phrase.strip()) > 10:  # Only meaningful phrases
                phrase_entry = {
                    "type": "key_phrase",
                    "content": phrase,
                    "session_id": session_record["session_id"],
                    "timestamp": session_record["timestamp"],
                    "phrase_index": i
                }
                entries_to_add.append(phrase_entry)
        
        # Create crisis-related entries if any
        for crisis in session_record["crisis_flags"]:
            crisis_entry = {
                "type": "crisis_flag",
                "content": f"Crisis level {crisis['level']}: {crisis.get('text', 'N/A')}",
                "session_id": session_record["session_id"],
                "timestamp": crisis["timestamp"],
                "crisis_level": crisis["level"]
            }
            entries_to_add.append(crisis_entry)
        
        # Generate embeddings and add to index
        if entries_to_add:
            contents = [entry["content"] for entry in entries_to_add]
            embeddings = self.encoder.encode(contents)
            embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)  # Normalize
            
            # Add to FAISS index
            self.index.add(embeddings.astype('float32'))
            
            # Add metadata
            start_idx = len(self.metadata)
            for i, entry in enumerate(entries_to_add):
                entry["index_id"] = start_idx + i
                self.metadata.append(entry)
    
    def get_relevant_context(self, query: str, k: int = 5) -> List[str]:
        """
        Retrieve relevant context from past conversations
        """
        if self.index.ntotal == 0:
            return []
        
        try:
            # Generate query embedding
            query_embedding = self.encoder.encode([query])
            query_embedding = query_embedding / np.linalg.norm(query_embedding, axis=1, keepdims=True)
            
            # Search for similar memories
            scores, indices = self.index.search(query_embedding.astype('float32'), k)
            
            # Get relevant contexts
            contexts = []
            for idx in indices[0]:
                if idx < len(self.metadata):
                    entry = self.metadata[idx]
                    context = self._format_context(entry)
                    if context:
                        contexts.append(context)
            
            return contexts
            
        except Exception as e:
            logger.error(f"Error retrieving context: {e}")
            return []
    
    def _format_context(self, entry: Dict) -> str:
        """Format memory entry as context string"""
        try:
            if entry["type"] == "session_summary":
                return f"Previous session: {entry['content'][:200]}..."
            elif entry["type"] == "key_phrase":
                return f"Past conversation: {entry['content']}"
            elif entry["type"] == "crisis_flag":
                return f"Previous crisis indicator: {entry['content']}"
            return ""
        except Exception as e:
            logger.error(f"Error formatting context: {e}")
            return ""
    
    def get_emotion_patterns(self, lookback_days: int = 30) -> Dict:
        """
        Analyze emotion patterns over time
        """
        cutoff_date = datetime.now().timestamp() - (lookback_days * 24 * 60 * 60)
        
        emotions_over_time = []
        techniques_used = []
        
        for session in self.sessions:
            try:
                session_time = datetime.fromisoformat(session["timestamp"]).timestamp()
                if session_time > cutoff_date:
                    emotions_over_time.extend(session.get("emotions_tracked", []))
                    techniques_used.extend([t["technique"] for t in session.get("techniques_used", [])])
            except Exception as e:
                logger.error(f"Error processing session for patterns: {e}")
                continue
        
        return {
            "emotions_frequency": self._count_emotions(emotions_over_time),
            "techniques_frequency": self._count_items(techniques_used),
            "total_sessions": len([s for s in self.sessions 
                                 if datetime.fromisoformat(s["timestamp"]).timestamp() > cutoff_date])
        }
    
    def _count_emotions(self, emotion_entries: List[Dict]) -> Dict:
        """Count emotion frequencies"""
        emotion_counts = {}
        for entry in emotion_entries:
            for emotion in entry.get("emotions", []):
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        return emotion_counts
    
    def _count_items(self, items: List[str]) -> Dict:
        """Count item frequencies"""
        counts = {}
        for item in items:
            counts[item] = counts.get(item, 0) + 1
        return counts
    
    def get_crisis_history(self) -> List[Dict]:
        """
        Get history of crisis indicators
        """
        crisis_history = []
        for session in self.sessions:
            for crisis in session.get("crisis_flags", []):
                crisis_history.append({
                    "session_id": session["session_id"],
                    "timestamp": crisis["timestamp"],
                    "level": crisis["level"],
                    "type": crisis.get("type", "unknown"),
                    "session_date": session["timestamp"]
                })
        
        # Sort by timestamp
        crisis_history.sort(key=lambda x: x["timestamp"], reverse=True)
        return crisis_history
    
    def clear_memory(self):
        """Clear all memory (use with caution)"""
        logger.warning("Clearing all memory...")
        
        # Reset index
        self.index = faiss.IndexFlatIP(self.embedding_dim)
        self.metadata = []
        self.sessions = []
        
        # Remove files
        for file_path in [self.index_file, self.metadata_file, self.sessions_file]:
            if os.path.exists(file_path):
                os.remove(file_path)
        
        logger.info("Memory cleared successfully") 