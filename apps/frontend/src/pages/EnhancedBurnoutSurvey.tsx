import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Container, Fade, Typography,  Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNotification } from '../contexts/NotificationContext';
import { useAppStore } from '../store/useAppStore';
import { BurnoutResult } from '../types';
import { 
  analyzeCombined,
  analyzeEmployee,
  analyzeSurveyQuestions,
  EmployeeData, 
  SurveyData, 
  EmployeeAnalysisResponse,
  SurveyAnalysisResponse,
  CombinedAnalysisResponse
} from '../services/api';
import { EnhancedBurnoutSurveyForm } from '../components/burnout/EnhancedBurnoutSurveyForm';
import EnhancedBurnoutSurveyResult from '../components/burnout/EnhancedBurnoutSurveyResult';

interface FormData {
  designation: number;
  resourceAllocation: number;
  mentalFatigueScore: number;
  companyType: string;
  wfhSetupAvailable: string;
  gender: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
  q10: number;
  employee_id?: string;
}

const createEmployeeData = (data: FormData): EmployeeData => ({
  designation: Number(data.designation),
  resource_allocation: Number(data.resourceAllocation),
  mental_fatigue_score: Number(data.mentalFatigueScore),
  company_type: data.companyType as 'Service' | 'Product',
  wfh_setup_available: data.wfhSetupAvailable as 'Yes' | 'No',
  gender: data.gender as 'Male' | 'Female',
});

const createSurveyData = (data: FormData): SurveyData => ({
  q1: Number(data.q1),
  q2: Number(data.q2),
  q3: Number(data.q3),
  q4: Number(data.q4),
  q5: Number(data.q5),
  q6: Number(data.q6),
  q7: Number(data.q7),
  q8: Number(data.q8),
  q9: Number(data.q9),
  q10: Number(data.q10),
});

export const EnhancedBurnoutSurvey: React.FC = () => {
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const { addAnalysisResult } = useAppStore();
  const theme = useTheme();

  const formMethods = useForm<FormData>({
    defaultValues: {
      designation: 3,
      resourceAllocation: 5,
      mentalFatigueScore: 5,
      companyType: 'Service',
      wfhSetupAvailable: 'Yes',
      gender: 'Male',
      q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setResult(null);
    
    try {
      const employeeData = createEmployeeData(data);
      const surveyData = createSurveyData(data);
      const employeeId = data.employee_id || `emp_${Date.now()}`;

      // Step 1: Call ML Model API for burnout prediction
      console.log('Step 1: Calling ML Model API...');
      const mlResult: EmployeeAnalysisResponse = await analyzeEmployee(employeeData, employeeId);
      
      // Step 2: Call Likert Survey API for risk assessment
      console.log('Step 2: Calling Survey API...');
      const surveyResult: SurveyAnalysisResponse = await analyzeSurveyQuestions(surveyData);
      
      // Step 3: Call Combined Analysis API for Gemini insights
      console.log('Step 3: Calling Combined Analysis API...');
      const combinedResult: CombinedAnalysisResponse = await analyzeCombined(employeeData, surveyData, employeeId);

      // Map all results to CombinedAnalysisResponse format for component
      const inferredRisk: 'Low' | 'Medium' | 'High' = (() => {
        // Priority: ML result first, then survey result, then Gemini summary
        if (mlResult.burnout_label.includes('Low')) return 'Low';
        if (mlResult.burnout_label.includes('High') || mlResult.burnout_label.includes('Very High')) return 'High';
        if (mlResult.burnout_label.includes('Medium')) return 'Medium';
        if (surveyResult.risk_level === 'Low') return 'Low';
        if (surveyResult.risk_level === 'High') return 'High';
        if (surveyResult.risk_level === 'Medium') return 'Medium';
        
        // Fallback: infer from Gemini summary
        const summary = combinedResult.mental_health_summary?.toLowerCase() || '';
        if (summary.includes('high')) return 'High';
        if (summary.includes('low')) return 'Low';
        return 'Medium';
      })();

      // Transform recommendations from string[] to object[] to match component props
      const formattedRecommendations = (combinedResult.recommendations || []).map((rec, index) => ({
        title: `Recommendation #${index + 1}`,
        description: rec,
        icon: 'Lightbulb', // Placeholder icon name
      }));

      // Create a proper CombinedAnalysisResponse with additional properties for the component
      const finalResult = {
        ...combinedResult,
        recommendations: formattedRecommendations, // Use the newly formatted array
        burnoutScore: mlResult.burnout_score / 100, // Normalize to 0-1 range
        riskLevel: inferredRisk,
        employeeData: {
          ...employeeData,
          designation_encoded: employeeData.designation,
          gender_encoded: employeeData.gender === 'Male' ? 1 : 0,
          company_type_encoded: employeeData.company_type === 'Service' ? 1 : 0,
          wfh_setup_available_encoded: employeeData.wfh_setup_available === 'Yes' ? 1 : 0,
          mental_fatigue_score: employeeData.mental_fatigue_score,
          resource_allocation: employeeData.resource_allocation,
        },
        surveyResults: {
          stress_level: surveyData.q2, // "I frequently feel anxious or stressed because of my work"
          job_satisfaction: surveyData.q4, // "I feel motivated and excited about my work"
          work_life_balance: surveyData.q10, // "I feel my personal time and work–life balance are respected"
          emotional_exhaustion: surveyData.q3, // "I feel emotionally exhausted at the end of my workday"
        },
        mlResult,
        surveyResult,
        breakdown: [
          { 
            category: "ML Burnout Prediction", 
            score: mlResult.burnout_score / 10, 
            description: `${mlResult.burnout_label} (${mlResult.prediction_confidence} confidence)`
          },
          { 
            category: "Survey Risk Assessment", 
            score: surveyResult.risk_level === 'Low' ? 3 : surveyResult.risk_level === 'High' ? 8 : 5, 
            description: `${surveyResult.risk_level} risk based on ${surveyResult.total_questions} questions`
          },
          { 
            category: "AI Insights", 
            score: 8, 
            description: `Powered by ${combinedResult.source}`
          }
        ]
      };

      setResult(finalResult);
      // Store the result in the app store (convert to BurnoutResult format for compatibility)
      const burnoutResult: BurnoutResult = {
        employeeId: employeeId,
        burnRate: mlResult.burnout_score,
        surveyScore: surveyResult.risk_level,
        mentalHealthSummary: combinedResult.mental_health_summary,
        recommendations: formattedRecommendations, // Use formatted recommendations here too
        riskLevel: inferredRisk,
        breakdown: finalResult.breakdown
      };
      addAnalysisResult('enhanced-survey', burnoutResult);
      showSuccess('Analysis completed successfully! All insights are now available.');
    } catch (err: any) {
      console.error('Analysis error:', err);
      showError(`Analysis failed: ${err.message || 'Please check your connection and try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    formMethods.reset();
    showSuccess('Survey reset successfully. You can now retake the assessment.');
  };

  return (
    <Container maxWidth={false} sx={{ 
      py: 4, 
      pb: 8, // Extra bottom padding to ensure space for footer
      minHeight: 'auto', // Remove fixed height constraint
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Box sx={{ 
        background: theme.palette.mode === 'dark'
          ? 'rgba(30, 41, 59, 0.95)'
          : 'rgba(255, 255, 255, 0.95)', 
        borderRadius: 3, 
        backdropFilter: 'blur(10px)',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: theme.palette.mode === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(255, 255, 255, 0.2)',
        overflow: 'hidden'
      }}>
        {!result ? (
          <Fade in timeout={500}>
            <Box>
              <EnhancedBurnoutSurveyForm
                formMethods={formMethods}
                loading={loading}
                onSubmit={onSubmit}
              />
            </Box>
          </Fade>
        ) : (
          <Fade in timeout={500}>
            <Box>
              {/* Show partial results notice if analysis is still in progress */}
              {loading && (
                <Alert severity="info" sx={{ m: 3, mb: 0 }}>
                  <Typography variant="body2">
                    <strong>Progressive Results:</strong> Showing results as they become available. 
                    Full insights will be displayed once AI analysis is complete.
                  </Typography>
                </Alert>
              )}
              
              <EnhancedBurnoutSurveyResult
                result={result}
                onRetakeAssessment={handleRetake}
              />
            </Box>
          </Fade>
        )}
      </Box>
    </Container>
  );
}; 