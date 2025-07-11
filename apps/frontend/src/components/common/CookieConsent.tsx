import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { InfoIcon } from '../../utils/icons';

const COOKIE_NAME = 'emoti-analyze-consent';

// Simple cookie helper functions
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const setCookie = (name: string, value: string, days: number) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
};

interface CookieConsentProps {
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({
  onAcceptAll,
  onRejectAll,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = getCookie(COOKIE_NAME);
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    setCookie(COOKIE_NAME, 'all', 365);
    setIsVisible(false);
    onAcceptAll?.();
  };

  const handleRejectAll = () => {
    setCookie(COOKIE_NAME, 'necessary', 365);
    setIsVisible(false);
    onRejectAll?.();
  };

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 3,
          borderRadius: 2,
          maxWidth: 600,
          mx: 'auto',
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <InfoIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Cookie Preferences
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ mb: 3 }}>
          We use cookies to enhance your experience. Accept all or customize
          your preferences.
        </Typography>

        <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
          <Button
            variant="outlined"
            onClick={handleRejectAll}
            fullWidth={isMobile}
          >
            Reject All
          </Button>
          <Button
            variant="contained"
            onClick={handleAcceptAll}
            fullWidth={isMobile}
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            }}
          >
            Accept All
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default CookieConsent; 