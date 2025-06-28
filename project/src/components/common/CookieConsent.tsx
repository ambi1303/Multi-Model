import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Link,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  InfoIcon, 
  SettingsIcon, 
  CheckCircleIcon,
  WarningIcon
} from '../../utils/icons';
import { 
  EmotiAnalyzeCookies, 
  CookieCategory, 
  COOKIE_REGISTRY,
  type CookieInfo 
} from '../../utils/cookies';

interface CookieConsentProps {
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  onSavePreferences?: (preferences: Record<CookieCategory, boolean>) => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({
  onAcceptAll,
  onRejectAll,
  onSavePreferences
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<Record<CookieCategory, boolean>>({
    [CookieCategory.NECESSARY]: true,
    [CookieCategory.FUNCTIONAL]: false,
    [CookieCategory.ANALYTICS]: false,
    [CookieCategory.MARKETING]: false
  });

  useEffect(() => {
    const existingConsent = EmotiAnalyzeCookies.getConsent();
    if (!existingConsent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsents = {
      [CookieCategory.NECESSARY]: true,
      [CookieCategory.FUNCTIONAL]: true,
      [CookieCategory.ANALYTICS]: true,
      [CookieCategory.MARKETING]: true
    };
    
    EmotiAnalyzeCookies.setConsent(allConsents);
    setIsVisible(false);
    onAcceptAll?.();
  };

  const handleRejectAll = () => {
    const necessaryOnly = {
      [CookieCategory.NECESSARY]: true,
      [CookieCategory.FUNCTIONAL]: false,
      [CookieCategory.ANALYTICS]: false,
      [CookieCategory.MARKETING]: false
    };
    
    EmotiAnalyzeCookies.setConsent(necessaryOnly);
    setIsVisible(false);
    onRejectAll?.();
  };

  const handleSavePreferences = () => {
    EmotiAnalyzeCookies.setConsent(preferences);
    setIsVisible(false);
    onSavePreferences?.(preferences);
  };

  const handlePreferenceChange = (category: CookieCategory, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [category]: category === CookieCategory.NECESSARY ? true : enabled
    }));
  };

  const getCookiesByCategory = (category: CookieCategory): CookieInfo[] => {
    return COOKIE_REGISTRY.filter(cookie => cookie.category === category);
  };

  const getCategoryIcon = (category: CookieCategory) => {
    switch (category) {
      case CookieCategory.NECESSARY:
        return <CheckCircleIcon />;
      case CookieCategory.FUNCTIONAL:
        return <SettingsIcon />;
      case CookieCategory.ANALYTICS:
        return <InfoIcon />;
      case CookieCategory.MARKETING:
        return <WarningIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getCategoryColor = (category: CookieCategory) => {
    switch (category) {
      case CookieCategory.NECESSARY:
        return 'success';
      case CookieCategory.FUNCTIONAL:
        return 'primary';
      case CookieCategory.ANALYTICS:
        return 'info';
      case CookieCategory.MARKETING:
        return 'warning';
      default:
        return 'default';
    }
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
        p: 2
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 3,
          borderRadius: 2,
          maxWidth: 600,
          mx: 'auto',
          background: theme.palette.mode === 'dark'
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
          We use cookies to enhance your experience. Accept all or customize your preferences.
        </Typography>

        <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
          <Button variant="outlined" onClick={handleRejectAll} fullWidth={isMobile}>
            Reject All
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAcceptAll} 
            fullWidth={isMobile}
            sx={{ 
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
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