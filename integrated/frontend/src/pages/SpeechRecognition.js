import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid
} from '@mui/material';
import { Mic as MicIcon } from '@mui/icons-material';

const SpeechRecognition = () => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Speech Recognition
        </Typography>
        <Typography variant="body1" paragraph>
          Convert speech to text with high accuracy using our advanced AI model.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<MicIcon />}
                sx={{ mb: 2 }}
              >
                Start Recording
              </Button>
              <Typography variant="body2" color="text.secondary">
                Click to start recording your speech
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, minHeight: 200 }}>
              <Typography variant="h6" gutterBottom>
                Transcription
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Your transcribed text will appear here...
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default SpeechRecognition; 