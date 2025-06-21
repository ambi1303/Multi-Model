import React from 'react';
import {
  Box,
  Typography,
  Link,
  Divider,
  IconButton,
  InputBase,
  Button,
  useTheme,
} from '@mui/material';
import { GitHub, Twitter, LinkedIn, Email } from '@mui/icons-material';

export const Footer: React.FC = () => {
  const theme = useTheme();
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        background: theme.palette.mode === 'dark'
          ? theme.palette.grey[900]
          : theme.palette.grey[50],
        color: theme.palette.text.primary,
        borderTop: 1,
        borderColor: 'divider',
        transition: 'background 0.3s',
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 6 }, py: 6 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 4, md: 0 },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'flex-start' },
          }}
        >
          {/* Brand/Description/Social */}
          <Box sx={{ flex: 2, minWidth: 220, mb: { xs: 4, md: 0 } }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              <Box component="span" sx={{ color: 'primary.main' }}>EmotiAnalyze
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Advanced sentiment analysis using multiple machine learning models for accurate emotion detection and text classification across various domains.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton href="#" color="inherit" aria-label="GitHub" size="small">
                <GitHub fontSize="inherit" />
              </IconButton>
              <IconButton href="#" color="inherit" aria-label="Twitter" size="small">
                <Twitter fontSize="inherit" />
              </IconButton>
              <IconButton href="#" color="inherit" aria-label="LinkedIn" size="small">
                <LinkedIn fontSize="inherit" />
              </IconButton>
            </Box>
          </Box>

          {/* Models */}
          <Box sx={{ flex: 1, minWidth: 150, mb: { xs: 3, md: 0 } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Models
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Link href="#" color="inherit" underline="hover" variant="body2">BERT</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">LSTM</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Transformer</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Ensemble</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Model Comparison</Link>
            </Box>
          </Box>

          {/* Resources */}
          <Box sx={{ flex: 1, minWidth: 150, mb: { xs: 3, md: 0 } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Resources
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Link href="#" color="inherit" underline="hover" variant="body2">Documentation</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">API Reference</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Tutorials</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Datasets</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Research Papers</Link>
            </Box>
          </Box>

          {/* Support */}
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Support
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Link href="#" color="inherit" underline="hover" variant="body2">Help Center</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Community</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Contact Us</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Report Issues</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Service Status</Link>
            </Box>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 0, opacity: 0.2 }} />

      {/* Newsletter Row */}
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 6 }, py: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            Stay Updated
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Get the latest updates on new models and features.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', width: { xs: '100%', md: 400 }, mt: { xs: 2, md: 0 } }}>
          <InputBase
            placeholder="Enter your email"
            sx={{
              flex: 1,
              px: 2,
              py: 1.2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '6px 0 0 6px',
              background: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.common.white,
              color: 'text.primary',
              fontSize: '1rem',
            }}
            inputProps={{ 'aria-label': 'Enter your email' }}
          />
          <Button
            variant="contained"
            color="primary"
            sx={{
              borderRadius: '0 6px 6px 0',
              px: 3,
              py: 1.5,
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: 'none',
            }}
            endIcon={<Email />}
          >
            Subscribe
          </Button>
        </Box>
      </Box>

      <Divider sx={{ my: 0, opacity: 0.2 }} />

      {/* Copyright/Policies Row */}
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 6 }, py: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          © 2024 EmotiAnalyze. All rights reserved.
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: { xs: 1, md: 0 } }}>
          <Link href="#" color="text.secondary" underline="hover" variant="body2">
            Privacy Policy
          </Link>
          <Link href="#" color="text.secondary" underline="hover" variant="body2">
            Terms of Service
          </Link>
          <Link href="#" color="text.secondary" underline="hover" variant="body2">
            Cookie Policy
          </Link>
        </Box>
      </Box>
    </Box>
  );
};