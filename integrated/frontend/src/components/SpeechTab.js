import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, Alert, CircularProgress, Paper } from '@mui/material';
import { Mic, Stop, UploadFile, Replay } from '@mui/icons-material';

function SpeechTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [useMicrophone, setUseMicrophone] = useState(true);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Initialize media recorder
  useEffect(() => {
    if (typeof window !== 'undefined') {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunksRef.current.push(e.data);
            }
          };
          mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
            setAudioBlob(audioBlob);
            chunksRef.current = [];
          };
        })
        .catch(err => {
          setError('Microphone access denied or not available');
          setUseMicrophone(false);
        });
    }
  }, []);

  // Start recording
  const startRecording = () => {
    if (mediaRecorderRef.current) {
      chunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setResult(null);
      setError(null);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setResult(null);
    setError(null);
    setUseMicrophone(false);
  };

  // Submit audio for analysis
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      if (useMicrophone && audioBlob) {
        formData.append('audio_file', audioBlob, 'recording.webm');
      } else if (selectedFile) {
        formData.append('audio_file', selectedFile);
      } else {
        throw new Error('No audio file selected');
      }

      const response = await fetch('http://localhost:9000/analyze-speech', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error analyzing speech');
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-analyze after recording is stopped
  useEffect(() => {
    if (audioBlob && !isRecording && !loading && useMicrophone) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob, isRecording, useMicrophone]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Speech Analysis</Typography>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button
          variant={useMicrophone ? 'contained' : 'outlined'}
          startIcon={<Mic />}
          onClick={() => setUseMicrophone(true)}
          disabled={!mediaRecorderRef.current}
        >
          Use Microphone
        </Button>
        <Button
          variant={!useMicrophone ? 'contained' : 'outlined'}
          startIcon={<UploadFile />}
          onClick={() => setUseMicrophone(false)}
        >
          Upload Audio
        </Button>
      </Box>

      {useMicrophone ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color={isRecording ? 'error' : 'primary'}
              onClick={isRecording ? stopRecording : startRecording}
              startIcon={isRecording ? <Stop /> : <Mic />}
              disabled={loading}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            {audioBlob && !isRecording && (
              <Button
                variant="outlined"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={<Replay />}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Analyze'}
              </Button>
            )}
          </Box>
          {isRecording && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Recording in progress...
            </Alert>
          )}
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFile />}
          >
            Choose Audio File
            <input type="file" accept="audio/*" hidden onChange={handleFileChange} />
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        {result && (
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', border: '2px solid', borderColor: 'primary.main', borderRadius: 2 }}>
            {result.text ? (
              <>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>Transcribed Text</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{result.text}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Sentiment</Typography>
                    <Typography variant="h6" color={result.sentiment === 'POSITIVE' ? 'success.main' : result.sentiment === 'NEGATIVE' ? 'error.main' : 'warning.main'}>
                      {result.sentiment}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Confidence</Typography>
                    <Typography variant="h6" color="primary">
                      {(result.confidence * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <>
                <Typography color="warning.main">No text detected or unexpected response.</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Raw JSON:</Typography>
                <Box component="pre" sx={{ background: '#eee', color: '#333', p: 2, borderRadius: 1, textAlign: 'left', fontSize: '0.95em', mt: 1 }}>
                  {JSON.stringify(result, null, 2)}
                </Box>
              </>
            )}
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default SpeechTab; 