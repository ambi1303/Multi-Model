import React from 'react';
import { motion } from 'framer-motion';

// Floating emoji animation
interface FloatingEmojiProps {
  emoji: string;
  delay?: number;
}

export const FloatingEmoji: React.FC<FloatingEmojiProps> = (props) => {
  const { emoji, delay = 0 } = props;
  return (
    <motion.div
      initial={{ opacity: 0, y: 100, rotate: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        y: [100, -20, -40, -100],
        rotate: [0, 180, 360],
        scale: [0.5, 1, 1.2, 0.8]
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 3,
        ease: "easeInOut"
      }}
      style={{
        position: 'absolute',
        left: `${Math.random() * 100}%`,
        fontSize: '2rem',
        zIndex: 0,
      }}
    >
      {emoji}
    </motion.div>
  );
}; 