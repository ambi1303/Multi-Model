export interface MessageTemplate {
  text: string;
  category: 'positive' | 'negative' | 'neutral';
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  { text: "I'm feeling great today! 😊", category: "positive" },
  { text: "This is really frustrating me 😤", category: "negative" },
  { text: "I'm not sure how I feel about this...", category: "neutral" },
  { text: "I'm so excited about the new project! 🎉", category: "positive" },
  { text: "I'm stressed about the deadline", category: "negative" },
  { text: "Working from home has been challenging", category: "neutral" },
  { text: "The team meeting went really well today", category: "positive" },
  { text: "I feel overwhelmed with my workload", category: "negative" }
];

export const CONVERSATION_STARTERS: string[] = [
  "How was your day?",
  "Tell me about your weekend",
  "What's on your mind?",
  "How are you feeling about work?",
  "Any exciting plans coming up?"
];

export const getRandomTemplate = (): MessageTemplate => {
  return MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)];
}; 