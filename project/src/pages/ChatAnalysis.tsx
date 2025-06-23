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
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Card,
  CardContent,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  analyzeSingleChatMessage, 
  analyzeBatchChatMessages,
  getBatchChatVisualizations,
  analyzeChatFile,
  CompleteAnalysisResponse
} from '../services/api';
import MentalStatesChart from '../components/charts/MentalStatesChart';
import SentimentTrendChart from '../components/charts/SentimentTrendChart';
import {
  MessageOutlined,
  Analytics,
  Mood,
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  ChatBubbleOutline,
  CloudUpload,
  Visibility,
  TrendingUp,
  Delete,
  Send
} from '@mui/icons-material';

interface SingleAnalysisResult {
  primary_emotion: string;
  sentiment_score: number;
  mental_state: string;
  emotion_score?: number;
  error?: string;
}

interface BatchAnalysisResult {
  // Overall summary (from visualizer.generate_summary)
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
  // Table analysis for each message (from emotion_detector.analyze_messages)
  analyzed_messages: Array<{
    timestamp: string;
    text: string;
    person_id: string;
    sentiment_score: number;
    primary_emotion: string;
    emotion_score: number;
    mental_state: string;
  }>;
  // Chart data for React components
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

interface VisualizationData {
  mentalStatesImg: string;
  sentimentTrendImg: string;
  summary: any;
}

export const ChatAnalysis: React.FC = () => {
  const [tab, setTab] = useState<'simple' | 'batch'>('simple');
  
  // Single message state
  const [text, setText] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SingleAnalysisResult | null>(null);
  
  // Batch analysis state
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchAnalysisResult | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchFileName, setBatchFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Tab switch handler
  const handleTabChange = (_: any, value: string) => {
    setTab(value as 'simple' | 'batch');
    setResult(null);
    setBatchResult(null);
    setBatchError(null);
    setBatchFileName('');
    setSelectedFile(null);
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
    
    try {
      const data = await analyzeSingleChatMessage({ text: text.trim() });
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message, primary_emotion: '', sentiment_score: 0, mental_state: '' });
    } finally {
      setLoading(false);
    }
  };

  // File selection handler (just selects file, doesn't analyze)
  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBatchError(null);
    setBatchResult(null);
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    setBatchFileName(file.name);
  };

  // Note: Visualizations are now included directly in the analysis response

  // Helper function to get emotion info
  const getEmotionInfo = (emotion: string) => {
    const emotionLower = (emotion || '').toLowerCase();
    switch (emotionLower) {
      case 'joy':
      case 'happy':
        return { text: 'Joy', color: '#4CAF50', bgColor: '#E8F5E9', icon: <Mood /> };
      case 'anger':
      case 'angry':
        return { text: 'Anger', color: '#F44336', bgColor: '#FFEBEE', icon: <SentimentVeryDissatisfied /> };
      case 'sadness':
      case 'sad':
        return { text: 'Sadness', color: '#2196F3', bgColor: '#E3F2FD', icon: <SentimentDissatisfied /> };
      case 'fear':
      case 'fearful':
        return { text: 'Fear', color: '#9C27B0', bgColor: '#F3E5F5', icon: <SentimentVeryDissatisfied /> };
      case 'surprise':
      case 'surprised':
        return { text: 'Surprise', color: '#FF9800', bgColor: '#FFF3E0', icon: <SentimentNeutral /> };
      case 'neutral':
      default:
        return { text: 'Neutral', color: '#607D8B', bgColor: '#ECEFF1', icon: <SentimentNeutral /> };
    }
  };

  // Render analysis result cards
  const renderAnalysisCards = (result: SingleAnalysisResult) => {
    if (result.error) {
      return <Alert severity="error">{result.error}</Alert>;
    }

    const emotionInfo = getEmotionInfo(result.primary_emotion);
    const sentimentPercentage = ((result.sentiment_score + 1) / 2 * 100).toFixed(0);

    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {/* Emotion Card */}
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: emotionInfo.bgColor, border: `1px solid ${emotionInfo.color}` }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Avatar sx={{ bgcolor: emotionInfo.color, mx: 'auto', mb: 1 }}>
                {emotionInfo.icon}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, color: emotionInfo.color }}>
                {emotionInfo.text}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Primary Emotion
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Sentiment Score Card */}
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#E3F2FD', border: '1px solid #2196F3' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Avatar sx={{ bgcolor: '#2196F3', mx: 'auto', mb: 1 }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2196F3' }}>
                {sentimentPercentage}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sentiment Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Mental State Card */}
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#FFFDE7', border: '1px solid #FBC02D' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Avatar sx={{ bgcolor: '#FBC02D', mx: 'auto', mb: 1 }}>
                <ChatBubbleOutline />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#F57C00' }}>
                {result.mental_state || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mental State
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Word Count Card */}
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#F3E5F5', border: '1px solid #9C27B0' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Avatar sx={{ bgcolor: '#9C27B0', mx: 'auto', mb: 1 }}>
                <MessageOutlined />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#9C27B0' }}>
                {wordCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Word Count
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const handleBatchAnalysis = async () => {
    if (!selectedFile) return;

    setBatchLoading(true);
    setBatchError(null);
    
    try {
      console.log('Starting complete analysis for:', selectedFile.name);
      
      // Complete analysis (matches main.py flow exactly)
      const result = await analyzeChatFile(selectedFile);
      console.log('Complete analysis result:', result);
      console.log('✅ Overall Summary:', result.summary);
      console.log('✅ Message Analysis:', result.analyzed_messages?.length, 'messages');
      console.log('✅ Mental States Data:', result.mental_states_data?.length, 'data points');
      console.log('✅ Sentiment Trend Data:', result.sentiment_trend_data?.length, 'data points');
      
      setBatchResult(result);
      console.log('✅ Results displayed successfully');
      
    } catch (error) {
      console.error('❌ Complete analysis error:', error);
      setBatchError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setBatchLoading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setBatchResult(null);
    setBatchError(null);
    // Clear the file input
    const fileInput = document.getElementById('batch-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#673AB7', mb: 1 }}>
          🔍 Chat Message Analyzer
        </Typography>
        <Typography variant="h6" sx={{ color: '#616161' }}>
          Analyze your messages for sentiment, emotions, and mental state insights
        </Typography>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
          <Tab 
            label="Simple Analysis" 
            value="simple" 
            icon={<MessageOutlined />}
            iconPosition="start"
          />
          <Tab 
            label="Batch Analysis" 
            value="batch" 
            icon={<Analytics />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Simple Analysis Tab */}
      {tab === 'simple' && (
        <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
          <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MessageOutlined color="primary" />
            Simple Message Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Quick analysis using the basic chat service (chat/chat/services → port 9000)
          </Typography>
          
          <form onSubmit={handleSimpleSubmit}>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={text}
              onChange={handleTextChange}
              placeholder="Type your message here..."
              disabled={loading}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Characters: {charCount} | Words: {wordCount}
              </Typography>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading || !text.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <MessageOutlined />}
              >
                {loading ? 'Analyzing...' : 'Analyze Message'}
              </Button>
            </Box>
          </form>

          {result && renderAnalysisCards(result)}
        </Paper>
      )}

      {/* Batch Analysis Tab */}
      {tab === 'batch' && (
        <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
          <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Analytics color="primary" />
            Batch Chat Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload a JSON file with multiple messages for comprehensive analysis and visualizations (mental_state_analyzer → port 8003)
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
                startIcon={<CloudUpload />}
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
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Button
                  variant="contained"
                  onClick={handleBatchAnalysis}
                  disabled={batchLoading}
                  startIcon={batchLoading ? <CircularProgress size={20} /> : <Send />}
                  sx={{ mb: 2 }}
                >
                  {batchLoading ? 'Analyzing...' : 'Analyze File'}
                </Button>
              </Box>
            )}
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
              <Card sx={{ mb: 3, bgcolor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📊 Analysis Summary
                    <Chip label={`${batchResult.summary.total_messages} messages`} color="primary" size="small" />
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        🧠 Mental State Distribution:
                      </Typography>
                      {Object.entries(batchResult.summary.mental_state_distribution || {}).map(([state, count]) => (
                        <Typography key={state} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                          • <strong>{state}:</strong> {String(count)}
                        </Typography>
                      ))}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>💭 Average Sentiment:</strong> {batchResult.summary.average_sentiment}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>😊 Most Common Emotion:</strong> {batchResult.summary.most_common_emotion}
                      </Typography>
                      {batchResult.summary.time_span && (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>⏰ Time Span:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ ml: 2, fontSize: '0.8rem' }}>
                            From: {batchResult.summary.time_span.start}
                          </Typography>
                          <Typography variant="body2" sx={{ ml: 2, fontSize: '0.8rem' }}>
                            To: {batchResult.summary.time_span.end}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>

                  {/* Success Message */}
                  {batchResult.success && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      {batchResult.message}
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Interactive React Visualizations */}
              {(batchResult.mental_states_data?.length > 0 || batchResult.sentiment_trend_data?.length > 0) && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
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
                </Card>
              )}

              {/* Message Details Table */}
              {Array.isArray(batchResult.analyzed_messages) && batchResult.analyzed_messages.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      📝 Detailed Message Analysis
                    </Typography>
                    <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Text</TableCell>
                            <TableCell>Person ID</TableCell>
                            <TableCell>Sentiment</TableCell>
                            <TableCell>Emotion</TableCell>
                            <TableCell>Mental State</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {batchResult.analyzed_messages.map((msg, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontSize: '0.75rem' }}>{msg.timestamp}</TableCell>
                              <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {msg.text}
                              </TableCell>
                              <TableCell>{msg.person_id}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={`${((msg.sentiment_score + 1) / 2 * 100).toFixed(0)}%`}
                                  size="small"
                                  color={msg.sentiment_score > 0 ? 'success' : msg.sentiment_score < 0 ? 'error' : 'default'}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={msg.primary_emotion}
                                  size="small"
                                  sx={{ bgcolor: getEmotionInfo(msg.primary_emotion).bgColor }}
                                />
                              </TableCell>
                              <TableCell>{msg.mental_state}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};