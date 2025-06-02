import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { AnalysisResponse } from '../types';
import { getLatestResults, getMentalStatesVisualization, getSentimentTrendVisualization } from '../services/api';

const History = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResponse | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await getLatestResults();
        setResults(data);
      } catch (err) {
        setError('Failed to fetch analysis history. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Analysis History
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {results ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Latest Analysis Results
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Total Messages Analyzed: {results.analyzed_messages.length}
                </Typography>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Summary
                </Typography>
                <pre style={{ overflow: 'auto' }}>
                  {JSON.stringify(results.summary, null, 2)}
                </pre>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Visualizations
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Mental States Distribution
                      </Typography>
                      <img
                        src={getMentalStatesVisualization()}
                        alt="Mental States"
                        style={{ width: '100%', height: 'auto' }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Sentiment Trend
                      </Typography>
                      <img
                        src={getSentimentTrendVisualization()}
                        alt="Sentiment Trend"
                        style={{ width: '100%', height: 'auto' }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Detailed Analysis
              </Typography>
              <Grid container spacing={2}>
                {results.analyzed_messages.map((message, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Message {index + 1}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {message.text}
                        </Typography>
                        <Typography variant="body2">
                          Sentiment Score: {message.sentiment_score.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          Primary Emotion: {message.primary_emotion}
                        </Typography>
                        <Typography variant="body2">
                          Emotion Score: {message.emotion_score.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          Mental State: {message.mental_state}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info">
            No analysis history available. Try analyzing some messages first!
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default History; 