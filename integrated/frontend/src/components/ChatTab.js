import React, { useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress, Paper, TextField } from '@mui/material';
import { Send, Replay } from '@mui/icons-material';

function ChatTab() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

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
      if (!response.ok) {
        throw new Error(data.error || 'Error analyzing text');
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Chat Analysis</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          multiline
          rows={4}
          variant="outlined"
          label="Enter your text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
          fullWidth
        />
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!text.trim() || loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </Button>
          {result && (
            <Button
              variant="outlined"
              onClick={() => {
                setText('');
                setResult(null);
                setError(null);
              }}
              startIcon={<Replay />}
            >
              Clear
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 3, width: '100%', maxWidth: 500, mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        {result && (
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', border: '2px solid', borderColor: 'primary.main', borderRadius: 2 }}>
            {(result.sentiment || result.confidence || result.sentiment_score !== undefined || result.primary_emotion || result.mental_state) ? (
              <>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>Analysis Results</Typography>
                {result.sentiment_score !== undefined && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Sentiment Score</Typography>
                    <Typography variant="h6" color={result.sentiment_score > 0 ? 'success.main' : result.sentiment_score < 0 ? 'error.main' : 'warning.main'}>
                      {result.sentiment_score.toFixed(2)}
                    </Typography>
                  </Box>
                )}
                {result.primary_emotion && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Primary Emotion</Typography>
                    <Typography variant="h6" color="primary">{result.primary_emotion}</Typography>
                  </Box>
                )}
                {result.emotion_score !== undefined && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Emotion Score</Typography>
                    <Typography variant="h6" color="primary">{(result.emotion_score * 100).toFixed(1)}%</Typography>
                  </Box>
                )}
                {result.mental_state && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Mental State</Typography>
                    <Typography variant="h6" color="primary">{result.mental_state}</Typography>
                  </Box>
                )}
                {result.keywords && result.keywords.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Key Topics</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 1 }}>
                      {result.keywords.map((keyword, index) => (
                        <Paper
                          key={index}
                          elevation={1}
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            borderRadius: 1,
                          }}
                        >
                          {keyword}
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            ) : (
              <>
                <Typography color="warning.main">No sentiment detected or unexpected response.</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Raw JSON:</Typography>
                <Box component="pre" sx={{ background: '#eee', color: '#333', p: 2, borderRadius: 1, textAlign: 'left', fontSize: '0.95em', mt: 1 }}>
                  {JSON.stringify(result, null, 2)}
                </Box>
              </>
            )}
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default ChatTab; 