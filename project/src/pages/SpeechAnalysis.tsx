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
} from '@mui/material';
import {
  Mic,
  Stop,
  PlayArrow,
  Download,
  Refresh,
  VolumeUp,
} from '@mui/icons-material';
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




  const formatWellnessContent = (content: string) => {
    if (!content) return '';
    
    // Split content into sections
    const sections = content.split(/\*\*([^*]+):\*\*/);
    const formattedSections: React.ReactNode[] = [];
    
    for (let i = 0; i < sections.length; i++) {
      if (i % 2 === 0) {
        // Regular content
        if (sections[i].trim()) {
          // Split by numbered lists and format them
          const lines = sections[i].split('\n').filter(line => line.trim());
          lines.forEach((line, lineIndex) => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              // Check if it's a numbered item
              const numberedMatch = trimmedLine.match(/^(\d+)\.\s*\*\*([^*]+)\*\*:\s*(.+)$/);
              if (numberedMatch) {
                formattedSections.push(
                  <Box key={`${i}-${lineIndex}`} sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                      {numberedMatch[1]}. {numberedMatch[2]}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                      {numberedMatch[3]}
                    </Typography>
                  </Box>
                );
              } else if (trimmedLine.match(/^\d+\./)) {
                // Simple numbered item
                const [number, ...rest] = trimmedLine.split(/\.\s*/);
                formattedSections.push(
                  <Typography key={`${i}-${lineIndex}`} variant="body1" sx={{ mb: 1.5, color: 'text.primary' }}>
                    <strong style={{ color: '#1976d2' }}>{number}.</strong> {rest.join('. ')}
                  </Typography>
                );
              } else {
                // Regular paragraph
                formattedSections.push(
                  <Typography key={`${i}-${lineIndex}`} variant="body1" sx={{ mb: 1.5, color: 'text.primary', lineHeight: 1.6 }}>
                    {trimmedLine}
                  </Typography>
                );
              }
            }
          });
        }
      } else {
        // Section header
        formattedSections.push(
          <Typography key={i} variant="h5" sx={{ fontWeight: 700, color: 'success.main', mb: 2, mt: 3 }}>
            🌟 {sections[i]}
          </Typography>
        );
      }
    }
    
    return <Box>{formattedSections}</Box>;
  };




  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4, mt: 2, animation: 'fadeIn 1.2s cubic-bezier(0.4,0,0.2,1)', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(-30px)' }, to: { opacity: 1, transform: 'none' } } }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(90deg, #6366f1, #7c3aed, #06b6d4, #f59e42, #6366f1)',
            backgroundSize: '200% auto',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'gradientMove 3s linear infinite',
            '@keyframes gradientMove': {
              '0%': { backgroundPosition: '0% 50%' },
              '50%': { backgroundPosition: '100% 50%' },
              '100%': { backgroundPosition: '0% 50%' },
            },
            position: 'relative',
            zIndex: 1,
          }}
        >
          Speech Emotion Analysis
        </Typography>
        <Box
          sx={{
            width: 320,
            maxWidth: '80vw',
            height: 6,
            mx: 'auto',
            borderRadius: 3,
            background: 'linear-gradient(90deg, #6366f1, #7c3aed, #06b6d4, #f59e42, #6366f1)',
            backgroundSize: '200% auto',
            animation: 'underlineMove 3s linear infinite',
            '@keyframes underlineMove': {
              '0%': { backgroundPosition: '0% 50%' },
              '50%': { backgroundPosition: '100% 50%' },
              '100%': { backgroundPosition: '0% 50%' },
            },
            mt: 1,
            mb: 3,
            opacity: 0.85,
          }}
        />
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
          {/* Technical Analysis Report */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Technical Analysis Report
              </Typography>
              <Box
                sx={{
                  p: 3,
                  backgroundColor: 'grey.50',
                  borderRadius: 2,
                  borderLeft: 4,
                  borderColor: 'primary.main',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-line',
                  fontSize: '1.05rem',
                }}
              >
                {analysis.technicalReport}
              </Box>
            </CardContent>
          </Card>
          {/* GenAI Wellness Advisor */}
          <Card sx={{ mb: 4, border: '1px solid', borderColor: 'success.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: 'success.main',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  mr: 2
                }}>
                  🧠
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                  Wellness Advisor
                </Typography>
                <Chip 
                  label="Powered by Llama 3" 
                  size="small" 
                  sx={{ ml: 2, backgroundColor: 'success.light', color: 'success.main' }}
                />
              </Box>
              <Box
                sx={{
                  p: 3,
                  backgroundColor: 'rgba(46, 125, 50, 0.05)',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'success.light',
                }}
              >
                {formatWellnessContent(analysis.genAIInsights)}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};