import re
import logging
from typing import Dict, List, Optional
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TherapeuticTechniques:
    """
    Implements various evidence-based therapeutic techniques
    including CBT, DBT, ACT with appropriate questioning strategies
    """
    
    def __init__(self):
        self.cbt_patterns = self._load_cbt_patterns()
        self.dbt_patterns = self._load_dbt_patterns()
        self.act_patterns = self._load_act_patterns()
        self.crisis_patterns = self._load_crisis_patterns()
    
    def select_technique(self, user_input: str, conversation_history: List[Dict], 
                        emotions_tracked: List[Dict]) -> str:
        """
        Select the most appropriate therapeutic technique based on context
        """
        user_lower = user_input.lower()
        
        # Check for crisis indicators first
        if self._matches_crisis_patterns(user_lower):
            return "crisis_support"
        
        # Analyze predominant emotions
        recent_emotions = self._get_recent_emotions(emotions_tracked)
        
        # Check for specific technique indicators
        if self._matches_cbt_patterns(user_lower, recent_emotions):
            return "cbt"
        elif self._matches_dbt_patterns(user_lower, recent_emotions):
            return "dbt"
        elif self._matches_act_patterns(user_lower, recent_emotions):
            return "act"
        
        # Default to validation for unclear situations
        return "validation"
    
    def _load_cbt_patterns(self) -> Dict:
        """Load CBT technique patterns and indicators"""
        return {
            "negative_thoughts": [
                r"always.*never", r"should.*must", r"terrible.*awful",
                r"can't.*anything", r"nobody.*everybody", r"worst.*best"
            ],
            "cognitive_distortions": [
                r"all.*nothing", r"never.*always", r"everyone.*no one",
                r"worst case", r"catastroph", r"mind reading"
            ],
            "thought_patterns": [
                r"thinking.*about", r"can't stop.*thinking", r"thoughts.*racing",
                r"worried.*about", r"keep.*thinking"
            ],
            "emotions": ["anxiety", "worry", "fear", "guilt", "shame", "anger"]
        }
    
    def _load_dbt_patterns(self) -> Dict:
        """Load DBT technique patterns and indicators"""
        return {
            "emotional_intensity": [
                r"overwhelmed", r"too much", r"can't handle", r"intense",
                r"explosive", r"out of control"
            ],
            "interpersonal_issues": [
                r"relationship", r"conflict", r"arguing", r"fighting",
                r"abandoned", r"rejected", r"alone"
            ],
            "self_harm_indicators": [
                r"hurt.*myself", r"self.*harm", r"cutting", r"burning"
            ],
            "emotions": ["anger", "rage", "sadness", "fear", "disgust", "love", "joy"]
        }
    
    def _load_act_patterns(self) -> Dict:
        """Load ACT technique patterns and indicators"""
        return {
            "avoidance": [
                r"avoid.*", r"can't face", r"running away", r"escape",
                r"don't want.*deal"
            ],
            "values_conflict": [
                r"meaningless", r"purpose", r"values", r"important.*me",
                r"what.*matters"
            ],
            "acceptance_needed": [
                r"accept.*", r"can't change", r"stuck.*with", r"have to live"
            ],
            "emotions": ["disappointment", "grief", "confusion", "emptiness"]
        }
    
    def _load_crisis_patterns(self) -> List[str]:
        """Load crisis indicator patterns"""
        return [
            r"want.*die", r"kill.*myself", r"suicide", r"end.*all",
            r"hurt.*myself", r"can't.*anymore", r"no.*point",
            r"everyone.*better.*without", r"plan.*hurt"
        ]
    
    def _matches_cbt_patterns(self, text: str, emotions: List[str]) -> bool:
        """Check if CBT approach is appropriate"""
        # Check for cognitive patterns
        for pattern_type, patterns in self.cbt_patterns.items():
            if pattern_type == "emotions":
                if any(emotion in emotions for emotion in patterns):
                    return True
            else:
                for pattern in patterns:
                    if re.search(pattern, text):
                        return True
        return False
    
    def _matches_dbt_patterns(self, text: str, emotions: List[str]) -> bool:
        """Check if DBT approach is appropriate"""
        # Check for emotional dysregulation patterns
        for pattern_type, patterns in self.dbt_patterns.items():
            if pattern_type == "emotions":
                if any(emotion in emotions for emotion in patterns):
                    return True
            else:
                for pattern in patterns:
                    if re.search(pattern, text):
                        return True
        return False
    
    def _matches_act_patterns(self, text: str, emotions: List[str]) -> bool:
        """Check if ACT approach is appropriate"""
        # Check for acceptance and values patterns
        for pattern_type, patterns in self.act_patterns.items():
            if pattern_type == "emotions":
                if any(emotion in emotions for emotion in patterns):
                    return True
            else:
                for pattern in patterns:
                    if re.search(pattern, text):
                        return True
        return False
    
    def _matches_crisis_patterns(self, text: str) -> bool:
        """Check for crisis indicators"""
        for pattern in self.crisis_patterns:
            if re.search(pattern, text):
                return True
        return False
    
    def _get_recent_emotions(self, emotions_tracked: List[Dict]) -> List[str]:
        """Get recent emotions from tracking data"""
        recent_emotions = []
        for entry in emotions_tracked[-3:]:  # Last 3 entries
            recent_emotions.extend(entry.get("emotions", []))
        return recent_emotions
    
    def get_technique_questions(self, technique: str, context: str = "") -> List[str]:
        """
        Get appropriate questions for the selected technique
        """
        questions = {
            "cbt": [
                "What thoughts were going through your mind when you felt this way?",
                "How realistic is this thought? What evidence supports or contradicts it?",
                "What would you tell a friend who had this same thought?",
                "Is there another way to look at this situation?",
                "What's the worst that could realistically happen? How would you cope?"
            ],
            "dbt": [
                "What emotion are you feeling right now, and how intense is it (1-10)?",
                "What triggered this emotional response?",
                "What do you need most right now - validation, problem-solving, or distraction?",
                "What would help you feel more grounded in this moment?",
                "How can you be gentle with yourself right now?"
            ],
            "act": [
                "What values matter most to you in this situation?",
                "What would you do if this difficult feeling wasn't here?",
                "How can you make space for this feeling while still moving toward what matters?",
                "What would someone you admire do in this situation?",
                "What small step could you take toward what's important to you?"
            ],
            "validation": [
                "That sounds really difficult. Can you help me understand more about what's happening?",
                "It makes sense that you'd feel this way given what you're going through.",
                "What's been the hardest part of this experience for you?",
                "How long have you been dealing with this?",
                "What support do you have right now?"
            ],
            "crisis_support": [
                "I'm concerned about you. Are you thinking about hurting yourself?",
                "Do you have a plan to harm yourself?",
                "Who can you reach out to right now for support?",
                "What has helped you get through difficult times before?",
                "Can we talk about ways to keep you safe right now?"
            ]
        }
        
        return questions.get(technique, questions["validation"])
    
    def get_technique_responses(self, technique: str) -> Dict[str, List[str]]:
        """
        Get response templates for different techniques
        """
        responses = {
            "cbt": {
                "validation": [
                    "I hear that you're struggling with these thoughts.",
                    "These thinking patterns are very common, and you're not alone.",
                    "It's understandable that these thoughts would cause distress."
                ],
                "reframing": [
                    "Let's examine this thought together.",
                    "What if we looked at this from a different angle?",
                    "Sometimes our minds play tricks on us with these patterns."
                ],
                "behavioral": [
                    "What small action could you take today?",
                    "How might you test this thought in real life?",
                    "What would be different if this thought weren't true?"
                ]
            },
            "dbt": {
                "distress_tolerance": [
                    "This feeling is temporary, even though it's intense right now.",
                    "Let's focus on getting through this moment safely.",
                    "What would help you ride this wave of emotion?"
                ],
                "emotion_regulation": [
                    "Let's name this emotion and see if we can understand it.",
                    "Emotions have important information for us.",
                    "What does this emotion tell you about what you need?"
                ],
                "mindfulness": [
                    "Let's bring your attention to the present moment.",
                    "Can you notice what you're experiencing right now without judgment?",
                    "What do you notice in your body right now?"
                ]
            },
            "act": {
                "acceptance": [
                    "It's natural to want to avoid difficult feelings.",
                    "What if you didn't have to fight this feeling?",
                    "Sometimes the struggle against our feelings creates more suffering."
                ],
                "values": [
                    "What matters most to you in this area of your life?",
                    "How do you want to be remembered?",
                    "What would make this struggle worthwhile?"
                ],
                "commitment": [
                    "What's one small step you could take today?",
                    "How can you honor your values even while feeling this way?",
                    "What would courage look like in this situation?"
                ]
            }
        }
        
        return responses.get(technique, {})
    
    def get_coping_strategies(self, technique: str, emotion: str = "") -> List[str]:
        """
        Get coping strategies based on technique and emotion
        """
        strategies = {
            "cbt": [
                "Challenge negative thoughts with evidence",
                "Practice thought stopping techniques",
                "Use behavioral experiments to test thoughts",
                "Keep a thought diary",
                "Practice positive self-talk"
            ],
            "dbt": [
                "Try the TIPP technique (Temperature, Intense exercise, Paced breathing, Paired muscle relaxation)",
                "Practice radical acceptance",
                "Use distraction techniques",
                "Try grounding exercises (5-4-3-2-1 sensory technique)",
                "Practice self-soothing with your five senses"
            ],
            "act": [
                "Practice mindful breathing",
                "Do a values clarification exercise",
                "Try the leaves on a stream visualization",
                "Practice psychological flexibility exercises",
                "Engage in values-based activities"
            ],
            "general": [
                "Take slow, deep breaths",
                "Listen to calming music",
                "Talk to a trusted friend or family member",
                "Go for a walk in nature",
                "Practice progressive muscle relaxation",
                "Write in a journal",
                "Engage in a creative activity"
            ]
        }
        
        return strategies.get(technique, strategies["general"])
    
    def assess_technique_effectiveness(self, session_data: Dict) -> Dict:
        """
        Assess how effective different techniques were in the session
        """
        techniques_used = session_data.get("techniques_used", [])
        conversation_length = len(session_data.get("messages", []))
        crisis_flags = len(session_data.get("crisis_flags", []))
        
        # Simple effectiveness scoring
        effectiveness = {}
        for technique_entry in techniques_used:
            technique = technique_entry["technique"]
            if technique not in effectiveness:
                effectiveness[technique] = {"count": 0, "score": 0}
            
            effectiveness[technique]["count"] += 1
            
            # Score based on conversation progression and crisis reduction
            base_score = 3  # Neutral
            if conversation_length > 10:  # Good engagement
                base_score += 1
            if crisis_flags == 0:  # No crisis escalation
                base_score += 1
            
            effectiveness[technique]["score"] = base_score
        
        return effectiveness 