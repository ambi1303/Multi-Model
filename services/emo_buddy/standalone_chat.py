#!/usr/bin/env python3
"""
Emo Buddy Standalone Chat

Run Emo Buddy as a standalone therapeutic chatbot without voice analysis.
Perfect for text-based therapeutic conversations.

Usage:
    python standalone_chat.py
    or
    python -m emo_buddy.standalone_chat
"""

import os
import sys
import logging
from datetime import datetime
from typing import Dict, List

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from emo_buddy import EmoBuddyAgent
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StandaloneEmoBuddy:
    """
    Standalone Emo Buddy for direct text-based therapeutic conversations
    """
    
    def __init__(self):
        try:
            self.agent = EmoBuddyAgent()
            self.session_active = False
            logger.info("Emo Buddy initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Emo Buddy: {e}")
            sys.exit(1)
    
    def start_chat(self):
        """Start the standalone chat interface"""
        self.display_welcome()
        
        while True:
            try:
                user_input = input("\n💬 You: ").strip()
                
                if not user_input:
                    continue
                    
                if user_input.lower() in ['quit', 'exit', 'bye', 'goodbye']:
                    break
                
                # Memory management commands
                if user_input.lower() in ['/clear-memory', '/reset', '/forget']:
                    self.handle_memory_clear()
                    continue
                
                if user_input.lower() in ['/memory-stats', '/stats']:
                    self.display_memory_stats()
                    continue
                
                if not self.session_active:
                    # Start new session with simulated analysis
                    response = self.start_new_session(user_input)
                    self.session_active = True
                else:
                    # Continue existing session
                    response, should_continue = self.agent.continue_conversation(user_input)
                    if not should_continue:
                        self.end_current_session()
                        self.session_active = False
                        continue
                
                print(f"\n🤖 Emo Buddy: {response}")
                
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye! Take care of yourself.")
                break
            except Exception as e:
                logger.error(f"Error in chat: {e}")
                print("\n🤖 Emo Buddy: I'm having some technical difficulties. Let's try again.")
        
        if self.session_active:
            self.end_current_session()
        
        print("\n🌟 Thank you for chatting with Emo Buddy. Remember, you're never alone. 🌟")
    
    def start_new_session(self, initial_message: str) -> str:
        """Start a new session with simulated analysis"""
        
        # Create simulated analysis report for standalone mode
        analysis_report = self.create_simulated_analysis(initial_message)
        
        print("\n🤖 Starting Emo Buddy Session...")
        print("=" * 50)
        
        return self.agent.start_session(analysis_report)
    
    def create_simulated_analysis(self, message: str) -> Dict:
        """Create a simulated technical analysis for standalone mode with workplace context"""
        
        # Enhanced emotion detection with workplace terms
        emotion_keywords = {
            'sadness': ['sad', 'low', 'down', 'depressed', 'unhappy', 'disappointed', 'deflated'],
            'stress': ['stressed', 'overwhelmed', 'pressure', 'tense', 'burden', 'strain'],
            'anxiety': ['anxious', 'worried', 'nervous', 'panic', 'fearful', 'concerned'],
            'exhaustion': ['tired', 'exhausted', 'drained', 'burnt out', 'weary', 'fatigued'],
            'frustration': ['frustrated', 'annoyed', 'irritated', 'angry', 'mad', 'upset'],
            'demotivation': ['unmotivated', 'don\'t feel like', 'no energy', 'can\'t', 'won\'t'],
            'joy': ['happy', 'good', 'great', 'wonderful', 'excited', 'amazing', 'love'],
            'confidence': ['confident', 'capable', 'strong', 'ready', 'motivated', 'determined']
        }
        
        workplace_indicators = ['manager', 'boss', 'work', 'job', 'office', 'meeting', 'project', 'deadline', 'client', 'scolded', 'feedback', 'coding', 'analysis', 'overtime', 'hours']
        
        message_lower = message.lower()
        
        # Detect emotions based on keywords
        detected_emotions = []
        for emotion, keywords in emotion_keywords.items():
            matches = sum(1 for keyword in keywords if keyword in message_lower)
            if matches > 0:
                # Higher confidence for more keyword matches
                confidence = min(0.3 + (matches * 0.2), 0.9)
                detected_emotions.append({"emotion": emotion, "confidence": confidence, "matches": matches})
        
        # Sort by confidence and take top emotions
        detected_emotions.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Determine primary sentiment
        negative_emotions = ['sadness', 'stress', 'anxiety', 'exhaustion', 'frustration', 'demotivation']
        positive_emotions = ['joy', 'confidence']
        
        if detected_emotions:
            primary_emotion = detected_emotions[0]['emotion']
            if primary_emotion in negative_emotions:
                sentiment_label = "NEGATIVE"
                sentiment_confidence = detected_emotions[0]['confidence']
            elif primary_emotion in positive_emotions:
                sentiment_label = "POSITIVE"
                sentiment_confidence = detected_emotions[0]['confidence']
            else:
                sentiment_label = "NEUTRAL"
                sentiment_confidence = 0.6
        else:
            sentiment_label = "NEUTRAL"
            sentiment_confidence = 0.5
            primary_emotion = "neutral"
            detected_emotions = [{"emotion": "neutral", "confidence": 0.5, "matches": 0}]
        
        # Check for workplace context
        workplace_present = any(indicator in message_lower for indicator in workplace_indicators)
        if workplace_present:
            # Boost confidence for workplace-related emotions
            sentiment_confidence = min(sentiment_confidence + 0.2, 0.95)
        
        # Create final emotion list (max 3 emotions)
        final_emotions = []
        for i, emotion_data in enumerate(detected_emotions[:3]):
            if i == 0:  # Primary emotion
                final_emotions.append({
                    "emotion": emotion_data['emotion'],
                    "confidence": emotion_data['confidence']
                })
            else:  # Secondary emotions
                final_emotions.append({
                    "emotion": emotion_data['emotion'],
                    "confidence": max(emotion_data['confidence'] - 0.2, 0.1)
                })
        
        # Ensure we have at least 3 emotions
        while len(final_emotions) < 3:
            final_emotions.append({"emotion": "neutral", "confidence": 0.1})
        
        # Determine intensity
        if sentiment_confidence >= 0.8:
            intensity = "high"
        elif sentiment_confidence >= 0.6:
            intensity = "moderate"
        else:
            intensity = "low"
        
        return {
            "transcription": message,
            "sentiment": {
                "label": sentiment_label,
                "confidence": sentiment_confidence,
                "intensity": intensity
            },
            "emotions": final_emotions,
            "source": "standalone_chat",
            "timestamp": datetime.now().isoformat(),
            "workplace_context": workplace_present
        }
    
    def end_current_session(self):
        """End the current session"""
        try:
            summary = self.agent.end_session()
            print("\n" + "=" * 50)
            print("🔄 Session Complete")
            print("=" * 50)
            print(summary)
            print("\n💭 Would you like to start a new conversation? Just type something!")
        except Exception as e:
            logger.error(f"Error ending session: {e}")
            print("\n✅ Session ended.")
    
    def display_welcome(self):
        """Display welcome message"""
        print("\n" + "🌟" * 50)
        print("🤖 Welcome to Emo Buddy - Your AI Therapeutic Companion")
        print("🌟" * 50)
        print("""
💡 How this works:
   • I'm here to provide emotional support and therapeutic guidance
   • I use evidence-based techniques like CBT, DBT, and ACT
   • I remember our conversations and build on our relationship
   • Everything is confidential and supportive

🎯 What I can help with:
   • Processing difficult emotions
   • Managing stress and anxiety
   • Working through relationship issues
   • Developing coping strategies
   • General emotional wellness

⚠️  Important: I'm an AI companion, not a replacement for professional help.
   If you're in crisis, please contact emergency services or a mental health professional.

🛠️  Memory Commands:
   • /clear-memory or /reset - Clear all conversation memory
   • /memory-stats or /stats - View memory statistics

🚀 Ready to chat? Just start typing! (Type 'quit' to exit)
        """)
        print("=" * 50)
    
    def handle_memory_clear(self):
        """Handle memory clearing with confirmation"""
        print("\n⚠️  WARNING: This will permanently delete ALL conversation memory!")
        print("   • All past conversations will be lost")
        print("   • Emotional patterns will be reset")
        print("   • You'll start fresh with no previous context")
        
        confirmation = input("\n🤔 Are you sure? Type 'YES' to confirm: ")
        if confirmation == "YES":
            try:
                # Get stats before clearing
                total_sessions = len(self.agent.memory.sessions)
                total_memories = len(self.agent.memory.metadata)
                
                # Clear memory
                self.agent.memory.clear_memory()
                
                print("✅ Memory cleared successfully!")
                print(f"   • Deleted {total_sessions} sessions")
                print(f"   • Deleted {total_memories} memory entries")
                print("\n🆕 I'll start fresh with no previous conversations.")
                
                # End current session if active
                if self.session_active:
                    self.session_active = False
                    print("   • Current session ended")
                
            except Exception as e:
                print(f"❌ Error clearing memory: {e}")
        else:
            print("❌ Memory clearing cancelled.")
    
    def display_memory_stats(self):
        """Display current memory statistics"""
        try:
            memory = self.agent.memory
            
            print("\n📊 EMO BUDDY MEMORY STATISTICS")
            print("=" * 40)
            print(f"🗂️  Total Sessions: {len(memory.sessions)}")
            print(f"🧠 Memory Entries: {len(memory.metadata)}")
            
            # Get emotion patterns
            emotion_patterns = memory.get_emotion_patterns()
            
            if emotion_patterns.get('emotions_frequency'):
                print(f"\n💭 Most Common Emotions:")
                emotions = emotion_patterns['emotions_frequency']
                for emotion, count in sorted(emotions.items(), key=lambda x: x[1], reverse=True)[:3]:
                    print(f"   • {emotion}: {count} times")
            
            if emotion_patterns.get('techniques_frequency'):
                print(f"\n🔧 Most Used Techniques:")
                techniques = emotion_patterns['techniques_frequency']
                for technique, count in sorted(techniques.items(), key=lambda x: x[1], reverse=True)[:3]:
                    print(f"   • {technique.upper()}: {count} times")
            
            # Crisis history
            crisis_history = memory.get_crisis_history()
            crisis_count = len(crisis_history)
            
            if crisis_count > 0:
                print(f"\n⚠️  Crisis Indicators: {crisis_count} detected")
            else:
                print(f"\n✅ Crisis Indicators: None detected")
            
            print("=" * 40)
            
        except Exception as e:
            print(f"❌ Error getting memory stats: {e}")

def main():
    """Main function to run standalone Emo Buddy"""
    try:
        # Check for required API keys
        if not os.environ.get("GEMINI_API_KEY"):
            print("❌ Error: GEMINI_API_KEY environment variable not set")
            print("Please set your Gemini API key in the .env file")
            sys.exit(1)
        
        chat = StandaloneEmoBuddy()
        chat.start_chat()
        
    except Exception as e:
        logger.error(f"Failed to start Emo Buddy: {e}")
        print(f"❌ Error starting Emo Buddy: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 