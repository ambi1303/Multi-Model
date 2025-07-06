import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/landing/HeroSection';
import { Footer } from '../components/layout/Footer';
import { useAppStore } from '../store/useAppStore';
import { LazyLoadSpinner } from '../components/common/LazyLoadSpinner';
import SEO from '../components/common/SEO';

// Lazy load below-the-fold sections for faster initial load
const FeaturesSection = React.lazy(() => import('../components/landing/FeaturesSection').then(m => ({ default: m.FeaturesSection })));
const StatsSection = React.lazy(() => import('../components/landing/StatsSection').then(m => ({ default: m.StatsSection })));
const CTASection = React.lazy(() => import('../components/landing/CTASection').then(m => ({ default: m.CTASection })));

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { setSidebarOpen } = useAppStore();
  const [shouldLoadBelowFold, setShouldLoadBelowFold] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleGetStarted = () => {
    setSidebarOpen(true); // Show sidebar (and header)
    navigate('/dashboard');
  };

  // Load below-the-fold content when user scrolls near the end of hero section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoadBelowFold(true);
          observer.disconnect(); // Only trigger once
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // Start loading 200px before the element comes into view
      }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    // Also load content after a delay if user doesn't scroll (fallback)
    const fallbackTimer = setTimeout(() => {
      setShouldLoadBelowFold(true);
    }, 3000); // Load after 3 seconds regardless

    // Preload on user interaction
    const handleUserInteraction = () => {
      setShouldLoadBelowFold(true);
      document.removeEventListener('mousemove', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('mousemove', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
      document.removeEventListener('mousemove', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  return (
    <>
      <SEO
        title="Home - AI-Powered Emotion Analysis"
        description="Welcome to EmotiAnalyze. Discover real-time insights into human emotion through advanced analysis of video, speech, and text. Unlock a deeper understanding of your users."
      />
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          width: '100vw',
          margin: 0,
          padding: 0,
          position: 'relative',
          overflow: 'hidden',
          '& > *': {
            width: '100%',
          }
        }}
      >
        {/* Full-screen Hero Section */}
        <Box 
          sx={{ 
            flex: 1,
            minHeight: '100vh',
            width: '100%',
            position: 'relative',
          }}
        >
          <HeroSection onGetStarted={handleGetStarted} />
          
          {/* Invisible trigger element to detect when to load below-the-fold content */}
          <div ref={triggerRef} style={{ height: '1px', position: 'absolute', bottom: '80vh' }} />
        </Box>
        
        {/* Below-the-fold content */}
        {shouldLoadBelowFold && (
          <Box sx={{ width: '100%' }}>
            <Suspense fallback={<LazyLoadSpinner message="Loading content..." minimal />}>
              <StatsSection />
              <FeaturesSection />
              <CTASection onGetStarted={handleGetStarted} />
            </Suspense>
          </Box>
        )}
        
        {/* Footer */}
        <Footer />
      </Box>
    </>
  );
}; 