import React from 'react';
import { motion } from 'framer-motion';

// Pulse animation component
interface PulseRingProps {
  color: string;
  delay?: number;
}

export const PulseRing: React.FC<PulseRingProps> = (props) => {
  const { color, delay = 0 } = props;
  return (
    <motion.div
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 2, opacity: 0 }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        ease: "easeOut"
      }}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        border: `2px solid ${color}`,
        top: 0,
        left: 0,
      }}
    />
  );
}; 