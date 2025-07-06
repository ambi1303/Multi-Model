# 🤖 Emo Buddy - AI Therapeutic Companion

A comprehensive AI therapeutic companion package using evidence-based therapy techniques (CBT, DBT, ACT) with advanced memory capabilities.

## 📁 Package Structure

```
emo_buddy/
├── __init__.py              # Package initialization and exports
├── emo_buddy_agent.py       # Main therapeutic AI agent
├── memory_manager.py        # Vector-based conversation memory system
├── therapeutic_techniques.py # Evidence-based therapy technique selection
├── crisis_detector.py       # Real-time crisis detection and safety resources
├── standalone_chat.py       # Standalone chat interface
└── README.md               # This file
```

## 🚀 Two Ways to Use Emo Buddy

### Way 1: Integrated with Voice Analysis (Current Default)
Use Emo Buddy as an optional continuation after voice analysis with full technical report integration:

```bash
# From the main project directory
python voice.py
# Follow voice analysis prompts
# Choose 'y' when asked to continue with Emo Buddy
```

**Features:**
- ✅ Full technical analysis (sentiment, emotions, transcription) carried forward
- ✅ Rich context from voice analysis integrated into therapeutic conversation
- ✅ Seamless transition from wellness advice to deep therapeutic support
- ✅ Memory system includes voice analysis data

### Way 2: Standalone Therapeutic Chatbot
Use Emo Buddy directly for text-based therapeutic conversations:

```bash
# From the main project directory
python emo_buddy/standalone_chat.py

# Or as a module
python -m emo_buddy.standalone_chat
```

**Features:**
- ✅ Direct text-based therapeutic conversations
- ✅ Simulated sentiment analysis for context
- ✅ Full memory and session management
- ✅ Independent therapeutic sessions
- ✅ Perfect for ongoing therapy-style conversations

## 🧠 Core Capabilities

### Memory System
- **Vector-based storage** using FAISS for semantic search
- **Session continuity** across multiple conversations
- **Emotional pattern tracking** over time
- **Context-aware responses** based on conversation history

### Therapeutic Techniques
- **CBT (Cognitive Behavioral Therapy)**: Thought pattern analysis and restructuring
- **DBT (Dialectical Behavior Therapy)**: Emotional regulation and distress tolerance
- **ACT (Acceptance and Commitment Therapy)**: Mindfulness and values-based living
- **Validation Therapy**: Acknowledgment and normalization
- **Reflective Listening**: Mirroring and understanding

### Crisis Detection
- **Real-time monitoring** for crisis indicators
- **Safety resources** and professional referrals
- **Escalation protocols** for high-risk situations
- **Emergency contact information**

## ⚙️ Configuration

Required environment variables in `.env` file:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here  # Only needed for integrated mode
```

## 📊 Session Management

### Integrated Mode (Way 1)
- Starts with technical analysis from voice
- Builds therapeutic goals from analysis
- Maintains context throughout session
- Stores comprehensive session data

### Standalone Mode (Way 2)
- Starts with simple sentiment analysis
- User-driven goal setting
- Maintains conversation memory
- Independent session tracking

## 🔒 Privacy & Safety

- **No data persistence** beyond session memory
- **Local storage** of conversation vectors
- **Crisis detection** with professional resource recommendations
- **Ethical AI** boundaries and limitations clearly communicated

## 🛠️ Development

### Key Classes
- `EmoBuddyAgent`: Main therapeutic conversation manager
- `ConversationMemory`: Vector-based memory system
- `TherapeuticTechniques`: Evidence-based technique selection
- `CrisisDetector`: Safety monitoring and resources
- `StandaloneEmoBuddy`: Direct chat interface

### Usage in Code
```python
from emo_buddy import EmoBuddyAgent

# Initialize agent
agent = EmoBuddyAgent()

# Start session with analysis (Way 1)
response = agent.start_session(analysis_report)

# Continue conversation
response, should_continue = agent.continue_conversation(user_input)

# End session
summary = agent.end_session()
```

## 📈 Future Enhancements

- Multiple language support
- Advanced crisis intervention protocols
- Integration with mental health resources
- Mood tracking and analytics
- Group therapy session support

---

**Note**: Emo Buddy is an AI companion designed to provide supportive conversations and basic therapeutic techniques. It is not a substitute for professional mental health care, therapy, or medical advice. 