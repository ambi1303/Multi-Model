import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { StatsSection } from '../components/landing/StatsSection';
import { CTASection } from '../components/landing/CTASection';
import { useAppStore } from '../store/useAppStore';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { setSidebarOpen } = useAppStore();

  const handleGetStarted = () => {
    setSidebarOpen(true); // Show sidebar (and header)
    navigate('/dashboard');
  };

  return (
    <Box>
      <HeroSection onGetStarted={handleGetStarted} />
      <StatsSection />
      <FeaturesSection />
      <CTASection onGetStarted={handleGetStarted} />
    </Box>
  );
}; 