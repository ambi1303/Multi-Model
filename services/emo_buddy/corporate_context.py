"""
Corporate Context Module for Emo Buddy

Provides workplace-specific emotional support, quick remedies,
and corporate-aware therapeutic guidance.
"""

import re
from typing import Dict, List, Tuple
from datetime import datetime

class CorporateContextAnalyzer:
    """Analyzes workplace-specific emotional states and provides corporate-aware solutions"""
    
    def __init__(self):
        self.workplace_indicators = {
            'manager_stress': ['manager', 'boss', 'supervisor', 'scolded', 'feedback', 'review'],
            'workload_pressure': ['overtime', 'deadline', 'work late', 'extended hours', 'too much work'],
            'burnout_signs': ['exhausted', 'tired', 'drained', 'overwhelmed', 'can\'t cope'],
            'imposter_syndrome': ['not good enough', 'fake', 'don\'t deserve', 'others better'],
            'team_conflict': ['colleague', 'team', 'conflict', 'disagreement', 'communication'],
            'work_life_balance': ['no time', 'family', 'personal life', 'weekend work'],
            'career_anxiety': ['promotion', 'career', 'future', 'job security', 'growth'],
            'tech_frustration': ['coding', 'bug', 'system down', 'technical issue', 'development']
        }
        
        self.quick_remedies = {
            'immediate_stress': [
                "🫁 **4-7-8 Breathing**: Inhale 4, hold 7, exhale 8 (repeat 3 times)",
                "🎵 **Focus Music**: Try lo-fi hip hop or brown noise for coding",
                "💪 **Desk Stretches**: 30-second neck rolls and shoulder shrugs",
                "🧠 **5-Minute Reset**: Step away, look out window, drink water"
            ],
            'work_motivation': [
                "🍅 **Pomodoro Technique**: 25min work, 5min break cycles",
                "🎯 **Micro-Goals**: Break work into 15-minute chunks",
                "🎶 **Productivity Playlist**: Upbeat instrumental music",
                "☕ **Comfort Setup**: Good lighting, tea/coffee, comfortable position"
            ],
            'manager_stress': [
                "📝 **Document Everything**: Keep email trails for clarity",
                "🧘 **Pre-Meeting Calm**: 2 minutes of deep breathing before interactions",
                "💭 **Reframe Thoughts**: 'Feedback is growth opportunity, not personal attack'",
                "🤝 **Seek Clarity**: Ask for specific examples and improvement steps"
            ],
            'burnout_prevention': [
                "⏰ **Hard Boundaries**: Set specific work end times",
                "🌿 **Micro-Breaks**: 2-minute mindfulness every hour",
                "🎭 **Separate Work Identity**: You are not your job performance",
                "🔋 **Energy Audit**: Track what drains vs energizes you"
            ],
            'extended_hours': [
                "💡 **Lighting**: Use warm lighting to reduce eye strain",
                "🚶 **Movement Breaks**: 2-minute walk every 45 minutes",
                "🧘 **Sitting Meditation**: 5-minute guided meditation apps",
                "🎧 **Ambient Sounds**: Nature sounds or white noise for focus"
            ]
        }
        
        self.corporate_resources = {
            'employee_assistance': "Consider your company's Employee Assistance Program (EAP)",
            'hr_support': "HR may have mental health resources or flexible work options",
            'manager_discussion': "Schedule 1:1 with manager to discuss workload and priorities",
            'professional_development': "Look into stress management or time management workshops",
            'health_benefits': "Check if your health insurance covers mental health services"
        }

    def analyze_workplace_context(self, text: str) -> Dict:
        """Analyze text for workplace-specific emotional indicators"""
        text_lower = text.lower()
        
        detected_contexts = []
        for context, keywords in self.workplace_indicators.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_contexts.append(context)
        
        # Identify primary workplace stressor
        primary_stressor = detected_contexts[0] if detected_contexts else 'general_work_stress'
        
        # Assess urgency level
        urgency = self._assess_urgency(text_lower)
        
        # Determine work type
        work_type = self._identify_work_type(text_lower)
        
        return {
            'primary_stressor': primary_stressor,
            'detected_contexts': detected_contexts,
            'urgency_level': urgency,
            'work_type': work_type,
            'requires_immediate_action': urgency >= 3
        }

    def _assess_urgency(self, text: str) -> int:
        """Assess urgency level (1-5) based on language intensity"""
        high_urgency = ['crisis', 'can\'t handle', 'breaking down', 'panic', 'emergency']
        medium_urgency = ['overwhelmed', 'stressed', 'anxious', 'worried', 'exhausted']
        low_urgency = ['tired', 'concerned', 'unsure', 'frustrated']
        
        if any(word in text for word in high_urgency):
            return 4
        elif any(word in text for word in medium_urgency):
            return 3
        elif any(word in text for word in low_urgency):
            return 2
        else:
            return 1

    def _identify_work_type(self, text: str) -> str:
        """Identify type of work for context-specific advice"""
        work_types = {
            'software_dev': ['coding', 'programming', 'development', 'bug', 'deploy'],
            'data_analysis': ['data', 'analysis', 'analytics', 'dashboard', 'metrics'],
            'management': ['team', 'meeting', 'management', 'leadership', 'reports'],
            'creative': ['design', 'creative', 'content', 'marketing', 'campaign'],
            'client_facing': ['client', 'customer', 'sales', 'support', 'presentation']
        }
        
        for work_type, keywords in work_types.items():
            if any(keyword in text for keyword in keywords):
                return work_type
        
        return 'general_office'

    def get_quick_remedies(self, context_analysis: Dict, emotion_state: str) -> List[str]:
        """Get immediate, actionable remedies based on context"""
        remedies = []
        
        primary_stressor = context_analysis.get('primary_stressor', 'general_work_stress')
        urgency = context_analysis.get('urgency_level', 2)
        detected_contexts = context_analysis.get('detected_contexts', [])
        
        # Add stress-specific remedies
        if primary_stressor in self.quick_remedies:
            remedies.extend(self.quick_remedies[primary_stressor][:2])
        
        # Add general immediate stress relief if high urgency
        if urgency >= 3:
            remedies.extend(self.quick_remedies['immediate_stress'][:2])
        
        # Add extended hours support if detected
        if any('extended' in str(ctx) or 'overtime' in str(ctx) for ctx in detected_contexts):
            remedies.extend(self.quick_remedies['extended_hours'][:2])
        
        # If no specific remedies found, add general ones
        if not remedies:
            remedies.extend(self.quick_remedies['immediate_stress'][:2])
        
        return remedies[:4]  # Limit to 4 practical suggestions

    def get_therapeutic_options(self, context_analysis: Dict) -> List[str]:
        """Get therapeutic options relevant to workplace stress"""
        options = []
        
        primary_stressor = context_analysis['primary_stressor']
        
        if primary_stressor == 'manager_stress':
            options = [
                "🗣️ **Communication Skills Training** - Learn assertive communication",
                "🧠 **CBT for Workplace Anxiety** - Address negative thought patterns",
                "💪 **Confidence Building Exercises** - Improve self-advocacy skills"
            ]
        elif primary_stressor == 'workload_pressure':
            options = [
                "⏰ **Time Management Coaching** - Prioritization and efficiency strategies",
                "🧘 **Stress Management Workshop** - Corporate wellness programs",
                "🎯 **Goal Setting Therapy** - Break overwhelming tasks into manageable steps"
            ]
        elif primary_stressor == 'burnout_signs':
            options = [
                "🔋 **Burnout Recovery Program** - Structured rest and energy restoration",
                "🏥 **Professional Mental Health Support** - Consider therapy or counseling",
                "⚖️ **Work-Life Balance Coaching** - Set healthy boundaries"
            ]
        else:
            options = [
                "🧠 **General Workplace Therapy** - Process work-related emotions",
                "💼 **Career Counseling** - Explore professional goals and challenges",
                "🧘 **Mindfulness for Professionals** - Stress reduction techniques"
            ]
        
        return options

    def generate_enhanced_summary(self, conversation_data: Dict, context_analysis: Dict) -> Dict:
        """Generate detailed, workplace-aware session summary"""
        
        # Extract actual emotions mentioned
        emotions_mentioned = self._extract_emotions_from_conversation(conversation_data)
        
        # Identify key workplace themes
        workplace_themes = context_analysis['detected_contexts']
        
        # Generate actionable insights
        insights = self._generate_workplace_insights(context_analysis, emotions_mentioned)
        
        # Create specific recommendations
        recommendations = self._create_workplace_recommendations(context_analysis)
        
        return {
            'emotional_state': emotions_mentioned,
            'workplace_stressors': workplace_themes,
            'key_insights': insights,
            'immediate_actions': recommendations['immediate'],
            'ongoing_support': recommendations['ongoing'],
            'urgency_assessment': context_analysis['urgency_level'],
            'work_context': context_analysis['work_type']
        }

    def _extract_emotions_from_conversation(self, conversation_data: Dict) -> List[str]:
        """Extract actual emotions mentioned in conversation"""
        emotion_keywords = {
            'sadness': ['sad', 'low', 'down', 'depressed', 'unhappy'],
            'stress': ['stressed', 'overwhelmed', 'pressure', 'tense'],
            'anxiety': ['anxious', 'worried', 'nervous', 'panic'],
            'exhaustion': ['tired', 'exhausted', 'drained', 'burnt out'],
            'frustration': ['frustrated', 'annoyed', 'irritated', 'angry'],
            'demotivation': ['unmotivated', 'don\'t feel like', 'no energy']
        }
        
        detected_emotions = []
        
        # Handle both message formats: standard messages and session messages
        messages = conversation_data.get('messages', [])
        if not messages:
            # Try to get from initial analysis and emotions_tracked
            initial_analysis = conversation_data.get('initial_analysis', {})
            emotions_tracked = conversation_data.get('emotions_tracked', [])
            
            # Check initial transcription
            if initial_analysis.get('transcription'):
                content = initial_analysis['transcription'].lower()
                for emotion, keywords in emotion_keywords.items():
                    if any(keyword in content for keyword in keywords):
                        if emotion not in detected_emotions:
                            detected_emotions.append(emotion)
            
            # Check emotions from tracking
            for emotion_entry in emotions_tracked:
                for emotion in emotion_entry.get('emotions', []):
                    if emotion in emotion_keywords and emotion not in detected_emotions:
                        detected_emotions.append(emotion)
        else:
            # Standard message format
            for msg in messages:
                if msg.get('role') == 'user':
                    content = msg.get('content', '').lower()
                    for emotion, keywords in emotion_keywords.items():
                        if any(keyword in content for keyword in keywords):
                            if emotion not in detected_emotions:
                                detected_emotions.append(emotion)
        
        return detected_emotions or ['general_work_stress']

    def _generate_workplace_insights(self, context_analysis: Dict, emotions: List[str]) -> List[str]:
        """Generate specific insights based on workplace context"""
        insights = []
        
        primary_stressor = context_analysis['primary_stressor']
        work_type = context_analysis['work_type']
        
        if primary_stressor == 'manager_stress':
            insights.append("Manager feedback triggered emotional response - normal stress reaction")
            insights.append("Additional workload while processing feedback increases overwhelm")
        
        if 'exhaustion' in emotions and work_type == 'software_dev':
            insights.append("Mental fatigue common in coding work - brain needs regular breaks")
            insights.append("Extended sitting for development work affects mood and energy")
        
        if 'sadness' in emotions and 'extended hours' in str(context_analysis):
            insights.append("Sadness linked to anticipation of long work hours - time boundary issue")
            insights.append("Work-life balance concerns affecting emotional well-being")
        
        return insights

    def _create_workplace_recommendations(self, context_analysis: Dict) -> Dict:
        """Create specific workplace recommendations"""
        immediate = []
        ongoing = []
        
        if context_analysis['urgency_level'] >= 3:
            immediate = [
                "Take 10-minute break before starting work session",
                "Use breathing exercises to manage immediate stress",
                "Set up comfortable workspace with good lighting",
                "Plan work breaks every 45-60 minutes"
            ]
        
        ongoing = [
            "Discuss workload management with supervisor",
            "Explore company wellness resources or EAP",
            "Consider time management or stress reduction workshops",
            "Build regular exercise or mindfulness into routine"
        ]
        
        return {'immediate': immediate, 'ongoing': ongoing} 

# Add the missing get_corporate_context function
def get_corporate_context() -> CorporateContextAnalyzer:
    """
    Factory function to create and return a CorporateContextAnalyzer instance
    """
    return CorporateContextAnalyzer() 