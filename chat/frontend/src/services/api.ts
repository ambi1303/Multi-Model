import axios from 'axios';
import { Message, MessageResponse, AnalysisResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const analyzeSingleMessage = async (message: Message): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>('/analyze/single', message);
    return response.data;
};

export const analyzeMultipleMessages = async (messages: Message[]): Promise<AnalysisResponse> => {
    const response = await api.post<AnalysisResponse>('/analyze/multiple', messages);
    return response.data;
};

export const getMentalStatesVisualization = () => {
    return `${API_BASE_URL}/visualizations/mental-states`;
};

export const getSentimentTrendVisualization = () => {
    return `${API_BASE_URL}/visualizations/sentiment-trend`;
};

export const getLatestResults = async (): Promise<AnalysisResponse> => {
    const response = await api.get<AnalysisResponse>('/results/latest');
    return response.data;
}; 