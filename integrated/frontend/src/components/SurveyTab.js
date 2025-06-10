import React, { useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress, Paper, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Slider, Stack, Grid, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Send, Replay } from '@mui/icons-material';
import VideoTab from './VideoTab';

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
  const [resultOpen, setResultOpen] = useState(false);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
      setResultOpen(true);
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

  const handleCloseResult = () => {
    setResultOpen(false);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
        Stress Analysis Survey
      </Typography>
      
      <Grid container spacing={3}>
        {/* Video Analysis Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%', bgcolor: 'background.paper', borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
              Facial Emotion Analysis
            </Typography>
            <Box sx={{ height: 'calc(100% - 48px)', display: 'flex', flexDirection: 'column' }}>
              <VideoTab />
            </Box>
          </Paper>
        </Grid>

        {/* Survey Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%', bgcolor: 'background.paper', borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Survey Questions</Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>Please answer the following questions:</Typography>
            
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl sx={{ mb: 2 }}>
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

              <FormControl sx={{ mb: 2 }}>
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

              <FormControl sx={{ mb: 2 }}>
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

              <FormControl sx={{ mb: 2 }}>
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

              <FormControl sx={{ mb: 2 }}>
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

              <FormControl sx={{ mb: 2 }}>
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

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
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
          </Paper>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 3, maxWidth: 500, mx: 'auto' }}>{error}</Alert>
      )}

      <Dialog open={resultOpen && !!result} onClose={handleCloseResult} maxWidth="xs" fullWidth>
        <DialogTitle>Burnout Analysis Results</DialogTitle>
        <DialogContent>
          {result && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Burn Rate</Typography>
                <Typography variant="h4" color={result.burn_rate < 0.3 ? 'success.main' : result.burn_rate < 0.5 ? 'warning.main' : 'error.main'} sx={{ fontFamily: 'Roboto, sans-serif', fontWeight: 'bold' }}>
                  {(result.burn_rate * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Stress Level</Typography>
                <Typography variant="h5" color={result.stress_level === 'Low Stress' ? 'success.main' : result.stress_level === 'Medium Stress' ? 'warning.main' : 'error.main'} sx={{ fontFamily: 'Roboto, sans-serif', fontWeight: 'bold' }}>
                  {result.stress_level}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Model Used</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'Roboto, sans-serif' }}>{result.model_used}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Prediction Time</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'Roboto, sans-serif' }}>{new Date(result.prediction_time).toLocaleString()}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResult} color="primary" variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SurveyTab; 