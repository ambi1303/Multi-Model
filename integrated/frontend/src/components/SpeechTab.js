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
          <div className="result-console" style={{
            background: '#181818',
            color: '#fff',
            borderRadius: 8,
            padding: 24,
            fontFamily: 'monospace',
            fontSize: '1.1em',
            marginTop: 24,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
          }}>
            <div>
              <span role="img" aria-label="mic">🎤</span> <b>Transcribed Text:</b> {result.text || 'N/A'}
            </div>
            <div style={{ marginTop: 12 }}>
              <span role="img" aria-label="brain">🧠</span> <b>Sentiment:</b> {result.sentiment || 'N/A'} <span style={{ color: '#aaa' }}>(Confidence: {typeof result.sentiment_score === 'number' ? result.sentiment_score.toFixed(2) : '0.00'})</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <span role="img" aria-label="bubble">💬</span> <b>Emotion:</b> {result.emotion || 'N/A'} <span style={{ color: '#aaa' }}>(Confidence: {typeof result.emotion_score === 'number' ? result.emotion_score.toFixed(2) : '0.00'})</span>
            </div>
          </div>
        )}
      </Box>
    </Box>
  );
}

export default SpeechTab; 