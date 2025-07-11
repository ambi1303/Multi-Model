import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  CardContent,
  Button,
  Alert,
  Chip,
  Stack,
  Fade,
  Collapse,
  LinearProgress,
  Badge,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Slider,
  CardActions,
  Dialog,
  DialogContent,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  MicIcon,
  StopIcon,
  PlayArrowIcon,
  DownloadIcon,
  RefreshIcon,
  VolumeUpIcon,
  PauseIcon,
  AudioFileIcon,
  AnalyticsIcon,
  EmojiEmotionsIcon,
  StarIcon,
  TimerIcon,
  SettingsIcon,
  DeleteIcon,
  SaveIcon,
} from '../utils/icons';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { speechApi } from '../services/speechApi';
import { SpeechAnalysisResult, EmotionResult } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { useAppStore } from '../store/useAppStore';
import { EnhancedCard } from '../components/common/EnhancedCard';
import { GradientButton } from '../components/common/GradientButton';
import { EmotionChip, getEmotionInfo } from '../components/common/EmotionChip';
import { useAnalysisProgress } from '../hooks/useAnalysisProgress';
import { EmoBuddyPopup } from '../components/common/EmoBuddyPopup';

// Styled Components
const AudioVisualizer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(0.5),
  height: 60,
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  background: `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.secondary.light}20)`,
  border: `1px solid ${theme.palette.divider}`,
}));

const WaveBar = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive: boolean; height: number }>(({ theme, isActive, height }) => ({
  width: 4,
  height: `${height}px`,
  backgroundColor: isActive ? theme.palette.primary.main : theme.palette.grey[400],
  borderRadius: 2,
  transition: 'all 0.3s ease',
  animation: isActive ? 'wave 1.5s ease-in-out infinite' : 'none',
  '@keyframes wave': {
    '0%, 100%': { transform: 'scaleY(1)' },
    '50%': { transform: 'scaleY(1.5)' },
  },
}));

const RecordingButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isRecording',
})<{ isRecording: boolean }>(({ theme, isRecording }) => ({
  width: 120,
  height: 120,
  borderRadius: '50%',
  fontSize: '2.5rem',
  transition: 'all 0.3s ease',
  background: isRecording 
    ? `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`
    : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  boxShadow: isRecording ? theme.shadows[8] : theme.shadows[4],
  animation: isRecording ? 'pulse 2s infinite' : 'none',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: theme.shadows[12],
  },
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)', opacity: 1 },
    '50%': { transform: 'scale(1.1)', opacity: 0.8 },
    '100%': { transform: 'scale(1)', opacity: 1 },
  },
}));

// Custom Hooks
const useAudioSettings = () => {
  const [settings, setSettings] = useState({
    quality: 'high',
    noiseReduction: true,
    echoCancellation: true,
    autoGain: true,
    sensitivity: 50,
  });

  const updateSetting = useCallback((key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  return { settings, updateSetting };
};

const useAnalysisHistory = () => {
  const [history, setHistory] = useState<SpeechAnalysisResult[]>([]);

  const addAnalysis = useCallback((analysis: SpeechAnalysisResult) => {
    setHistory(prev => [...prev.slice(-4), analysis]); // Keep last 5 analyses
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, addAnalysis, clearHistory };
};

const SpeechAnalysis: React.FC = () => {
  const theme = useTheme();
  const [tab, setTab] = useState<'record' | 'history'>('record');
  const [analysis, setAnalysis] = useState<SpeechAnalysisResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [showEmoBuddy, setShowEmoBuddy] = useState(false);
  const [emoBuddyAnalysis, setEmoBuddyAnalysis] = useState<SpeechAnalysisResult | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Custom hooks
  const { isRecording, audioBlob, duration, error, start, stop, reset } = useAudioRecorder();
  const { progress, isLoading, startProgress, completeProgress } = useAnalysisProgress();
  const { settings, updateSetting } = useAudioSettings();
  const { history, addAnalysis, clearHistory } = useAnalysisHistory();
  const { showSuccess, showError } = useNotification();
  const { addAnalysisResult } = useAppStore();

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Enhanced audio analysis with progress tracking
  const analyzeAudio = async () => {
    if (!audioBlob) {
      showError('No audio recording available.');
      return;
    }

    const progressInterval = startProgress();

    try {
      const result = await speechApi.analyzeAudio(audioBlob);
      const enhancedResult = {
        ...result,
        duration,
        timestamp: Date.now(),
      };
      
      setAnalysis(enhancedResult);
      addAnalysis(enhancedResult);
      addAnalysisResult('speech', enhancedResult);
      showSuccess('Audio analyzed successfully! 🎉');
      
      // Show Emo Buddy popup after successful analysis
      setEmoBuddyAnalysis(enhancedResult);
      setTimeout(() => {
        setShowEmoBuddy(true);
      }, 2000); // Show popup 2 seconds after analysis completes
    } catch (err) {
      showError('Failed to analyze audio. Please try again.');
    } finally {
      completeProgress(progressInterval);
    }
  };

  // Enhanced audio playback with controls
  const toggleAudioPlayback = useCallback(() => {
    if (!audioBlob) return;

    if (playingAudio && audioRef.current) {
      audioRef.current.pause();
      setPlayingAudio(false);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audioRef.current = audio;
      
      audio.onended = () => setPlayingAudio(false);
      audio.onerror = () => {
        showError('Failed to play audio.');
        setPlayingAudio(false);
      };
      
      audio.play()
        .then(() => setPlayingAudio(true))
        .catch(() => {
          showError('Failed to play audio.');
          setPlayingAudio(false);
        });
    }
  }, [audioBlob, playingAudio, showError]);

  // Enhanced download with metadata
  const downloadAudio = useCallback(() => {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `speech-analysis-${timestamp}.webm`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess(`Audio saved as ${filename} 📁`);
  }, [audioBlob, showSuccess]);

  // Enhanced reset with confirmation
  const handleReset = useCallback(() => {
    reset();
    setAnalysis(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingAudio(false);
  }, [reset]);

  const handleEmoBuddyClick = () => {
    if (analysis) {
      setEmoBuddyAnalysis(analysis);
      setShowEmoBuddy(true);
    } else {
      showError("No analysis result available for EmoBuddy.");
    }
  };

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: 'record' | 'history') => {
    setTab(newValue);
  };

  // Audio visualizer component
  const renderAudioVisualizer = () => {
    const bars = Array.from({ length: 20 }, (_, i) => (
      <WaveBar
        key={i}
        isActive={isRecording}
        height={Math.random() * 40 + 10}
        sx={{ animationDelay: `${i * 0.1}s` }}
      />
    ));

    return (
      <AudioVisualizer>
        {bars}
      </AudioVisualizer>
    );
  };

  // Enhanced emotion display
  const renderEmotionAnalysis = (emotions: EmotionResult[]) => {
    if (!emotions || emotions.length === 0) return null;

    const topEmotions = emotions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    return (
      <EnhancedCard sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            😊 Emotion Analysis
            <Badge badgeContent={emotions.length} color="primary" />
          </Typography>
          
          <Stack spacing={2}>
            {topEmotions.map((emotion, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmotionChip emotion={emotion.emotion} />
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={emotion.confidence * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: getEmotionInfo(emotion.emotion).color,
                      },
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'right' }}>
                  {(emotion.confidence * 100).toFixed(1)}%
                </Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </EnhancedCard>
    );
  };

  // Enhanced sentiment display
  const renderSentimentAnalysis = (sentiment: any) => {
    if (!sentiment) return null;

    const sentimentColor = sentiment.label === 'positive' ? 'success' : 
                          sentiment.label === 'negative' ? 'error' : 'warning';

    return (
      <EnhancedCard sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            💭 Sentiment Analysis
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip
              label={sentiment.label.toUpperCase()}
              color={sentimentColor}
              sx={{ fontWeight: 'bold' }}
            />
            <Typography variant="body1">
              Confidence: {(sentiment.confidence * 100).toFixed(1)}%
            </Typography>
          </Box>

          {sentiment.scores && (
            <Stack spacing={1}>
              {Object.entries(sentiment.scores).map(([key, value]) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ minWidth: 80, textTransform: 'capitalize' }}>
                    {key}:
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(value as number) * 100}
                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'right' }}>
                    {((value as number) * 100).toFixed(1)}%
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </EnhancedCard>
    );
  };

  // Enhanced wellness content formatter
  const formatWellnessContent = (content: string) => {
    if (!content) return '';
    
    const sections = content.split(/\*\*([^*]+):\*\*/);
    const formattedSections: React.ReactNode[] = [];
    
    for (let i = 0; i < sections.length; i++) {
      if (i % 2 === 0) {
        if (sections[i].trim()) {
          const lines = sections[i].split('\n').filter(line => line.trim());
          lines.forEach((line, lineIndex) => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
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
                const [number, ...rest] = trimmedLine.split(/\.\s*/);
                formattedSections.push(
                  <Typography key={`${i}-${lineIndex}`} variant="body1" sx={{ mb: 1.5, color: 'text.primary' }}>
                    <strong style={{ color: theme.palette.primary.main }}>{number}.</strong> {rest.join('. ')}
                  </Typography>
                );
              } else {
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
        formattedSections.push(
          <Typography key={i} variant="h5" sx={{ fontWeight: 700, color: 'success.main', mb: 2, mt: 3 }}>
            🌟 {sections[i]}
          </Typography>
        );
      }
    }
    
    return <Box>{formattedSections}</Box>;
  };

  const renderAudioControls = () => (
    <EnhancedCard sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 4 }}>
          🎙️ Audio Recording
        </Typography>
        
        {/* Recording Button */}
        <Box sx={{ mb: 4 }}>
          <RecordingButton
            isRecording={isRecording}
            onClick={isRecording ? stop : start}
            variant="contained"
            disabled={isLoading}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </RecordingButton>
        </Box>

        {/* Duration Display */}
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
        
        {/* Recording Status */}
        {isRecording && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
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
              Recording in progress...
            </Typography>
          </Box>
        )}

        {/* Audio Visualizer */}
        {renderAudioVisualizer()}

        {/* Control Buttons */}
        <Stack spacing={2} sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleReset}
            fullWidth
            disabled={isRecording || isLoading}
          >
            Reset Recording
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setShowSettings(!showSettings)}
            fullWidth
          >
            Audio Settings
          </Button>
        </Stack>

        {/* Settings Panel */}
        <Collapse in={showSettings}>
          <EnhancedCard interactive={false} sx={{ mt: 2, p: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              🔧 Recording Settings
            </Typography>
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Microphone Sensitivity
                </Typography>
                <Slider
                  value={settings.sensitivity}
                  onChange={(_, value) => updateSetting('sensitivity', value)}
                  min={0}
                  max={100}
                  step={10}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label="Noise Reduction"
                  color={settings.noiseReduction ? 'primary' : 'default'}
                  onClick={() => updateSetting('noiseReduction', !settings.noiseReduction)}
                  clickable
                />
                <Chip
                  label="Echo Cancellation"
                  color={settings.echoCancellation ? 'primary' : 'default'}
                  onClick={() => updateSetting('echoCancellation', !settings.echoCancellation)}
                  clickable
                />
                <Chip
                  label="Auto Gain"
                  color={settings.autoGain ? 'primary' : 'default'}
                  onClick={() => updateSetting('autoGain', !settings.autoGain)}
                  clickable
                />
              </Stack>
            </Stack>
          </EnhancedCard>
        </Collapse>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between', p: 2, flexWrap: 'wrap', gap: 2 }}>
        <Button startIcon={<RefreshIcon />} onClick={handleReset} color="secondary">
          Analyze New Audio
        </Button>
        <GradientButton
          startIcon={<EmojiEmotionsIcon />}
          onClick={handleEmoBuddyClick}
        >
          Ask EmoBuddy
        </GradientButton>
      </CardActions>
    </EnhancedCard>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Enhanced Header */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 4,
        opacity: 0,
        animation: 'slideInDown 0.8s ease-out forwards',
        '@keyframes slideInDown': {
          '0%': {
            opacity: 0,
            transform: 'translateY(-30px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 2,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          🎤 Smart Speech Analysis
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Record and analyze emotions from speech patterns and vocal characteristics
        </Typography>
        
        {/* Quick Stats */}
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
          <Chip 
            icon={<AnalyticsIcon />}
            label={`${history.length} Analyses`}
            color="primary"
            variant="outlined"
          />
          <Chip 
            icon={<EmojiEmotionsIcon />}
            label="Real-time AI"
            color="secondary"
            variant="outlined"
          />
          <Chip 
            icon={<StarIcon />}
            label="Enhanced UX"
            color="success"
            variant="outlined"
          />
        </Stack>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
          <Tab
            label="Record & Analyze"
            value="record"
            icon={<MicIcon />}
            iconPosition="start"
          />
                     <Tab
             label="Analysis History"
             value="history"
             icon={<TimerIcon />}
             iconPosition="start"
           />
        </Tabs>
      </Paper>

      {/* Record & Analyze Tab */}
      {tab === 'record' && (
        <Grid container spacing={4}>
          {/* Recording Controls */}
          <Grid item xs={12} md={6}>
            {renderAudioControls()}
          </Grid>

          {/* Audio Analysis */}
          <Grid item xs={12} md={6}>
            <EnhancedCard>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  🎵 Audio Analysis
                </Typography>
                
                {audioBlob ? (
                  <Box>
                    <Alert severity="success" sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Recording Ready for Analysis
                      </Typography>
                      <Typography variant="body2">
                        Duration: {formatTime(duration)} • Size: {(audioBlob.size / 1024).toFixed(1)} KB
                      </Typography>
                    </Alert>
                    
                    {/* Progress Bar */}
                    {progress > 0 && (
                      <Fade in>
                        <Box sx={{ mb: 3 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={progress} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                              }
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Analyzing audio... {progress.toFixed(0)}%
                          </Typography>
                        </Box>
                      </Fade>
                    )}
                    
                    {/* Action Buttons */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={4}>
                        <Tooltip title={playingAudio ? "Pause Audio" : "Play Audio"}>
                          <Button
                            variant="outlined"
                            startIcon={playingAudio ? <PauseIcon /> : <PlayArrowIcon />}
                            onClick={toggleAudioPlayback}
                            fullWidth
                            size="small"
                          >
                            {playingAudio ? 'Pause' : 'Play'}
                          </Button>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={4}>
                        <Tooltip title="Download Audio">
                          <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={downloadAudio}
                            fullWidth
                            size="small"
                          >
                            Save
                          </Button>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={4}>
                        <GradientButton
                          onClick={analyzeAudio}
                          loading={isLoading}
                          loadingText="Analyzing..."
                          size="small"
                          fullWidth
                        >
                          Analyze
                        </GradientButton>
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                      borderRadius: 2,
                      border: '2px dashed',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}>
                      <VolumeUpIcon />
                    </Box>
                    <Typography variant="h6" color="text.secondary">
                      No recording available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start recording to analyze speech
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </EnhancedCard>
          </Grid>
        </Grid>
      )}

      {/* Analysis History Tab */}
      {tab === 'history' && (
        <EnhancedCard>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                📚 Analysis History
              </Typography>
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={clearHistory}
                disabled={history.length === 0}
                color="error"
              >
                Clear All
              </Button>
            </Box>

            {history.length > 0 ? (
              <List sx={{ width: '100%' }}>
                {history.reverse().map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                    }}
                  >
                                         <ListItemAvatar>
                       <Avatar sx={{ bgcolor: 'primary.main' }}>
                         <AudioFileIcon />
                       </Avatar>
                     </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Analysis #{history.length - index}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(item.timestamp).toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Duration: {formatTime(item.duration)} • 
                            Sentiment: {item.sentiment?.label || 'N/A'}
                          </Typography>
                          {item.emotions && item.emotions.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <EmotionChip emotion={item.emotions[0].emotion} />
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No analysis history yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start recording and analyzing speech to see your history here
                </Typography>
              </Box>
            )}
          </CardContent>
        </EnhancedCard>
      )}

      {/* Analysis Results */}
      {analysis && !isLoading && tab === 'record' && (
        <Fade in timeout={800}>
          <Box sx={{ mt: 4 }}>
            {/* Transcription */}
            {analysis.transcription && (
              <EnhancedCard sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📝 Transcription
                    <Chip label="AI Generated" size="small" color="primary" />
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      p: 2,
                      backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                      borderRadius: 2,
                      fontStyle: 'italic',
                      lineHeight: 1.6,
                    }}
                  >
                    "{analysis.transcription}"
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
                  <GradientButton
                    startIcon={<EmojiEmotionsIcon />}
                    onClick={handleEmoBuddyClick}
                  >
                    Ask EmoBuddy
                  </GradientButton>
                </CardActions>
              </EnhancedCard>
            )}

            {/* Emotion Analysis */}
            {analysis.emotions && renderEmotionAnalysis(analysis.emotions)}

            {/* Sentiment Analysis */}
            {analysis.sentiment && renderSentimentAnalysis(analysis.sentiment)}

            {/* Enhanced Technical Report */}
            {analysis.technicalReport && (
              <EnhancedCard sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🔬 Technical Analysis Report
                      <Chip label="Detailed" size="small" color="info" />
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Download Report">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const blob = new Blob([analysis.technicalReport], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `technical-report-${new Date().toISOString().slice(0, 10)}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            showSuccess('Technical report downloaded! 📄');
                          }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  {/* Simplified Technical Report - All Content Expanded */}
                  <Box
                    sx={{
                      p: 3,
                      backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      position: 'relative',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-line',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        color: 'text.primary',
                        pr: 6, // Space for copy button
                      }}
                    >
                      {analysis.technicalReport}
                    </Typography>
                  </Box>

                  {/* Export Action */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        const reportData = {
                          timestamp: new Date().toISOString(),
                          duration: analysis.duration,
                          content: analysis.technicalReport,
                          wordCount: analysis.technicalReport.split(/\s+/).length,
                          characterCount: analysis.technicalReport.length
                        };
                        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `speech-analysis-report-${new Date().toISOString().slice(0, 10)}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        showSuccess('Report exported! 📊');
                      }}
                    >
                      Export JSON
                    </Button>
                  </Box>
                </CardContent>
              </EnhancedCard>
            )}

            {/* AI Wellness Advisor */}
            {analysis.genAIInsights && (
              <EnhancedCard sx={{ mb: 3, border: '1px solid', borderColor: 'success.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ 
                      bgcolor: 'success.main',
                      color: 'white',
                      mr: 2
                    }}>
                      🧠
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                      AI Wellness Advisor
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
              </EnhancedCard>
            )}
          </Box>
        </Fade>
      )}

      {/* Floating Action Button */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
        direction="up"
      >
        <SpeedDialAction
          icon={<RefreshIcon />}
          tooltipTitle="Reset All"
          onClick={() => {
            handleReset();
            setAnalysis(null);
            clearHistory();
          }}
        />
                 <SpeedDialAction
           icon={<SaveIcon />}
           tooltipTitle="Share Analysis"
           onClick={() => {
             if (analysis) {
               navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
               showSuccess('Analysis copied to clipboard! 📋');
             }
           }}
         />
         <SpeedDialAction
           icon={<TimerIcon />}
           tooltipTitle="View History"
           onClick={() => setTab('history')}
         />
      </SpeedDial>

      {/* Emo Buddy Popup */}
      {showEmoBuddy && (
        <Dialog open={showEmoBuddy} onClose={() => { setShowEmoBuddy(false); setEmoBuddyAnalysis(null); }} maxWidth="sm" fullWidth>
          <DialogContent sx={{ p: 0 }}>
            <EmoBuddyPopup
              analysisResult={emoBuddyAnalysis}
              onClose={() => { setShowEmoBuddy(false); setEmoBuddyAnalysis(null); }}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default SpeechAnalysis;