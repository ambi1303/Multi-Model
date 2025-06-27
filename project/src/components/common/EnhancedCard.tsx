import React from 'react';
import { Card, CardProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const AnimatedCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: theme.shadows[12],
    '& .MuiCardContent-root': {
      background: `linear-gradient(135deg, ${theme.palette.primary.light}15, ${theme.palette.secondary.light}15)`,
    }
  },
  '&:active': {
    transform: 'translateY(-4px) scale(1.01)',
  }
}));

interface EnhancedCardProps extends CardProps {
  children: React.ReactNode;
  elevation?: number;
  interactive?: boolean;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({ 
  children, 
  elevation = 2, 
  interactive = true,
  sx,
  ...props 
}) => {
  const Component = interactive ? AnimatedCard : Card;
  
  return (
    <Component 
      elevation={elevation}
      sx={{
        borderRadius: '20px',
        ...sx
      }}
      {...props}
    >
      {children}
    </Component>
  );
}; 