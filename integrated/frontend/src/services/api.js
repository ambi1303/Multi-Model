import axios from 'axios';

const API_BASE_URL = 'http://localhost:9000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Video Analysis
export const analyzeVideo = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/analyze-video', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Chat Analysis
export const analyzeChat = async (text, personId = null) => {
    const response = await api.post('/analyze-chat', {
        text,
        person_id: personId,
    });
    // Expected response format from chat model:
    // {
    //   timestamp: string,
    //   text: string,
    //   person_id: string,
    //   sentiment_score: number,
    //   primary_emotion: string,
    //   emotion_score: number,
    //   mental_state: string
    // }
    return response.data;
};

// Survey Analysis
export const analyzeSurvey = async (surveyData) => {
    const response = await api.post('/analyze-survey', surveyData);
    // Expected response format from survey model:
    // {
    //   burn_rate: number,
    //   stress_level: string,
    //   model_used: string,
    //   prediction_time: string
    // }
    return response.data;
};

// Speech-to-Text Analysis
export const analyzeSpeech = async (audioFile) => {
    const formData = new FormData();
    formData.append('file', audioFile);
    const response = await api.post('/analyze-speech', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    // Expected response format from STT model:
    // {
    //   text: string,
    //   sentiment: string,
    //   confidence: number
    // }
    return response.data;
};

// Combined Analysis
export const analyzeAll = async (data) => {
    const formData = new FormData();
    
    if (data.videoFile) {
        formData.append('file', data.videoFile);
    }
    if (data.audioFile) {
        formData.append('audio_file', data.audioFile);
    }
    if (data.text) {
        formData.append('text', data.text);
    }
    if (data.personId) {
        formData.append('person_id', data.personId);
    }

    const response = await api.post('/analyze-all', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    // Expected response format from combined analysis:
    // {
    //   video_results: object,
    //   audio_results: object,
    //   text_results: object,
    //   combined_analysis: object
    // }
    return response.data;
};

// Get Dashboard Stats
export const getDashboardStats = async () => {
    const response = await api.get('/dashboard-stats');
    // Expected response format:
    // {
    //   total_analyses: number,
    //   success_rate: number,
    //   average_sentiment: number,
    //   recent_analyses: array,
    //   service_status: object
    // }
    return response.data;
};

// Health Check
export const checkHealth = async () => {
    const response = await api.get('/health');
    return response.data;
}; 