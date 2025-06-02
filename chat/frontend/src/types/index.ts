export interface Message {
    text: string;
    person_id?: string;
}

export interface MessageResponse {
    timestamp: string;
    text: string;
    person_id: string;
    sentiment_score: number;
    primary_emotion: string;
    emotion_score: number;
    mental_state: string;
}

export interface AnalysisResponse {
    analyzed_messages: MessageResponse[];
    summary: {
        [key: string]: any;
    };
} 