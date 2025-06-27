import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { PlayArrowIcon, SearchIcon } from '../../utils/icons';

// Optimized floating element with reduced animation complexity
const FloatingElement: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ y: [-5, 5, -5] }}
    transition={{
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
  >
    {children}
  </motion.div>
);

// Optimized gradient orb with delayed animation
const GradientOrb: React.FC<{ size: number; color: string; top: string; left: string; delay?: number }> = ({ 
  size, color, top, left, delay = 1 
}) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 0.4 }}
    transition={{ duration: 0.8, delay }}
    style={{
      position: 'absolute',
      top,
      left,
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: `${color}30`,
      backgroundImage: `radial-gradient(circle, ${color}30 0%, ${color}10 70%, transparent 100%)`,
      filter: 'blur(2px)',
      zIndex: 0,
      willChange: 'transform',
    }}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        backgroundColor: `${color}40`,
        backgroundImage: `conic-gradient(from 0deg, ${color}40, transparent, ${color}40)`,
      }}
    />
  </motion.div>
);

export const HeroSection: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0f0f23',
        backgroundImage: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
        margin: 0,
        padding: 0,
      }}
    >
      {/* Delayed Background Orbs - don't block LCP */}
      <GradientOrb size={300} color="#3b82f6" top="10%" left="80%" delay={1.5} />
      <GradientOrb size={200} color="#8b5cf6" top="60%" left="10%" delay={2} />
      <GradientOrb size={150} color="#06b6d4" top="20%" left="20%" delay={2.5} />
      <GradientOrb size={250} color="#10b981" top="70%" left="70%" delay={3} />

      <Container 
        maxWidth={false}
        sx={{ 
          position: 'relative', 
          zIndex: 1,
          width: '100%',
          maxWidth: '1400px',
          px: { xs: 2, sm: 3, md: 4, lg: 6 },
          mx: 'auto',
        }}
      >
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center" sx={{ minHeight: '100vh' }}>
          <Grid item xs={12} md={6}>
            {/* Critical content - no animation delays */}
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography
                variant="h1"
                className="hero-heading"
                sx={{
                  fontSize: { 
                    xs: '2.5rem', 
                    sm: '3.5rem', 
                    md: '4rem', 
                    lg: '5rem',
                    xl: '6rem'
                  },
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: { xs: 2, md: 3 },
                  lineHeight: 1.1,
                }}
              >
                Emotion
                <br />
                Intelligence
                <br />
                <Box
                  component="span"
                  className="highlight"
                  sx={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Unleashed
                </Box>
              </Typography>

              <Typography
                variant="h5"
                className="hero-subtitle"
                sx={{
                  fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem', lg: '1.8rem' },
                  color: 'rgba(255, 255, 255, 0.8)',
                  mb: { xs: 3, md: 4 },
                  lineHeight: 1.6,
                  fontWeight: 300,
                  maxWidth: { xs: '100%', md: '90%' },
                }}
              >
                Harness the power of AI to decode emotions across video, speech, and text. 
                Transform human insights into actionable intelligence.
              </Typography>

              <Box 
                className="hero-buttons" 
                sx={{ 
                  display: 'flex', 
                  gap: { xs: 2, sm: 3 }, 
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  justifyContent: { xs: 'center', md: 'flex-start' },
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={onGetStarted}
                  startIcon={<PlayArrowIcon />}
                  className="btn-primary"
                  sx={{
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
                    minWidth: { xs: '100%', sm: 'auto' },
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      boxShadow: '0 15px 40px rgba(59, 130, 246, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Start Analyzing
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<SearchIcon />}
                  className="btn-secondary"
                  sx={{
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    fontWeight: 600,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    minWidth: { xs: '100%', sm: 'auto' },
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.6)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Explore Features
                </Button>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            {/* Enhanced right side content with better mobile responsiveness */}
            <Box 
              sx={{ 
                position: 'relative', 
                height: { xs: '400px', sm: '500px', md: '600px' },
                display: { xs: 'none', md: 'block' } // Hide on mobile for better performance
              }}
            >
              <FloatingElement delay={1}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  style={{
                    position: 'absolute',
                    top: '10%',
                    left: '20%',
                    width: '200px',
                    height: '120px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                    borderRadius: '16px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'white', mb: 1, textAlign: 'center' }}>
                    Video Analysis
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                    Real-time emotion detection
                  </Typography>
                </motion.div>
              </FloatingElement>

              <FloatingElement delay={1.5}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5, duration: 0.8 }}
                  style={{
                    position: 'absolute',
                    top: '40%',
                    right: '10%',
                    width: '180px',
                    height: '100px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                    borderRadius: '16px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'white', mb: 1, textAlign: 'center' }}>
                    Speech Analysis
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                    Voice emotion insights
                  </Typography>
                </motion.div>
              </FloatingElement>

              <FloatingElement delay={2}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2, duration: 0.8 }}
                  style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '30%',
                    width: '160px',
                    height: '80px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%)',
                    borderRadius: '16px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body1" sx={{ color: 'white', mb: 0.5, textAlign: 'center', fontWeight: 600 }}>
                    Text Analysis
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                    Sentiment detection
                  </Typography>
                </motion.div>
              </FloatingElement>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};