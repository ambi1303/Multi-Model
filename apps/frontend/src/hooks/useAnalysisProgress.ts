import { useState, useCallback } from 'react';

export const useAnalysisProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const startProgress = useCallback(() => {
    setIsLoading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 20;
      });
    }, 200);

    return interval;
  }, []);

  const completeProgress = useCallback((intervalId?: NodeJS.Timeout) => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    setProgress(100);
    setTimeout(() => {
      setProgress(0);
      setIsLoading(false);
    }, 1000);
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(0);
    setIsLoading(false);
  }, []);

  return {
    progress,
    isLoading,
    startProgress,
    completeProgress,
    resetProgress
  };
}; 