import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Alert,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Videocam,
  Upload,
  PlayArrow,
  Stop,
  CameraAlt,
  Refresh,
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useWebcam } from '../hooks/useWebcam';
import { videoApi } from '../services/videoApi';
import { VideoAnalysisResult } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import { useAppStore } from '../store/useAppStore';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 24 }}>
    {value === index && children}
  </div>
);

export const VideoAnalysis: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [analysis, setAnalysis] = useState<VideoAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { showSuccess, showError } = useNotification();
  const { addAnalysisResult } = useAppStore();
  
  const { stream, error, isActive, videoRef, start, stop, capture } = useWebcam();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (isActive) stop(); // Stop camera when switching tabs
  };

  function aggregateResults(results: VideoAnalysisResult[]): VideoAnalysisResult | null {
    if (!results.length) return null;
    // Count emotions
    const emotionCounts: Record<string, number> = {};
    let totalConfidence = 0;
    let total = 0;
    results.forEach(r => {
      r.emotions.forEach(e => {
        emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
        totalConfidence += e.confidence;
        total++;
      });
    });
    // Find dominant
    let dominantEmotion = '';
    let maxCount = 0;
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      if (count > maxCount) {
        dominantEmotion = emotion;
        maxCount = count;
      }
    });
    return {
      emotions: Object.entries(emotionCounts).map(([emotion, count]) => ({ emotion, confidence: count / total, timestamp: Date.now() })),
      dominantEmotion,
      averageConfidence: total ? totalConfidence / total : 0,
      timestamp: Date.now(),
    };
  }

  const analyzeFor10Seconds = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    const results = [];
    const startTime = Date.now();
    let elapsed = 0;
    while (elapsed < 10000) {
      const imageData = capture();
      if (imageData) {
        try {
           
          const result = await videoApi.analyzeFrame(imageData);
          results.push(result);
        } catch (e) {
          // ignore errors for individual frames
        }
      }
       
      await new Promise(res => setTimeout(res, 500));
      elapsed = Date.now() - startTime;
    }
    const agg = aggregateResults(results);
    setAnalysis(agg);
    setIsAnalyzing(false);
    showSuccess('10-second video analysis complete!');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showError('Image file is too large. Please select a file under 10MB.');
      return;
    }

    setLoading(true);
    try {
      const result = await videoApi.analyzeFrame(file);
      setAnalysis(result);
      addAnalysisResult('video', result);
      showSuccess('Image analyzed successfully!');
    } catch (err) {
      showError('Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    stop();
  };

  const chartData = analysis?.emotions.slice(0, 6).map(emotion => ({
    emotion: emotion.emotion,
    confidence: Math.round(emotion.confidence * 100),
  })) || [];

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
          Video Emotion Analysis
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
          Analyze emotions from live video or uploaded images using advanced AI
        </Typography>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<Videocam />}
            label="Live Camera"
            iconPosition="start"
          />
          <Tab
            icon={<Upload />}
            label="Upload Image"
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: 2,
                    overflow: 'hidden',
                    backgroundColor: 'grey.100',
                    aspectRatio: '4/3',
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: isActive ? 'block' : 'none',
                    }}
                  />
                  {!isActive && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.secondary',
                      }}
                    >
                      <Videocam sx={{ fontSize: 64, mb: 2 }} />
                      <Typography variant="h6">Camera not active</Typography>
                      <Typography variant="body2">
                        Click "Start Camera" to begin
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {!isActive ? (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PlayArrow />}
                      onClick={start}
                      fullWidth
                    >
                      Start Camera
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<CameraAlt />}
                        onClick={analyzeFor10Seconds}
                        disabled={loading || isAnalyzing}
                        fullWidth
                      >
                        Analyze 10s Video
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Stop />}
                        onClick={stop}
                        fullWidth
                      >
                        Stop Camera
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={reset}
                    fullWidth
                  >
                    Reset
                  </Button>

                  {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 6,
                textAlign: 'center',
                backgroundColor: 'grey.50',
              }}
            >
              <Upload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Upload an image to analyze emotions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Supported formats: JPG, PNG, GIF (max 10MB)
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<Upload />}
                  size="large"
                >
                  Choose Image
                </Button>
              </label>
            </Box>
          </CardContent>
        </TabPanel>
      </Card>

      {/* Loading */}
      {(loading || isAnalyzing) && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <LoadingSpinner message={isAnalyzing ? "Analyzing video for 10 seconds..." : "Analyzing emotions..."} />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analysis && !loading && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Analysis Results
                </Typography>
                
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                    mb: 3,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Dominant Emotion
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      color: 'primary.main',
                      mb: 1,
                    }}
                  >
                    {analysis.dominantEmotion}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average confidence: {Math.round(analysis.averageConfidence * 100)}%
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {analysis.emotions.slice(0, 5).map((emotion, index) => (
                    <Box key={emotion.emotion}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography
                          variant="body1"
                          sx={{ textTransform: 'capitalize', fontWeight: 500 }}
                        >
                          {emotion.emotion}
                        </Typography>
                        <Chip
                          label={`${Math.round(emotion.confidence * 100)}%`}
                          size="small"
                          color={index === 0 ? 'primary' : 'default'}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={emotion.confidence * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: index === 0 
                              ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                              : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Confidence Distribution
                </Typography>
                
                {chartData.length > 0 && (
                  <BarChart
                    dataset={chartData}
                    xAxis={[{ scaleType: 'band', dataKey: 'emotion' }]}
                    series={[
                      {
                        dataKey: 'confidence',
                        label: 'Confidence %',
                        color: '#2563eb',
                      },
                    ]}
                    height={300}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};