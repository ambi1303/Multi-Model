import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { PlayArrow, Explore, TrendingUp } from '@mui/icons-material';

const FloatingElement: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ y: [-10, 10, -10] }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
  >
    {children}
  </motion.div>
);

const GradientOrb: React.FC<{ size: number; color: string; top: string; left: string; delay?: number }> = ({ 
  size, color, top, left, delay = 0 
}) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 0.6 }}
    transition={{ duration: 1, delay }}
    style={{
      position: 'absolute',
      top,
      left,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color}40 0%, ${color}10 70%, transparent 100%)`,
      filter: 'blur(1px)',
      zIndex: 0,
    }}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: `conic-gradient(from 0deg, ${color}60, transparent, ${color}60)`,
      }}
    />
  </motion.div>
);

export const HeroSection: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Animated Background Orbs */}
      <GradientOrb size={300} color="#3b82f6" top="10%" left="80%" delay={0} />
      <GradientOrb size={200} color="#8b5cf6" top="60%" left="10%" delay={0.5} />
      <GradientOrb size={150} color="#06b6d4" top="20%" left="20%" delay={1} />
      <GradientOrb size={250} color="#10b981" top="70%" left="70%" delay={1.5} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '4rem', lg: '5rem' },
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3,
                  lineHeight: 1.1,
                }}
              >
                Emotion
                <br />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  Intelligence
                </motion.span>
                <br />
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Unleashed
                </motion.span>
              </Typography>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    mb: 4,
                    lineHeight: 1.6,
                    fontWeight: 300,
                  }}
                >
                  Harness the power of AI to decode emotions across video, speech, and text. 
                  Transform human insights into actionable intelligence.
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={onGetStarted}
                  startIcon={<PlayArrow />}
                  sx={{
                    px: 4,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
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
                  startIcon={<Explore />}
                  sx={{
                    px: 4,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
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
              </motion.div>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', height: '500px' }}>
              <FloatingElement delay={0}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 1 }}
                  style={{
                    position: 'absolute',
                    top: '10%',
                    left: '20%',
                    width: '200px',
                    height: '120px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Video Analysis
                  </Typography>
                </motion.div>
              </FloatingElement>

              <FloatingElement delay={1}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 1 }}
                  style={{
                    position: 'absolute',
                    top: '40%',
                    right: '10%',
                    width: '180px',
                    height: '100px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Speech AI
                  </Typography>
                </motion.div>
              </FloatingElement>

              <FloatingElement delay={2}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.6, duration: 1 }}
                  style={{
                    position: 'absolute',
                    bottom: '20%',
                    left: '10%',
                    width: '160px',
                    height: '90px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Text Insights
                  </Typography>
                </motion.div>
              </FloatingElement>

              {/* Central Connecting Lines */}
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 2, duration: 2 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <svg width="300" height="300" viewBox="0 0 300 300">
                  <motion.path
                    d="M150,150 L100,80 M150,150 L220,120 M150,150 L80,220"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="5,5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 2, duration: 2 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              {/* Central Hub */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 2.5, duration: 0.8 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 40px rgba(245, 158, 11, 0.4)',
                }}
              >
                <TrendingUp sx={{ color: 'white', fontSize: 32 }} />
              </motion.div>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};