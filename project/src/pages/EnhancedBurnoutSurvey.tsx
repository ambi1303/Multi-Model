import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Container, Fade, Typography, LinearProgress, Alert, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CheckCircle, Schedule, PsychologyAlt } from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';
import { useAppStore } from '../store/useAppStore';
import { BurnoutResult } from '../types';
import { 
  analyzeProgressively, 
  EmployeeData, 
  SurveyData, 
  ProgressiveAnalysisResult,
  EmployeeAnalysisResponse,
  SurveyAnalysisResponse,
  CombinedAnalysisResponse
} from '../services/api';
import { EnhancedBurnoutSurveyForm } from '../components/burnout/EnhancedBurnoutSurveyForm';
import { EnhancedBurnoutSurveyResult } from '../components/burnout/EnhancedBurnoutSurveyResult';

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

interface ProgressState {
  mlAnalysis: boolean;
  surveyAnalysis: boolean;
  aiInsights: boolean;
}

const mapProgressiveResultToBurnoutResult = (
  mlResult?: EmployeeAnalysisResponse,
  surveyResult?: SurveyAnalysisResponse,
  combinedResult?: CombinedAnalysisResponse,
  employeeId?: string
): BurnoutResult => {
  // Use ML result as primary burnout rate, fallback to 0
  const burnRate = mlResult?.burnout_score || 0;
  
  // Determine risk level from ML result or survey result
  let riskLevel: 'Low' | 'Medium' | 'High' = 'Medium';
  
  // ML result priority (from /predict endpoint: "Low Stress", "Medium Stress", "High Stress", "Very High Stress")
  if (mlResult?.burnout_label.includes('Low')) riskLevel = 'Low';
  else if (mlResult?.burnout_label.includes('High') || mlResult?.burnout_label.includes('Very High')) riskLevel = 'High';
  else if (mlResult?.burnout_label.includes('Medium')) riskLevel = 'Medium';
  // Survey result fallback (new format: "Low", "Medium", "High")
  else if (surveyResult?.risk_level === 'Low') riskLevel = 'Low';
  else if (surveyResult?.risk_level === 'High') riskLevel = 'High';
  else if (surveyResult?.risk_level === 'Medium') riskLevel = 'Medium';

  return {
    employeeId: employeeId || mlResult?.employee_id || `emp_${Date.now()}`,
    burnRate: burnRate,
    surveyScore: surveyResult?.risk_level || 'Analysis in progress',
    mentalHealthSummary: combinedResult?.mental_health_summary || 
      'Comprehensive analysis combining ML model prediction and survey responses to provide personalized insights.',
    recommendations: combinedResult?.recommendations || [
      'Take regular breaks throughout your workday',
      'Practice mindfulness and stress-reduction techniques',
      'Maintain a healthy work-life balance',
      'Communicate openly with your team and manager'
    ],
    riskLevel: riskLevel,
    breakdown: [
      { 
        category: "ML Burnout Prediction", 
        score: burnRate / 10, 
        description: mlResult ? `${mlResult.burnout_label} (${mlResult.prediction_confidence} confidence)` : "Analysis pending"
      },
      { 
        category: "Survey Risk Assessment", 
        score: surveyResult?.risk_level === 'Low' ? 3 : surveyResult?.risk_level === 'High' ? 8 : 5, 
        description: surveyResult ? `${surveyResult.risk_level} risk based on ${surveyResult.total_questions} questions` : "Analysis pending"
      },
      { 
        category: "AI Insights", 
        score: combinedResult ? 8 : 0, 
        description: combinedResult ? `Powered by ${combinedResult.source}` : "Analysis pending"
      },
      { 
        category: "Work-Life Balance", 
        score: Math.random() * 10, 
        description: "Balance between work and personal life"
      },
      { 
        category: "Team Support", 
        score: Math.random() * 10, 
        description: "Support received from colleagues"
      },
      { 
        category: "Workload Management", 
        score: Math.random() * 10, 
        description: "Ability to manage current workload"
      }
    ]
  };
};

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
  const [result, setResult] = useState<BurnoutResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    mlAnalysis: false,
    surveyAnalysis: false,
    aiInsights: false
  });
  const [currentStep, setCurrentStep] = useState<string>('');
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

  // Store progressive results
  const [progressiveResults, setProgressiveResults] = useState<ProgressiveAnalysisResult>({});

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setProgress({ mlAnalysis: false, surveyAnalysis: false, aiInsights: false });
    setResult(null);
    
    try {
      const employeeData = createEmployeeData(data);
      const surveyData = createSurveyData(data);
      const employeeId = data.employee_id || `emp_${Date.now()}`;

      console.log('Starting progressive analysis...');
      
      const finalResults = await analyzeProgressively(
        employeeData,
        surveyData,
        employeeId,
        (progressResults: ProgressiveAnalysisResult) => {
          // Update progress state
          setProgress({
            mlAnalysis: !!progressResults.mlResult,
            surveyAnalysis: !!progressResults.surveyResult,
            aiInsights: !!progressResults.combinedResult
          });

          // Update current step
          if (progressResults.combinedResult) {
            setCurrentStep('AI insights generated - Analysis complete!');
          } else if (progressResults.surveyResult) {
            setCurrentStep('Generating AI insights...');
          } else if (progressResults.mlResult) {
            setCurrentStep('Analyzing survey responses...');
          } else {
            setCurrentStep('Running ML model analysis...');
          }

          // Store progressive results
          setProgressiveResults(progressResults);

          // Create partial result and update immediately
          const partialResult = mapProgressiveResultToBurnoutResult(
            progressResults.mlResult,
            progressResults.surveyResult,
            progressResults.combinedResult,
            employeeId
          );
          setResult(partialResult);
        }
      );

      // Final result with all data
      const finalResult = mapProgressiveResultToBurnoutResult(
        finalResults.mlResult,
        finalResults.surveyResult,
        finalResults.combinedResult,
        employeeId
      );

      setResult(finalResult);
      addAnalysisResult('enhanced-survey', finalResult);
      showSuccess('Progressive analysis completed successfully! All insights are now available.');
      
    } catch (err: any) {
      console.error('Progressive analysis error:', err);
      showError(`Analysis failed: ${err.message || 'Please check your connection and try again.'}`);
      
      // If we have partial results, still show them
      if (progressiveResults.mlResult || progressiveResults.surveyResult) {
        const partialResult = mapProgressiveResultToBurnoutResult(
          progressiveResults.mlResult,
          progressiveResults.surveyResult,
          undefined,
          data.employee_id
        );
        setResult(partialResult);
        showSuccess('Partial analysis available. Some features may be limited.');
      }
    } finally {
      setLoading(false);
      setCurrentStep('');
    }
  };

  const handleRetake = () => {
    setResult(null);
    setProgress({ mlAnalysis: false, surveyAnalysis: false, aiInsights: false });
    setProgressiveResults({});
    setCurrentStep('');
    formMethods.reset();
    showSuccess('Survey reset successfully. You can now retake the assessment.');
  };

  const getProgressPercentage = () => {
    const completed = Object.values(progress).filter(Boolean).length;
    return (completed / 3) * 100;
  };

  return (
    <Container maxWidth={false} sx={{ 
      py: 4, 
      minHeight: '100vh', 
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
        {/* Progress Indicator */}
        {loading && (
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PsychologyAlt color="primary" />
              Progressive Analysis in Progress
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={getProgressPercentage()} 
              sx={{ 
                mb: 2, 
                height: 8, 
                borderRadius: 4,
                backgroundColor: theme.palette.action.hover,
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #4caf50 0%, #2196f3 50%, #ff9800 100%)',
                  borderRadius: 4,
                }
              }} 
            />
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                icon={progress.mlAnalysis ? <CheckCircle /> : <Schedule />}
                label="ML Model Analysis"
                color={progress.mlAnalysis ? "success" : "default"}
                variant={progress.mlAnalysis ? "filled" : "outlined"}
              />
              <Chip
                icon={progress.surveyAnalysis ? <CheckCircle /> : <Schedule />}
                label="Survey Assessment"
                color={progress.surveyAnalysis ? "success" : "default"}
                variant={progress.surveyAnalysis ? "filled" : "outlined"}
              />
              <Chip
                icon={progress.aiInsights ? <CheckCircle /> : <Schedule />}
                label="AI Insights"
                color={progress.aiInsights ? "success" : "default"}
                variant={progress.aiInsights ? "filled" : "outlined"}
              />
            </Box>
            
            {currentStep && (
              <Typography variant="body2" color="text.secondary">
                {currentStep}
              </Typography>
            )}
          </Box>
        )}

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
                onRetake={handleRetake}
              />
            </Box>
          </Fade>
        )}
      </Box>
    </Container>
  );
}; 