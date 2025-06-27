import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Container, Button, Grid } from '@mui/material';
import { PlayArrowIcon, TrendingUpIcon, InfoIcon } from '../../utils/icons';

export const CTASection: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  return (
    <Box
      sx={{
        py: 12,
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background */}
      <motion.div
        animate={{ 
          background: [
            'radial-gradient(circle at 20% 50%, #3b82f620 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, #8b5cf620 0%, transparent 50%)',
            'radial-gradient(circle at 50% 20%, #10b98120 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, #3b82f620 0%, transparent 50%)',
          ]
        }}
        transition={{ duration: 8, repeat: Infinity }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Ready to Transform Your Understanding of Human Emotion?
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  mb: 4,
                  lineHeight: 1.6,
                }}
              >
                Join thousands of organizations already using EmotiAnalyze to unlock 
                deeper insights into human behavior and emotional intelligence.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={onGetStarted}
                    startIcon={<PlayArrowIcon />}
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
                      },
                    }}
                  >
                    Start Free Trial
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outlined"
                    size="large"
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
                      },
                    }}
                  >
                    Schedule Demo
                  </Button>
                </motion.div>
              </Box>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', height: '400px' }}>
              {/* Floating Elements */}
              <motion.div
                animate={{ y: [-20, 20, -20] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: 'absolute',
                  top: '20%',
                  left: '10%',
                  width: '120px',
                  height: '120px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                  borderRadius: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)',
                }}
              >
                                    <Box sx={{ color: 'white', fontSize: 40, display: 'flex', justifyContent: 'center' }}>
                      <TrendingUpIcon />
                    </Box>
              </motion.div>

              <motion.div
                animate={{ y: [20, -20, 20] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '20%',
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  borderRadius: '25px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
                }}
              >
                                    <Box sx={{ color: 'white', fontSize: 35, display: 'flex', justifyContent: 'center' }}>
                      <InfoIcon />
                    </Box>
              </motion.div>

              <motion.div
                animate={{ y: [-15, 15, -15] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                style={{
                  position: 'absolute',
                  bottom: '20%',
                  left: '30%',
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)',
                }}
              >
                                    <Box sx={{ color: 'white', fontSize: 30, display: 'flex', justifyContent: 'center' }}>
                      <PlayArrowIcon />
                    </Box>
              </motion.div>

              {/* Connecting Lines */}
              <motion.svg
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0 }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1, duration: 1 }}
              >
                <motion.path
                  d="M100,100 Q200,50 300,150 Q250,250 150,300"
                  stroke="url(#ctaGradient)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.5, duration: 2 }}
                />
                <defs>
                  <linearGradient id="ctaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
              </motion.svg>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};