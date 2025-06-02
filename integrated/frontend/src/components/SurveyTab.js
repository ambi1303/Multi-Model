import React, { useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress, Paper, TextField, Slider, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { Send, Replay } from '@mui/icons-material';

function SurveyTab() {
  const [formData, setFormData] = useState({
    designation: 1,
    resourceAllocation: 5,
    mentalFatigueScore: 5,
    companyType: 'Service',
    wfhSetupAvailable: 'Yes',
    gender: 'Male'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('http://localhost:9000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Designation: formData.designation,
          Resource_Allocation: formData.resourceAllocation,
          Mental_Fatigue_Score: formData.mentalFatigueScore,
          Company_Type: formData.companyType,
          WFH_Setup_Available: formData.wfhSetupAvailable,
          Gender: formData.gender
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error analyzing survey');
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      designation: 1,
      resourceAllocation: 5,
      mentalFatigueScore: 5,
      companyType: 'Service',
      wfhSetupAvailable: 'Yes',
      gender: 'Male'
    });
    setResult(null);
    setError(null);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Employee Burnout Survey</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <FormControl>
          <FormLabel>Designation Level (1-5)</FormLabel>
          <Slider
            value={formData.designation}
            onChange={(_, value) => setFormData(prev => ({ ...prev, designation: value }))}
            min={1}
            max={5}
            step={1}
            marks
            valueLabelDisplay="auto"
            disabled={loading}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Resource Allocation (1-10)</FormLabel>
          <Slider
            value={formData.resourceAllocation}
            onChange={(_, value) => setFormData(prev => ({ ...prev, resourceAllocation: value }))}
            min={1}
            max={10}
            step={1}
            marks
            valueLabelDisplay="auto"
            disabled={loading}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Mental Fatigue Score (1-10)</FormLabel>
          <Slider
            value={formData.mentalFatigueScore}
            onChange={(_, value) => setFormData(prev => ({ ...prev, mentalFatigueScore: value }))}
            min={1}
            max={10}
            step={1}
            marks
            valueLabelDisplay="auto"
            disabled={loading}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Company Type</FormLabel>
          <RadioGroup
            value={formData.companyType}
            onChange={(e) => setFormData(prev => ({ ...prev, companyType: e.target.value }))}
            row
          >
            <FormControlLabel value="Service" control={<Radio />} label="Service" disabled={loading} />
            <FormControlLabel value="Product" control={<Radio />} label="Product" disabled={loading} />
          </RadioGroup>
        </FormControl>

        <FormControl>
          <FormLabel>WFH Setup Available</FormLabel>
          <RadioGroup
            value={formData.wfhSetupAvailable}
            onChange={(e) => setFormData(prev => ({ ...prev, wfhSetupAvailable: e.target.value }))}
            row
          >
            <FormControlLabel value="Yes" control={<Radio />} label="Yes" disabled={loading} />
            <FormControlLabel value="No" control={<Radio />} label="No" disabled={loading} />
          </RadioGroup>
        </FormControl>

        <FormControl>
          <FormLabel>Gender</FormLabel>
          <RadioGroup
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            row
          >
            <FormControlLabel value="Male" control={<Radio />} label="Male" disabled={loading} />
            <FormControlLabel value="Female" control={<Radio />} label="Female" disabled={loading} />
          </RadioGroup>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
          >
            {loading ? 'Analyzing...' : 'Submit Survey'}
          </Button>
          {result && (
            <Button
              variant="outlined"
              onClick={handleReset}
              startIcon={<Replay />}
            >
              Reset
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 3, width: '100%', maxWidth: 500, mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        {result && (
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', border: '2px solid', borderColor: 'primary.main', borderRadius: 2 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>Burnout Analysis Results</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Burn Rate</Typography>
                <Typography variant="h4" color={result.burn_rate < 0.3 ? 'success.main' : result.burn_rate < 0.5 ? 'warning.main' : 'error.main'}>
                  {(result.burn_rate * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Stress Level</Typography>
                <Typography variant="h5" color={result.stress_level === 'Low Stress' ? 'success.main' : result.stress_level === 'Medium Stress' ? 'warning.main' : 'error.main'}>
                  {result.stress_level}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Model Used</Typography>
                <Typography variant="body1">{result.model_used}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Prediction Time</Typography>
                <Typography variant="body2">{new Date(result.prediction_time).toLocaleString()}</Typography>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default SurveyTab; 