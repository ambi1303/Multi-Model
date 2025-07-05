import React from 'react';
import { Box } from '@mui/material';

interface StyledIconProps {
  IconComponent: React.ElementType;
  sx?: object;
}

export const StyledIcon: React.FC<StyledIconProps> = ({ IconComponent, sx }) => {
  return <Box component={IconComponent} sx={sx} />;
}; 