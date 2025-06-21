import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Mic,
  Stop,
  PlayArrow,
  Download,
  Refresh,
  VolumeUp,
} from '@mui/icons-material';
import { PieChart } from '@mui/x-charts/PieChart';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { speechApi } from '../services/speechApi';
import { SpeechAnalysisResult } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import { useAppStore } from '../store/useAppStore';

export const SpeechAnalysis: React.FC = () => {
  const [analysis, setAnalysis] = useState<SpeechAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const { addAnalysisResult } = useAppStore();
  
  const { isRecording, audioBlob, duration, error, start, stop, reset } = useAudioRecorder();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const analyzeAudio = async () => {
    if (!audioBlob) {
      showError('No audio recording available.');
      return;
    }

    setLoading(true);
    try {
      const result = await speechApi.analyzeAudio(audioBlob);
      setAnalysis(result);
      addAnalysisResult('speech', result);
      showSuccess('Audio analyzed successfully!');
    } catch (err) {
      showError('Failed to analyze audio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play().catch(() => {
        showError('Failed to play audio.');
      });
    }
  };

  const downloadAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Audio downloaded successfully!');
    }
  };

  const handleReset = () => {
    reset();
    setAnalysis(null);
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'success';
    if (score < -0.3) return 'error';
    return 'warning';
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return 'Positive';
    if (score < -0.3) return 'Negative';
    return 'Neutral';
  };

  const pieData = analysis?.emotions.slice(0, 5).map((emotion, index) => ({
    id: index,
    value: Math.round(emotion.confidence * 100),
    label: emotion.emotion,
  })) || [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
          Speech Emotion Analysis
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Record and analyze emotions from speech patterns and vocal characteristics
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Recording Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Audio Recording
              </Typography>
              
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    backgroundColor: isRecording ? 'error.light' : 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    animation: isRecording ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)', opacity: 1 },
                      '50%': { transform: 'scale(1.05)', opacity: 0.8 },
                      '100%': { transform: 'scale(1)', opacity: 1 },
                    },
                  }}
                >
                  <Mic
                    sx={{
                      fontSize: 48,
                      color: isRecording ? 'error.contrastText' : 'text.secondary',
                    }}
                  />
                </Box>
                
                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    mb: 2,
                    color: isRecording ? 'error.main' : 'text.primary',
                  }}
                >
                  {formatTime(duration)}
                </Typography>
                
                {isRecording && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'error.main',
                        animation: 'blink 1s infinite',
                        '@keyframes blink': {
                          '0%, 50%': { opacity: 1 },
                          '51%, 100%': { opacity: 0 },
                        },
                      }}
                    />
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
                      Recording...
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {!isRecording ? (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Mic />}
                    onClick={start}
                    fullWidth
                  >
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    startIcon={<Stop />}
                    onClick={stop}
                    fullWidth
                  >
                    Stop Recording
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleReset}
                  fullWidth
                >
                  Reset
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Audio Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Audio Analysis
              </Typography>
              
              {audioBlob ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Recording Ready
                    </Typography>
                    <Typography variant="body2">
                      Duration: {formatTime(duration)}
                    </Typography>
                  </Alert>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4}>
                      <Button
                        variant="outlined"
                        startIcon={<PlayArrow />}
                        onClick={playAudio}
                        fullWidth
                        size="small"
                      >
                        Play
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={downloadAudio}
                        fullWidth
                        size="small"
                      >
                        Save
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        variant="contained"
                        onClick={analyzeAudio}
                        disabled={loading}
                        fullWidth
                        size="small"
                      >
                        Analyze
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: 'grey.50',
                    borderRadius: 2,
                    border: '2px dashed',
                    borderColor: 'divider',
                  }}
                >
                  <VolumeUp sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No recording available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start recording to analyze speech
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Loading */}
      {loading && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <LoadingSpinner message="Analyzing speech patterns..." />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analysis && !loading && (
        <Box sx={{ mt: 4 }}>
          {/* Transcription */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Speech Transcription
              </Typography>
              <Box
                sx={{
                  p: 3,
                  backgroundColor: 'grey.50',
                  borderRadius: 2,
                  borderLeft: 4,
                  borderColor: 'primary.main',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontStyle: 'italic',
                    fontSize: '1.1rem',
                    lineHeight: 1.6,
                  }}
                >
                  "{analysis.transcription}"
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={4}>
            {/* Sentiment Analysis */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                    Sentiment Analysis
                  </Typography>
                  
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      backgroundColor: `${getSentimentColor(analysis.sentiment.score)}.light`,
                      color: `${getSentimentColor(analysis.sentiment.score)}.contrastText`,
                      mb: 3,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {getSentimentLabel(analysis.sentiment.score)}
                      </Typography>
                      <Chip
                        label={`Score: ${Number(analysis.sentiment.score).toFixed(2)}`}
                        size="small"
                        sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                      />
                    </Box>
                    
                    <Box
                      sx={{
                        width: '100%',
                        height: 8,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${Math.abs(analysis.sentiment.score) * 50 + 50}%`,
                          height: '100%',
                          backgroundColor: 'rgba(255,255,255,0.8)',
                          transition: 'width 0.3s ease-in-out',
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Duration:</strong> {analysis.duration.toFixed(1)} seconds
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Analysis:</strong> Based on speech patterns and content
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Emotion Distribution */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                    Emotion Breakdown
                  </Typography>
                  
                  {pieData.length > 0 && (
                    <PieChart
                      series={[
                        {
                          data: pieData,
                          highlightScope: { faded: 'global', highlighted: 'item' },
                          faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                        },
                      ]}
                      height={250}
                    />
                  )}
                  
                  <Box sx={{ mt: 3 }}>
                    <Grid container spacing={1}>
                      {analysis.emotions.slice(0, 6).map((emotion, index) => (
                        <Grid item xs={6} key={emotion.emotion}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
                            >
                              {emotion.emotion}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};