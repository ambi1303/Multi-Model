import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pulseAnimation = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(25, 118, 210, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
`;

const StyledGradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  backgroundSize: '200% 200%',
  animation: `${gradientAnimation} 3s ease infinite`,
  color: 'white',
  fontWeight: 'bold',
  borderRadius: '25px',
  padding: '12px 30px',
  textTransform: 'none',
  fontSize: '1.1rem',
  '&:hover': {
    animation: `${pulseAnimation} 1s infinite, ${gradientAnimation} 1.5s ease infinite`,
    transform: 'scale(1.05)',
  },
  '&:disabled': {
    background: theme.palette.grey[400],
    animation: 'none',
    color: theme.palette.text.disabled,
  }
}));

interface GradientButtonProps extends Omit<ButtonProps, 'color'> {
  loading?: boolean;
  loadingText?: string;
}

export const GradientButton: React.FC<GradientButtonProps> = ({ 
  children,
  loading = false,
  loadingText = 'Loading...',
  disabled,
  startIcon,
  ...props 
}) => {
  return (
    <StyledGradientButton
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : startIcon}
      {...props}
    >
      {loading ? loadingText : children}
    </StyledGradientButton>
  );
}; 