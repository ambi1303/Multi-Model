import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Slider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  Collapse,
  Alert,
  Stack,
} from '@mui/material';
import {
  PersonIcon as Person,
  WorkIcon as Work,
  PsychologyIcon as Psychology,
  AssessmentIcon as Assessment,
  CheckCircleIcon as CheckCircle,
  ArrowBackIcon as ArrowBack,
  ArrowForwardIcon as ArrowForward,
  RestartAltIcon as RestartAlt,
  InfoIcon as Info,
  LightbulbIcon as Lightbulb,
  TrendingUpIcon as TrendingUp,
  EmojiEmotionsIcon as EmojiEmotions,
  BusinessIcon as Business,
  HomeIcon as Home,
  ScaleIcon as Scale,
} from '../../utils/icons';
import { Controller } from 'react-hook-form';
import { SimpleChartFallback } from '../charts/SimpleChartFallback';
import { keyframes } from '@emotion/react';
import { styled, useTheme } from '@mui/material/styles';

// Animated components
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const AnimatedCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const StepCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[800]} 100%)`
    : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease-in-out',
}));

const CustomSlider = styled(Slider)(({ theme }) => ({
  '& .MuiSlider-rail': {
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(90deg, ${theme.palette.success.dark} 0%, ${theme.palette.warning.dark} 50%, ${theme.palette.error.dark} 100%)`
      : `linear-gradient(90deg, ${theme.palette.success.light} 0%, ${theme.palette.warning.light} 50%, ${theme.palette.error.light} 100%)`,
    height: 8,
    borderRadius: 4,
  },
  '& .MuiSlider-track': {
    background: 'transparent',
  },
  '& .MuiSlider-thumb': {
    backgroundColor: theme.palette.primary.main,
    border: `3px solid ${theme.palette.background.paper}`,
    boxShadow: theme.shadows[4],
    '&:hover': {
      boxShadow: theme.shadows[8],
      animation: `${pulseAnimation} 1s infinite`,
    },
  },
  '& .MuiSlider-mark': {
    backgroundColor: theme.palette.divider,
    height: 12,
    width: 2,
    borderRadius: 1,
  },
  '& .MuiSlider-markActive': {
    backgroundColor: theme.palette.primary.main,
  },
}));

// Type definitions for form fields
interface SliderField {
  name: string;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  icon: React.ReactElement;
  stepIndex: number;
  marks: { value: number; label: string; }[] | boolean;
}

interface RadioField {
  name: string;
  label: string;
  description: string;
  options: { value: string; label: string; icon: React.ReactElement; }[];
  stepIndex: number;
}



// Type guards


interface EnhancedBurnoutSurveyFormProps {
  formMethods: any;
  loading: boolean;
  onSubmit: (data: any) => void;
}

const steps = [
  { label: 'Personal Info', icon: <Person />, description: 'Basic information about you' },
  { label: 'Work Environment', icon: <Work />, description: 'Your workplace details' },
  { label: 'Mental Health', icon: <Psychology />, description: 'How you feel at work' },
  { label: 'Review & Submit', icon: <Assessment />, description: 'Review your responses' },
];

const sliderFields: SliderField[] = [
  { 
    name: 'designation', 
    label: 'Designation Level', 
    description: 'Your position level in the organization (1=Entry, 5=Senior)',
    min: 1, 
    max: 5, 
    step: 1,
    icon: <Scale />,
    stepIndex: 0,
    marks: [
      { value: 1, label: 'Entry' },
      { value: 2, label: 'Junior' },
      { value: 3, label: 'Mid' },
      { value: 4, label: 'Senior' },
      { value: 5, label: 'Lead' },
    ]
  },
  { 
    name: 'resourceAllocation', 
    label: 'Resource Allocation', 
    description: 'How well-equipped you feel with resources (1=Very Poor, 10=Excellent)',
    min: 1, 
    max: 10, 
    step: 1,
    icon: <TrendingUp />,
    stepIndex: 1,
    marks: true
  },
  { 
    name: 'mentalFatigueScore', 
    label: 'Mental Fatigue Level', 
    description: 'Your current mental fatigue level (1=Very Low, 10=Extremely High)',
    min: 1, 
    max: 10, 
    step: 1,
    icon: <Psychology />,
    stepIndex: 2,
    marks: true
  },
];

const radioFields: RadioField[] = [
  { 
    name: 'companyType', 
    label: 'Company Type', 
    description: 'What type of company do you work for?',
    options: [
      { value: 'Service', label: 'Service Company', icon: <Business /> },
      { value: 'Product', label: 'Product Company', icon: <Lightbulb /> }
    ],
    stepIndex: 1
  },
  { 
    name: 'wfhSetupAvailable', 
    label: 'Remote Work Setup', 
    description: 'Do you have access to work from home facilities?',
    options: [
      { value: 'Yes', label: 'Yes, I have WFH setup', icon: <Home /> },
      { value: 'No', label: 'No WFH setup available', icon: <Business /> }
    ],
    stepIndex: 1
  },
  { 
    name: 'gender', 
    label: 'Gender', 
    description: 'Please select your gender',
    options: [
      { value: 'Male', label: 'Male', icon: <Person /> },
      { value: 'Female', label: 'Female', icon: <Person /> }
    ],
    stepIndex: 0
  },
];

const likertQuestions = [
  'I feel happy and relaxed while doing my job',
  'I frequently feel anxious or stressed because of my work',
  'I feel emotionally exhausted at the end of my workday',
  'I feel motivated and excited about my work',
  'I feel a sense of accomplishment and purpose in my role',
  'I find myself feeling detached or indifferent about my work',
  'My workload is manageable within my regular working hours',
  'I have control over how I organize and complete my tasks',
  'My manager and team provide support when I face challenges',
  'I feel my personal time and work–life balance are respected by the organization',
];

const getLikertScale = (theme: any) => [
  { value: 1, label: 'Strongly Disagree', emoji: '😟', color: theme.palette.error.main },
  { value: 2, label: 'Disagree', emoji: '😕', color: theme.palette.warning.main },
  { value: 3, label: 'Neutral', emoji: '😐', color: theme.palette.grey[500] },
  { value: 4, label: 'Agree', emoji: '🙂', color: theme.palette.success.main },
  { value: 5, label: 'Strongly Agree', emoji: '😊', color: theme.palette.success.dark },
];

export const EnhancedBurnoutSurveyForm: React.FC<EnhancedBurnoutSurveyFormProps> = ({ 
  formMethods, 
  loading, 
  onSubmit 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showTips, setShowTips] = useState(false);
  
  const { control, handleSubmit, watch, formState, trigger } = formMethods;
  const { errors, isValid } = formState;
  const values = watch();
  const theme = useTheme();
  const likertScale = getLikertScale(theme);

  // Calculate completion percentage
  const totalFields = sliderFields.length + radioFields.length + likertQuestions.length;
  const filledFields = Object.values(values).filter(v => v !== undefined && v !== '').length;
  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  // Prepare data for radar chart
  const radarData = sliderFields.map(f => ({
    subject: f.label.replace(' Level', '').replace(' Score', ''),
    value: Number(values[f.name]) || f.min,
    fullMark: f.max,
  }));

  // Check if current step is valid
  const isStepValid = (step: number) => {
    const stepFields = [
      ...sliderFields.filter(f => f.stepIndex === step),
      ...radioFields.filter(f => f.stepIndex === step),
      ...(step === 2 ? likertQuestions.map((q, i) => ({ key: `q${i + 1}` })) : [])
    ];
    
    return stepFields.every(field => {
      const fieldName = 'key' in field ? field.key : field.name;
      return values[fieldName] !== undefined && values[fieldName] !== '';
    });
  };

  const handleNext = async () => {
    const isCurrentStepValid = await trigger();
    if (isCurrentStepValid && isStepValid(activeStep)) {
      setCompletedSteps(prev => new Set([...prev, activeStep]));
      setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const handleStepClick = (step: number) => {
    if (completedSteps.has(step) || step <= activeStep) {
      setActiveStep(step);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <StepCard elevation={2}>
            <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person />
              Personal Information
            </Typography>
            <Grid container spacing={3}>
              {sliderFields.filter(f => f.stepIndex === 0).map(field => (
                <Grid item xs={12} key={field.name}>
                  <Fade in timeout={500}>
                    <Box>
                      <Controller
                        name={field.name}
                        control={control}
                        render={({ field: controllerField }) => (
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              {field.icon}
                              <Typography variant="h6">{field.label}</Typography>
                              <Tooltip title={field.description}>
                                <IconButton size="small">
                                  <Info />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {field.description}
                            </Typography>
                            <CustomSlider
                              {...controllerField}
                              value={Number(controllerField.value) || field.min}
                              min={field.min}
                              max={field.max}
                              step={field.step}
                              marks={field.marks}
                              valueLabelDisplay="auto"
                              sx={{ mt: 2, mb: 3 }}
                            />
                            {errors[field.name] && (
                              <Alert severity="error" sx={{ mt: 1 }}>
                                {errors[field.name]?.message}
                              </Alert>
                            )}
                          </Box>
                        )}
                      />
                    </Box>
                  </Fade>
                </Grid>
              ))}
              {radioFields.filter(f => f.stepIndex === 0).map(field => (
                <Grid item xs={12} key={field.name}>
                  <Fade in timeout={500}>
                    <Box>
                      <Controller
                        name={field.name}
                        control={control}
                        render={({ field: controllerField }) => (
                          <FormControl component="fieldset" error={!!errors[field.name]} sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <Typography variant="h6">{field.label}</Typography>
                              <Tooltip title={field.description}>
                                <IconButton size="small">
                                  <Info />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {field.description}
                            </Typography>
                            <RadioGroup 
                              {...controllerField} 
                              value={controllerField.value || field.options[0].value}
                              row
                            >
                              {field.options.map(opt => (
                                <Zoom in timeout={300} key={opt.value}>
                                  <FormControlLabel 
                                    value={opt.value} 
                                    control={<Radio />} 
                                    label={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {opt.icon}
                                        {opt.label}
                                      </Box>
                                    }
                                    sx={{ 
                                      mr: 3,
                                      '& .MuiFormControlLabel-label': {
                                        fontSize: '0.9rem'
                                      }
                                    }}
                                  />
                                </Zoom>
                              ))}
                            </RadioGroup>
                            {errors[field.name] && (
                              <Alert severity="error" sx={{ mt: 1 }}>
                                {errors[field.name]?.message}
                              </Alert>
                            )}
                          </FormControl>
                        )}
                      />
                    </Box>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </StepCard>
        );

      case 1:
        return (
          <StepCard elevation={2}>
            <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Work />
              Work Environment
            </Typography>
            <Grid container spacing={3}>
              {sliderFields.filter(f => f.stepIndex === 1).map(field => (
                <Grid item xs={12} key={field.name}>
                  <Fade in timeout={500}>
                    <Box>
                      <Controller
                        name={field.name}
                        control={control}
                        render={({ field: controllerField }) => (
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              {field.icon}
                              <Typography variant="h6">{field.label}</Typography>
                              <Tooltip title={field.description}>
                                <IconButton size="small">
                                  <Info />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {field.description}
                            </Typography>
                            <CustomSlider
                              {...controllerField}
                              value={Number(controllerField.value) || field.min}
                              min={field.min}
                              max={field.max}
                              step={field.step}
                              marks={field.marks}
                              valueLabelDisplay="auto"
                              sx={{ mt: 2, mb: 3 }}
                            />
                            {errors[field.name] && (
                              <Alert severity="error" sx={{ mt: 1 }}>
                                {errors[field.name]?.message}
                              </Alert>
                            )}
                          </Box>
                        )}
                      />
                    </Box>
                  </Fade>
                </Grid>
              ))}
              {radioFields.filter(f => f.stepIndex === 1).map(field => (
                <Grid item xs={12} md={6} key={field.name}>
                  <Fade in timeout={500}>
                    <Box>
                      <Controller
                        name={field.name}
                        control={control}
                        render={({ field: controllerField }) => (
                          <FormControl component="fieldset" error={!!errors[field.name]} sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <Typography variant="h6">{field.label}</Typography>
                              <Tooltip title={field.description}>
                                <IconButton size="small">
                                  <Info />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {field.description}
                            </Typography>
                            <RadioGroup 
                              {...controllerField} 
                              value={controllerField.value || field.options[0].value}
                            >
                              {field.options.map(opt => (
                                <Zoom in timeout={300} key={opt.value}>
                                  <FormControlLabel 
                                    value={opt.value} 
                                    control={<Radio />} 
                                    label={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {opt.icon}
                                        {opt.label}
                                      </Box>
                                    }
                                    sx={{ 
                                      mb: 1,
                                      '& .MuiFormControlLabel-label': {
                                        fontSize: '0.9rem'
                                      }
                                    }}
                                  />
                                </Zoom>
                              ))}
                            </RadioGroup>
                            {errors[field.name] && (
                              <Alert severity="error" sx={{ mt: 1 }}>
                                {errors[field.name]?.message}
                              </Alert>
                            )}
                          </FormControl>
                        )}
                      />
                    </Box>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </StepCard>
        );

      case 2:
        return (
          <StepCard elevation={2}>
            <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology />
              Mental Health Assessment
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Please rate how much you agree with each statement on a scale of 1 to 5.
            </Typography>
            
            {/* Mental Fatigue Slider */}
            {sliderFields.filter(f => f.stepIndex === 2).map(field => (
              <Box key={field.name} sx={{ mb: 4 }}>
                <Controller
                  name={field.name}
                  control={control}
                  render={({ field: controllerField }) => (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        {field.icon}
                        <Typography variant="h6">{field.label}</Typography>
                        <Tooltip title={field.description}>
                          <IconButton size="small">
                            <Info />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {field.description}
                      </Typography>
                      <CustomSlider
                        {...controllerField}
                        value={Number(controllerField.value) || field.min}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        marks={field.marks}
                        valueLabelDisplay="auto"
                        sx={{ mt: 2, mb: 3 }}
                      />
                      {errors[field.name] && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {errors[field.name]?.message}
                        </Alert>
                      )}
                    </Box>
                  )}
                />
              </Box>
            ))}

            <Grid container spacing={2}>
              {likertQuestions.map((question, index) => (
                <Grid item xs={12} key={`q${index + 1}`}>
                  <Fade in timeout={500 + index * 100}>
                    <AnimatedCard>
                      <CardContent sx={{ p: 3 }}>
                        <Controller
                          name={`q${index + 1}`}
                          control={control}
                          render={({ field }) => (
                            <Box>
                              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmojiEmotions />
                                {question}
                              </Typography>
                              <RadioGroup
                                {...field}
                                value={field.value || 3}
                                row
                                sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  '& .MuiFormControlLabel-root': {
                                    margin: 0,
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                  }
                                }}
                              >
                                {likertScale.map(scale => (
                                  <Tooltip key={scale.value} title={scale.label} arrow>
                                    <FormControlLabel
                                      value={scale.value}
                                      control={
                                        <Radio 
                                          sx={{ 
                                            color: scale.color,
                                            '&.Mui-checked': {
                                              color: scale.color,
                                            }
                                          }} 
                                        />
                                      }
                                      label={
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography variant="h5" sx={{ mb: 0.5 }}>
                                            {scale.emoji}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {scale.value}
                                          </Typography>
                                        </Box>
                                      }
                                    />
                                  </Tooltip>
                                ))}
                              </RadioGroup>
                              {errors[`q${index + 1}`] && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                  {errors[`q${index + 1}`]?.message}
                                </Alert>
                              )}
                            </Box>
                          )}
                        />
                      </CardContent>
                    </AnimatedCard>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </StepCard>
        );

      case 3:
        return (
          <StepCard elevation={2}>
            <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment />
              Review Your Responses
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Response Visualization
                </Typography>
                <Box sx={{ height: 300, width: '100%' }}>
                  <SimpleChartFallback
                    data={radarData.map(item => ({
                      name: item.subject,
                      value: item.value,
                      color: '#8884d8'
                    }))}
                    type="radar"
                    height={300}
                    title="Your Assessment Scores"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Summary
                </Typography>
                <Stack spacing={2}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      Survey completion: <strong>{completionPercentage}%</strong>
                    </Typography>
                  </Alert>
                  {Object.entries(values).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${value}`}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </StepCard>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
          Employee Burnout Assessment
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          A comprehensive evaluation to understand your workplace well-being
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={completionPercentage} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            mb: 2,
            backgroundColor: (theme) => theme.palette.action.hover,
            '& .MuiLinearProgress-bar': {
              background: (theme) => theme.palette.mode === 'dark'
                ? `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`
                : 'linear-gradient(90deg, #4caf50 0%, #2196f3 50%, #9c27b0 100%)',
            }
          }} 
        />
        <Typography variant="body2" color="text.secondary">
          {completionPercentage}% Complete
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper 
        activeStep={activeStep} 
        alternativeLabel 
        sx={{ mb: 4 }}
      >
        {steps.map((step, index) => (
          <Step 
            key={step.label} 
            completed={completedSteps.has(index)}
            sx={{ cursor: 'pointer' }}
            onClick={() => handleStepClick(index)}
          >
            <StepLabel 
              icon={
                completedSteps.has(index) ? (
                  <CheckCircle />
                ) : (
                  step.icon
                )
              }
            >
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {step.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {step.description}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Content */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Collapse in={true} timeout={500}>
          {renderStepContent(activeStep)}
        </Collapse>

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={<ArrowBack />}
            variant="outlined"
            size="large"
          >
            Back
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Show helpful tips">
              <IconButton onClick={() => setShowTips(!showTips)}>
                <Lightbulb />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Reset form">
              <IconButton onClick={() => window.location.reload()}>
                <RestartAlt />
              </IconButton>
            </Tooltip>
          </Box>

          {activeStep === steps.length - 1 ? (
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !isValid}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
              sx={{
                background: (theme) => theme.palette.mode === 'dark'
                  ? `linear-gradient(45deg, ${theme.palette.success.dark} 30%, ${theme.palette.success.main} 90%)`
                  : 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                '&:hover': {
                  background: (theme) => theme.palette.mode === 'dark'
                    ? `linear-gradient(45deg, ${theme.palette.success.dark} 30%, ${theme.palette.success.light} 90%)`
                    : 'linear-gradient(45deg, #388e3c 30%, #689f38 90%)',
                }
              }}
            >
              {loading ? 'Analyzing...' : 'Submit Assessment'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              disabled={!isStepValid(activeStep)}
            >
              Next
            </Button>
          )}
        </Box>
      </form>

      {/* Tips Panel */}
      <Collapse in={showTips}>
        <Alert 
          severity="info" 
          sx={{ mt: 3 }}
          onClose={() => setShowTips(false)}
        >
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Tips for accurate assessment:</strong>
            </Typography>
            <Box component="ul" sx={{ mt: 0, mb: 0, pl: 2 }}>
              <Typography component="li" variant="body2">Answer honestly based on your recent experiences</Typography>
              <Typography component="li" variant="body2">Consider your feelings over the past few weeks</Typography>
              <Typography component="li" variant="body2">Take your time - there's no rush</Typography>
              <Typography component="li" variant="body2">All responses are confidential</Typography>
            </Box>
          </Box>
        </Alert>
      </Collapse>
    </Box>
  );
}; 