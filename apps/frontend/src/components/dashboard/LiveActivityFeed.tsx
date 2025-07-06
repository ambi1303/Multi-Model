import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Live activity feed
export const LiveActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState([
    { id: 1, text: "Sarah just completed video analysis", icon: "🎥", time: "2s ago" },
    { id: 2, text: "New happiness spike detected!", icon: "😊", time: "5s ago" },
    { id: 3, text: "Team mood: Absolutely vibing", icon: "✨", time: "12s ago" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newActivities = [
        "Alex started speech analysis 🎤",
        "Stress levels dropping! 📉",
        "New user joined the vibe check 👋",
        "AI confidence boosted! 🚀",
        "Team energy is through the roof! ⚡",
        "Burnout risk decreased 💪",
        "Happy emotions detected 😄",
        "Productivity mode: ON 🔥",
      ];
      
      const newActivity = {
        id: Date.now(),
        text: newActivities[Math.floor(Math.random() * newActivities.length)],
        icon: "🎯",
        time: "now"
      };
      
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ maxHeight: 300, overflow: 'hidden' }}>
      <AnimatePresence>
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.8 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                mb: 1,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Typography sx={{ fontSize: '1.5rem', mr: 2 }}>
                {activity.icon}
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {activity.text}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activity.time}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
}; 