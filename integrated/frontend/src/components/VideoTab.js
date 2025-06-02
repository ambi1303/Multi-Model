import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { PlayArrow, Stop, PhotoCamera } from '@mui/icons-material';
import Webcam from 'react-webcam';

function VideoTab() {
  const webcamRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [emotionCounts, setEmotionCounts] = useState({});
  const [webcamAvailable, setWebcamAvailable] = useState(true);

  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(() => {
        captureAndSend();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    let timer;
    if (isAnalyzing && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isAnalyzing && timeLeft === 0) {
      setIsAnalyzing(false);
      setResultOpen(true);
    }
    return () => clearInterval(timer);
  }, [isAnalyzing, timeLeft]);

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setEmotionCounts({});
    setTimeLeft(10);
    setResult(null);
    setError(null);
  };

  const captureAndSend = async () => {
    if (!webcamRef.current) return;
    let imageSrc;
    try {
      imageSrc = webcamRef.current.getScreenshot();
    } catch (e) {
      setError('Unable to capture webcam image.');
      return;
    }
    if (!imageSrc) return;
    try {
      const byteString = atob(imageSrc.split(',')[1]);
      const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const formData = new FormData();
      formData.append('file', blob, 'webcam.jpg');
      const response = await fetch('http://localhost:9000/analyze-video', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data && data.emotion) {
        setEmotionCounts(prev => ({
          ...prev,
          [data.emotion]: (prev[data.emotion] || 0) + 1
        }));
      }
    } catch (err) {
      setError('Error analyzing webcam image.');
    }
  };

  const getMostFrequentEmotion = () => {
    if (Object.keys(emotionCounts).length === 0) return 'No emotions detected';
    return Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)[0][0];
  };

  const handleCloseResult = () => {
    setResultOpen(false);
  };

  return (
    <Box>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 640, mx: 'auto', mb: 2 }}>
        {webcamAvailable ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={320}
            height={240}
            style={{ width: '100%', borderRadius: 8 }}
            onUserMediaError={() => setWebcamAvailable(false)}
          />
        ) : (
          <Alert severity="error">Webcam not available or permission denied.</Alert>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={startAnalysis}
          disabled={isAnalyzing || loading || !webcamAvailable}
          startIcon={isAnalyzing ? <Stop /> : <PlayArrow />}
        >
          {isAnalyzing ? `Analyzing... ${timeLeft}s` : 'Start 10s Analysis'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      <Dialog open={resultOpen && Object.keys(emotionCounts).length > 0} onClose={handleCloseResult} maxWidth="xs" fullWidth>
        <DialogTitle>Facial Emotion Analysis Results</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Dominant Emotion</Typography>
              <Typography variant="h5">{getMostFrequentEmotion()}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Emotion Breakdown</Typography>
              {Object.entries(emotionCounts).map(([emotion, count]) => (
                <Typography key={emotion} variant="body2">
                  {emotion}: {count} times
                </Typography>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResult} color="primary" variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default VideoTab; 