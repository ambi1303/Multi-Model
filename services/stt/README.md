# 🎤 Voice Analysis & Emo Buddy System

A comprehensive voice analysis system with AI-powered therapeutic companion that provides deep emotional support using evidence-based therapy techniques.

## 🌟 Features

### Core Pipeline
- **Voice Recording**: 10-second audio capture with high-quality processing
- **Speech-to-Text**: Google Speech Recognition with Vosk fallback
- **Sentiment Analysis**: RoBERTa-based sentiment classification
- **Emotion Detection**: Multi-label emotion recognition
- **AI Wellness Advice**: Groq LLaMA 3 powered personalized recommendations

### Emo Buddy Therapeutic Companion
- **Evidence-Based Therapy**: CBT, DBT, and ACT techniques
- **Crisis Detection**: Real-time mental health crisis identification
- **Memory System**: Vector-based conversation memory with RAG
- **Personalized Responses**: Context-aware therapeutic interventions
- **Session Tracking**: Comprehensive emotion and technique logging

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Voice Input   │───▶│  Speech-to-Text  │───▶│   RoBERTa AI    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Groq LLaMA 3    │◀───│  Analysis Report │◀───│ Sentiment/Emotion│
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│ Wellness Advice │    │   Emo Buddy      │
└─────────────────┘    │   (Optional)     │
                       └──────────────────┘
                               │
        ┌──────────────────────────────────────────┐
        │              Emo Buddy System            │
        ├──────────────────────────────────────────┤
        │ • Gemini AI Conversational Engine        │
        │ • Vector Memory (FAISS + Sentence-BERT)  │
        │ • Therapeutic Techniques (CBT/DBT/ACT)   │
        │ • Crisis Detection & Safety Resources    │
        │ • Session Logging & Emotion Tracking    │
        └──────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Up API Keys

**Option A: Interactive Setup (Recommended)**
```bash
python setup_env.py
```

**Option B: Manual Setup**
Create a `.env` file in your project directory:

```env
# Required for Groq LLaMA 3 wellness advice
GROQ_API_KEY=your_actual_groq_api_key_here

# Required for Emo Buddy therapeutic companion (Gemini)
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Get your API keys:**
- **Groq API**: [console.groq.com](https://console.groq.com)
- **Gemini API**: [Google AI Studio](https://aistudio.google.com/app/apikey)

### 3. Test Setup
```bash
python test_setup.py
```

### 4. Run the System
```bash
python voice.py
```

📋 **For detailed setup instructions, see [SETUP.md](SETUP.md)**

## 🎯 Usage

### Basic Voice Analysis
1. Run the system and press Enter to start recording
2. Speak for 10 seconds when prompted
3. View the technical analysis report with sentiment and emotion data
4. Receive AI-powered wellness advice

### Emo Buddy Therapeutic Session
1. After the basic analysis, choose 'y' when prompted to start Emo Buddy
2. Engage in a therapeutic conversation with evidence-based techniques
3. Receive personalized support based on your emotional state
4. End the session naturally or type 'exit' to conclude

### Example Session Flow
```
🎤 Voice Analysis & Emo Buddy System
==================================================
This system provides:
1. Voice analysis with sentiment & emotion detection
2. AI-powered wellness advice  
3. Optional Emo Buddy therapeutic companion
==================================================

Press Enter to start recording (10 seconds)...
[Recording and analysis occurs]

==================================================
🤖 EMO BUDDY THERAPEUTIC COMPANION
==================================================
Would you like to continue with Emo Buddy? (y/n): y

🤖 Emo Buddy: I can see you're feeling [emotion]. That sounds really difficult...
💬 You: [Your response]
🤖 Emo Buddy: [Therapeutic response using CBT/DBT/ACT techniques]
```

## 🧠 Therapeutic Techniques

### Cognitive Behavioral Therapy (CBT)
- Thought challenging and cognitive restructuring
- Behavioral experiments and activity scheduling
- Identifying cognitive distortions

### Dialectical Behavior Therapy (DBT)
- Distress tolerance and emotion regulation
- Mindfulness and interpersonal effectiveness
- Crisis survival strategies

### Acceptance and Commitment Therapy (ACT)
- Psychological flexibility and acceptance
- Values clarification and commitment
- Mindfulness and present-moment awareness

## 🚨 Crisis Detection

The system includes comprehensive crisis detection with:
- **Real-time monitoring** for suicidal ideation, self-harm, and severe distress
- **Automatic resource provision** with crisis hotlines and emergency contacts
- **Safety planning** with personalized coping strategies
- **Professional referrals** when appropriate

### Crisis Resources
- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741
- **Emergency Services**: 911

## 💾 Memory & Tracking

### Conversation Memory
- Vector-based storage using FAISS and Sentence-BERT
- Retrieval-augmented generation for context-aware responses
- Persistent memory across sessions

### Emotion Tracking
- Real-time emotion detection and logging
- Pattern analysis over time
- Technique effectiveness assessment

### Session Summaries
Each session generates:
- Emotion frequency analysis
- Therapeutic techniques used
- Key insights and recommendations
- Crisis flags and safety notes

## 📁 File Structure

```
voiceimp/
├── .env                        # Your API keys (create this file)
├── voice.py                    # Main application
├── emo_buddy.py               # Emo Buddy agent
├── memory_manager.py          # Vector memory system
├── therapeutic_techniques.py   # CBT/DBT/ACT techniques
├── crisis_detector.py         # Crisis detection system
├── test_setup.py             # Setup verification
├── requirements.txt           # Python dependencies
├── README.md                  # This file
├── SETUP.md                   # Detailed setup guide
├── vosk-model-small-en-us-0.15/  # Speech recognition model
└── emo_buddy_memory/          # Generated memory files
    ├── memory_index.faiss
    ├── memory_metadata.json
    └── sessions.json
```

## 🔒 Privacy & Security

- **Local Processing**: Voice processing happens locally when possible
- **Data Minimization**: Only necessary data is stored
- **Secure Memory**: Sensitive information is truncated in logs
- **Crisis Logging**: High-risk events are logged for safety monitoring
- **API Key Security**: Store keys in `.env` file (never commit to version control)

## 🚀 Advanced Features

### Memory System
- **Semantic Search**: Find relevant past conversations
- **Emotion Patterns**: Track emotional trends over time
- **Crisis History**: Monitor crisis indicators and responses

### Therapeutic Intelligence
- **Technique Selection**: Automatic selection based on user needs
- **Response Adaptation**: Context-aware therapeutic responses
- **Progress Tracking**: Monitor therapeutic technique effectiveness

## 🛠️ Troubleshooting

### Common Issues

1. **"No module named 'dotenv'"**
   - Run: `pip install python-dotenv`

2. **"GROQ_API_KEY not set"**
   - Create `.env` file with your API keys
   - Ensure no spaces around `=` in the `.env` file

3. **"Speech recognition failed"**
   - Check microphone permissions
   - Ensure clear audio input
   - Verify Vosk model files are present

4. **Memory/FAISS errors**
   - Delete `emo_buddy_memory/` folder to reset
   - Reinstall: `pip install --force-reinstall faiss-cpu`

**For detailed troubleshooting, see [SETUP.md](SETUP.md)**

## 📚 References

- **Cognitive Behavioral Therapy**: Beck, A. T. (1979)
- **Dialectical Behavior Therapy**: Linehan, M. M. (1993)
- **Acceptance and Commitment Therapy**: Hayes, S. C. (2004)
- **Crisis Intervention**: National Suicide Prevention Guidelines

## ⚖️ Ethical Considerations

This system is designed for **supportive purposes only** and should not replace professional mental health care. Users experiencing severe mental health crises should seek immediate professional help.

## 🤝 Contributing

This project is designed to be educational and supportive. When contributing:
- Maintain therapeutic best practices
- Prioritize user safety and privacy
- Follow evidence-based approaches
- Test crisis detection thoroughly

## 📄 License

This project is for educational and supportive purposes. Please use responsibly and in accordance with mental health best practices.

---

**Note**: This system provides AI-powered support but is not a substitute for professional mental health care. If you're experiencing a mental health crisis, please contact emergency services or a mental health professional immediately. 