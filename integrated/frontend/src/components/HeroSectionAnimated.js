import React from 'react';
import { motion } from 'framer-motion';

const HeroSectionAnimated = () => {
  const headline = "Unlock the Power of Multimodal Sentiment Analysis";
  const subtext = "Analyze emotions, sentiment, and context across text, voice, and visual data with cutting-edge AI technology. Get deeper insights than ever before.";

  // Variants for staggered appearance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.03 // Adjust this for faster/slower letter animation
      }
    }
  };

  const subtextVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1, y: 0,
      transition: {
        delay: headline.length * 0.03 + 0.5, // Start after headline + a small delay
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="relative bg-blue-50 min-h-screen flex items-center justify-center overflow-hidden py-16 md:py-24">
      {/* Background circles animation */}
      <motion.div 
        className="absolute w-48 h-48 rounded-full bg-blue-200 opacity-40 top-1/4 left-1/4"
        animate={{ 
          scale: [0.8, 1.2, 0.8], 
          opacity: [0.4, 0.2, 0.4] 
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute w-40 h-40 rounded-full bg-blue-300 opacity-30 bottom-1/4 right-1/4"
        animate={{ 
          scale: [0.7, 1.1, 0.7], 
          opacity: [0.3, 0.1, 0.3] 
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div 
        className="absolute w-32 h-32 rounded-full bg-blue-400 opacity-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{ 
          scale: [0.9, 1.3, 0.9], 
          opacity: [0.2, 0.05, 0.2] 
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold text-sm tracking-wide mb-4">
          Advanced AI-Powered Analysis
        </span>
        <motion.h1 
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {"Unlock the Power of "}
          <span className="text-teal-600 inline-block">
            {"Multimodal"}
          </span>
          {" Sentiment Analysis"}
        </motion.h1>
        <motion.p 
          className="text-base sm:text-lg md:text-xl text-gray-700 opacity-80 max-w-2xl mx-auto mb-8"
          variants={subtextVariants}
          initial="hidden"
          animate="visible"
        >
          {subtext}
        </motion.p>

        {/* Removed buttons as per request */}
      </div>
    </div>
  );
};

export default HeroSectionAnimated; 