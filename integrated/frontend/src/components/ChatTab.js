import React, { useState } from 'react';
import { Box, Button, Typography, Paper, TextField, CircularProgress, Grid } from '@mui/material';
import { 
  MessageOutlined as MessageOutlinedIcon, 
  AutoAwesome as AutoAwesomeIcon, 
  CheckCircleOutline as CheckCircleOutlineIcon,
  Adjust as AdjustIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Mood as MoodIcon,
  SentimentVeryDissatisfied as SentimentVeryDissatisfiedIcon,
  SentimentDissatisfied as SentimentDissatisfiedIcon,
  SentimentNeutral as SentimentNeutralIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

function ChatTab() {
  const [text, setText] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showLoadingCard, setShowLoadingCard] = useState(false);
  const [chatMessages] = useState([]);

  const loadingTextVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.2 
      }
    }
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    setCharCount(newText.length);
    setWordCount(newText.trim().split(/\s+/).filter(word => word.length > 0).length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setResult(null);
    setShowLoadingCard(true); 

    try {
      const response = await fetch('http://localhost:9000/analyze-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          person_id: 'user_api'
        }),
      });

      const data = await response.json();
      console.log("Backend response data:", data);
      if (!response.ok) {
        throw new Error(data.error || 'Error analyzing text');
      }
      // Use backend response directly
      setResult(data);
    } catch (err) {
      console.error('Error analyzing text:', err);
    } finally {
      setLoading(false);
      setShowLoadingCard(false); 
    }
  };

  // Helper to determine sentiment text and color based on primary_emotion
  const getEmotionInfo = (emotion) => {
    switch ((emotion || '').toLowerCase()) {
      case 'joy':
        return { text: 'Joy', color: '#4CAF50', bgColor: '#E8F5E9', icon: <MoodIcon /> };
      case 'anger':
        return { text: 'Anger', color: '#9C27B0', bgColor: '#F3E5F5', icon: <SentimentVeryDissatisfiedIcon /> };
      case 'sadness':
        return { text: 'Sadness', color: '#2196F3', bgColor: '#E3F2FD', icon: <SentimentDissatisfiedIcon /> };
      case 'neutral':
      default:
        return { text: 'Neutral', color: '#FF9800', bgColor: '#FFF3E0', icon: <SentimentNeutralIcon /> };
    }
  };

  const emotionInfo = result ? getEmotionInfo(result.primary_emotion) : null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #E0F2F7 0%, #E8EAF6 50%, #F3E5F5 100%)',
        p: 2,
      }}
    >
      {/* Main Title and Subtitle */}
      <Typography
        variant="h3"
        component="h1"
        sx={{
          fontWeight: 700,
          color: '#673AB7', 
          mb: 1,
          textAlign: 'center',
        }}
      >
        Text Analyzer
      </Typography>
      <Typography
        variant="h6"
        sx={{
          color: '#616161',
          mb: 4,
          textAlign: 'center',
        }}
      >
        Analyze your text for sentiment, emotions, and insights
      </Typography>

      {/* Input Card */}
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: 600,
          width: '100%',
          borderRadius: 3,
          bgcolor: 'white',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          border: '1px solid #E0E0E0',
          mb: 3, 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MessageOutlinedIcon sx={{ mr: 1, color: '#616161' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#424242' }}>
            Enter Your Text
          </Typography>
        </Box>
        <TextField
          multiline
          rows={6}
          variant="outlined"
          placeholder="Type or paste your text here for analysis..."
          value={text}
          onChange={handleTextChange}
          disabled={loading}
          fullWidth
          sx={{
            mb: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              borderColor: '#E0E0E0',
              '&:hover fieldset': {
                borderColor: '#BDBDBD',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#9575CD',
              },
            },
          }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {charCount} characters • {wordCount} words
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            onClick={handleSubmit}
            disabled={!text.trim() || loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
            sx={{
              background: 'linear-gradient(45deg, #7E57C2 30%, #BA68C8 90%)', 
              color: 'white',
              py: 1.5,
              px: 3,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                opacity: 0.9,
                background: 'linear-gradient(45deg, #7E57C2 30%, #BA68C8 90%)',
              },
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze Text'}
          </Button>
        </Box>
      </Paper>

      {/* Loading Card (New) */}
      {showLoadingCard && (
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: 600,
            width: '100%',
            borderRadius: 3,
            bgcolor: 'white',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E0E0E0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            mt: 3, 
          }}
        >
          <CircularProgress 
            size={60} 
            sx={{
              color: '#673AB7',
              mb: 2,
              animationDuration: '800ms', 
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#424242', mb: 2 }}>
            Analyzing Your Text...
          </Typography>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            sx={{ textAlign: 'left', width: '100%', px: { xs: 0, sm: 2 } }}
          >
            <motion.div variants={loadingTextVariants}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Processing sentiment...
              </Typography>
            </motion.div>
            <motion.div variants={loadingTextVariants}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Detecting emotions...
              </Typography>
            </motion.div>
            <motion.div variants={loadingTextVariants}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Extracting key phrases...
              </Typography>
            </motion.div>
            <motion.div variants={loadingTextVariants}>
              <Typography variant="body1" color="text.secondary">
                Calculating readability...
              </Typography>
            </motion.div>
          </motion.div>
        </Paper>
      )}

      {/* Analysis Results */}
      {result && !showLoadingCard && (
        <Box sx={{ mt: 3, width: '100%', maxWidth: 600, mx: 'auto' }}>
          {/* Analysis Complete Banner */}
          <Box
            sx={{
              bgcolor: '#E8F5E9', // Light green
              p: 2,
              borderRadius: 2,
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              border: '1px solid #A5D6A7',
            }}
          >
            <CheckCircleOutlineIcon sx={{ color: '#4CAF50' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                Analysis Complete!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This text contains {wordCount} words with a {emotionInfo?.text.toLowerCase()} tone. The content appears to be well-structured and engaging.
              </Typography>
            </Box>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={2} mb={3}>
            {/* Sentiment Card */}
            <Grid item xs={6} sm={3}>
              <Paper 
                elevation={1} 
                sx={{
                  p: 2, 
                  textAlign: 'center', 
                  borderRadius: 2, 
                  bgcolor: emotionInfo?.bgColor || '#E0E0E0',
                  color: emotionInfo?.color || '#424242',
                  border: `1px solid ${emotionInfo?.color || '#BDBDBD'}`
                }}
              >
                <Box sx={{ fontSize: 40, mb: 1 }}>
                  {emotionInfo?.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {emotionInfo?.text}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sentiment
                </Typography>
              </Paper>
            </Grid>
            {/* Score Card */}
            <Grid item xs={6} sm={3}>
              <Paper 
                elevation={1} 
                sx={{
                  p: 2, 
                  textAlign: 'center', 
                  borderRadius: 2, 
                  bgcolor: '#E3F2FD', // Light blue
                  color: '#2196F3', // Blue
                  border: '1px solid #90CAF9'
                }}
              >
                <Box sx={{ fontSize: 40, mb: 1 }}>
                  <AdjustIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {result.emotion_score !== undefined ? (result.emotion_score * 100).toFixed(2) : '0.00'}/100
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Score
                </Typography>
              </Paper>
            </Grid>
            {/* Mental State Card */}
            <Grid item xs={6} sm={3}>
              <Paper 
                elevation={1} 
                sx={{
                  p: 2, 
                  textAlign: 'center', 
                  borderRadius: 2, 
                  bgcolor: '#FFFDE7', // Light yellow
                  color: '#FBC02D', // Amber
                  border: '1px solid #FFE082'
                }}
              >
                <Box sx={{ fontSize: 40, mb: 1 }}>
                  <ChatBubbleOutlineIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {result.mental_state || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Mental State
                </Typography>
              </Paper>
            </Grid>
            {/* Word Count Card */}
            <Grid item xs={6} sm={3}>
              <Paper 
                elevation={1} 
                sx={{
                  p: 2, 
                  textAlign: 'center', 
                  borderRadius: 2, 
                  bgcolor: '#F3E5F5', // Light purple
                  color: '#6A1B9A', // Purple
                  border: '1px solid #CE93D8'
                }}
              >
                <Box sx={{ fontSize: 40, mb: 1 }}>
                  <ChatBubbleOutlineIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {wordCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Word Count
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {chatMessages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2,
                backgroundColor: message.sender === 'user' ? 'primary.light' : 'grey.100',
                borderRadius: 2,
                maxWidth: '70%',
              }}
            >
              <Typography variant="body1">{message.text}</Typography>
            </Paper>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default ChatTab; 