import { 
  EmotionResult, 
  VideoAnalysisResult, 
  SpeechAnalysisResult, 
  ChatMessage, 
  BurnoutSurveyData, 
  BurnoutResult 
} from '../types';

const mockEmotions = ['happy', 'sad', 'angry', 'surprised', 'neutral', 'fearful', 'disgusted'];

const generateMockEmotions = (): EmotionResult[] => {
  return mockEmotions.map(emotion => ({
    emotion,
    confidence: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
    timestamp: Date.now()
  })).sort((a, b) => b.confidence - a.confidence);
};

export const analyzeVideoFrame = async (imageData: string): Promise<VideoAnalysisResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const emotions = generateMockEmotions();
  const dominantEmotion = emotions[0].emotion;
  const averageConfidence = emotions.reduce((sum, e) => sum + e.confidence, 0) / emotions.length;
  
  return {
    emotions,
    dominantEmotion,
    averageConfidence
  };
};

export const analyzeSpeech = async (audioBlob: Blob): Promise<SpeechAnalysisResult> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const mockTranscriptions = [
    "I'm feeling really overwhelmed with work lately.",
    "Today was such a great day, everything went smoothly!",
    "I'm not sure how to handle this situation.",
    "I feel anxious about the upcoming presentation.",
    "I'm so excited about this new opportunity!"
  ];
  
  const transcription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
  const emotions = generateMockEmotions();
  
  const sentimentLabels = ['positive', 'negative', 'neutral'];
  const sentiment = {
    label: sentimentLabels[Math.floor(Math.random() * sentimentLabels.length)],
    score: Math.random() * 2 - 1 // -1 to 1
  };
  
  return {
    transcription,
    sentiment,
    emotions,
    duration: Math.random() * 30 + 5 // 5-35 seconds
  };
};

export const analyzeChatMessage = async (text: string): Promise<ChatMessage> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const emotions = generateMockEmotions();
  const mentalStates = ['confident', 'stressed', 'anxious', 'calm', 'excited', 'frustrated'];
  
  const sentiment = {
    label: text.includes('!') ? 'positive' : text.includes('?') ? 'neutral' : 'negative',
    score: Math.random() * 2 - 1
  };
  
  return {
    id: Date.now().toString(),
    text,
    timestamp: Date.now(),
    analysis: {
      sentiment,
      emotions,
      mentalState: mentalStates[Math.floor(Math.random() * mentalStates.length)]
    }
  };
};

export const analyzeBurnoutSurvey = async (data: BurnoutSurveyData): Promise<BurnoutResult> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const scores = Object.values(data).filter(v => typeof v === 'number') as number[];
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  let riskLevel: BurnoutResult['riskLevel'];
  if (averageScore >= 8) riskLevel = 'Severe';
  else if (averageScore >= 6) riskLevel = 'High';
  else if (averageScore >= 4) riskLevel = 'Moderate';
  else riskLevel = 'Low';
  
  const recommendations = [
    'Consider taking regular breaks throughout the day',
    'Practice stress-reduction techniques like meditation',
    'Maintain a healthy work-life balance',
    'Seek support from colleagues or professional counselors',
    'Prioritize sleep and physical exercise',
    'Set realistic goals and expectations'
  ];
  
  const breakdown = [
    { category: 'Workload Stress', score: data.workload, impact: 'High' },
    { category: 'Work-Life Balance', score: data.workLifeBalance, impact: 'Medium' },
    { category: 'Job Satisfaction', score: data.jobSatisfaction, impact: 'Medium' },
    { category: 'Overall Stress', score: data.stressLevel, impact: 'High' }
  ];
  
  return {
    riskLevel,
    score: averageScore,
    recommendations: recommendations.slice(0, 3),
    breakdown
  };
};