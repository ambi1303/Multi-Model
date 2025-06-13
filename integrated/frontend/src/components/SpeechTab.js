import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper, Button, LinearProgress, Chip } from '@mui/material';
import { Mic, Stop, UploadFile, CloudUpload, GraphicEq, VolumeUp } from '@mui/icons-material';

function pad(num) {
  return num.toString().padStart(2, '0');
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

function SpeechTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [inputMode, setInputMode] = useState('mic'); // 'mic' or 'upload'
  const [timer, setTimer] = useState(0);
  const timerInterval = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerInterval.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    };
  }, [isRecording]);

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
      setTimer(0);
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
    setAudioBlob(null);
  };

  // Reset all
  const handleReset = () => {
    setIsRecording(false);
    setAudioBlob(null);
    setResult(null);
    setError(null);
    setSelectedFile(null);
    setTimer(0);
  };

  // Submit audio for analysis
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const formData = new FormData();
      if (inputMode === 'mic' && audioBlob) {
        formData.append('audio_file', audioBlob, 'recording.webm');
      } else if (inputMode === 'upload' && selectedFile) {
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
    if (audioBlob && !isRecording && !loading && inputMode === 'mic') {
      // Don't auto-analyze, require user to click Analyze
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob, isRecording, inputMode]);

  // UI rendering
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff', py: 6 }}>
      <Typography variant="h3" align="center" sx={{ fontWeight: 700, mb: 1 }}>
        Voice Analysis Tool
      </Typography>
      <Typography align="center" sx={{ color: 'grey.700', mb: 4 }}>
        Record your voice or upload an audio file to get detailed analysis
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Paper elevation={1} sx={{ maxWidth: 700, width: '100%', borderRadius: 3, p: { xs: 2, md: 4 }, mx: 2 }}>
          {/* Audio Input Section */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <VolumeUp sx={{ mr: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Audio Input
              </Typography>
            </Box>
            <Typography sx={{ color: 'grey.600', mb: 2 }}>
              Choose your preferred method to provide audio for analysis
            </Typography>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <Button
                variant={inputMode === 'mic' ? 'contained' : 'outlined'}
                startIcon={<Mic />}
                onClick={() => setInputMode('mic')}
                sx={{ borderRadius: '8px 0 0 8px', flex: 1, fontWeight: 600 }}
              >
                Microphone
              </Button>
              <Button
                variant={inputMode === 'upload' ? 'contained' : 'outlined'}
                startIcon={<UploadFile />}
                onClick={() => setInputMode('upload')}
                sx={{ borderRadius: '0 8px 8px 0', flex: 1, fontWeight: 600 }}
              >
                Upload File
              </Button>
            </Box>
            {/* Main interaction area */}
            <Box sx={{ border: '2px dashed #e0e0e0', borderRadius: 2, minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mb: 2, p: 2 }}>
              {inputMode === 'mic' ? (
                <>
                  <Typography variant="h4" sx={{ fontFamily: 'monospace', mb: 1 }}>{formatTime(timer)}</Typography>
                  {isRecording ? (
                    <>
                      <Typography sx={{ color: 'error.main', mb: 1 }}><span style={{ fontSize: 18, verticalAlign: 'middle' }}>●</span> Recording...</Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="outlined" color="inherit" onClick={stopRecording} sx={{ minWidth: 56, fontWeight: 600 }} startIcon={<Stop />}>Stop</Button>
                      </Box>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={startRecording}
                      startIcon={<Mic />}
                      sx={{ minWidth: 180, fontWeight: 600, fontSize: 18 }}
                      disabled={loading}
                    >
                      Start Recording
                    </Button>
                  )}
                  {audioBlob && !isRecording && (
                    <Typography sx={{ color: 'success.main', mt: 2 }}>
                      <CloudUpload sx={{ verticalAlign: 'middle', mr: 1 }} /> Recording saved ({formatTime(timer)})
                    </Typography>
                  )}
                </>
              ) : (
                <Box sx={{ width: '100%', textAlign: 'center' }}>
                  <CloudUpload sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Upload Audio File
                  </Typography>
                  <Typography sx={{ color: 'grey.600', mb: 2 }}>
                    Supports MP3, WAV, M4A files up to 10MB
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadFile />}
                    sx={{ fontWeight: 600 }}
                  >
                    Choose File
                    <input type="file" accept="audio/*" hidden onChange={handleFileChange} />
                  </Button>
                  {selectedFile && (
                    <Typography sx={{ mt: 2, color: 'success.main' }}>{selectedFile.name}</Typography>
                  )}
                </Box>
              )}
            </Box>
            {/* Analyze/Reset Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<GraphicEq />}
                sx={{ fontWeight: 700, fontSize: 18, minWidth: 180 }}
                onClick={handleSubmit}
                disabled={loading || (inputMode === 'mic' ? !audioBlob : !selectedFile)}
              >
                Analyze Voice
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ fontWeight: 700, fontSize: 18, minWidth: 120 }}
                onClick={handleReset}
                disabled={loading}
              >
                Reset
              </Button>
            </Box>
            {/* Loading State */}
            {loading && (
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}><CircularProgress size={20} sx={{ mr: 1 }} /> Analyzing your voice...</Typography>
                <LinearProgress sx={{ height: 10, borderRadius: 2, mb: 1 }} />
                <Typography sx={{ color: 'grey.600' }}>Processing audio patterns, tone, and emotional indicators...</Typography>
              </Box>
            )}
            {/* Error State */}
            {error && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography color="error" sx={{ fontWeight: 600 }}>{error}</Typography>
              </Box>
            )}
            {/* Results Section */}
            {result && !loading && (
              <Box sx={{ mt: 6 }}>
                <Typography variant="h4" align="center" sx={{ fontWeight: 700, mb: 4 }}>
                  Analysis Results
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', mb: 3 }}>
                  {/* Transcribed Text Card */}
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 3, minWidth: 260, flex: 1, maxWidth: 340, border: '1px solid #eee', transition: 'transform 0.15s, box-shadow 0.15s', '&:hover': { boxShadow: 6, transform: 'scale(1.03)' } }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Transcribed Text</Typography>
                    <Typography sx={{ fontWeight: 500, fontSize: 18 }}>{result.text || 'No text detected.'}</Typography>
                  </Paper>
                  {/* Sentiment Card */}
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 3, minWidth: 260, flex: 1, maxWidth: 340, border: '1px solid #eee', transition: 'transform 0.15s, box-shadow 0.15s', '&:hover': { boxShadow: 6, transform: 'scale(1.03)' } }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Sentiment</Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 20, mb: 1 }}>{result.sentiment || 'N/A'}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <LinearProgress variant="determinate" value={result.sentiment_score ? result.sentiment_score * 100 : 0} sx={{ flex: 1, height: 8, borderRadius: 2 }} />
                      <Chip label={`${result.sentiment_score ? (result.sentiment_score * 100).toFixed(2) : '0.00'}%`} size="small" sx={{ ml: 1, fontWeight: 700 }} />
                    </Box>
                  </Paper>
                  {/* Clarity Score Card (using emotion_score) */}
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 3, minWidth: 260, flex: 1, maxWidth: 340, border: '1px solid #eee', transition: 'transform 0.15s, box-shadow 0.15s', '&:hover': { boxShadow: 6, transform: 'scale(1.03)' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <GraphicEq sx={{ mr: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Clarity Score</Typography>
                    </Box>
                    <Typography><b>Speech Clarity</b></Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <LinearProgress variant="determinate" value={result.emotion_score ? result.emotion_score * 100 : 0} sx={{ flex: 1, height: 8, borderRadius: 2 }} />
                      <Chip label={`${result.emotion_score ? (result.emotion_score * 100).toFixed(2) : '0.00'}%`} size="small" sx={{ ml: 1, fontWeight: 700 }} />
                    </Box>
                  </Paper>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default SpeechTab; 