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
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Stack
} from '@mui/material';
import {
  analyzeSingleChatMessage,
  analyzeChatFile,
  analyzeBatchChatMessages
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
  TrendingUp,
  Delete,
  Send,
  Add,
  PlayArrow,
  Description,
  TextSnippet
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

interface MessageInput {
  id: string;
  text: string;
  person_id: string;
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
  const [batchMode, setBatchMode] = useState<'file' | 'manual'>('manual');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchAnalysisResult | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Manual message input state
  const [messages, setMessages] = useState<MessageInput[]>([
    { id: '1', text: '', person_id: 'user_1' },
    { id: '2', text: '', person_id: 'user_1' }
  ]);

  // Tab switch handler
  const handleTabChange = (_: any, value: string) => {
    setTab(value as 'simple' | 'batch');
    setResult(null);
    setBatchResult(null);
    setBatchError(null);
    setSelectedFile(null);
  };

  // Text change handler
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
    setCharCount(newText.length);
    setWordCount(newText.trim().split(/\s+/).filter(word => word.length > 0).length);
  };

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
  };

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

        {/* Sentiment Card */}
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
          <Card sx={{ bgcolor: '#FFF3E0', border: '1px solid #FF9800' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Avatar sx={{ bgcolor: '#FF9800', mx: 'auto', mb: 1 }}>
                <ChatBubbleOutline />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#FF9800' }}>
                {result.mental_state}
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
                <TextSnippet />
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
    setBatchLoading(true);
    setBatchError(null);

    try {
      let result;
      
      if (batchMode === 'file' && selectedFile) {
        console.log('Starting file analysis for:', selectedFile.name);
        result = await analyzeChatFile(selectedFile);
      } else if (batchMode === 'manual') {
        const validMessages = messages.filter(msg => msg.text.trim().length > 0);
        if (validMessages.length === 0) {
          throw new Error('Please add at least one message');
        }
        
        console.log('Starting manual batch analysis for:', validMessages.length, 'messages');
        const jsonData = convertMessagesToJson();
        
        // Create a temporary JSON file for the analysis
        const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const jsonFile = new File([jsonBlob], 'manual_messages.json', { type: 'application/json' });
        
        result = await analyzeChatFile(jsonFile);
      } else {
        throw new Error('Please select a file or add messages');
      }

      console.log('Batch analysis result:', result);
      setBatchResult(result);

    } catch (error) {
      console.error('❌ Batch analysis error:', error);
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

  const clearMessages = () => {
    setMessages([
      { id: '1', text: '', person_id: 'user_1' },
      { id: '2', text: '', person_id: 'user_1' }
    ]);
    setBatchResult(null);
    setBatchError(null);
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
            label="Single Message"
            value="simple"
            icon={<MessageOutlined />}
            iconPosition="start"
          />
          <Tab
            label="Batch Input"
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
            Batch Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Analyze multiple messages at once for comparative insights
          </Typography>

          {/* Batch Mode Selection */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* JSON File Upload Option */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  p: 3, 
                  cursor: 'pointer',
                  border: batchMode === 'file' ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  bgcolor: batchMode === 'file' ? '#f3f8ff' : 'white',
                  '&:hover': { bgcolor: '#f8f9fa' }
                }}
                onClick={() => setBatchMode('file')}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Avatar sx={{ 
                    bgcolor: batchMode === 'file' ? '#1976d2' : '#e0e0e0', 
                    width: 60, 
                    height: 60, 
                    mb: 2 
                  }}>
                    <Description sx={{ fontSize: 30 }} />
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
              </Card>
            </Grid>

            {/* Manual Message Input Option */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  p: 3, 
                  cursor: 'pointer',
                  border: batchMode === 'manual' ? '2px solid #4caf50' : '1px solid #e0e0e0',
                  bgcolor: batchMode === 'manual' ? '#f1f8e9' : 'white',
                  '&:hover': { bgcolor: '#f8f9fa' }
                }}
                onClick={() => setBatchMode('manual')}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Avatar sx={{ 
                    bgcolor: batchMode === 'manual' ? '#4caf50' : '#e0e0e0', 
                    width: 60, 
                    height: 60, 
                    mb: 2 
                  }}>
                    <TextSnippet sx={{ fontSize: 30 }} />
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
              </Card>
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
                  startIcon={<Add />}
                  onClick={addMessage}
                  size="small"
                >
                  Add Message
                </Button>
              </Box>

              <Stack spacing={2} sx={{ mb: 3 }}>
                {messages.map((message, index) => (
                  <Card key={message.id} sx={{ p: 2, bgcolor: '#fafafa' }}>
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
                      />
                      <TextField
                        sx={{ minWidth: 120 }}
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
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Card>
                ))}
              </Stack>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="outlined"
                  onClick={clearMessages}
                  startIcon={<Delete />}
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
              startIcon={batchLoading ? <CircularProgress size={20} /> : <PlayArrow />}
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