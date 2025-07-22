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
import { SpeechAnalysisResult, User } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { BoxProps } from '@mui/material/Box';
import { shouldForwardProp } from '@mui/system';
import { useAppStore } from '../../store/useAppStore';

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

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isUser' && shouldForwardProp(prop as keyof BoxProps),
})<{ isUser: boolean }>(({ theme, isUser }) => ({
  maxWidth: '80%',
  padding: theme.spacing(1, 2),
  borderRadius: 16,
  background: isUser
    ? theme.palette.primary.main
    : theme.palette.action.hover,
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
  const user = useAppStore((state) => state.user);
  
  // State management
  const [showNotification, setShowNotification] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(true); // Show window immediately
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<EmoBuddySession | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showStartPrompt, setShowStartPrompt] = useState(true); // NEW: Show start prompt initially
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSendCall = useRef<number>(0);
  const lastEndCall = useRef<number>(0);
  const initializationInProgress = useRef<boolean>(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat window opens and session is active
  useEffect(() => {
    if (showChatWindow && !isMinimized && session) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showChatWindow, isMinimized, session]);

  // Auto-start session and send transcription when component mounts
  useEffect(() => {
    // REMOVED: Automatic EmoBuddy initialization
    // The new flow shows analysis results first, then user can choose to start EmoBuddy
  }, []);

  // Handle manual EmoBuddy start from analysis results
  const handleStartEmoBuddy = async () => {
    // Prevent duplicate initialization
    if (initializationInProgress.current || isInitializing || session || !analysisResult || !user?.id) {
      return;
    }

    initializationInProgress.current = true;
    setIsInitializing(true);
    setShowStartPrompt(false); // Hide start prompt

    // Show temporary message about starting EmoBuddy
    const startingMessage: Message = {
      id: 'starting-emobuddy',
      content: 'Starting EmoBuddy session based on your speech analysis...',
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([startingMessage]);

    try {
      // Check availability first
      const availability = await speechApi.checkEmoBuddyAvailability();
      if (!availability.available) {
        showError('Emo Buddy is currently unavailable. Please try again later.');
        return;
      }

      // Start EmoBuddy session using new API method
      let sessionData: EmoBuddySession | null = null;
      let retries = 0;
      const maxRetries = 3;
      
      while (!sessionData && retries < maxRetries) {
        try {
          sessionData = await speechApi.startEmoBuddyFromAnalysis(analysisResult, user.id);
          break;
        } catch (error: any) {
          retries++;
          if (retries < maxRetries && error?.response?.status !== 400) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
            continue;
          } else {
            throw error;
          }
        }
      }
      
      // Validate session data
      if (!sessionData?.session_id || !sessionData?.response) {
        showError('Failed to start Emo Buddy session. Invalid response.');
        return;
      }
      
      setSession(sessionData);
      
      // Add transcription as first user message
      const transcriptionMessage: Message = {
        id: Date.now().toString(),
        content: analysisResult.transcribed_text || "I just completed a speech analysis.",
        isUser: true,
        timestamp: new Date(),
      };
      
      // Add initial bot response
      const initialBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: sessionData.response,
        isUser: false,
        timestamp: new Date(),
      };
      
      // Replace starting message with actual conversation
      setMessages([transcriptionMessage, initialBotMessage]);
      showSuccess('Emo Buddy is now ready to help you! 🤖');
      setShowChatWindow(true); // Ensure chat window is visible
    } catch (error) {
      console.error('Failed to start Emo Buddy session:', error);
      showError('Failed to start Emo Buddy session. Please try again.');
      setMessages([]); // Clear starting message on error
      setShowStartPrompt(true); // Show start prompt again on error
    } finally {
      setIsInitializing(false);
      initializationInProgress.current = false;
    }
  };

  // REMOVED: Old handleAutoStart method - replaced with handleStartEmoBuddy

  // Handle notification click (now starts EmoBuddy manually)
  const handleNotificationClick = async () => {
    // Prevent multiple concurrent starts
    if (initializationInProgress.current || isInitializing) {
      return;
    }
    
    // If session already exists, show chat window
    if (session) {
      setShowChatWindow(true);
      return;
    }
    
    // Otherwise start EmoBuddy
    await handleStartEmoBuddy();
  };

  // Handle sending message
  const handleSendMessage = async () => {
    const now = Date.now();
    if (now - lastSendCall.current < 2000) return; // throttle: 2 seconds
    lastSendCall.current = now;
    
    if (!inputValue.trim() || !session || isLoading || isInitializing) return;
    if (!user?.id) {
      showError('You must be logged in to use Emo Buddy.');
      return;
    }

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
      const response = await speechApi.continueEmoBuddyConversation(session.session_id, userMessage.content, user.id);
      
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
    if (!session || isLoading) return;
    if (!user?.id) {
      showError('You must be logged in to use Emo Buddy.');
      return;
    }

    setIsLoading(true);

    try {
      const endData = await speechApi.endEmoBuddySession(session.session_id, user.id);
      showSuccess(`Emo Buddy session ended. Summary: ${endData.summary}`);
      setShowChatWindow(false);
      setShowEndDialog(false);
      onClose();
    } catch (error) {
      console.error('Failed to end Emo Buddy session:', error);
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

  // Render start prompt for EmoBuddy
  const renderStartPrompt = () => (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'primary.main', width: 64, height: 64 }}>
        <EmojiEmotionsIcon sx={{ fontSize: 32 }} />
      </Avatar>
      
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Ready to Chat with Emo Buddy?
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
        Based on your speech analysis, Emo Buddy can provide personalized emotional support and therapeutic guidance.
      </Typography>
      
      <Box sx={{ mb: 3, p: 2, bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
          📝 Your Speech: "{analysisResult?.transcribed_text?.slice(0, 100)}..."
        </Typography>
        <Typography variant="body2" color="text.secondary">
          😊 Emotion: {analysisResult?.sentiment?.label} • 🎯 Confidence: {Math.round((analysisResult?.sentiment?.confidence || 0) * 100)}%
        </Typography>
      </Box>
      
      <Button
        onClick={handleStartEmoBuddy}
        disabled={isInitializing}
        startIcon={isInitializing ? <CircularProgress size={20} /> : <EmojiEmotionsIcon />}
        fullWidth
        sx={{ mb: 2 }}
      >
        {isInitializing ? 'Starting Emo Buddy...' : 'Start Emo Buddy Session'}
      </Button>
      
      <Typography variant="caption" color="text.secondary">
        💡 Emo Buddy uses evidence-based therapy techniques (CBT, DBT, ACT) to provide personalized support
      </Typography>
    </Box>
  );

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
                {/* Show start prompt when no session exists */}
                {showStartPrompt && !session && messages.length === 0 && (
                  renderStartPrompt()
                )}
                
                {/* Show loading state when first starting */}
                {messages.length === 0 && isLoading && !showStartPrompt && (
                  <>
                    <MessageBubble isUser={false}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CircularProgress size={16} />
                        <Typography variant="body2">Starting Emo Buddy session...</Typography>
                      </Stack>
                    </MessageBubble>
                  </>
                )}
                
                {/* Show messages */}
                {messages.map((message) => (
                  <MessageBubble key={message.id} isUser={message.isUser}>
                    <Typography variant="body2">{message.content}</Typography>
                  </MessageBubble>
                ))}
                
                {/* Show typing indicator when continuing conversation */}
                {messages.length > 0 && isLoading && (
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
                  placeholder={session ? "Type your message..." : "Start Emo Buddy session first..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading || !session} // Disable input until session starts
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 20,
                    },
                  }}
                />
                <IconButton 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading || !session}
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
      <Dialog 
        open={showEndDialog} 
        onClose={() => setShowEndDialog(false)}
        aria-labelledby="end-session-dialog-title"
        aria-describedby="end-session-dialog-description"
        disableRestoreFocus={false}
        keepMounted={false}
      >
        <DialogTitle id="end-session-dialog-title">End Emo Buddy Session?</DialogTitle>
        <DialogContent>
          <Typography id="end-session-dialog-description">
            Are you sure you want to end your therapeutic session with Emo Buddy? 
            Your conversation will be summarized and saved for your records.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndDialog(false)} autoFocus>Continue Chat</Button>
          <Button onClick={handleEndSession} variant="contained" color="primary">
            End Session
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 