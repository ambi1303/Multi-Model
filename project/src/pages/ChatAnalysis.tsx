import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Alert,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Send,
  Clear,
  Psychology,
  TrendingUp,
  Delete,
} from '@mui/icons-material';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { ChatMessage } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import { useAppStore } from '../store/useAppStore';
import api from '../services/api';

export const ChatAnalysis: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const { addAnalysisResult } = useAppStore();

  const analyzeMessage = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      // Real API call
      const response = await api.post('/analyze-chat', {
        text: inputText.trim(),
        person_id: 'user_api',
      });
      const data = response.data;
      // Map backend response to ChatMessage
      const now = Date.now();
      const result: ChatMessage = {
        id: now.toString(),
        text: data.text,
        timestamp: now,
        analysis: {
          sentiment: {
            label: data.sentiment || data.primary_emotion || 'neutral',
            score: data.sentiment_score ?? 0,
          },
          emotions: [{ emotion: data.primary_emotion || 'neutral', confidence: data.emotion_score ?? 1, timestamp: now }],
          mentalState: data.mental_state || 'neutral',
        },
      };
      setMessages(prev => [result, ...prev]);
      addAnalysisResult('chat', result);
      setInputText('');
      showSuccess('Message analyzed successfully!');
    } catch (err) {
      showError('Failed to analyze message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      analyzeMessage();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    showSuccess('Chat history cleared.');
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'success';
    if (score < -0.3) return 'error';
    return 'warning';
  };

  const getMentalStateColor = (state: string) => {
    const colors: { [key: string]: string } = {
      confident: 'primary',
      stressed: 'error',
      anxious: 'warning',
      calm: 'success',
      excited: 'secondary',
      frustrated: 'error',
    };
    return colors[state] || 'default';
  };

  // Calculate trends
  const sentimentTrend = messages.slice(0, 10).reverse().map((msg, index) => ({
    x: index + 1,
    y: msg.analysis.sentiment.score,
  }));

  const emotionData = messages.length > 0 ? 
    messages[0].analysis.emotions.slice(0, 5).map(emotion => ({
      emotion: emotion.emotion,
      confidence: Math.round(emotion.confidence * 100),
    })) : [];

  const averageSentiment = messages.length > 0 ? 
    messages.reduce((sum, msg) => sum + msg.analysis.sentiment.score, 0) / messages.length : 0;

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
          Chat Mental State Analysis
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
          Analyze emotional patterns and mental states from text conversations
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Chat Input */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Message Analysis
              </Typography>
              
              <Box sx={{ position: 'relative', mb: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here to analyze emotional content..."
                  disabled={loading}
                  inputProps={{ maxLength: 500 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 12,
                    backgroundColor: 'background.paper',
                    px: 1,
                  }}
                >
                  {inputText.length}/500
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={loading ? <LoadingSpinner size={16} /> : <Send />}
                  onClick={analyzeMessage}
                  disabled={!inputText.trim() || loading}
                  sx={{ flex: 1 }}
                >
                  {loading ? 'Analyzing...' : 'Analyze Message'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={clearHistory}
                  disabled={messages.length === 0}
                >
                  Clear History
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Message History */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Conversation Analysis
                </Typography>
                <Chip
                  label={`${messages.length} messages`}
                  color="primary"
                  variant="outlined"
                />
              </Box>
              
              <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                {messages.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 8,
                      color: 'text.secondary',
                    }}
                  >
                    <Psychology sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6">No messages analyzed yet</Typography>
                    <Typography variant="body2">
                      Start typing to analyze emotional content
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {messages.map((message, index) => (
                      <Paper
                        key={message.id}
                        variant="outlined"
                        sx={{
                          p: 3,
                          backgroundColor: 'grey.50',
                          position: 'relative',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Message {messages.length - index} • {new Date(message.timestamp).toLocaleTimeString()}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              label={message.analysis.sentiment.label}
                              size="small"
                              color={getSentimentColor(message.analysis.sentiment.score)}
                            />
                            <Chip
                              label={message.analysis.mentalState}
                              size="small"
                              color={getMentalStateColor(message.analysis.mentalState) as any}
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        
                        <Typography
                          variant="body1"
                          sx={{
                            mb: 2,
                            p: 2,
                            backgroundColor: 'background.paper',
                            borderRadius: 1,
                            borderLeft: 4,
                            borderColor: 'primary.main',
                          }}
                        >
                          "{message.text}"
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Dominant emotion: <strong>{message.analysis.emotions[0]?.emotion}</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                              Sentiment score: <strong>{message.analysis.sentiment.score.toFixed(2)}</strong>
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => setMessages(prev => prev.filter(m => m.id !== message.id))}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics Sidebar */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Overall Insights
                </Typography>
                
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    color: 'white',
                    textAlign: 'center',
                    mb: 3,
                  }}
                >
                  <Psychology sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Average Sentiment
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {averageSentiment.toFixed(2)}
                  </Typography>
                </Box>
                
                {messages.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Messages
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {messages.length}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Latest State
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                      >
                        {messages[0]?.analysis.mentalState}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Trend
                      </Typography>
                      <TrendingUp fontSize="small" color="success" />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {emotionData.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Current Emotions
                  </Typography>
                  <BarChart
                    dataset={emotionData}
                    yAxis={[{ scaleType: 'band', dataKey: 'emotion' }]}
                    series={[{ dataKey: 'confidence', label: 'Confidence %' }]}
                    layout="horizontal"
                    height={200}
                  />
                </CardContent>
              </Card>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Sentiment Trend */}
      {sentimentTrend.length > 1 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Sentiment Trend
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Track emotional changes over conversation
            </Typography>
            <LineChart
              series={[
                {
                  data: sentimentTrend.map(point => point.y),
                  label: 'Sentiment Score',
                  color: '#2563eb',
                },
              ]}
              xAxis={[{
                data: sentimentTrend.map(point => point.x),
                label: 'Message Number',
              }]}
              yAxis={[{
                min: -1,
                max: 1,
                label: 'Sentiment Score',
              }]}
              height={300}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};