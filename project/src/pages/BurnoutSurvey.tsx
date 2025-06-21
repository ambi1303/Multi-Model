import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Slider,
  TextField,
  Alert,
  Chip,
  LinearProgress,
  Paper,
} from '@mui/material';
import {
  Assignment,
  Psychology,
  TrendingUp,
  Refresh,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { RadarChart } from '@mui/x-charts';
import { BarChart } from '@mui/x-charts/BarChart';
import { BurnoutSurveyData, BurnoutResult } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import { useAppStore } from '../store/useAppStore';
import api from '../services/api';
import { useTheme } from '@mui/material/styles';

const schema = yup.object({
  workload: yup.number().required().min(1).max(10),
  workLifeBalance: yup.number().required().min(1).max(10),
  jobSatisfaction: yup.number().required().min(1).max(10),
  stressLevel: yup.number().required().min(1).max(10),
  supportSystem: yup.number().required().min(1).max(10),
  sleepQuality: yup.number().required().min(1).max(10),
  energyLevel: yup.number().required().min(1).max(10),
  motivation: yup.number().required().min(1).max(10),
  additionalComments: yup.string().max(500),
});

const questions = [
  { key: 'designation', label: 'Designation Level (1-5)', min: 1, max: 5 },
  { key: 'resourceAllocation', label: 'Resource Allocation (1-10)', min: 1, max: 10 },
  { key: 'mentalFatigueScore', label: 'Mental Fatigue Score (1-10)', min: 1, max: 10 },
  { key: 'companyType', label: 'Company Type (Service=1, Product=2)', min: 1, max: 2 },
  { key: 'wfhSetupAvailable', label: 'WFH Setup (Yes=1, No=2)', min: 1, max: 2 },
  { key: 'gender', label: 'Gender (Male=1, Female=2)', min: 1, max: 2 },
];

// Helper to map categorical values to numbers for radar chart
const mapRadarValue = (key: string, value: any) => {
  if (key === 'companyType') return value === 'Product' ? 2 : 1;
  if (key === 'wfhSetupAvailable') return value === 'No' ? 2 : 1;
  if (key === 'gender') return value === 'Female' ? 2 : 1;
  return typeof value === 'number' ? value : 0;
};

export const BurnoutSurvey: React.FC = () => {
  const [result, setResult] = useState<BurnoutResult | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const { addAnalysisResult } = useAppStore();
  const theme = useTheme();

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<any>({
    defaultValues: {
      designation: 1,
      resourceAllocation: 5,
      mentalFatigueScore: 5,
      companyType: 'Service',
      wfhSetupAvailable: 'Yes',
      gender: 'Male',
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: any) => {
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
    reset();
    setResult(null);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'success';
      case 'Moderate': return 'warning';
      case 'High': return 'error';
      case 'Severe': return 'error';
      default: return 'default';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'Low': return CheckCircle;
      case 'Moderate': return TrendingUp;
      case 'High': 
      case 'Severe': return Warning;
      default: return Assignment;
    }
  };

  // Prepare radar chart data for preview (form) or for results (last submitted)
  const radarData = questions.map(q => ({
    axis: q.key,
    value: mapRadarValue(q.key, watchedValues[q.key]),
  }));

  return (
    <Box>
      {/* Header */}
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
          {/* Survey Form */}
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
                    {/* Designation Level (1-5) */}
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
                    {/* Resource Allocation (1-10) */}
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
                    {/* Mental Fatigue Score (1-10) */}
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
                    {/* Company Type */}
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
                    {/* WFH Setup Available */}
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
                    {/* Gender */}
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

          {/* Live Preview */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Assessment Preview
                  </Typography>
                  {Array.isArray(radarData) && radarData.length > 0 && radarData.every(d => typeof d.value === 'number' && !isNaN(d.value)) ? (
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
          {/* Results Header */}
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: `${getRiskColor(result.riskLevel || '').light}`,
                  color: `${getRiskColor(result.riskLevel || '').contrastText}`,
                  mb: 3,
                }}
              >
                {React.createElement(getRiskIcon(result.riskLevel || ''), { sx: { fontSize: 32 } })}
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {(result.riskLevel || 'Unknown')} Risk
                </Typography>
              </Box>
              
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
                  {typeof result.score === 'number' && !isNaN(result.score) ? result.score.toFixed(2) : '--'}/10
                </Typography>
              </Paper>
            </CardContent>
          </Card>

          <Grid container spacing={4}>
            {/* Radar Chart for Assessment Preview (after results) */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Assessment Preview
                  </Typography>
                  {Array.isArray(radarData) && radarData.length > 0 && radarData.every(d => typeof d.value === 'number' && !isNaN(d.value)) ? (
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

            {/* Breakdown Chart */}
            {Array.isArray(result.breakdown) && result.breakdown.length > 0 ? (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                      Risk Breakdown
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Analysis by category
                    </Typography>
                    
                    <BarChart
                      dataset={result.breakdown}
                      yAxis={[{ scaleType: 'band', dataKey: 'category' }]}
                      series={[{ dataKey: 'score', label: 'Score' }]}
                      layout="horizontal"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                      Risk Breakdown
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Analysis by category
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">No breakdown data available.</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Recommendations */}
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