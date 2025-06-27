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
import { GitHub, TwitterIcon, LinkedInIcon, EmailIcon } from '../../utils/icons';

export const Footer: React.FC = () => {
  const theme = useTheme();
  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        background: theme.palette.mode === 'dark'
          ? theme.palette.grey[900]
          : theme.palette.grey[50],
        color: theme.palette.text.primary,
        borderTop: 1,
        borderColor: 'divider',
        transition: 'background 0.3s',
        width: '100%',
      }}
    >
      <Box sx={{ 
        width: '100%',
        px: 2,
        py: 4,
      }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'flex-start' },
          }}
        >
          {/* Brand/Description/Social */}
          <Box sx={{ 
            flex: 2, 
            minWidth: 220, 
            maxWidth: { xs: '100%', md: '350px' },
          }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              <Box component="span" sx={{ color: 'primary.main' }}>EmotiAnalyze
              </Box>
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                lineHeight: 1.6,
              }}
            >
              Advanced sentiment analysis using multiple machine learning models for accurate emotion detection and text classification across various domains.
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              alignItems: 'center',
            }}>
              <IconButton href="#" color="inherit" aria-label="GitHub" size="small">
                <GitHub />
              </IconButton>
              <IconButton href="#" color="inherit" aria-label="Twitter" size="small">
                <TwitterIcon />
              </IconButton>
              <IconButton href="#" color="inherit" aria-label="LinkedIn" size="small">
                <LinkedInIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Models */}
          <Box sx={{ 
            flex: 1, 
            minWidth: 150, 
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Models
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 0.5,
            }}>
              <Link href="#" color="inherit" underline="hover" variant="body2">BERT</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">LSTM</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Transformer</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Ensemble</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Model Comparison</Link>
            </Box>
          </Box>

          {/* Resources */}
          <Box sx={{ 
            flex: 1, 
            minWidth: 150, 
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Resources
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 0.5,
            }}>
              <Link href="#" color="inherit" underline="hover" variant="body2">Documentation</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">API Reference</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Tutorials</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Datasets</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Research Papers</Link>
            </Box>
          </Box>

          {/* Support */}
          <Box sx={{ 
            flex: 1, 
            minWidth: 150,
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Support
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 0.5,
            }}>
              <Link href="#" color="inherit" underline="hover" variant="body2">Help Center</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Community</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Contact Us</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Report Issues</Link>
              <Link href="#" color="inherit" underline="hover" variant="body2">Service Status</Link>
            </Box>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ opacity: 0.3 }} />

      {/* Newsletter Row */}
      <Box sx={{ 
        width: '100%',
        px: 2,
        py: 3,
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        justifyContent: 'space-between', 
        gap: 2,
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            Stay Updated
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Get the latest updates on new models and features.
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'stretch', 
          width: { xs: '100%', md: 'auto' }, 
          maxWidth: { md: 400 },
          mt: { xs: 2, md: 0 },
          height: 48,
        }}>
          <InputBase
            placeholder="Enter your email"
            sx={{
              flex: 1,
              px: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '6px 0 0 6px',
              background: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.common.white,
              color: 'text.primary',
              fontSize: '0.875rem',
            }}
            inputProps={{ 'aria-label': 'Enter your email' }}
          />
          <Button
            variant="contained"
            color="primary"
            sx={{
              borderRadius: '0 6px 6px 0',
              px: 3,
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: 'none',
              minWidth: 'auto',
            }}
            endIcon={<EmailIcon />}
          >
            Subscribe
          </Button>
        </Box>
      </Box>

      <Divider sx={{ opacity: 0.3 }} />

      {/* Copyright/Policies Row */}
      <Box sx={{ 
        width: '100%',
        px: 2,
        py: 2,
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        justifyContent: 'space-between', 
        gap: 2,
      }}>
        <Typography variant="body2" color="text.secondary">
          © 2024 EmotiAnalyze. All rights reserved.
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          flexWrap: 'wrap', 
          mt: { xs: 1, md: 0 },
          alignItems: 'center',
        }}>
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