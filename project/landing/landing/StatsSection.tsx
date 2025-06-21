import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Container, Grid } from '@mui/material';

const stats = [
  { value: '99.2%', label: 'Accuracy Rate', color: '#3b82f6' },
  { value: '50M+', label: 'Emotions Analyzed', color: '#8b5cf6' },
  { value: '<100ms', label: 'Response Time', color: '#10b981' },
  { value: '24/7', label: 'Uptime', color: '#f59e0b' },
];

const CountUpNumber: React.FC<{ value: string; duration?: number }> = ({ value, duration = 2 }) => {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <Typography
        variant="h2"
        sx={{
          fontWeight: 900,
          fontSize: { xs: '2.5rem', md: '3.5rem' },
          background: 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {value}
      </Typography>
    </motion.div>
  );
};

export const StatsSection: React.FC = () => {
  return (
    <Box
      sx={{
        py: 12,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '200px',
          height: '200px',
          border: '2px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '50%',
        }}
      />
      
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '10%',
          width: '150px',
          height: '150px',
          border: '2px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '50%',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              mb: 2,
              color: 'white',
            }}
          >
            Trusted by Industry Leaders
          </Typography>

          <Typography
            variant="h6"
            sx={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 8,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Our platform delivers enterprise-grade performance with industry-leading metrics
          </Typography>
        </motion.div>

        <Grid container spacing={6}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
                whileHover={{ scale: 1.05 }}
              >
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 4,
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      border: `1px solid ${stat.color}40`,
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: `linear-gradient(90deg, ${stat.color} 0%, ${stat.color}80 100%)`,
                    }}
                  />
                  
                  <CountUpNumber value={stat.value} />
                  
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: 600,
                      mt: 1,
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};