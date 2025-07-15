import api from './api';
import { AnalyticsData, AnalyticsFilters, ExportData } from '../types/analytics';

// Real analytics data fetching functions
export const fetchOverviewData = async (filters: AnalyticsFilters) => {
  const response = await api.get('/analytics/overview', { params: filters });
  return response.data;
};

export const fetchVideoAnalytics = async (filters: AnalyticsFilters) => {
  const response = await api.get('/analytics/video', { params: filters });
  return response.data;
};

export const fetchSpeechAnalytics = async (filters: AnalyticsFilters) => {
  const response = await api.get('/analytics/speech', { params: filters });
  return response.data;
};

export const fetchChatAnalytics = async (filters: AnalyticsFilters) => {
  const response = await api.get('/analytics/chat', { params: filters });
  return response.data;
};

export const fetchSurveyAnalytics = async (filters: AnalyticsFilters) => {
  const response = await api.get('/analytics/survey', { params: filters });
  return response.data;
};

export const fetchDepartmentAnalytics = async (filters: AnalyticsFilters) => {
  const response = await api.get('/analytics/department', { params: filters });
  return response.data;
};

export const getAnalyticsData = async (filters: AnalyticsFilters): Promise<AnalyticsData> => {
  const results = await Promise.allSettled([
    fetchOverviewData(filters),
    fetchVideoAnalytics(filters),
    fetchSpeechAnalytics(filters),
    fetchChatAnalytics(filters),
    fetchSurveyAnalytics(filters),
    fetchDepartmentAnalytics(filters)
  ]);

  const [
    overview,
    video,
    speech,
    chat,
    survey,
    department
  ] = results.map(result => (result.status === 'fulfilled' ? result.value : null));

  return {
    overview,
    video,
    speech,
    chat,
    survey,
    department
  };
};

export const exportAnalytics = async (filters: AnalyticsFilters): Promise<ExportData> => {
  const response = await api.post('/analytics/export', filters);
  return response.data;
};