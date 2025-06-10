import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { Assessment as SurveyIcon } from '@mui/icons-material';

const Survey = () => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Survey Analysis
        </Typography>
        <Typography variant="body1" paragraph>
          Create and analyze surveys with our advanced AI-powered platform.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 3 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <FormLabel>How satisfied are you with our service?</FormLabel>
                <RadioGroup>
                  <FormControlLabel value="very-satisfied" control={<Radio />} label="Very Satisfied" />
                  <FormControlLabel value="satisfied" control={<Radio />} label="Satisfied" />
                  <FormControlLabel value="neutral" control={<Radio />} label="Neutral" />
                  <FormControlLabel value="dissatisfied" control={<Radio />} label="Dissatisfied" />
                  <FormControlLabel value="very-dissatisfied" control={<Radio />} label="Very Dissatisfied" />
                </RadioGroup>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                label="Additional Comments"
                sx={{ mb: 3 }}
              />

              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SurveyIcon />}
                fullWidth
              >
                Submit Survey
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Survey Results
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Overall Sentiment:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Not analyzed yet
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Key Insights:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Recommendations:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Survey; 