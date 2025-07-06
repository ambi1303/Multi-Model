import React, { memo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface OptimizedLoadingSpinnerProps {
  message?: string;
  size?: number;
  minimal?: boolean;
  minHeight?: string;
}

export const OptimizedLoadingSpinner: React.FC<OptimizedLoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 40,
  minimal = false,
  minHeight = '200px'
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: minimal ? 1 : 2,
        minHeight: minimal ? 'auto' : minHeight,
        width: '100%',
        padding: minimal ? 1 : 3,
      }}
    >
      <Box
        sx={{
          width: size,
          height: size,
          border: `${Math.max(2, size / 10)}px solid rgba(59, 130, 246, 0.1)`,
          borderTop: `${Math.max(2, size / 10)}px solid #3b82f6`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }}
      />
      {!minimal && (
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            fontSize: '0.875rem',
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

// Skeleton loader for better perceived performance
interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | false;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = memo(({
  width = '100%',
  height = '1.2em',
  variant = 'text',
  animation = 'wave',
}) => {
  const theme = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return {
          borderRadius: '50%',
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        };
      case 'rectangular':
        return {
          borderRadius: theme.shape.borderRadius,
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        };
      default: // text
        return {
          borderRadius: 4,
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        };
    }
  };

  const getAnimationStyles = () => {
    if (animation === 'pulse') {
      return {
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        '@keyframes skeleton-pulse': {
          '0%': { opacity: 1 },
          '50%': { opacity: 0.4 },
          '100%': { opacity: 1 },
        },
      };
    } else if (animation === 'wave') {
      return {
        background: `linear-gradient(90deg, ${theme.palette.grey[300]} 25%, ${theme.palette.grey[200]} 50%, ${theme.palette.grey[300]} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'skeleton-wave 1.5s infinite',
        '@keyframes skeleton-wave': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      };
    }
    return {
      backgroundColor: theme.palette.grey[300],
    };
  };

  return (
    <Box
      sx={{
        ...getVariantStyles(),
        ...getAnimationStyles(),
        display: 'inline-block',
        // Prevent layout shift
        contain: 'layout',
      }}
      role="presentation"
      aria-hidden="true"
    />
  );
});

SkeletonLoader.displayName = 'SkeletonLoader';

// Page transition wrapper to prevent layout shift
interface PageTransitionProps {
  children: React.ReactNode;
  loading?: boolean;
  minHeight?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = memo(({
  children,
  loading = false,
  minHeight = '400px',
}) => {
  return (
    <Box
      sx={{
        minHeight,
        width: '100%',
        position: 'relative',
        // Prevent layout shift during transitions
        contain: 'layout',
        transition: 'opacity 0.2s ease-in-out',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <OptimizedLoadingSpinner 
          message="Loading content..." 
          minHeight={minHeight}
        />
      ) : (
        children
      )}
    </Box>
  );
});

PageTransition.displayName = 'PageTransition'; 