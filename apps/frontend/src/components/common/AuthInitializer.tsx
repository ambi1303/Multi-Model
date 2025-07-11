import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

/**
 * Component that initializes authentication state on app startup
 * This component should be rendered early in the app lifecycle
 */
export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initializeAuth = useAppStore((state) => state.actions.initializeAuth);

  useEffect(() => {
    // Initialize authentication state from stored token
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
};

export default AuthInitializer; 