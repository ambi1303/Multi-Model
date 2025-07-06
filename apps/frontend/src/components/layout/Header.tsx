import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useMediaQuery,
  useTheme as useMuiTheme,
  Popover,
} from '@mui/material';
import {
  MenuIcon,
  NotificationsIcon,
  AccountCircleIcon,
  LightModeIcon,
  DarkModeIcon,
} from '../../utils/icons';
import { useTheme } from '../../contexts/ThemeContext';
import { ServiceStatus } from '../common/ServiceStatus';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const muiTheme = useMuiTheme();
  const { mode, toggleTheme } = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [statusAnchorEl, setStatusAnchorEl] = useState<HTMLElement | null>(null);

  const handleStatusClick = (event: React.MouseEvent<HTMLElement>) => {
    setStatusAnchorEl(event.currentTarget);
  };

  const handleStatusClose = () => {
    setStatusAnchorEl(null);
  };

  const statusPopoverOpen = Boolean(statusAnchorEl);

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: 1,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { xs: 'inline-flex', md: 'inline-flex' } }}
          aria-label="toggle sidebar"
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.2rem',
              }}
            >
              EA
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
              EmotiAnalyze
            </Typography>
            {!isMobile && (
              <Typography variant="caption" color="text.secondary">
                Multi-Modal Emotion Analysis Platform
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Service Status Indicator */}
          <Box sx={{ mr: 1, cursor: 'pointer' }} onClick={handleStatusClick}>
            <ServiceStatus />
          </Box>
          
          <Popover
            open={statusPopoverOpen}
            anchorEl={statusAnchorEl}
            onClose={handleStatusClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <Box sx={{ p: 1 }}>
              <ServiceStatus showDetails={true} refreshInterval={30000} />
            </Box>
          </Popover>

          <IconButton onClick={toggleTheme} color="inherit">
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
          
          <IconButton color="inherit">
            <AccountCircleIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};