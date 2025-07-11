import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import google.generativeai as genai
from memory_manager import get_memory_manager, ConversationMemory
import uuid
from crisis_detector import CrisisDetector
from therapeutic_techniques import get_technique
from corporate_context import get_corporate_context
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmoBuddyAgent:
    """
    Emo Buddy - A therapeutic AI companion that provides deep emotional support
    using evidence-based therapy techniques like CBT, DBT, and ACT.
    """
    
    def __init__(self):
        self.setup_gemini()
        self.memory = get_memory_manager()
        self.therapeutic_techniques = get_technique()
        self.crisis_detector = CrisisDetector()
        self.corporate_analyzer = get_corporate_context()
        self.current_session = {
            "start_time": datetime.now(),
            "messages": [],
            "conversation_messages": [],
            "emotions_tracked": [],
            "techniques_used": [],
            "crisis_flags": [],
            "workplace_context": {},
            "quick_remedies_given": [],
            "solution_oriented": True,
            "user_id": None # Add user_id to session
        }
        
    def setup_gemini(self):
        """Initialize Gemini API"""
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        logger.info("Gemini API initialized successfully")
    
    def start_session(self, analysis_report: Dict) -> str:
        """
        Start a new Emo Buddy session with the initial analysis report
        """
        logger.info("Starting Emo Buddy session...")
        
        # --- Store user_id in the session ---
        user_id = analysis_report.get("user_id")
        if user_id:
            self.current_session["user_id"] = user_id
            # Also add it to the initial analysis for the memory manager
            analysis_report["user_id"] = user_id
        else:
            logger.warning("No user_id provided in analysis_report for Emo Buddy session.")
        # --- End change ---

        # Extract key information from the technical analysis
        transcript = analysis_report["transcription"]
        sentiment = analysis_report["sentiment"]
        emotions = analysis_report["emotions"]
        
        # Analyze workplace context for corporate-specific insights
        workplace_context = self.corporate_analyzer.analyze_workplace_context(transcript)
        self.current_session["workplace_context"] = workplace_context
        
        # Store comprehensive initial analysis in current session
        self.current_session["initial_analysis"] = analysis_report
        self.current_session["user_context"] = {
            "primary_concern": transcript,
            "emotional_state": {
                "sentiment": sentiment["label"],
                "intensity": sentiment.get("intensity", "moderate"),
                "confidence": sentiment["confidence"],
                "top_emotions": [e["emotion"] for e in emotions[:3]]
            },
            "session_goals": self._infer_session_goals(transcript, sentiment, emotions),
            "therapeutic_needs": self._assess_therapeutic_needs(transcript, sentiment, emotions)
        }
        
        self.current_session["emotions_tracked"].extend([
            {
                "timestamp": datetime.now().isoformat(),
                "sentiment": sentiment["label"],
                "emotions": [e["emotion"] for e in emotions[:3]],
                "source": "technical_analysis",
                "intensity": sentiment.get("intensity", "moderate")
            }
        ])
        
        # Check for crisis indicators
        crisis_level = self.crisis_detector.assess_crisis_level(transcript, sentiment, emotions)
        if crisis_level > 3:  # Scale of 1-5
            self.current_session["crisis_flags"].append({
                "timestamp": datetime.now().isoformat(),
                "level": crisis_level,
                "type": "initial_assessment"
            })
        
        # Retrieve relevant past conversations with enhanced context
        past_context = self.memory.get_relevant_context(transcript + " " + " ".join([e["emotion"] for e in emotions[:3]]))
        emotion_patterns = self.memory.get_emotion_patterns()
        
        # Check if user needs immediate solutions vs deeper exploration
        if (workplace_context.get('requires_immediate_action', False) or 
            workplace_context.get('detected_contexts', [])):
            response = self._provide_quick_workplace_solutions(transcript, workplace_context, sentiment, emotions)
        else:
            initial_prompt = self._create_initial_prompt(transcript, sentiment, emotions, past_context, crisis_level, emotion_patterns)
            response = self._generate_response(initial_prompt)
        
        self._log_interaction("assistant", "session_start", response)
        
        return response
    
    def continue_conversation(self, user_input: str) -> Tuple[str, bool]:
        """
        Continue the therapeutic conversation
        Returns: (response, should_continue)
        """
        self._log_interaction("user", user_input, "")
        self._update_user_context(user_input)
        
        new_workplace_context = self.corporate_analyzer.analyze_workplace_context(user_input)
        if new_workplace_context.get('detected_contexts'):
            existing_context = self.current_session.get("workplace_context", {})
            existing_context.update(new_workplace_context)
            self.current_session["workplace_context"] = existing_context
        
        crisis_level = self.crisis_detector.assess_text_for_crisis(user_input)
        if crisis_level > 3:
            self.current_session["crisis_flags"].append({
                "timestamp": datetime.now().isoformat(),
                "level": crisis_level,
                "type": "conversation_crisis",
                "text": user_input
            })
        
        conversation_history = self._get_conversation_history()
        past_context = self.memory.get_relevant_context(user_input + " " + self._get_current_emotional_context())
        
        technique = self.therapeutic_techniques.select_technique(
            user_input, 
            conversation_history, 
            self.current_session["emotions_tracked"]
        )
        
        self.current_session["techniques_used"].append({
            "timestamp": datetime.now().isoformat(),
            "technique": technique,
            "context": user_input[:100],
            "rationale": self._get_technique_rationale(technique, user_input)
        })
        
        if self._is_solution_request(user_input):
            response = self._provide_targeted_solutions(user_input)
            should_continue = self._should_continue_conversation(user_input, response)
        else:
            therapeutic_prompt = self._create_therapeutic_prompt(
                user_input, 
                conversation_history, 
                past_context, 
                technique, 
                crisis_level
            )
            response = self._generate_response(therapeutic_prompt)
            should_continue = self._should_continue_conversation(user_input, response)
        
        self._log_interaction("assistant", "therapeutic_response", response)
        
        return response, should_continue
    
    def end_session(self) -> str:
        """
        End the current session and provide summary
        """
        logger.info("Ending Emo Buddy session...")
        summary = self._generate_enhanced_session_summary()
        self.memory.store_session(self.current_session, summary)
        
        self.current_session = {
            "start_time": datetime.now(),
            "messages": [],
            "conversation_messages": [],
            "emotions_tracked": [],
            "techniques_used": [],
            "crisis_flags": [],
            "workplace_context": {},
            "quick_remedies_given": [],
            "solution_oriented": True
        }
        
        return summary
    
    def _create_initial_prompt(self, transcript: str, sentiment: Dict, emotions: List, 
                              past_context: List, crisis_level: int, emotion_patterns: Dict = None) -> str:
        """Create the initial therapeutic prompt with rich context"""
        
        # Format past context with better structure
        past_context_str = self._format_past_context(past_context)
        
        # Format emotion patterns
        emotion_pattern_str = self._format_emotion_patterns(emotion_patterns) if emotion_patterns else ""
        
        crisis_note = ""
        if crisis_level > 3:
            crisis_note = "\n⚠️ CRISIS ALERT: High crisis indicators detected. Prioritize safety and consider professional resources."
        
        # Get user context
        user_context = self.current_session.get("user_context", {})
        therapeutic_needs = user_context.get("therapeutic_needs", "general support")
        session_goals = user_context.get("session_goals", ["understand current state"])
        
        return f"""
You are Emo Buddy, a compassionate AI therapeutic companion with extensive training in CBT, DBT, and ACT techniques. You have deep memory of past conversations and can build meaningful therapeutic relationships over time.

**CURRENT SESSION CONTEXT:**
The user just expressed: "{transcript}"

**COMPREHENSIVE EMOTIONAL ANALYSIS:**
- Primary Sentiment: {sentiment['label']} (confidence: {sentiment['confidence']:.2f})
- Key Emotions: {', '.join([f"{e['emotion']} ({e['confidence']:.2f})" for e in emotions[:3]])}
- Emotional Intensity: {sentiment.get('intensity', 'moderate')}
- Therapeutic Needs: {therapeutic_needs}

**SESSION OBJECTIVES:**
{chr(10).join([f"• {goal}" for goal in session_goals])}

**RELEVANT MEMORY & CONTEXT:**
{past_context_str}

{emotion_pattern_str}

{crisis_note}

**YOUR THERAPEUTIC MISSION:**
1. **ACKNOWLEDGE & VALIDATE**: Start by genuinely acknowledging their current emotional state
2. **REFERENCE CONTEXT**: Subtly reference relevant past context if available to show continuity
3. **EXPLORE WITH PURPOSE**: Ask thoughtful questions that connect to their therapeutic needs
4. **BUILD RAPPORT**: Show you remember and care about their ongoing journey
5. **SET FOUNDATION**: Establish a safe space for deeper exploration

**RESPONSE APPROACH:**
- Start with empathetic validation of their current state
- Reference any relevant past context naturally (e.g., "I remember you mentioned...")
- Ask ONE meaningful question that shows you understand their deeper needs
- Keep initial response warm, professional, and focused (2-3 sentences)
- Use their name or personal references if you know them from past sessions

Respond as Emo Buddy with therapeutic wisdom, genuine care, and contextual awareness.
"""
    
    def _create_therapeutic_prompt(self, user_input: str, conversation_history: List, 
                                  past_context: List, technique: str, crisis_level: int) -> str:
        """Create therapeutic response prompt with comprehensive context"""
        
        # Format conversation history with better context
        history_str = self._format_conversation_history(conversation_history)
        
        # Format past context with relevance indicators
        past_context_str = self._format_past_context(past_context)
        
        # Get current user context and progress
        user_context = self.current_session.get("user_context", {})
        emotional_journey = self._track_emotional_journey()
        session_progress = self._assess_session_progress()
        
        crisis_note = ""
        if crisis_level > 3:
            crisis_note = "\n⚠️ CRISIS ALERT: Provide immediate support resources and prioritize safety."
        
        return f"""
You are Emo Buddy, deeply engaged in an ongoing therapeutic conversation. You have context about this user's journey and current emotional state.

**CURRENT MOMENT:**
User just shared: "{user_input}"

**ONGOING SESSION CONTEXT:**
- Primary Concern: {user_context.get('primary_concern', 'Not specified')}
- Emotional State: {user_context.get('emotional_state', {}).get('sentiment', 'Unknown')} 
- Session Goals: {', '.join(user_context.get('session_goals', ['General support']))}
- Therapeutic Needs: {user_context.get('therapeutic_needs', 'General support')}

**EMOTIONAL JOURNEY THIS SESSION:**
{emotional_journey}

**CONVERSATION FLOW:**
{history_str}

**RELEVANT MEMORY FROM PAST SESSIONS:**
{past_context_str}

**SESSION PROGRESS ASSESSMENT:**
{session_progress}

**RECOMMENDED THERAPEUTIC APPROACH:** {technique}
Rationale: {self.current_session.get('techniques_used', [{}])[-1].get('rationale', 'Based on current needs')}

{crisis_note}

**YOUR THERAPEUTIC RESPONSE STRATEGY:**
1. **ACKNOWLEDGE PROGRESSION**: Reference how their sharing builds on previous moments in this conversation
2. **APPLY TECHNIQUE**: Use {technique} technique thoughtfully and naturally
3. **SHOW CONTINUITY**: Connect to their ongoing concerns and emotional patterns
4. **DEEPEN UNDERSTANDING**: Ask questions that build on what you already know
5. **VALIDATE GROWTH**: Recognize any progress or insights they're showing
6. **PROVIDE DIRECTION**: Guide them toward therapeutic goals while following their lead

**TECHNIQUE APPLICATION:**
- **CBT**: Challenge thoughts, explore evidence, identify patterns in their thinking
- **DBT**: Focus on emotional regulation, distress tolerance, interpersonal skills
- **ACT**: Encourage acceptance, mindfulness, values-based action
- **Validation**: Acknowledge their experience as understandable and meaningful
- **Reflection**: Mirroring back to ensure understanding and build rapport"

**RESPONSE GUIDELINES:**
- Build on the conversation flow naturally
- Reference specific things they've shared (today or previously)
- Ask questions that show you're tracking their emotional journey
- Keep responses conversational but therapeutically purposeful (3-4 sentences)
- Show that you see them as a whole person, not just their current problem

Respond as Emo Buddy with deep therapeutic understanding and genuine human connection.
"""
    
    def _generate_response(self, prompt: str) -> str:
        """Generate response using Gemini"""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I'm having trouble processing right now. Could you share a bit more about how you're feeling?"
    
    def _log_interaction(self, role: str, content: str, response: str):
        """Log conversation interaction"""
        self.current_session["messages"].append({
            "timestamp": datetime.now().isoformat(),
            "role": role,
            "content": content,
            "response": response
        })
        
        # Also store in conversation format for enhanced summary
        if "conversation_messages" not in self.current_session:
            self.current_session["conversation_messages"] = []
            
        if role == "user":
            self.current_session["conversation_messages"].append({
                "role": "user",
                "content": content
            })
        elif role == "assistant":
            self.current_session["conversation_messages"].append({
                "role": "assistant", 
                "content": response
            })
    
    def _get_conversation_history(self) -> List[Dict]:
        """Get formatted conversation history"""
        return [
            {
                "role": msg["role"],
                "content": msg.get("response", msg["content"])
            }
            for msg in self.current_session["messages"]
            if msg["role"] in ["user", "assistant"]
        ]
    
    def _should_continue_conversation(self, user_input: str, response: str) -> bool:
        """Determine if conversation should continue"""
        ending_phrases = [
            "thank you", "thanks", "goodbye", "bye", "that's all", 
            "i'm done", "end session", "stop", "quit"
        ]
        
        user_lower = user_input.lower()
        for phrase in ending_phrases:
            if phrase in user_lower:
                return False
        
        return len(self.current_session["messages"]) < 30
    
    def _generate_session_summary(self) -> str:
        """Generate comprehensive session summary"""
        emotions_summary = self._summarize_emotions()
        techniques_summary = self._summarize_techniques()
        key_insights = self._extract_key_insights()
        crisis_summary = self._summarize_crisis_flags()
        
        duration = datetime.now() - self.current_session["start_time"]
        
        summary = f"""
🌿 EMO BUDDY SESSION SUMMARY
{'='*50}

📅 Session Duration: {duration}
💬 Total Interactions: {len(self.current_session["messages"])}

🧠 EMOTIONS TRACKED:
{emotions_summary}

🔧 THERAPEUTIC TECHNIQUES USED:
{techniques_summary}

💡 KEY INSIGHTS:
{key_insights}

{crisis_summary}

📝 RECOMMENDATIONS:
- Continue monitoring emotional patterns
- Practice suggested coping strategies
- Consider professional support if patterns persist

🎯 NEXT STEPS:
- Reflect on insights from this session
- Apply therapeutic techniques in daily life
- Return when you need support or want to check in
"""
        return summary
    
    def _summarize_emotions(self) -> str:
        """Summarize emotions tracked during session"""
        if not self.current_session["emotions_tracked"]:
            return "No specific emotions tracked"
        
        emotions = []
        for entry in self.current_session["emotions_tracked"]:
            emotions.extend(entry["emotions"])
        
        # Count emotion frequencies
        emotion_counts = {}
        for emotion in emotions:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        # Sort by frequency
        sorted_emotions = sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True)
        
        return "\n".join([f"- {emotion}: {count} times" for emotion, count in sorted_emotions[:5]])
    
    def _summarize_techniques(self) -> str:
        """Summarize therapeutic techniques used"""
        if not self.current_session["techniques_used"]:
            return "No specific techniques applied"
        
        techniques = [entry["technique"] for entry in self.current_session["techniques_used"]]
        technique_counts = {}
        for technique in techniques:
            technique_counts[technique] = technique_counts.get(technique, 0) + 1
        
        return "\n".join([f"- {technique}: {count} times" for technique, count in technique_counts.items()])
    
    def _extract_key_insights(self) -> str:
        """Extract key insights from the conversation"""
        return "Insights generated based on conversation patterns and emotional responses"
    
    def _summarize_crisis_flags(self) -> str:
        """Summarize any crisis flags detected"""
        if not self.current_session["crisis_flags"]:
            return ""
        
        return f"""
⚠️ CRISIS INDICATORS DETECTED:
- {len(self.current_session["crisis_flags"])} crisis flags raised
- Highest level: {max([flag["level"] for flag in self.current_session["crisis_flags"]])}
- Immediate professional support recommended
"""

    def _infer_session_goals(self, transcript: str, sentiment: Dict, emotions: List) -> List[str]:
        """Infer likely session goals based on initial analysis"""
        goals = ["understand current emotional state"]
        transcript_lower = transcript.lower()
        if any(word in transcript_lower for word in ["help", "support", "don't know"]):
            goals.append("provide emotional support and guidance")
        if any(word in transcript_lower for word in ["anxious", "worried", "stress", "panic"]):
            goals.append("address anxiety and stress management")
        if any(word in transcript_lower for word in ["sad", "depressed", "down", "low"]):
            goals.append("explore and process sadness/depression")
        if any(word in transcript_lower for word in ["work", "job", "office", "deadline"]):
            goals.append("discuss work-related stress and coping")
        if any(word in transcript_lower for word in ["relationship", "family", "friend"]):
            goals.append("explore interpersonal relationships")
        if sentiment["label"] == "NEGATIVE" and sentiment["confidence"] > 0.8:
            goals.append("process strong negative emotions")
        return goals[:4]

    def _assess_therapeutic_needs(self, transcript: str, sentiment: Dict, emotions: List) -> str:
        """Assess primary therapeutic needs based on analysis"""
        top_emotion = emotions[0]["emotion"] if emotions else "neutral"
        needs_mapping = {
            "sadness": "emotional processing and mood support",
            "anger": "anger management and emotional regulation",
            "fear": "anxiety reduction and coping strategies", 
            "anxiety": "anxiety management and grounding techniques",
            "disgust": "value clarification and acceptance work",
            "surprise": "processing unexpected events and adaptation",
            "joy": "maintaining positive mental health",
            "neutral": "general emotional wellness support"
        }
        transcript_lower = transcript.lower()
        if any(word in transcript_lower for word in ["crisis", "emergency", "help me", "can't cope"]):
            return "crisis intervention and immediate support"
        elif any(word in transcript_lower for word in ["work", "job", "career", "deadline"]):
            return "work-life balance and stress management"
        elif any(word in transcript_lower for word in ["relationship", "partner", "family"]):
            return "relationship counseling and communication skills"
        return needs_mapping.get(top_emotion, "general emotional support")

    def _update_user_context(self, user_input: str):
        """Update user context based on new input"""
        if "user_context" not in self.current_session:
            self.current_session["user_context"] = {}
        context = self.current_session["user_context"]
        if "emotional_trajectory" not in context:
            context["emotional_trajectory"] = []
        positive_words = ["better", "good", "okay", "fine", "improving", "helped"]
        negative_words = ["worse", "bad", "terrible", "awful", "struggling", "difficult"]
        user_lower = user_input.lower()
        if any(word in user_lower for word in positive_words):
            context["emotional_trajectory"].append({"direction": "positive", "timestamp": datetime.now().isoformat()})
        elif any(word in user_lower for word in negative_words):
            context["emotional_trajectory"].append({"direction": "negative", "timestamp": datetime.now().isoformat()})
        if "recurring_themes" not in context:
            context["recurring_themes"] = {}
        themes = ["work", "family", "health", "relationship", "anxiety", "depression", "stress"]
        for theme in themes:
            if theme in user_lower:
                context["recurring_themes"][theme] = context["recurring_themes"].get(theme, 0) + 1

    def _get_current_emotional_context(self) -> str:
        """Get current emotional context for memory search"""
        context = self.current_session.get("user_context", {})
        emotional_state = context.get("emotional_state", {})
        context_parts = []
        if emotional_state.get("sentiment"):
            context_parts.append(emotional_state["sentiment"])
        if emotional_state.get("top_emotions"):
            context_parts.extend(emotional_state["top_emotions"])
        if context.get("therapeutic_needs"):
            context_parts.append(context["therapeutic_needs"])
        return " ".join(context_parts)

    def _get_technique_rationale(self, technique: str, user_input: str) -> str:
        """Provide rationale for technique selection"""
        rationales = {
            "cbt": "User showing thought patterns that could benefit from cognitive restructuring",
            "dbt": "Emotional regulation and distress tolerance skills needed",
            "act": "Acceptance and mindfulness approach appropriate for current state",
            "validation": "User needs acknowledgment and normalization of their experience",
            "reflection": "Mirroring back to ensure understanding and build rapport"
        }
        return rationales.get(technique, "Selected based on current therapeutic needs")

    def _format_past_context(self, past_context: List) -> str:
        """Format past context with better structure and relevance"""
        if not past_context:
            return "No previous sessions found - this appears to be our first meaningful conversation."
        formatted = "RELEVANT MEMORIES FROM PAST SESSIONS:\n"
        for i, ctx in enumerate(past_context[:3], 1):
            formatted += f"  {i}. {ctx}\n"
        if len(past_context) > 3:
            formatted += f"  ... and {len(past_context) - 3} other relevant memories"
        return formatted

    def _format_emotion_patterns(self, emotion_patterns: Dict) -> str:
        """Format emotion patterns from memory"""
        if not emotion_patterns or not emotion_patterns.get("common_emotions"):
            return ""
        common_emotions = emotion_patterns.get("common_emotions", {})
        if not common_emotions:
            return ""
        formatted = "EMOTIONAL PATTERNS FROM HISTORY:\n"
        for emotion, count in list(common_emotions.items())[:3]:
            formatted += f"  • {emotion}: appeared in {count} previous sessions\n"
        return formatted

    def _format_conversation_history(self, conversation_history: List) -> str:
        """Format conversation history with better context"""
        if not conversation_history:
            return "This is the start of our conversation."
        formatted = ""
        for msg in conversation_history[-4:]:
            role = "You" if msg["role"] == "user" else "Emo Buddy"
            content = msg["content"][:150] + "..." if len(msg["content"]) > 150 else msg["content"]
            formatted += f"{role}: {content}\n"
        return formatted

    def _track_emotional_journey(self) -> str:
        """Track emotional journey within this session"""
        context = self.current_session.get("user_context", {})
        initial_state = context.get("emotional_state", {})
        trajectory = context.get("emotional_trajectory", [])
        if not trajectory:
            return f"Started session feeling {initial_state.get('sentiment', 'unknown')}"
        journey = f"Started {initial_state.get('sentiment', 'unknown')}"
        if trajectory:
            recent_direction = trajectory[-1]["direction"] if trajectory else "stable"
            journey += f" → Currently trending {recent_direction}"
        return journey

    def _assess_session_progress(self) -> str:
        """Assess progress within current session"""
        message_count = len(self.current_session.get("messages", []))
        techniques_used = len(self.current_session.get("techniques_used", []))
        if message_count < 3:
            return "Early in session - building rapport and understanding"
        elif message_count < 8:
            return f"Mid-session - actively exploring with {techniques_used} therapeutic approaches"
        else:
            return f"Advanced session - deep therapeutic work with {techniques_used} techniques applied"

    def _provide_quick_workplace_solutions(self, transcript: str, workplace_context: Dict, sentiment: Dict, emotions: List) -> str:
        """Provide immediate workplace-specific solutions and remedies"""
        quick_remedies = self.corporate_analyzer.get_quick_remedies(workplace_context, sentiment['label'])
        self.current_session["quick_remedies_given"].extend(quick_remedies)
        emotion_str = ", ".join([e["emotion"] for e in emotions[:2]])
        primary_stressor = workplace_context.get('primary_stressor', 'work_stress')
        response = f"""I can see you're dealing with {emotion_str} related to {primary_stressor.replace('_', ' ')}. Let me give you some immediate help:

**🚀 QUICK SOLUTIONS:**
{chr(10).join([f"• {remedy}" for remedy in quick_remedies])}

**💡 UNDERSTANDING WHY:**
You're feeling this way because {self._explain_workplace_emotions(workplace_context, emotions)}

**🔄 NEXT STEPS:**
Would you like:
1. **More quick remedies** for immediate relief
2. **Deeper therapeutic conversation** to process these feelings
3. **Corporate resources** and long-term strategies

What feels most helpful right now?"""
        return response

    def _is_solution_request(self, user_input: str) -> bool:
        """Check if user is requesting solutions rather than exploration"""
        solution_keywords = [
            'tips', 'help', 'suggestions', 'what to do', 'how to', 'give me',
            'quick', 'fast', 'immediate', 'motivation', 'remedy', 'fix',
            'advice', 'solutions', 'strategies', 'techniques'
        ]
        user_lower = user_input.lower()
        return any(keyword in user_lower for keyword in solution_keywords)

    def _provide_targeted_solutions(self, user_input: str) -> str:
        """Provide targeted solutions based on current workplace context"""
        workplace_context = self.current_session.get("workplace_context", {})
        if 'motivation' in user_input.lower():
            remedies = self.corporate_analyzer.quick_remedies.get('work_motivation', [])
        elif 'stress' in user_input.lower():
            remedies = self.corporate_analyzer.quick_remedies.get('immediate_stress', [])
        elif 'extended hours' in user_input.lower() or 'long' in user_input.lower():
            remedies = self.corporate_analyzer.quick_remedies.get('extended_hours', [])
        else:
            remedies = self.corporate_analyzer.get_quick_remedies(workplace_context, 'mixed')
        if not remedies:
            remedies = self.corporate_analyzer.quick_remedies.get('immediate_stress', [])
        self.current_session["quick_remedies_given"].extend(remedies[:3])
        response = f"""Here are targeted solutions for your situation:

**🎯 IMMEDIATE ACTIONS:**
{chr(10).join([f"• {remedy}" for remedy in remedies[:3]])}

**✅ NEXT:**
Try one of these now, then let me know:
- Which one feels most doable?
- Do you need deeper emotional support?
- Want more specific strategies?

Remember: Small actions can create big changes in how you feel."""
        return response

    def _explain_workplace_emotions(self, workplace_context: Dict, emotions: List) -> str:
        """Explain why user is feeling specific emotions based on workplace context"""
        primary_stressor = workplace_context.get('primary_stressor', 'work_stress')
        work_type = workplace_context.get('work_type', 'general_office')
        explanations = {
            'manager_stress': "receiving critical feedback while being assigned additional work creates emotional overload",
            'workload_pressure': "your brain is processing both the immediate stress and the anticipation of extended effort",
            'burnout_signs': "your energy reserves are depleted from sustained workplace pressure",
            'extended_hours': "the prospect of prolonged focus and physical discomfort (sitting) triggers stress response"
        }
        base_explanation = explanations.get(primary_stressor, "workplace stress is affecting your emotional regulation")
        if work_type == 'software_dev' or work_type == 'data_analysis':
            base_explanation += " - coding/analysis work requires sustained mental energy which compounds emotional fatigue"
        return base_explanation

    def _generate_enhanced_session_summary(self) -> str:
        """Generate enhanced session summary with corporate context and actionable insights"""
        session_duration = datetime.now() - self.current_session["start_time"]
        total_interactions = len(self.current_session.get("messages", []))
        workplace_context = self.current_session.get("workplace_context", {})
        if workplace_context:
            conversation_data = {
                "messages": self.current_session.get("conversation_messages", []),
                "initial_analysis": self.current_session.get("initial_analysis", {}),
                "emotions_tracked": self.current_session.get("emotions_tracked", [])
            }
            enhanced_summary = self.corporate_analyzer.generate_enhanced_summary(
                conversation_data,
                workplace_context
            )
            summary = f"""
==================================================
🔄 Session Complete
==================================================

🌿 EMO BUDDY SESSION SUMMARY
==================================================

📅 Session Duration: {session_duration}
💬 Total Interactions: {total_interactions}

🧠 EMOTIONAL STATE ANALYSIS:
{chr(10).join([f"- {emotion}" for emotion in enhanced_summary.get('emotional_state', ['General work stress'])])}

💼 WORKPLACE STRESSORS IDENTIFIED:
{chr(10).join([f"- {stressor.replace('_', ' ').title()}" for stressor in enhanced_summary.get('workplace_stressors', ['General work pressure'])])}

🎯 WORK CONTEXT: {enhanced_summary.get('work_context', 'General office work').replace('_', ' ').title()}

🚨 URGENCY LEVEL: {enhanced_summary.get('urgency_assessment', 2)}/5

💡 KEY INSIGHTS:
{chr(10).join([f"• {insight}" for insight in enhanced_summary.get('key_insights', ['Session provided emotional processing opportunity'])])}

🚀 IMMEDIATE ACTIONS RECOMMENDED:
{chr(10).join([f"• {action}" for action in enhanced_summary.get('immediate_actions', ['Take breaks as needed'])])}

🌱 ONGOING SUPPORT SUGGESTIONS:
{chr(10).join([f"• {support}" for support in enhanced_summary.get('ongoing_support', ['Continue monitoring stress levels'])])}

🔧 QUICK REMEDIES PROVIDED:
{chr(10).join([f"• {remedy}" for remedy in self.current_session.get('quick_remedies_given', ['General therapeutic support'])])}

🎭 THERAPEUTIC TECHNIQUES USED:
{self._summarize_techniques()}

📝 NEXT STEPS:
- Apply immediate actions before your next work session
- Monitor emotional responses to workplace situations
- Return for support when needed

🌟 Remember: You have practical tools and strategies to manage workplace stress effectively. 🌟
"""
        else:
            summary = self._generate_session_summary()
        return summary 