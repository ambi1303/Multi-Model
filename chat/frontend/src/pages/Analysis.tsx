import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { Message, MessageResponse, AnalysisResponse } from '../types';
import { analyzeSingleMessage, analyzeMultipleMessages, getMentalStatesVisualization, getSentimentTrendVisualization } from '../services/api';

const Analysis = () => {
  const [message, setMessage] = useState('');
  const [personId, setPersonId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MessageResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);

  const handleSingleAnalysis = async () => {
    if (!message.trim()) {
      setError('Please enter a message to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await analyzeSingleMessage({
        text: message,
        person_id: personId || undefined,
      });
      setResult(response);
    } catch (err) {
      setError('Failed to analyze message. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleAnalysis = async () => {
    if (!message.trim()) {
      setError('Please enter messages to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const messages = message.split('\n').filter(m => m.trim()).map(m => ({
        text: m,
        person_id: personId || undefined,
      }));

      const response = await analyzeMultipleMessages(messages);
      setAnalysisResult(response);
    } catch (err) {
      setError('Failed to analyze messages. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Message Analysis
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Input
              </Typography>
              <TextField
                fullWidth
                label="Person ID (optional)"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Message(s)"
                multiline
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                margin="normal"
                placeholder="Enter a single message or multiple messages (one per line)"
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSingleAnalysis}
                  disabled={loading}
                >
                  Analyze Single Message
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleMultipleAnalysis}
                  disabled={loading}
                >
                  Analyze Multiple Messages
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Results
              </Typography>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              )}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {result && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">Single Message Analysis</Typography>
                    <Typography>Text: {result.text}</Typography>
                    <Typography>Sentiment Score: {result.sentiment_score.toFixed(2)}</Typography>
                    <Typography>Primary Emotion: {result.primary_emotion}</Typography>
                    <Typography>Emotion Score: {result.emotion_score.toFixed(2)}</Typography>
                    <Typography>Mental State: {result.mental_state}</Typography>
                  </CardContent>
                </Card>
              )}
              {analysisResult && (
                <>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6">Multiple Messages Analysis</Typography>
                      <Typography>Total Messages: {analysisResult.analyzed_messages.length}</Typography>
                      <Typography>Summary:</Typography>
                      <pre>{JSON.stringify(analysisResult.summary, null, 2)}</pre>
                    </CardContent>
                  </Card>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>Visualizations</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <img
                          src={getMentalStatesVisualization()}
                          alt="Mental States"
                          style={{ width: '100%', height: 'auto' }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <img
                          src={getSentimentTrendVisualization()}
                          alt="Sentiment Trend"
                          style={{ width: '100%', height: 'auto' }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Analysis; 