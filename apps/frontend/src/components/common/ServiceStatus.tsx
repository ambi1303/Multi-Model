import React, { useEffect, useState } from 'react';
import { checkApiHealth, HealthCheckResponse } from '../../services/api';
import { Box, Typography, Chip, CircularProgress, Paper } from '@mui/material';
import { CheckCircleIcon, ErrorIcon, WarningIcon } from '../../utils/icons';

interface ServiceStatusProps {
  showDetails?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const ServiceStatus: React.FC<ServiceStatusProps> = ({ 
  showDetails = false,
  refreshInterval = 60000 // Default: check every minute
}) => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const result = await checkApiHealth();
      setHealth(result);
      setError(null);
    } catch (err) {
      setError('Failed to check service status');
      console.error('Health check error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    
    // Set up interval for periodic checks
    const interval = setInterval(fetchHealth, refreshInterval);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'up':
        return 'success';
      case 'degraded':
      case 'partial':
        return 'warning';
      case 'unhealthy':
      case 'down':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'up':
        return <CheckCircleIcon />;
      case 'degraded':
      case 'partial':
        return <WarningIcon />;
      case 'unhealthy':
      case 'down':
        return <ErrorIcon />;
      default:
        return <WarningIcon />;
    }
  };

  if (loading && !health) {
    return <CircularProgress size={24} />;
  }

  if (error) {
    return <Chip 
      icon={<ErrorIcon />} 
      label="Services: Error" 
      color="error" 
      size="small" 
      variant="outlined" 
    />;
  }

  if (!health) {
    return <Chip 
      icon={<WarningIcon />} 
      label="Services: Unknown" 
      color="warning" 
      size="small" 
      variant="outlined" 
    />;
  }

  // Simple status chip for minimal display
  if (!showDetails) {
    const overallStatus = health.status.toLowerCase();
    return (
      <Chip 
        icon={getStatusIcon(overallStatus)} 
        label={`Services: ${overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}`}
        color={getStatusColor(overallStatus) as any}
        size="small"
        variant="outlined"
      />
    );
  }

  // Detailed view with all services
  return (
    <Paper elevation={1} sx={{ p: 2, maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>
        Service Status
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          API Version: {health.version || 'Unknown'}
        </Typography>
        <Chip 
          icon={getStatusIcon(health.status)} 
          label={`Overall: ${health.status}`}
          color={getStatusColor(health.status) as any}
          size="small"
          sx={{ mt: 1 }}
        />
      </Box>

      <Typography variant="subtitle2" gutterBottom>
        Services:
      </Typography>
      
      {health.services && Object.entries(health.services).map(([name, info]) => (
        <Box key={name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Chip 
            icon={getStatusIcon(info.status)} 
            label={`${name}: ${info.status}`}
            color={getStatusColor(info.status) as any}
            size="small"
            sx={{ mr: 1 }}
          />
          {info.latency !== undefined && (
            <Typography variant="caption" color="text.secondary">
              {info.latency}ms
            </Typography>
          )}
        </Box>
      ))}
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Typography variant="caption" color="text.secondary">
          Last checked: {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Paper>
  );
}; 