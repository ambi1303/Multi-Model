import re
import logging
from typing import Dict, List, Tuple
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CrisisDetector:
    """
    Detects crisis situations and provides appropriate resources and support
    """
    
    def __init__(self):
        self.crisis_keywords = self._load_crisis_keywords()
        self.severity_weights = self._load_severity_weights()
        self.emergency_resources = self._load_emergency_resources()
    
    def _load_crisis_keywords(self) -> Dict[str, List[str]]:
        """Load crisis detection keywords organized by severity"""
        return {
            "suicidal_ideation": [
                r"kill.*myself", r"end.*life", r"suicide", r"want.*die",
                r"better.*dead", r"end.*all", r"take.*life",
                r"not.*worth.*living", r"no.*point.*living"
            ],
            "self_harm": [
                r"hurt.*myself", r"self.*harm", r"cutting", r"burning",
                r"hitting.*myself", r"punish.*myself", r"deserve.*pain"
            ],
            "crisis_planning": [
                r"plan.*kill", r"plan.*hurt", r"how.*kill", r"method.*die",
                r"pills.*enough", r"rope.*tie", r"jump.*bridge"
            ],
            "hopelessness": [
                r"no.*hope", r"hopeless", r"pointless", r"meaningless",
                r"nothing.*matters", r"give.*up", r"can't.*go.*on"
            ],
            "severe_depression": [
                r"can't.*anymore", r"too.*tired", r"exhausted.*living",
                r"burden.*everyone", r"everyone.*better.*without"
            ],
            "panic_crisis": [
                r"can't.*breathe", r"heart.*racing", r"dying.*panic",
                r"losing.*mind", r"going.*crazy", r"out.*control"
            ],
            "psychosis_indicators": [
                r"voices.*telling", r"hearing.*things", r"seeing.*things",
                r"people.*following", r"conspiracy", r"not.*real"
            ]
        }
    
    def _load_severity_weights(self) -> Dict[str, int]:
        """Load severity weights for different crisis types"""
        return {
            "suicidal_ideation": 5,
            "crisis_planning": 5,
            "self_harm": 4,
            "psychosis_indicators": 4,
            "severe_depression": 3,
            "hopelessness": 3,
            "panic_crisis": 2
        }
    
    def _load_emergency_resources(self) -> Dict:
        """Load emergency resources and contact information"""
        return {
            "crisis_hotlines": {
                "us": {
                    "988": "National Suicide Prevention Lifeline (US)",
                    "741741": "Crisis Text Line (Text HOME to 741741)",
                    "1-800-366-8288": "Self-Injury Outreach & Support"
                },
                "international": {
                    "116123": "Samaritans (UK/Ireland)",
                    "13-11-14": "Lifeline Australia",
                    "1-833-456-4566": "Canada Suicide Prevention Service"
                }
            },
            "emergency_services": "911 (US), 999 (UK), 112 (EU)",
            "online_support": [
                "Crisis Text Line: crisistextline.org",
                "National Suicide Prevention Lifeline: suicidepreventionlifeline.org",
                "Crisis Support: www.crisis.org.uk"
            ]
        }
    
    def assess_crisis_level(self, text: str, sentiment: Dict, emotions: List[Dict]) -> int:
        """
        Assess crisis level on a scale of 1-5
        1: No crisis indicators
        2: Mild distress
        3: Moderate concern
        4: High risk
        5: Immediate crisis
        """
        if not text:
            return 1
        
        text_lower = text.lower()
        crisis_score = 0
        detected_types = []
        
        # Check for crisis keywords
        for crisis_type, patterns in self.crisis_keywords.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    weight = self.severity_weights.get(crisis_type, 1)
                    crisis_score += weight
                    detected_types.append(crisis_type)
                    logger.warning(f"Crisis indicator detected: {crisis_type}")
        
        # Factor in sentiment analysis
        if sentiment.get("label") == "negative":
            confidence = sentiment.get("confidence", 0)
            if confidence > 0.8:  # High confidence negative sentiment
                crisis_score += 1
        
        # Factor in emotions
        high_risk_emotions = ["sadness", "fear", "anger", "disgust"]
        for emotion_data in emotions[:3]:  # Top 3 emotions
            emotion = emotion_data.get("emotion", "")
            confidence = emotion_data.get("confidence", 0)
            
            if emotion in high_risk_emotions and confidence > 0.7:
                crisis_score += 1
        
        # Convert to 1-5 scale
        if crisis_score == 0:
            return 1
        elif crisis_score <= 2:
            return 2
        elif crisis_score <= 4:
            return 3
        elif crisis_score <= 6:
            return 4
        else:
            return 5
    
    def assess_text_for_crisis(self, text: str) -> int:
        """
        Quick crisis assessment for ongoing conversation text
        """
        if not text:
            return 1
        
        text_lower = text.lower()
        crisis_score = 0
        
        # Check for immediate crisis indicators
        immediate_crisis = [
            r"right now", r"tonight", r"today", r"this moment",
            r"about to", r"going to", r"planning to"
        ]
        
        has_immediate = any(re.search(pattern, text_lower) for pattern in immediate_crisis)
        
        # Check for crisis keywords
        for crisis_type, patterns in self.crisis_keywords.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    weight = self.severity_weights.get(crisis_type, 1)
                    crisis_score += weight
                    
                    # Increase severity for immediate indicators
                    if has_immediate and crisis_type in ["suicidal_ideation", "self_harm", "crisis_planning"]:
                        crisis_score += 2
        
        # Convert to 1-5 scale
        if crisis_score == 0:
            return 1
        elif crisis_score <= 2:
            return 2
        elif crisis_score <= 4:
            return 3
        elif crisis_score <= 6:
            return 4
        else:
            return 5
    
    def get_crisis_response(self, crisis_level: int, detected_types: List[str] = None) -> Dict:
        """
        Get appropriate crisis response based on severity level
        """
        if detected_types is None:
            detected_types = []
        
        response = {
            "level": crisis_level,
            "immediate_action": "",
            "resources": [],
            "safety_plan": [],
            "follow_up": ""
        }
        
        if crisis_level >= 4:  # High risk or immediate crisis
            response["immediate_action"] = (
                "🚨 IMMEDIATE CRISIS DETECTED 🚨\n"
                "Your safety is the top priority. Please reach out for immediate help:\n"
                "• Call 988 (National Suicide Prevention Lifeline)\n"
                "• Call 911 if in immediate danger\n"
                "• Go to your nearest emergency room\n"
                "• Call a trusted friend or family member to stay with you"
            )
            
            response["resources"] = [
                "National Suicide Prevention Lifeline: 988",
                "Crisis Text Line: Text HOME to 741741",
                "Emergency Services: 911",
                "National Sexual Assault Hotline: 1-800-656-4673"
            ]
            
            response["safety_plan"] = [
                "Remove any means of self-harm from your immediate environment",
                "Stay with someone you trust",
                "Create a list of people you can call for support",
                "Identify your warning signs and triggers",
                "Write down reasons for living"
            ]
            
        elif crisis_level == 3:  # Moderate concern
            response["immediate_action"] = (
                "⚠️ I'm concerned about what you're sharing. While this may not be an immediate crisis, "
                "it's important to get support. Consider reaching out to a mental health professional "
                "or a crisis support line."
            )
            
            response["resources"] = [
                "National Alliance on Mental Illness: 1-800-950-6264",
                "Crisis Text Line: Text HOME to 741741",
                "Psychology Today Therapist Finder: psychologytoday.com",
                "BetterHelp Online Therapy: betterhelp.com"
            ]
            
        elif crisis_level == 2:  # Mild distress
            response["immediate_action"] = (
                "I hear that you're going through a difficult time. While this doesn't seem like "
                "an immediate crisis, it's still important to take care of your mental health."
            )
            
            response["resources"] = [
                "Mental Health America: mhanational.org",
                "National Alliance on Mental Illness: nami.org",
                "Anxiety and Depression Association: adaa.org"
            ]
        
        response["follow_up"] = (
            "Remember: You are not alone, and there are people who want to help. "
            "If your feelings worsen or you start having thoughts of hurting yourself, "
            "please reach out for immediate support."
        )
        
        return response
    
    def create_safety_plan(self, user_context: str = "") -> Dict:
        """
        Create a personalized safety plan
        """
        return {
            "warning_signs": [
                "Feeling hopeless or trapped",
                "Withdrawing from friends and family",
                "Dramatic mood changes",
                "Talking about death or dying",
                "Giving away possessions"
            ],
            "coping_strategies": [
                "Call a trusted friend or family member",
                "Practice deep breathing exercises",
                "Go for a walk or do light exercise",
                "Listen to calming music",
                "Write in a journal",
                "Take a warm bath or shower"
            ],
            "support_contacts": [
                {"name": "Trusted Friend/Family", "phone": "___________"},
                {"name": "Therapist/Counselor", "phone": "___________"},
                {"name": "Crisis Hotline", "phone": "988"},
                {"name": "Emergency", "phone": "911"}
            ],
            "professional_help": [
                "Primary care doctor",
                "Mental health therapist",
                "Psychiatrist",
                "Crisis counselor"
            ],
            "environment_safety": [
                "Remove or secure any means of self-harm",
                "Stay in public or with others when feeling unsafe",
                "Avoid alcohol and drugs",
                "Create a safe, comfortable space"
            ]
        }
    
    def get_immediate_coping_techniques(self, crisis_type: str = "general") -> List[str]:
        """
        Get immediate coping techniques for crisis situations
        """
        techniques = {
            "suicidal_ideation": [
                "Call 988 immediately",
                "Remove any harmful objects from your area",
                "Call a trusted person to stay with you",
                "Go to a public place",
                "Focus on reasons for living"
            ],
            "panic_crisis": [
                "Practice 4-7-8 breathing (inhale 4, hold 7, exhale 8)",
                "Use the 5-4-3-2-1 grounding technique",
                "Hold an ice cube or splash cold water on your face",
                "Name what you see, hear, and feel around you",
                "Remind yourself that panic attacks are temporary"
            ],
            "self_harm": [
                "Hold ice cubes where you want to hurt yourself",
                "Draw on your skin with a red marker",
                "Do intense physical exercise",
                "Squeeze a stress ball very hard",
                "Call a crisis line or trusted person"
            ],
            "general": [
                "Take slow, deep breaths",
                "Count backwards from 100 by 7s",
                "Name 5 things you can see, 4 you can touch, 3 you can hear",
                "Call someone you trust",
                "Go to a safe, public place"
            ]
        }
        
        return techniques.get(crisis_type, techniques["general"])
    
    def log_crisis_event(self, crisis_data: Dict) -> None:
        """
        Log crisis event for tracking and follow-up
        """
        timestamp = datetime.now().isoformat()
        
        log_entry = {
            "timestamp": timestamp,
            "crisis_level": crisis_data.get("level", 0),
            "detected_types": crisis_data.get("detected_types", []),
            "user_text": crisis_data.get("text", "")[:200],  # First 200 chars for privacy
            "response_given": crisis_data.get("response_type", ""),
            "resources_provided": crisis_data.get("resources", [])
        }
        
        # In a production system, this would go to a secure database
        logger.critical(f"CRISIS EVENT LOGGED: {log_entry}")
        
        # Could also trigger alerts to supervisors or emergency contacts
        if crisis_data.get("level", 0) >= 4:
            logger.critical("HIGH-RISK CRISIS EVENT - IMMEDIATE ATTENTION REQUIRED") 