import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  TextField, 
  CircularProgress, 
  Grid, 
  Tabs, 
  Tab, 
  Alert, 
  Card,
  CardContent,
  Chip,
  Avatar,
  Fade,
  Slide,
  LinearProgress,
  Stack,
} from '@mui/material';
import { styled, keyframes, useTheme } from '@mui/material/styles';
import { 
  analyzeSingleChatMessage, 
  analyzeSingleMessageAdvanced,
} from '../services/api';

import {
  MessageCircleIcon,
  AutoAwesomeIcon,
  BarChartIcon,
  SendIcon,
} from '../utils/icons';

// 🎨 Enhanced Animations (same as ChatAnalysis)
const pulseAnimation = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(25, 118, 210, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
`;

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// 🎯 Styled Components
const AnimatedCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  }
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  backgroundSize: '200% 200%',
  animation: `${gradientAnimation} 3s ease infinite`,
  color: 'white',
  fontWeight: 'bold',
  borderRadius: '20px',
  textTransform: 'none',
  '&:hover': {
    animation: `${pulseAnimation} 1s infinite, ${gradientAnimation} 1.5s ease infinite`,
    transform: 'scale(1.05)',
  }
}));

interface SingleAnalysisResult {
  primary_emotion: string;
  sentiment_score: number;
  mental_state: string;
  emotion_score?: number;
  error?: string;
}

const ChatTab: React.FC = () => {
  const theme = useTheme();
  const [tab, setTab] = useState<'simple' | 'advanced' | 'batch'>('simple');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  // Enhanced state with animations
  const [text, setText] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SingleAnalysisResult | null>(null);
  
  // Advanced analysis state
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [advancedResult, setAdvancedResult] = useState<SingleAnalysisResult | null>(null);

  // Tab switch handler
  const handleTabChange = (_: any, value: string) => {
    setTab(value as 'simple' | 'advanced' | 'batch');
    setResult(null);
    setAdvancedResult(null);
  };

  // Text change handler
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
    setCharCount(newText.length);
    setWordCount(newText.trim().split(/\s+/).filter(word => word.length > 0).length);
  };

  // Simple analysis submit
  const handleSimpleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setLoading(true);
    setResult(null);
    setAnalysisProgress(0);

    // Enhanced progress simulation
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    
    try {
      const data = await analyzeSingleChatMessage({ text: text.trim() });
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message, primary_emotion: '', sentiment_score: 0, mental_state: '' });
    } finally {
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setLoading(false);
      setTimeout(() => setAnalysisProgress(0), 1000);
    }
  };

  // Advanced analysis submit
  const handleAdvancedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setAdvancedLoading(true);
    setAdvancedResult(null);
    
    try {
      const data = await analyzeSingleMessageAdvanced({ text: text.trim() });
      setAdvancedResult(data);
    } catch (err: any) {
      setAdvancedResult({ error: err.message, primary_emotion: '', sentiment_score: 0, mental_state: '' });
    } finally {
      setAdvancedLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* 🎨 Enhanced Header */}
      <Slide in direction="down" timeout={800}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
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
              animation: `${gradientAnimation} 3s ease infinite`
            }}
          >
            🚀 Advanced Chat Analyzer
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Multi-mode analysis with enhanced visualizations and insights
          </Typography>
        </Box>
      </Slide>

      {/* Enhanced Tabs */}
      <Paper sx={{ borderRadius: '20px', overflow: 'hidden', mb: 3 }}>
        <Tabs 
          value={tab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '1rem'
            }
          }}
        >
          <Tab 
            label="🔍 Simple Analysis" 
            value="simple"
            icon={<MessageCircleIcon />}
            iconPosition="start"
          />
          <Tab 
            label="🧠 Advanced Analysis" 
            value="advanced"
            icon={<AutoAwesomeIcon />}
            iconPosition="start"
          />
          <Tab 
            label="📊 Batch Analysis" 
            value="batch"
            icon={<BarChartIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Enhanced Tab Content */}
      {tab === 'simple' && (
        <Fade in timeout={500}>
          <AnimatedCard sx={{ p: 4, borderRadius: '20px' }}>
            <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MessageCircleIcon />
              Quick Message Analysis
            </Typography>

            <form onSubmit={handleSimpleSubmit}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Enter your message"
                placeholder="Type something interesting... ✨"
                value={text}
                onChange={handleTextChange}
                disabled={loading}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '15px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    }
                  }
                }}
              />

              {/* Enhanced Progress and Stats */}
              {analysisProgress > 0 && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={analysisProgress}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                      }
                    }}
                  />
                </Box>
              )}

              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Chip label={`${charCount} chars`} color="primary" size="small" />
                <Chip label={`${wordCount} words`} color="secondary" size="small" />
              </Stack>

              <Box sx={{ textAlign: 'center' }}>
                <GradientButton
                  type="submit"
                  disabled={loading || !text.trim()}
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                >
                  {loading ? 'Analyzing...' : 'Analyze Message'}
                </GradientButton>
              </Box>
            </form>

            {/* Enhanced Results Display */}
            {result && (
              <Fade in timeout={800}>
                <Box sx={{ mt: 4 }}>
                  {result.error ? (
                    <Alert severity="error" sx={{ borderRadius: '15px' }}>
                      {result.error}
                    </Alert>
                  ) : (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <AnimatedCard>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Avatar sx={{ 
                              width: 60, 
                              height: 60, 
                              mx: 'auto', 
                              mb: 2,
                              bgcolor: 'primary.main',
                              animation: `${pulseAnimation} 2s infinite`
                            }}>
                              😊
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {result.primary_emotion}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Primary Emotion
                            </Typography>
                          </CardContent>
                        </AnimatedCard>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <AnimatedCard>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ 
                              fontWeight: 'bold', 
                              color: 'primary.main',
                              mb: 1
                            }}>
                              {((result.sentiment_score + 1) / 2 * 100).toFixed(0)}%
                            </Typography>
                            <Typography variant="h6">Sentiment</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Positivity Score
                            </Typography>
                          </CardContent>
                        </AnimatedCard>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <AnimatedCard>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Avatar sx={{ 
                              width: 60, 
                              height: 60, 
                              mx: 'auto', 
                              mb: 2,
                              bgcolor: 'secondary.main'
                            }}>
                              🧠
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {result.mental_state}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Mental State
                            </Typography>
                          </CardContent>
                        </AnimatedCard>
                      </Grid>
                    </Grid>
                  )}
                </Box>
              </Fade>
            )}
          </AnimatedCard>
        </Fade>
      )}

      {/* Advanced Analysis Tab */}
      {tab === 'advanced' && (
        <Fade in timeout={500}>
          <AnimatedCard sx={{ p: 4, borderRadius: '20px' }}>
            <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon />
              Advanced Analysis
            </Typography>
            
            <form onSubmit={handleAdvancedSubmit}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Enter your message for advanced analysis"
                placeholder="Type something for deeper insights... 🧠"
                value={text}
                onChange={handleTextChange}
                disabled={advancedLoading}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '15px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    }
                  }
                }}
              />

              <Box sx={{ textAlign: 'center' }}>
                <GradientButton
                  type="submit"
                  disabled={advancedLoading || !text.trim()}
                  size="large"
                  startIcon={advancedLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                >
                  {advancedLoading ? 'Deep Analyzing...' : 'Advanced Analysis'}
                </GradientButton>
              </Box>
            </form>

            {/* Enhanced Advanced Results */}
            {advancedResult && (
              <Fade in timeout={800}>
                <Box sx={{ mt: 4 }}>
                  {advancedResult.error ? (
                    <Alert severity="error" sx={{ borderRadius: '15px' }}>
                      {advancedResult.error}
                    </Alert>
                  ) : (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <AnimatedCard>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              🎭 Emotion Analysis
                            </Typography>
                            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                              {advancedResult.primary_emotion}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Confidence: {((advancedResult.emotion_score || 0) * 100).toFixed(1)}%
                            </Typography>
                          </CardContent>
                        </AnimatedCard>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <AnimatedCard>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              🧠 Mental State
                            </Typography>
                            <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                              {advancedResult.mental_state}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Advanced neural analysis
                            </Typography>
                          </CardContent>
                        </AnimatedCard>
                      </Grid>
                    </Grid>
                  )}
                </Box>
              </Fade>
            )}
          </AnimatedCard>
        </Fade>
      )}

      {/* Batch Analysis Tab */}
      {tab === 'batch' && (
        <Fade in timeout={500}>
          <AnimatedCard sx={{ p: 4, borderRadius: '20px' }}>
            <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChartIcon />
              Batch Analysis
            </Typography>
            
            {/* File upload and batch processing UI would go here */}
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary">
                📊 Batch analysis features coming soon...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Upload multiple messages for comprehensive analysis
              </Typography>
            </Box>
          </AnimatedCard>
        </Fade>
      )}
    </Box>
  );
};

export default ChatTab; 