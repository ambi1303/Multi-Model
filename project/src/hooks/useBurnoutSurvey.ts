import { useState } from 'react';
import { BurnoutResult } from '../types';
import api from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useAppStore } from '../store/useAppStore';

export function useBurnoutSurvey() {
  const [result, setResult] = useState<BurnoutResult | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const { addAnalysisResult } = useAppStore();

  const analyzeSurvey = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        Designation: Number(data.designation),
        Resource_Allocation: Number(data.resourceAllocation),
        Mental_Fatigue_Score: Number(data.mentalFatigueScore),
        Company_Type: data.companyType,
        WFH_Setup_Available: data.wfhSetupAvailable,
        Gender: data.gender,
      };
      const response = await api.post('/analyze-survey', payload);
      const backend = response.data;
      const mappedResult = {
        riskLevel: (backend.stress_level || 'Unknown').split(' ')[0],
        score: typeof backend.burn_rate === 'number' ? backend.burn_rate * 10 : 0,
        recommendations: [],
        breakdown: [],
      };
      setResult(mappedResult);
      setLastSubmitted(data);
      addAnalysisResult('survey', mappedResult);
      showSuccess('Survey analyzed successfully!');
    } catch (err) {
      showError('Failed to analyze survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetSurvey = () => {
    setResult(null);
    setLastSubmitted(null);
  };

  return {
    result,
    lastSubmitted,
    loading,
    analyzeSurvey,
    resetSurvey,
    setResult,
    setLastSubmitted,
  };
} 