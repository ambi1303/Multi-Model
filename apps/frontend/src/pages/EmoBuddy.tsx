import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Stack,
  Avatar,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
} from '@mui/material';
import {  SendIcon, EmojiEmotionsIcon, CheckCircleIcon, InfoIcon, WarningIcon } from '../utils/icons';
import api from '../services/api'; // Use the centralized, secure api service
import { useAppStore } from '../store/useAppStore';

const EMO_BUDDY_API_PREFIX = '/emo-buddy';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const WelcomeComponent = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      Welcome to Emo Buddy - Your AI Therapeutic Companion
    </Typography>
    <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
      I'm here to provide emotional support and therapeutic guidance using evidence-based techniques.
      Everything is confidential and supportive.
    </Alert>
    <Typography variant="subtitle1" gutterBottom>What I can help with:</Typography>
    <List dense>
      <ListItem>
        <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" /></ListItemIcon>
        <ListItemText primary="Processing difficult emotions" />
      </ListItem>
      <ListItem>
        <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" /></ListItemIcon>
        <ListItemText primary="Managing stress and anxiety" />
      </ListItem>
      <ListItem>
        <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" /></ListItemIcon>
        <ListItemText primary="Developing coping strategies" />
      </ListItem>
    </List>
    <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
      <b>Important:</b> I'm an AI companion, not a replacement for professional help.
      If you're in crisis, please contact emergency services.
    </Alert>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
      Ready to chat? Just start typing!
    </Typography>
  </Box>
);

export const EmoBuddy: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [firstMessageSent, setFirstMessageSent] = useState(false);
  const lastEndSessionCall = useRef<number>(0);
  
  // Get user info from store
  const user = useAppStore((state) => state.user);
  const token = useAppStore((state) => state.token);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || !user?.id) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    const endpoint = sessionId ? `${EMO_BUDDY_API_PREFIX}/continue` : `${EMO_BUDDY_API_PREFIX}/start`;
    const body = sessionId
      ? { session_id: sessionId, user_message: currentInput }
      : { user_id: user.id, analysis_report: { transcription: currentInput, sentiment: { label: 'neutral', confidence: 0.5 }, emotions: [] } };

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      isUser: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);

    try {
      const response = await api.post(endpoint, body);
      
      if (response.data) {
        let responseContent = '';
        
        // Handle different response formats
        if (typeof response.data === 'string') {
          responseContent = response.data;
        } else if (response.data.response) {
          responseContent = response.data.response;
        } else if (response.data.message) {
          responseContent = response.data.message;
        } else {
          responseContent = JSON.stringify(response.data);
        }
        
        // Extract session_id if present
        if (responseContent.includes('session_id:') && !sessionId) {
          const lines = responseContent.split('\n');
          const sessionIdLine = lines.find(line => line.startsWith('session_id:'));
          if (sessionIdLine) {
            const newSessionId = sessionIdLine.split(':')[1].trim();
            setSessionId(newSessionId);
          }
          responseContent = lines.filter(line => !line.startsWith('session_id:')).join('\n').trim();
        }
        
        // Update the bot message with the response
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMessage.id ? { ...m, content: responseContent } : m
          )
        );
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      // Check if the last message is a typing indicator, if so replace it
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && !lastMessage.isUser && lastMessage.content === '') {
          return [...prev.slice(0, -1), errorBotMessage];
        }
        return [...prev, errorBotMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const callEndSession = async () => {
    if (!sessionId || !user?.id) return;
    const now = Date.now();
    if (now - lastEndSessionCall.current < 2000) return; // throttle: 2 seconds
    lastEndSessionCall.current = now;
    try {
      await api.post(`${EMO_BUDDY_API_PREFIX}/end`, {
        session_id: sessionId,
        user_id: user.id
      }, {
        headers: {
          'X-Session-Mode': 'CONTINUATION' // Indicate this is ending a session
        }
      });
    } catch (e) {
      // Optionally handle error
    }
  };

  const handleNewSession = async () => {
    await callEndSession();
    setSessionId(null);
    setMessages([]);
    setInputValue('');
    setError(null);
    setFirstMessageSent(false);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <EmojiEmotionsIcon />
          </Avatar>
          <Typography variant="h5" fontWeight={700}>
            Emo-Buddy - AI Companion
          </Typography>
        </Stack>
        <Box
          sx={(theme) => ({
            minHeight: 320,
            maxHeight: 400,
            overflowY: 'auto',
            mb: 2,
            background: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
            borderRadius: 2,
            p: 2,
            border: `1px solid ${theme.palette.divider}`,
          })}
        >
          {messages.length === 0 && !isLoading && <WelcomeComponent />}
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: msg.isUser ? 'flex-end' : 'flex-start',
                mb: 1,
              }}
            >
              <Box
                sx={{
                  bgcolor: msg.isUser ? 'primary.main' : 'action.hover',
                  color: msg.isUser ? 'primary.contrastText' : 'text.primary',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  maxWidth: '80%',
                  fontSize: '1rem',
                  boxShadow: 1,
                }}
              >
                {msg.content}
              </Box>
            </Box>
          ))}
          
          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Emo Buddy is typing...</Typography>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>
        {error && (
          <Typography color="error" mb={2}>{error}</Typography>
        )}
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            size="small"
            sx={{ borderRadius: 2 }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            sx={{ borderRadius: 2 }}
          >
            <SendIcon />
          </IconButton>
        </Stack>
        <Button
          variant="text"
          color="secondary"
          sx={{ mt: 2 }}
          onClick={handleNewSession}
        >
          New Session
        </Button>
      </Paper>
    </Box>
  );
};

export default EmoBuddy; 