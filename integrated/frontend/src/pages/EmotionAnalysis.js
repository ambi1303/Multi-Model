import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { SentimentSatisfied as EmotionIcon } from '@mui/icons-material';

const EmotionAnalysis = () => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Emotion Analysis
        </Typography>
        <Typography variant="body1" paragraph>
          Analyze emotions from facial expressions and voice patterns using our advanced AI model.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<EmotionIcon />}
                sx={{ mb: 2 }}
              >
                Start Analysis
              </Button>
              <Typography variant="body2" color="text.secondary">
                Upload an image or video to analyze emotions
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Analysis Results
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">Primary Emotion:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Not analyzed yet
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">Confidence:</Typography>
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

export default EmotionAnalysis; 