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
        """Create a simulated technical analysis for standalone mode"""
        
        # Simple sentiment analysis
        positive_words = ["happy", "good", "great", "wonderful", "excited", "joy", "love", "amazing"]
        negative_words = ["sad", "bad", "terrible", "awful", "depressed", "angry", "hate", "horrible", "anxious", "worried", "stressed"]
        
        message_lower = message.lower()
        
        # Count positive/negative words
        pos_count = sum(1 for word in positive_words if word in message_lower)
        neg_count = sum(1 for word in negative_words if word in message_lower)
        
        # Determine sentiment
        if neg_count > pos_count:
            sentiment = {"label": "NEGATIVE", "confidence": 0.75, "intensity": "moderate"}
            primary_emotion = "sadness"
        elif pos_count > neg_count:
            sentiment = {"label": "POSITIVE", "confidence": 0.75, "intensity": "moderate"}
            primary_emotion = "joy"
        else:
            sentiment = {"label": "NEUTRAL", "confidence": 0.60, "intensity": "low"}
            primary_emotion = "neutral"
        
        # Create emotion list
        emotions = [
            {"emotion": primary_emotion, "confidence": 0.70},
            {"emotion": "surprise", "confidence": 0.15},
            {"emotion": "neutral", "confidence": 0.10}
        ]
        
        return {
            "transcription": message,
            "sentiment": sentiment,
            "emotions": emotions,
            "source": "standalone_chat",
            "timestamp": datetime.now().isoformat()
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

🚀 Ready to chat? Just start typing! (Type 'quit' to exit)
        """)
        print("=" * 50)

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