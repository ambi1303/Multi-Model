/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Slider,
  Alert,
  Paper,
} from '@mui/material';
import {
  Assignment,
  Refresh,
} from '@mui/icons-material';
import { RadarChart } from '@mui/x-charts';
import { BurnoutResult } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import { useAppStore } from '../store/useAppStore';
import api from '../services/api';
import { useTheme } from '@mui/material/styles';

const questions = [
  { key: 'designation', label: 'Designation Level (1-5)', min: 1, max: 5 },
  { key: 'resourceAllocation', label: 'Resource Allocation (1-10)', min: 1, max: 10 },
  { key: 'mentalFatigueScore', label: 'Mental Fatigue Score (1-10)', min: 1, max: 10 },
  { key: 'companyType', label: 'Company Type (Service=1, Product=2)', min: 1, max: 2 },
  { key: 'wfhSetupAvailable', label: 'WFH Setup (Yes=1, No=2)', min: 1, max: 2 },
  { key: 'gender', label: 'Gender (Male=1, Female=2)', min: 1, max: 2 },
];

const likertQuestions = [
  { key: 'q1', label: 'I feel happy and relaxed while doing my job. (1-5)' },
  { key: 'q2', label: 'I frequently feel anxious or stressed because of my work. (1-5)' },
  { key: 'q3', label: 'I feel emotionally exhausted at the end of my workday. (1-5)' },
  { key: 'q4', label: 'I feel motivated and excited about my work. (1-5)' },
  { key: 'q5', label: 'I feel a sense of accomplishment and purpose in my role. (1-5)' },
  { key: 'q6', label: 'I find myself feeling detached or indifferent about my work. (1-5)' },
  { key: 'q7', label: 'My workload is manageable within my regular working hours. (1-5)' },
  { key: 'q8', label: 'I have control over how I organize and complete my tasks. (1-5)' },
  { key: 'q9', label: 'My manager and team provide support when I face challenges. (1-5)' },
  { key: 'q10', label: 'I feel my personal time and work–life balance are respected by the organization. (1-5)' },
];

const mapRadarValue = (key: string, value: string | number): number => {
  if (key === 'companyType') return value === 'Product' ? 2 : 1;
  if (key === 'wfhSetupAvailable') return value === 'No' ? 2 : 1;
  if (key === 'gender') return value === 'Female' ? 2 : 1;
  return typeof value === 'number' ? value : 0;
};

const mapBackendResponse = (backendResult: any): BurnoutResult => {
  return {
    "Employee ID": backendResult["Employee ID"] || "anonymous",
    "Predicted Burn Rate": backendResult["Predicted Burn Rate"] || 0,
    "Survey Score": backendResult["Survey Score"] || "",
    "Mental Health Summary": backendResult["Mental Health Summary"] || "",
    "Recommendations": Array.isArray(backendResult["Recommendations"]) ? backendResult["Recommendations"] : [],
    riskLevel: backendResult["Survey Score"]?.includes("High Risk") ? "High" :
      backendResult["Survey Score"]?.includes("Medium Risk") ? "Medium" : "Low",
    score: (backendResult["Predicted Burn Rate"] || 0) / 10,
    recommendations: Array.isArray(backendResult["Recommendations"]) ? backendResult["Recommendations"] : [],
    breakdown: [],
    employeeId: backendResult["Employee ID"] || "anonymous",
    surveyScore: backendResult["Survey Score"] || "",
    mentalHealthSummary: backendResult["Mental Health Summary"] || "",
    burnRate: backendResult["Predicted Burn Rate"] || 0
  };
};

const createPayload = (data: FormData) => {
  return {
    employee: {
      designation: Number(data.designation),
      resource_allocation: Number(data.resourceAllocation),
      mental_fatigue_score: Number(data.mentalFatigueScore),
      company_type: data.companyType,
      wfh_setup_available: data.wfhSetupAvailable,
      gender: data.gender,
    },
    survey: {
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
    },
    employee_id: data.employee_id || undefined,
  };
};

const formatScore = (score: number | undefined): string => {
  return typeof score === 'number' && !isNaN(score) ? (score * 10).toFixed(0) : '--';
};

const isValidRadarData = (data: any[]): boolean => {
  return Array.isArray(data) && data.length > 0 && data.every(d => typeof d.value === 'number' && !isNaN(d.value));
};

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

export const BurnoutSurvey: React.FC = () => {
  const [result, setResult] = useState<BurnoutResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const { addAnalysisResult } = useAppStore();
  const theme = useTheme();

  const { control, handleSubmit, watch, reset } = useForm<FormData>({
    defaultValues: {
      designation: 1,
      resourceAllocation: 5,
      mentalFatigueScore: 5,
      companyType: 'Service',
      wfhSetupAvailable: 'Yes',
      gender: 'Male',
      q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload = createPayload(data);
      console.log('Sending payload:', payload);
      const response = await api.post('/analyze-survey', payload);

      const mappedResult = mapBackendResponse(response.data);

      setResult(mappedResult);
      addAnalysisResult('survey', mappedResult);
      showSuccess('Survey analyzed successfully!');
    } catch (err) {
      console.error('Survey submission error:', err);
      showError('Failed to analyze survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetSurvey = () => {
    reset();
    setResult(null);
  };

  const radarData = questions.map(q => ({
    axis: q.key,
    value: mapRadarValue(q.key, watchedValues[q.key as keyof typeof watchedValues] ?? 0),
  }));

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
          Employee Burnout Assessment
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Comprehensive evaluation to identify burnout risk and stress levels
        </Typography>
      </Box>

      {!result ? (
        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Survey Questions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Please answer the following questions:
                </Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Controller
                      name="designation"
                      control={control}
                      render={({ field }) => (
                        <Box>
                          <Typography sx={{ mb: 1 }}>Designation Level (1-5)</Typography>
                          <Slider {...field} min={1} max={5} step={1} marks valueLabelDisplay="auto" />
                        </Box>
                      )}
                    />
                    <Controller
                      name="resourceAllocation"
                      control={control}
                      render={({ field }) => (
                        <Box>
                          <Typography sx={{ mb: 1 }}>Resource Allocation (1-10)</Typography>
                          <Slider {...field} min={1} max={10} step={1} marks valueLabelDisplay="auto" />
                        </Box>
                      )}
                    />
                    <Controller
                      name="mentalFatigueScore"
                      control={control}
                      render={({ field }) => (
                        <Box>
                          <Typography sx={{ mb: 1 }}>Mental Fatigue Score (1-10)</Typography>
                          <Slider {...field} min={1} max={10} step={1} marks valueLabelDisplay="auto" />
                        </Box>
                      )}
                    />
                    <Controller
                      name="companyType"
                      control={control}
                      render={({ field }) => (
                        <Box>
                          <Typography sx={{ mb: 1 }}>Company Type</Typography>
                          <Box>
                            <label><input type="radio" value="Service" checked={field.value === 'Service'} onChange={() => field.onChange('Service')} /> Service</label>
                            <label style={{ marginLeft: 16 }}><input type="radio" value="Product" checked={field.value === 'Product'} onChange={() => field.onChange('Product')} /> Product</label>
                          </Box>
                        </Box>
                      )}
                    />
                    <Controller
                      name="wfhSetupAvailable"
                      control={control}
                      render={({ field }) => (
                        <Box>
                          <Typography sx={{ mb: 1 }}>WFH Setup Available</Typography>
                          <Box>
                            <label><input type="radio" value="Yes" checked={field.value === 'Yes'} onChange={() => field.onChange('Yes')} /> Yes</label>
                            <label style={{ marginLeft: 16 }}><input type="radio" value="No" checked={field.value === 'No'} onChange={() => field.onChange('No')} /> No</label>
                          </Box>
                        </Box>
                      )}
                    />
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <Box>
                          <Typography sx={{ mb: 1 }}>Gender</Typography>
                          <Box>
                            <label><input type="radio" value="Male" checked={field.value === 'Male'} onChange={() => field.onChange('Male')} /> Male</label>
                            <label style={{ marginLeft: 16 }}><input type="radio" value="Female" checked={field.value === 'Female'} onChange={() => field.onChange('Female')} /> Female</label>
                          </Box>
                        </Box>
                      )}
                    />
                    <Box sx={{ mt: 4, mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Mental Health Assessment Questions
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
                        Respond on a scale of 1 to 5: 1 = Strongly Disagree, 5 = Strongly Agree
                      </Typography>
                    </Box>
                    {likertQuestions.map(q => (
                      <Controller
                        key={q.key}
                        name={q.key as keyof FormData}
                        control={control}
                        render={({ field }) => (
                          <Box sx={{ mb: 2 }}>
                            <Typography sx={{ mb: 1 }}>{q.label}</Typography>
                            <Slider 
                              value={typeof field.value === 'number' ? field.value : 1}
                              onChange={(_, value) => field.onChange(value)}
                              onBlur={field.onBlur}
                              min={1} 
                              max={5} 
                              step={1} 
                              marks 
                              valueLabelDisplay="auto" 
                            />
                          </Box>
                        )}
                      />
                    ))}
                    <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        startIcon={loading ? <LoadingSpinner size={16} /> : <Assignment />}
                        sx={{ flex: 1 }}
                      >
                        {loading ? 'Analyzing...' : 'Analyze Assessment'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={resetSurvey}
                        startIcon={<Refresh />}
                      >
                        Reset
                      </Button>
                    </Box>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Assessment Preview
                  </Typography>
                  {isValidRadarData(radarData) ? (
                    <RadarChart
                      series={[
                        {
                          data: radarData.map(d => d.value),
                          label: 'Scores',
                        },
                      ]}
                      height={250}
                      radar={{
                        metrics: questions.map(q => q.label),
                        max: 10,
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">No preview data available.</Typography>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    What This Measures
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[
                      { color: '#2563eb', label: 'Work-related stress factors' },
                      { color: '#7c3aed', label: 'Physical and mental fatigue' },
                      { color: '#059669', label: 'Support system adequacy' },
                      { color: '#dc2626', label: 'Overall job satisfaction' },
                    ].map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: item.color,
                          }}
                        />
                        <Typography variant="body2">{item.label}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Your burnout assessment indicates a <strong>{(result.riskLevel || '').toLowerCase()}</strong> risk level
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  display: 'inline-block',
                  p: 2,
                  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : 'grey.50',
                  color: theme.palette.mode === 'dark' ? theme.palette.grey[100] : 'inherit',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Overall Score:
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {formatScore(result.score)}%
                </Typography>
              </Paper>
            </CardContent>
          </Card>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Assessment Preview
                  </Typography>
                  {isValidRadarData(radarData) ? (
                    <RadarChart
                      series={[
                        {
                          data: radarData.map(d => d.value),
                          label: 'Scores',
                        },
                      ]}
                      height={250}
                      radar={{
                        metrics: questions.map(q => q.label),
                        max: 10,
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">No preview data available.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                    Risk Breakdown
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Analysis by category
                  </Typography>

                  {result.mentalHealthSummary ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 3,
                        backgroundColor: 'background.default',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                        {result.mentalHealthSummary}
                      </Typography>
                    </Paper>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No breakdown data available.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                    Personalized Recommendations
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {(result.recommendations || []).map((rec, index) => (
                      <Paper
                        key={index}
                        variant="outlined"
                        sx={{
                          p: 3,
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Typography variant="body1">{rec}</Typography>
                      </Paper>
                    ))}

                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Important Note
                      </Typography>
                      <Typography variant="body2">
                        This assessment is for informational purposes only. If you're experiencing severe burnout symptoms,
                        consider consulting with a healthcare professional or your HR department.
                      </Typography>
                    </Alert>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="outlined"
              size="large"
              onClick={resetSurvey}
              startIcon={<Refresh />}
            >
              Take Assessment Again
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};