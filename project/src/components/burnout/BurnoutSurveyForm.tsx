import React from 'react';
import { Box, Button, Typography, Grid, Paper, CircularProgress, Slider, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';
import { Controller } from 'react-hook-form';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface BurnoutSurveyFormProps {
  formMethods: any;
  loading: boolean;
  onSubmit: (data: any) => void;
}

const sliderFields = [
  { name: 'designation', label: 'Designation', min: 1, max: 5, step: 1 },
  { name: 'resourceAllocation', label: 'Resource Allocation', min: 1, max: 10, step: 1 },
  { name: 'mentalFatigueScore', label: 'Mental Fatigue Score', min: 1, max: 10, step: 1 },
];

const radioFields = [
  { name: 'companyType', label: 'Company Type', options: ['Service', 'Product'] },
  { name: 'wfhSetupAvailable', label: 'WFH Setup Available', options: ['Yes', 'No'] },
  { name: 'gender', label: 'Gender', options: ['Male', 'Female'] },
];

export const BurnoutSurveyForm: React.FC<BurnoutSurveyFormProps> = ({ formMethods, loading, onSubmit }) => {
  const { control, handleSubmit, watch, formState } = formMethods;
  const { errors } = formState;
  const values = watch();

  // Prepare data for radar chart
  const radarData = sliderFields.map(f => ({
    subject: f.label,
    value: Number(values[f.name]) || f.min,
    fullMark: f.max,
  }));

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 900, mx: 'auto', mt: 4 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={4}>
          {/* Radar Chart */}
          <Grid item xs={12} md={5}>
            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} />
                  <Radar name="Score" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          {/* Form Fields */}
          <Grid item xs={12} md={7}>
            <Typography variant="h5" sx={{ mb: 2, textAlign: 'center' }}>
              Predict Burnout
            </Typography>
            <Grid container spacing={2}>
              {/* Sliders */}
              {sliderFields.map(f => (
                <Grid item xs={12} key={f.name}>
                  <Controller
                    name={f.name}
                    control={control}
                    render={({ field }) => (
                      <Box>
                        <FormLabel>{f.label}</FormLabel>
                        <Slider
                          {...field}
                          value={Number(field.value) || f.min}
                          min={f.min}
                          max={f.max}
                          step={f.step}
                          marks
                          valueLabelDisplay="auto"
                          sx={{ mt: 2, mb: 1 }}
                        />
                        {errors[f.name] && (
                          <Typography color="error" variant="caption">{errors[f.name]?.message}</Typography>
                        )}
                      </Box>
                    )}
                  />
                </Grid>
              ))}
              {/* Radio Groups */}
              {radioFields.map(f => (
                <Grid item xs={12} sm={6} key={f.name}>
                  <Controller
                    name={f.name}
                    control={control}
                    render={({ field }) => (
                      <FormControl component="fieldset" error={!!errors[f.name]} sx={{ width: '100%' }}>
                        <FormLabel component="legend">{f.label}</FormLabel>
                        <RadioGroup row {...field} value={field.value || f.options[0]}>
                          {f.options.map(opt => (
                            <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />
                          ))}
                        </RadioGroup>
                        {errors[f.name] && (
                          <Typography color="error" variant="caption">{errors[f.name]?.message}</Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                fullWidth
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : 'Predict Burnout'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}; 