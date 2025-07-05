import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Badge,
  Fade,
  Slide,
  Stack,
  Avatar,
  Divider,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { styled, useTheme, alpha } from '@mui/material/styles';
import {
  ChatIcon,
  CloseIcon,
  SendIcon,
  EmojiEmotionsIcon,
  FullscreenExitIcon,
  FullscreenIcon,
  MicIcon,
} from '../../utils/icons';
import { speechApi, EmoBuddySession, EmoBuddyConversation } from '../../services/speechApi';
import { SpeechAnalysisResult } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';

// Styled Components
const NotificationBubble = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 20,
  right: 20,
  padding: theme.spacing(2),
  borderRadius: 20,
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: theme.palette.primary.contrastText,
  boxShadow: theme.shadows[8],
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  zIndex: 1400,
  maxWidth: 300,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[12],
  },
}));

const ChatWindow = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 100,
  right: 20,
  width: 380,
  height: 500,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: theme.shadows[16],
  zIndex: 1300,
  background: theme.palette.background.paper,
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const ChatMessages = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(1),
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  background: alpha(theme.palette.background.default, 0.5),
}));

const MessageBubble = styled(Box)<{ isUser: boolean }>(({ theme, isUser }) => ({
  maxWidth: '80%',
  padding: theme.spacing(1, 2),
  borderRadius: 16,
  background: isUser
    ? theme.palette.primary.main
    : theme.palette.grey[100],
  color: isUser
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  wordWrap: 'break-word',
  animation: 'slideIn 0.3s ease',
  '@keyframes slideIn': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
}));

const ChatInput = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface EmoBuddyPopupProps {
  analysisResult: SpeechAnalysisResult | null;
  onClose: () => void;
}

export const EmoBuddyPopup: React.FC<EmoBuddyPopupProps> = ({ analysisResult, onClose }) => {
  const theme = useTheme();
  const { showError, showSuccess } = useNotification();
  
  // State management
  const [showNotification, setShowNotification] = useState(true);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<EmoBuddySession | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSendCall = useRef<number>(0);
  const lastEndCall = useRef<number>(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat window opens
  useEffect(() => {
    if (showChatWindow && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showChatWindow, isMinimized]);

  // Handle notification click
  const handleNotificationClick = async () => {
    if (!analysisResult) {
      showError('No analysis result available for Emo Buddy session.');
      return;
    }

    setShowNotification(false);
    setIsLoading(true);

    try {
      // Check availability first
      const availability = await speechApi.checkEmoBuddyAvailability();
      if (!availability.available) {
        showError('Emo Buddy is currently unavailable. Please try again later.');
        return;
      }

      // Start session
      const sessionData = await speechApi.startEmoBuddySession(analysisResult);
      setSession(sessionData);
      
      // Add initial message
      const initialMessage: Message = {
        id: Date.now().toString(),
        content: sessionData.response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      setShowChatWindow(true);
      showSuccess('Emo Buddy session started! 🤖');
    } catch (error) {
      console.error('Failed to start Emo Buddy session:', error);
      showError('Failed to start Emo Buddy session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    const now = Date.now();
    if (now - lastSendCall.current < 2000) return; // throttle: 2 seconds
    lastSendCall.current = now;
    if (!inputValue.trim() || !session || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await speechApi.continueEmoBuddyConversation(session.session_id, userMessage.content);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);

      // Check if conversation should continue
      if (!response.should_continue) {
        setTimeout(() => {
          setShowEndDialog(true);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      showError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle ending session
  const handleEndSession = async () => {
    const now = Date.now();
    if (now - lastEndCall.current < 2000) return; // throttle: 2 seconds
    lastEndCall.current = now;
    if (!session) return;

    try {
      await speechApi.endEmoBuddySession(session.session_id);
      showSuccess('Emo Buddy session ended. Take care! 💙');
      setShowChatWindow(false);
      setShowEndDialog(false);
      onClose();
    } catch (error) {
      console.error('Failed to end session:', error);
      showError('Failed to end session properly.');
    }
  };

  // Handle key press in input
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Notification Bubble */}
      <Fade in={showNotification}>
        <NotificationBubble onClick={handleNotificationClick}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Badge badgeContent="!" color="error">
              <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                <EmojiEmotionsIcon />
              </Avatar>
            </Badge>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                Emo Buddy wants to talk! 🤖
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                I can help with your emotional wellbeing
              </Typography>
            </Box>
          </Stack>
        </NotificationBubble>
      </Fade>

      {/* Chat Window */}
      <Slide direction="up" in={showChatWindow}>
        <ChatWindow>
          {/* Header */}
          <ChatHeader>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                <EmojiEmotionsIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">Emo Buddy</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Your therapeutic companion
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <IconButton 
                size="small" 
                onClick={() => setIsMinimized(!isMinimized)}
                sx={{ color: 'inherit' }}
              >
                {isMinimized ? <FullscreenIcon /> : <FullscreenExitIcon />}
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => setShowEndDialog(true)}
                sx={{ color: 'inherit' }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </ChatHeader>

          {!isMinimized && (
            <>
              {/* Messages */}
              <ChatMessages>
                {messages.map((message) => (
                  <MessageBubble key={message.id} isUser={message.isUser}>
                    <Typography variant="body2">{message.content}</Typography>
                  </MessageBubble>
                ))}
                {isLoading && (
                  <MessageBubble isUser={false}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CircularProgress size={16} />
                      <Typography variant="body2">Emo Buddy is typing...</Typography>
                    </Stack>
                  </MessageBubble>
                )}
                <div ref={messagesEndRef} />
              </ChatMessages>

              {/* Input */}
              <ChatInput>
                <TextField
                  ref={inputRef}
                  fullWidth
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 20,
                    },
                  }}
                />
                <IconButton 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  color="primary"
                >
                  <SendIcon />
                </IconButton>
              </ChatInput>
            </>
          )}
        </ChatWindow>
      </Slide>

      {/* End Session Dialog */}
      <Dialog open={showEndDialog} onClose={() => setShowEndDialog(false)}>
        <DialogTitle>End Emo Buddy Session?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to end your therapeutic session with Emo Buddy? 
            Your conversation will be summarized and saved for your records.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndDialog(false)}>Continue Chat</Button>
          <Button onClick={handleEndSession} variant="contained" color="primary">
            End Session
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 