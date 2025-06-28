import React, { useState, useRef, useCallback } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Fade,
  Collapse,
  LinearProgress,
  Badge,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Snackbar
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  analyzeSingleChatMessage,
  analyzeChatFile
} from '../services/api';
import MentalStatesChart from '../components/charts/MentalStatesChart';
import SentimentTrendChart from '../components/charts/SentimentTrendChart';
import {
  ChatIcon,
  AnalyticsIcon,
  CloudUploadIcon,
  DeleteIcon,
  SendIcon,
  AddIcon,
  PlayArrowIcon,
  AssignmentIcon,
  TextSnippetIcon,
  AutoAwesomeIcon,
  RefreshIcon,
  EmojiEmotionsIcon,
  StarIcon
} from '../utils/icons';
import { EnhancedCard } from '../components/common/EnhancedCard';
import { GradientButton } from '../components/common/GradientButton';
import { EmotionChip, getEmotionInfo } from '../components/common/EmotionChip';
import { useAnalysisProgress } from '../hooks/useAnalysisProgress';
import { MESSAGE_TEMPLATES, getRandomTemplate } from '../constants/messageTemplates';

// Styled Components
const FloatingTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '20px',
    transition: 'all 0.3s ease',
    background: theme.palette.background.paper,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
    },
    '&.Mui-focused': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
      '& fieldset': {
        borderColor: theme.palette.primary.main,
        borderWidth: '2px',
      }
    }
  }
}));

interface SingleAnalysisResult {
  primary_emotion: string;
  sentiment_score: number;
  mental_state: string;
  emotion_score?: number;
  error?: string;
}

interface BatchAnalysisResult {
  summary: {
    total_messages: number;
    mental_state_distribution: Record<string, string>;
    average_sentiment: string;
    most_common_emotion: string;
    dominant_mental_state?: string;
    time_span?: {
      start: string;
      end: string;
    };
  };
  analyzed_messages: Array<{
    timestamp: string;
    text: string;
    person_id: string;
    sentiment_score: number;
    primary_emotion: string;
    emotion_score: number;
    mental_state: string;
  }>;
  mental_states_data: Array<{
    name: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  sentiment_trend_data: Array<{
    timestamp: string;
    fullTimestamp: string;
    sentiment: number;
    rawSentiment: number;
    text: string;
  }>;
  success: boolean;
  message: string;
}

interface MessageInput {
  id: string;
  text: string;
  person_id: string;
}

// Custom Hooks
const useTextAnalysis = () => {
  const [text, setText] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
    setCharCount(newText.length);
    setWordCount(newText.trim().split(/\s+/).filter(word => word.length > 0).length);
  }, []);

  const clearText = useCallback(() => {
    setText('');
    setCharCount(0);
    setWordCount(0);
  }, []);

  return {
    text,
    charCount,
    wordCount,
    handleTextChange,
    clearText,
    setText
  };
};

const useNotification = () => {
  const [showSuccess, setShowSuccess] = useState(false);

  const showNotification = useCallback(() => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  }, []);

  return { showSuccess, showNotification };
};

export const ChatAnalysis: React.FC = () => {
  const theme = useTheme();
  const [tab, setTab] = useState<'simple' | 'batch'>('simple');
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simple analysis state
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(false);
  const [result, setResult] = useState<SingleAnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<SingleAnalysisResult[]>([]);

  // Batch analysis state
  const [batchMode, setBatchMode] = useState<'file' | 'manual'>('manual');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchAnalysisResult | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<MessageInput[]>([
    { id: '1', text: '', person_id: 'user_1' },
    { id: '2', text: '', person_id: 'user_1' }
  ]);

  // Custom hooks
  const { text, charCount, wordCount, handleTextChange, setText } = useTextAnalysis();
  const { progress, isLoading, startProgress, completeProgress } = useAnalysisProgress();
  const { showSuccess, showNotification } = useNotification();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Enhanced submit with better UX
  const handleSimpleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const progressInterval = startProgress();

    try {
      const data = await analyzeSingleChatMessage({ text: text.trim() });
      setResult(data);
      setAnalysisHistory(prev => [...prev.slice(-4), data]); // Keep last 5 analyses
      showNotification();
      scrollToBottom();
    } catch (err: any) {
      const errorResult = { error: err.message, primary_emotion: '', sentiment_score: 0, mental_state: '' };
      setResult(errorResult);
    } finally {
      completeProgress(progressInterval);
    }
  };

  // Quick template insertion
  const handleTemplateSelect = (template: string) => {
    setText(template);
    setShowTemplates(false);
  };

  // Tab switch handler
  const handleTabChange = useCallback((_: React.SyntheticEvent, value: string) => {
    setTab(value as 'simple' | 'batch');
    setResult(null);
    setBatchResult(null);
    setBatchError(null);
    setSelectedFile(null);
  }, []);

  // Message input handlers
  const handleMessageChange = (id: string, field: 'text' | 'person_id', value: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, [field]: value } : msg
    ));
  };

  const addMessage = () => {
    const newId = (Math.max(...messages.map(m => parseInt(m.id))) + 1).toString();
    setMessages(prev => [...prev, { id: newId, text: '', person_id: 'user_1' }]);
  };

  const removeMessage = (id: string) => {
    if (messages.length > 1) {
      setMessages(prev => prev.filter(msg => msg.id !== id));
    }
  };

  // Convert manual messages to JSON format
  const convertMessagesToJson = () => {
    const validMessages = messages.filter(msg => msg.text.trim().length > 0);
    return {
      person_id: "batch_user",
      messages: validMessages.map((msg, index) => ({
        text: msg.text.trim(),
        timestamp: new Date(Date.now() + index * 1000).toISOString(),
        person_id: msg.person_id
      }))
    };
  };

  // File selection handler
  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBatchError(null);
    setBatchResult(null);

    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
  };

  const handleBatchAnalysis = async () => {
    setBatchLoading(true);
    setBatchError(null);

    try {
      let result;
      
      if (batchMode === 'file' && selectedFile) {
        result = await analyzeChatFile(selectedFile);
      } else if (batchMode === 'manual') {
        const validMessages = messages.filter(msg => msg.text.trim().length > 0);
        if (validMessages.length === 0) {
          throw new Error('Please add at least one message');
        }
        
        const jsonData = convertMessagesToJson();
        const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const jsonFile = new File([jsonBlob], 'manual_messages.json', { type: 'application/json' });
        
        result = await analyzeChatFile(jsonFile);
      } else {
        throw new Error('Please select a file or add messages');
      }

      setBatchResult(result);

    } catch (error) {
      setBatchError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setBatchLoading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setBatchResult(null);
    setBatchError(null);
    const fileInput = document.getElementById('batch-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const clearMessages = () => {
    setMessages([
      { id: '1', text: '', person_id: 'user_1' },
      { id: '2', text: '', person_id: 'user_1' }
    ]);
    setBatchResult(null);
    setBatchError(null);
  };

  // Enhanced analysis cards with animations
  const renderAnalysisCards = (result: SingleAnalysisResult) => {
    if (result.error) {
      return (
        <Fade in timeout={500}>
          <Alert severity="error" sx={{ borderRadius: '15px', mb: 2 }}>
            <Typography variant="h6">Analysis Failed</Typography>
            <Typography>{result.error}</Typography>
          </Alert>
        </Fade>
      );
    }

    const emotionInfo = getEmotionInfo(result.primary_emotion, theme.palette.mode === 'dark');
    const sentimentPercentage = ((result.sentiment_score + 1) / 2) * 100;

    return (
      <Fade in timeout={800}>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Emotion Card */}
          <Grid item xs={12} md={4}>
            <EnhancedCard>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 2, 
                  fontSize: '2rem',
                  bgcolor: emotionInfo.color
                }}>
                  {emotionInfo.emoji}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {result.primary_emotion.charAt(0).toUpperCase() + result.primary_emotion.slice(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {emotionInfo.description}
                </Typography>
                <Chip 
                  label={`${((result.emotion_score || 0) * 100).toFixed(1)}% confidence`}
                  color="primary"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </EnhancedCard>
          </Grid>

          {/* Sentiment Card */}
          <Grid item xs={12} md={4}>
            <EnhancedCard>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={sentimentPercentage}
                    size={80}
                    thickness={6}
                    sx={{
                      color: sentimentPercentage > 60 ? '#4CAF50' : sentimentPercentage > 40 ? '#FF9800' : '#F44336',
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Typography variant="h6" component="div" color="text.secondary">
                      {sentimentPercentage.toFixed(0)}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Sentiment Score
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sentimentPercentage > 60 ? 'Very Positive' : 
                   sentimentPercentage > 40 ? 'Neutral' : 'Negative'}
                </Typography>
              </CardContent>
            </EnhancedCard>
          </Grid>

          {/* Mental State Card */}
          <Grid item xs={12} md={4}>
            <EnhancedCard>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 2,
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                }}>
                  🧠
                </Avatar>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Mental State
                </Typography>
                <Chip 
                  label={result.mental_state}
                  color="secondary"
                  sx={{ 
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    px: 2,
                    py: 1
                  }}
                />
              </CardContent>
            </EnhancedCard>
          </Grid>
        </Grid>
      </Fade>
    );
  };

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
          💬 Smart Chat Analysis
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Discover emotions, sentiment, and mental states in your conversations
        </Typography>
        
        {/* Quick Stats */}
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
          <Chip 
            icon={<AnalyticsIcon />}
            label={`${analysisHistory.length} Analyses`}
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
            label="Single Message"
            value="simple"
                            icon={<ChatIcon />}
            iconPosition="start"
          />
          <Tab
            label="Batch Input"
            value="batch"
            icon={<AnalyticsIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Simple Analysis Tab */}
      {tab === 'simple' && (
        <Paper sx={{ p: 4, mb: 3, borderRadius: '20px', boxShadow: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ChatIcon />
            Single Message Analysis
          </Typography>

          <form onSubmit={handleSimpleSubmit}>
            {/* Enhanced Input Section */}
            <Box sx={{ mb: 4 }}>
              <FloatingTextField
                fullWidth
                multiline
                rows={4}
                label="Enter your message for analysis"
                placeholder="Type your message here... 💭"
                value={text}
                onChange={handleTextChange}
                variant="outlined"
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title="Quick Templates">
                        <IconButton onClick={() => setShowTemplates(!showTemplates)}>
                          <AutoAwesomeIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )
                }}
              />

              {/* Real-time Stats */}
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Chip 
                  label={`${charCount} characters`} 
                  size="small" 
                  color={charCount > 280 ? 'warning' : 'default'}
                />
                <Chip 
                  label={`${wordCount} words`} 
                  size="small" 
                  color="primary"
                />
                <Chip 
                  label={realTimeAnalysis ? 'Real-time ON' : 'Real-time OFF'} 
                  size="small" 
                  color={realTimeAnalysis ? 'success' : 'default'}
                  onClick={() => setRealTimeAnalysis(!realTimeAnalysis)}
                  sx={{ cursor: 'pointer' }}
                />
              </Stack>

              {/* Progress Bar */}
              {progress > 0 && (
                <Fade in>
                  <Box sx={{ mb: 2 }}>
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
                      Analyzing... {progress.toFixed(0)}%
                    </Typography>
                  </Box>
                </Fade>
              )}

              {/* Message Templates */}
              <Collapse in={showTemplates}>
                <EnhancedCard interactive={false} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    💡 Quick Message Templates
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {MESSAGE_TEMPLATES.map((template, index) => (
                      <Chip
                        key={index}
                        label={template.text}
                        onClick={() => handleTemplateSelect(template.text)}
                        color={template.category === 'positive' ? 'success' : template.category === 'negative' ? 'error' : 'default'}
                        variant="outlined"
                        sx={{ 
                          mb: 1, 
                          cursor: 'pointer',
                          '&:hover': { 
                            transform: 'scale(1.05)',
                            boxShadow: 2
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </EnhancedCard>
              </Collapse>
            </Box>

            {/* Enhanced Submit Button */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <GradientButton
                type="submit"
                loading={isLoading}
                loadingText="Analyzing Magic..."
                disabled={!text.trim()}
                size="large"
                startIcon={<SendIcon />}
              >
                Analyze Message ✨
              </GradientButton>
            </Box>
          </form>

          {/* Success Notification */}
          <Snackbar
            open={showSuccess}
            autoHideDuration={3000}
            onClose={() => {}}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert severity="success" sx={{ borderRadius: '15px' }}>
              🎉 Analysis complete! Check out your results below.
            </Alert>
          </Snackbar>

          {/* Analysis Results */}
          {result && renderAnalysisCards(result)}

          {/* Analysis History */}
          {analysisHistory.length > 0 && (
            <Fade in timeout={1000}>
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  📚 Recent Analysis History
                  <Badge badgeContent={analysisHistory.length} color="primary" />
                </Typography>
                <Stack spacing={2}>
                  {analysisHistory.slice(-3).reverse().map((analysis, index) => (
                    <Box key={`analysis-${analysisHistory.length - index}`}>
                      <EnhancedCard sx={{ 
                        p: 2, 
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                        opacity: 0,
                        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s forwards`,
                        '@keyframes fadeInUp': {
                          '0%': {
                            opacity: 0,
                            transform: 'translateY(20px)',
                          },
                          '100%': {
                            opacity: 1,
                            transform: 'translateY(0)',
                          },
                        },
                      }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <EmotionChip emotion={analysis.primary_emotion} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {analysis.primary_emotion} • {analysis.mental_state}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Sentiment: {(((analysis.sentiment_score + 1) / 2) * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                          <Chip 
                            label={`#${analysisHistory.length - index}`}
                            size="small"
                            color="primary"
                          />
                        </Stack>
                      </EnhancedCard>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Fade>
          )}

          <div ref={messagesEndRef} />
        </Paper>
      )}

      {/* Batch Analysis Tab */}
      {tab === 'batch' && (
        <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
          <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnalyticsIcon />
            Batch Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Analyze multiple messages at once for comparative insights
          </Typography>

          {/* Batch Mode Selection */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* JSON File Upload Option */}
            <Grid item xs={12} md={6}>
              <EnhancedCard 
                sx={{ 
                  p: 3, 
                  border: batchMode === 'file' ? '2px solid' : '1px solid',
                  borderColor: batchMode === 'file' ? 'primary.main' : 'divider',
                  bgcolor: batchMode === 'file' ? 'primary.light' : 'background.paper',
                }}
                onClick={() => setBatchMode('file')}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Avatar sx={{ 
                    bgcolor: batchMode === 'file' ? 'primary.main' : 'grey.400', 
                    width: 60, 
                    height: 60, 
                    mb: 2 
                  }}>
                    <Box sx={{ fontSize: 30 }}>
                      <AssignmentIcon />
                    </Box>
                  </Avatar>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    JSON File Upload
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload a JSON file with pre-formatted messages
                  </Typography>
                  {batchMode === 'file' && (
                    <Chip label="Selected" color="primary" size="small" sx={{ mt: 1 }} />
                  )}
                </Box>
              </EnhancedCard>
            </Grid>

            {/* Manual Message Input Option */}
            <Grid item xs={12} md={6}>
              <EnhancedCard 
                sx={{ 
                  p: 3, 
                  cursor: 'pointer',
                  border: batchMode === 'manual' ? '2px solid' : '1px solid',
                  borderColor: batchMode === 'manual' ? 'success.main' : 'divider',
                  bgcolor: batchMode === 'manual' 
                    ? (theme.palette.mode === 'dark' ? 'success.dark' : 'success.light')
                    : 'background.paper',
                }}
                onClick={() => setBatchMode('manual')}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Avatar sx={{ 
                    bgcolor: batchMode === 'manual' ? 'success.main' : 'grey.400', 
                    width: 60, 
                    height: 60, 
                    mb: 2 
                  }}>
                    <Box sx={{ fontSize: 30 }}>
                      <TextSnippetIcon />
                    </Box>
                  </Avatar>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    Multiple Messages
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add messages manually and convert to JSON
                  </Typography>
                  {batchMode === 'manual' && (
                    <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
                  )}
                </Box>
              </EnhancedCard>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* JSON File Upload Mode */}
          {batchMode === 'file' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📁 JSON File Upload
              </Typography>
              
              {/* Sample JSON Format */}
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Expected JSON format:</Typography>
                <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {`{
  "person_id": "user_123",
  "messages": [
    {"text": "I'm feeling great today!", "timestamp": "2024-01-01T10:00:00Z"},
    {"text": "Work is stressing me out.", "timestamp": "2024-01-01T11:00:00Z"}
  ]
}`}
                </Typography>
              </Alert>

              {/* File Upload */}
              <Box sx={{ mb: 3 }}>
                <input
                  id="batch-file-input"
                  type="file"
                  accept=".json"
                  onChange={handleBatchFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="batch-file-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 2 }}
                  >
                    Choose JSON File
                  </Button>
                </label>

                {selectedFile && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="body2">
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </Typography>
                      <Tooltip title="Remove file">
                        <IconButton size="small" onClick={clearFile}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Manual Message Input Mode */}
          {batchMode === 'manual' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  ✏️ Multiple Message Input
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addMessage}
                  size="small"
                >
                  Add Message
                </Button>
              </Box>

              <Stack spacing={2} sx={{ mb: 3 }}>
                {messages.map((message, index) => (
                  <EnhancedCard key={message.id} sx={{ 
                    p: 2, 
                    bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                    border: `1px solid ${theme.palette.divider}`,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Typography variant="body2" sx={{ 
                        minWidth: 80, 
                        fontWeight: 600, 
                        color: 'primary.main',
                        mt: 1
                      }}>
                        Message {index + 1}
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder={`Enter message ${index + 1}...`}
                        value={message.text}
                        onChange={(e) => handleMessageChange(message.id, 'text', e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'background.paper',
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                              }
                            }
                          }
                        }}
                      />
                      <TextField
                        sx={{ 
                          minWidth: 120,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'background.paper',
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                              }
                            }
                          }
                        }}
                        placeholder="Person ID"
                        value={message.person_id}
                        onChange={(e) => handleMessageChange(message.id, 'person_id', e.target.value)}
                        variant="outlined"
                        size="small"
                      />
                      {messages.length > 1 && (
                        <Tooltip title="Remove message">
                          <IconButton 
                            size="small" 
                            onClick={() => removeMessage(message.id)}
                            color="error"
                            sx={{
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'dark' ? 'error.dark' : 'error.light',
                                color: 'error.contrastText'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </EnhancedCard>
                ))}
              </Stack>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="outlined"
                  onClick={clearMessages}
                  startIcon={<DeleteIcon />}
                  color="error"
                >
                  Clear All
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  {messages.filter(m => m.text.trim()).length} messages ready for analysis
                </Typography>
              </Box>
            </Box>
          )}

          {/* Analyze Button */}
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              onClick={handleBatchAnalysis}
              disabled={batchLoading || (batchMode === 'file' && !selectedFile) || (batchMode === 'manual' && messages.filter(m => m.text.trim()).length === 0)}
              startIcon={batchLoading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
              size="large"
              sx={{ px: 4 }}
            >
              {batchLoading ? 'Analyzing...' : 'Start Batch Analysis'}
            </Button>
          </Box>

          {/* Loading State */}
          {batchLoading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Analyzing your messages...
              </Typography>
            </Box>
          )}

          {/* Error State */}
          {batchError && <Alert severity="error" sx={{ mb: 3 }}>{batchError}</Alert>}

          {/* Batch Results */}
          {batchResult && (
            <Box sx={{ mt: 3 }}>
              {/* Analysis Summary */}
              <EnhancedCard sx={{ 
                mb: 3, 
                bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                border: `1px solid ${theme.palette.divider}`,
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📊 Analysis Summary
                    <Chip label={`${batchResult.summary.total_messages} messages`} color="primary" size="small" />
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                        🧠 Mental State Distribution:
                      </Typography>
                      {Object.entries(batchResult.summary.mental_state_distribution || {}).map(([state, count]) => (
                        <Typography key={state} variant="body2" sx={{ ml: 2, mb: 0.5, color: 'text.secondary' }}>
                          • <strong style={{ color: theme.palette.text.primary }}>{state}:</strong> {String(count)}
                        </Typography>
                      ))}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" sx={{ mb: 1, color: 'text.primary' }}>
                        <strong>💭 Average Sentiment:</strong> {batchResult.summary.average_sentiment}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1, color: 'text.primary' }}>
                        <strong>😊 Most Common Emotion:</strong> {batchResult.summary.most_common_emotion}
                      </Typography>
                      {batchResult.summary.time_span && (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 0.5, color: 'text.primary' }}>
                            <strong>⏰ Time Span:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ ml: 2, fontSize: '0.8rem', color: 'text.secondary' }}>
                            From: {batchResult.summary.time_span.start}
                          </Typography>
                          <Typography variant="body2" sx={{ ml: 2, fontSize: '0.8rem', color: 'text.secondary' }}>
                            To: {batchResult.summary.time_span.end}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>

                  {/* Success Message */}
                  {batchResult.success && (
                    <Alert severity="success" sx={{ mt: 2, borderRadius: '12px' }}>
                      {batchResult.message}
                    </Alert>
                  )}
                </CardContent>
              </EnhancedCard>

              {/* Interactive React Visualizations */}
              {(batchResult.mental_states_data?.length > 0 || batchResult.sentiment_trend_data?.length > 0) && (
                <EnhancedCard sx={{ 
                  mb: 3,
                  bgcolor: 'background.paper',
                  border: `1px solid ${theme.palette.divider}`,
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                      📈 Interactive Visualizations (React Charts)
                    </Typography>
                    <Grid container spacing={3}>
                      {batchResult.mental_states_data?.length > 0 && (
                        <Grid item xs={12} lg={6}>
                          <MentalStatesChart data={batchResult.mental_states_data} />
                        </Grid>
                      )}
                      {batchResult.sentiment_trend_data?.length > 0 && (
                        <Grid item xs={12} lg={6}>
                          <SentimentTrendChart data={batchResult.sentiment_trend_data} />
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </EnhancedCard>
              )}

              {/* Message Details Table */}
              {Array.isArray(batchResult.analyzed_messages) && batchResult.analyzed_messages.length > 0 && (
                <EnhancedCard sx={{
                  bgcolor: 'background.paper',
                  border: `1px solid ${theme.palette.divider}`,
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                      📝 Detailed Message Analysis
                    </Typography>
                    <TableContainer 
                      component={Paper} 
                      sx={{ 
                        maxHeight: 600,
                        bgcolor: 'background.paper',
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ 
                              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                              color: 'text.primary',
                              fontWeight: 'bold'
                            }}>
                              Timestamp
                            </TableCell>
                            <TableCell sx={{ 
                              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                              color: 'text.primary',
                              fontWeight: 'bold'
                            }}>
                              Text
                            </TableCell>
                            <TableCell sx={{ 
                              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                              color: 'text.primary',
                              fontWeight: 'bold'
                            }}>
                              Person ID
                            </TableCell>
                            <TableCell sx={{ 
                              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                              color: 'text.primary',
                              fontWeight: 'bold'
                            }}>
                              Sentiment
                            </TableCell>
                            <TableCell sx={{ 
                              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                              color: 'text.primary',
                              fontWeight: 'bold'
                            }}>
                              Emotion
                            </TableCell>
                            <TableCell sx={{ 
                              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                              color: 'text.primary',
                              fontWeight: 'bold'
                            }}>
                              Mental State
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {batchResult.analyzed_messages.map((msg, idx) => (
                            <TableRow 
                              key={idx}
                              sx={{
                                '&:nth-of-type(odd)': {
                                  bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                                },
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' ? 'grey.700' : 'grey.200',
                                }
                              }}
                            >
                              <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                {msg.timestamp}
                              </TableCell>
                              <TableCell sx={{ 
                                maxWidth: 200, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                color: 'text.primary'
                              }}>
                                {msg.text}
                              </TableCell>
                              <TableCell sx={{ color: 'text.primary' }}>
                                {msg.person_id}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={`${((msg.sentiment_score + 1) / 2 * 100).toFixed(0)}%`}
                                  size="small"
                                  color={msg.sentiment_score > 0 ? 'success' : msg.sentiment_score < 0 ? 'error' : 'default'}
                                  sx={{
                                    fontWeight: 'bold',
                                    '&.MuiChip-colorDefault': {
                                      bgcolor: theme.palette.mode === 'dark' ? 'grey.700' : 'grey.300',
                                      color: 'text.primary'
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={msg.primary_emotion}
                                  size="small"
                                  sx={{ 
                                    bgcolor: theme.palette.mode === 'dark' 
                                      ? `${getEmotionInfo(msg.primary_emotion).color}40`  // 40 = 25% opacity in hex
                                      : getEmotionInfo(msg.primary_emotion).bgColor,
                                    color: theme.palette.mode === 'dark' 
                                      ? getEmotionInfo(msg.primary_emotion).color
                                      : 'text.primary',
                                    fontWeight: 'bold',
                                    border: `1px solid ${getEmotionInfo(msg.primary_emotion).color}80`
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ color: 'text.primary', fontWeight: 500 }}>
                                {msg.mental_state}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </EnhancedCard>
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* 🎯 Floating Action Button for Quick Actions */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
        direction="up"
      >
        <SpeedDialAction
          icon={<RefreshIcon />}
          tooltipTitle="Clear All"
          onClick={() => {
            setText('');
            setResult(null);
            setAnalysisHistory([]);
            setBatchResult(null);
          }}
        />
        <SpeedDialAction
          icon={<AutoAwesomeIcon />}
          tooltipTitle="Random Template"
          onClick={() => {
            const randomTemplate = getRandomTemplate();
            handleTemplateSelect(randomTemplate.text);
          }}
        />
        <SpeedDialAction
          icon={<EmojiEmotionsIcon />}
          tooltipTitle="Toggle Real-time"
          onClick={() => setRealTimeAnalysis(!realTimeAnalysis)}
        />
      </SpeedDial>
    </Box>
  );
};