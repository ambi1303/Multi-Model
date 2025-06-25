import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Avatar,
  Chip,
} from '@mui/material';

// Animated metric card component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: string;
  delay?: number;
}

export const MetricCard: React.FC<MetricCardProps> = (props) => {
  const { title, value, icon, color, subtitle, trend, delay = 0 } = props;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ 
        scale: 1.05, 
        rotateY: 5,
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Box
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`,
          backdropFilter: 'blur(20px)',
          border: `2px solid ${color}30`,
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <motion.div
          animate={{
            background: isHovered 
              ? `linear-gradient(45deg, ${color}30, transparent, ${color}30)`
              : 'transparent'
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '200%',
            height: '100%',
            zIndex: 0,
          }}
          transition={{ duration: 0.6 }}
        />
        
        <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <motion.div
              animate={{ 
                rotate: isHovered ? 360 : 0,
                scale: isHovered ? 1.2 : 1
              }}
              transition={{ duration: 0.6 }}
            >
              <Avatar
                sx={{
                  background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
                  width: 56,
                  height: 56,
                  mr: 2,
                }}
              >
                {icon}
              </Avatar>
            </motion.div>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {title}
              </Typography>
              <motion.div
                key={value}
                initial={{ scale: 1.2, color: color }}
                animate={{ scale: 1, color: 'inherit' }}
                transition={{ duration: 0.3 }}
              >
                <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1 }}>
                  {value}
                </Typography>
              </motion.div>
            </Box>
          </Box>
          
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Chip
                label={trend}
                size="small"
                color="success"
                sx={{ mt: 1, fontSize: '0.7rem' }}
              />
            </motion.div>
          )}
        </Box>
      </Box>
    </motion.div>
  );
}; 