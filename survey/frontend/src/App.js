import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { predictBurnout } from './services/api';

function App() {
  const [formData, setFormData] = useState({
    Designation: '',
    'Resource Allocation': '',
    'Mental Fatigue Score': '',
    'Company Type': '',
    'WFH Setup Available': '',
    Gender: '',
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await predictBurnout(formData);
      setPrediction(result);
    } catch (err) {
      setError(err.message || 'An error occurred while making the prediction');
    } finally {
      setLoading(false);
    }
  };

  const formatPredictionTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      // Handle both ISO string and Unix timestamp
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(date);
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Employee Burnout Prediction
        </Typography>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Predict Burnout
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Designation (1-5)"
                  name="Designation"
                  type="number"
                  value={formData.Designation}
                  onChange={handleInputChange}
                  inputProps={{ min: 1, max: 5, step: 0.1 }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Resource Allocation (1-10)"
                  name="Resource Allocation"
                  type="number"
                  value={formData['Resource Allocation']}
                  onChange={handleInputChange}
                  inputProps={{ min: 1, max: 10, step: 0.1 }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mental Fatigue Score (1-10)"
                  name="Mental Fatigue Score"
                  type="number"
                  value={formData['Mental Fatigue Score']}
                  onChange={handleInputChange}
                  inputProps={{ min: 1, max: 10, step: 0.1 }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Company Type"
                  name="Company Type"
                  value={formData['Company Type']}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="Service">Service</MenuItem>
                  <MenuItem value="Product">Product</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="WFH Setup Available"
                  name="WFH Setup Available"
                  value={formData['WFH Setup Available']}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Gender"
                  name="Gender"
                  value={formData.Gender}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Predict Burnout'}
              </Button>
            </Box>
          </form>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {prediction && (
          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h5" gutterBottom>
              Prediction Result
            </Typography>
            <Typography variant="h6" color="primary">
              Burn Rate: {(prediction.burn_rate * 100).toFixed(2)}%
            </Typography>
            <Typography variant="h6" color="secondary">
              Stress Level: {prediction.stress_level}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Model Used: {prediction.model_used}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Prediction Time: {formatPredictionTime(prediction.prediction_time)}
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

export default App; 