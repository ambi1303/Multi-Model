import { 
  EmotionResult, 
  VideoAnalysisResult, 
  SpeechAnalysisResult, 
  ChatMessage, 
} from '../types';

const mockEmotions = ['happy', 'sad', 'angry', 'surprised', 'neutral', 'fearful', 'disgusted'];

const generateMockEmotions = (): EmotionResult[] => {
  return mockEmotions.map(emotion => ({
    emotion,
    confidence: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
    timestamp: Date.now()
  })).sort((a, b) => b.confidence - a.confidence);
};

export const analyzeVideoFrame = async (_imageData: string): Promise<VideoAnalysisResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const emotions = generateMockEmotions();
  const dominantEmotion = emotions[0].emotion;
  const averageConfidence = emotions.reduce((sum, e) => sum + e.confidence, 0) / emotions.length;
  
  return {
    emotions,
    dominantEmotion,
    averageConfidence,
    timestamp: Date.now(),
  };
};

export const analyzeSpeech = async (_audioBlob: Blob): Promise<SpeechAnalysisResult> => {
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
    confidence: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
    scores: {
      negative: Math.random() * 0.4,
      neutral: Math.random() * 0.4,
      positive: Math.random() * 0.4,
    },
    polarity: Math.random() * 2 - 1, // -1 to 1
    subjectivity: Math.random(), // 0 to 1
    intensity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
  };
  
  return {
    transcription,
    sentiment,
    emotions,
    genAIInsights: "This is a mock AI insight about the user's emotional state based on speech analysis.",
    technicalReport: "Mock technical report with audio processing details and quality metrics.",
    duration: Math.random() * 30 + 5, // 5-35 seconds
    timestamp: Date.now(),
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