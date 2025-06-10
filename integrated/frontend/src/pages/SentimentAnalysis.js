import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  Card,
  CardContent
} from '@mui/material';
import { Psychology as SentimentIcon } from '@mui/icons-material';

const SentimentAnalysis = () => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sentiment Analysis
        </Typography>
        <Typography variant="body1" paragraph>
          Analyze the sentiment and emotional context of your text using our advanced AI model.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                label="Enter your text"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SentimentIcon />}
                fullWidth
              >
                Analyze Sentiment
              </Button>
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
                    <Typography variant="subtitle1">Overall Sentiment:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Not analyzed yet
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">Confidence Score:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Key Emotions:</Typography>
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

export default SentimentAnalysis; 