import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, Alert, CircularProgress, Paper } from '@mui/material';
import { PhotoCamera, UploadFile, Replay } from '@mui/icons-material';
import Webcam from 'react-webcam';

function VideoTab() {
  const webcamRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useWebcam, setUseWebcam] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionCounts, setEmotionCounts] = useState({});
  const [timeLeft, setTimeLeft] = useState(10);
  const [showReport, setShowReport] = useState(false);
  const [webcamAvailable, setWebcamAvailable] = useState(true);

  // Start 10-second analysis
  const startAnalysis = () => {
    setIsAnalyzing(true);
    setShowReport(false);
    setEmotionCounts({});
    setTimeLeft(10);
    setResult(null);
    setError(null);
  };

  // Add webcam error handling
  const handleUserMediaError = (err) => {
    setWebcamAvailable(false);
    setError('Webcam not available or permission denied.');
  };

  // Capture and send frame
  const captureAndSend = async () => {
    if (!webcamRef.current || !webcamAvailable) return;
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

  // Interval for capturing frames
  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(() => {
        captureAndSend();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Timer for 10 seconds
  useEffect(() => {
    let timer;
    if (isAnalyzing && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isAnalyzing && timeLeft === 0) {
      setIsAnalyzing(false);
      setShowReport(true);
    }
    return () => clearInterval(timer);
  }, [isAnalyzing, timeLeft]);

  // Get most frequent emotion
  const getMostFrequentEmotion = () => {
    if (Object.keys(emotionCounts).length === 0) return 'No emotions detected';
    return Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)[0][0];
  };

  // File upload fallback (single frame)
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setResult(null);
    setError(null);
    setUseWebcam(false);
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch('http://localhost:9000/analyze-video', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
      if (!response.ok) {
        setError(data.error || 'Error analyzing image');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Video Emotion Recognition</Typography>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button
          variant={useWebcam ? 'contained' : 'outlined'}
          startIcon={<PhotoCamera />}
          onClick={() => setUseWebcam(true)}
        >
          Use Webcam
        </Button>
        <Button
          variant={!useWebcam ? 'contained' : 'outlined'}
          startIcon={<UploadFile />}
          onClick={() => setUseWebcam(false)}
        >
          Upload Image
        </Button>
      </Box>
      {useWebcam ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {webcamAvailable ? (
            (() => {
              try {
                return (
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width={320}
                    height={240}
                    style={{ borderRadius: '10px', marginBottom: '1rem' }}
                    onUserMediaError={handleUserMediaError}
                  />
                );
              } catch (err) {
                return <Alert severity="error" sx={{ mb: 2 }}>Webcam component failed to render: {err.message}</Alert>;
              }
            })()
          ) : (
            <Alert severity="error" sx={{ mb: 2 }}>Webcam not available or permission denied.</Alert>
          )}
          {!isAnalyzing && !showReport && webcamAvailable && (
            <Button
              variant="contained"
              color="primary"
              onClick={startAnalysis}
              disabled={loading}
              startIcon={<Replay />}
              sx={{ mt: 2 }}
            >
              Start 10s Analysis
            </Button>
          )}
          {isAnalyzing && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={24} color="primary" />
              <Typography color="primary" fontWeight="bold">
                Analyzing... Time left: {timeLeft}s
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box component="form" onSubmit={handleFileSubmit} sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFile />}
          >
            Choose Image
            <input type="file" accept="image/*" hidden onChange={handleFileChange} />
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!selectedFile || loading}
            startIcon={<Replay />}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Analyze'}
          </Button>
          {selectedFile && (
            <Typography variant="body2" sx={{ ml: 1 }}>{selectedFile.name}</Typography>
          )}
        </Box>
      )}
      <Box sx={{ mt: 3, width: '100%', maxWidth: 500, mx: 'auto' }}>
        {typeof error === 'object' ? JSON.stringify(error) : error && (
          <Alert severity="error" sx={{ mb: 2 }}>{typeof error === 'object' ? JSON.stringify(error) : error}</Alert>
        )}
        {showReport && (
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', border: '2px solid', borderColor: 'primary.main', borderRadius: 2 }}>
            <Typography variant="h4" color="primary" sx={{ mb: 1 }}>{getMostFrequentEmotion().toUpperCase()}</Typography>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Most Frequent Emotion</Typography>
            <Typography variant="subtitle2">Emotion Breakdown:</Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, mt: 1, mb: 2 }}>
              {Object.entries(emotionCounts).map(([emotion, count]) => (
                <li key={emotion}><b>{emotion}:</b> {count} times</li>
              ))}
            </Box>
            <Button variant="outlined" onClick={startAnalysis} startIcon={<Replay />}>Analyze Again</Button>
          </Paper>
        )}
        {!useWebcam && result && (
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', border: '2px solid', borderColor: 'primary.main', borderRadius: 2 }}>
            {result.emotion ? (
              <>
                <Typography variant="h4" color="primary">{result.emotion.toUpperCase()}</Typography>
                <Typography variant="subtitle1" sx={{ mt: 1 }}>Detected Emotion</Typography>
              </>
            ) : (
              <>
                <Typography color="warning.main">No emotion detected or unexpected response.</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Raw JSON:</Typography>
                <Box component="pre" sx={{ background: '#eee', color: '#333', p: 2, borderRadius: 1, textAlign: 'left', fontSize: '0.95em', mt: 1 }}>{typeof result === 'object' ? JSON.stringify(result) : result}</Box>
              </>
            )}
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default VideoTab; 