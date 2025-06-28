import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  TextField,
} from '@mui/material';
import {
  AnalyticsIcon,
  DownloadIcon,
  RefreshIcon,
  FilterListIcon,
  WarningIcon,
  InfoIcon,
} from '../utils/icons';
import { motion } from 'framer-motion';
import { useNotification } from '../contexts/NotificationContext';
import { OptimizedLoadingSpinner } from '../components/common/OptimizedLoadingSpinner';
import { analyticsApi } from '../services/analyticsApi';
import { AnalyticsFilters, AnalyticsData } from '../types/analytics';

// Lazy load analytics dashboards to reduce initial bundle
const OverviewDashboard = lazy(() => 
  import('../components/analytics/OverviewDashboard').then(m => ({ default: m.OverviewDashboard }))
);

const VideoAnalyticsDashboard = lazy(() => 
  import('../components/analytics/VideoAnalyticsDashboard').then(m => ({ default: m.VideoAnalyticsDashboard }))
);

const SpeechAnalyticsDashboard = lazy(() => 
  import('../components/analytics/SpeechAnalyticsDashboard').then(m => ({ default: m.SpeechAnalyticsDashboard }))
);

const ChatAnalyticsDashboard = lazy(() => 
  import('../components/analytics/ChatAnalyticsDashboard').then(m => ({ default: m.ChatAnalyticsDashboard }))
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 24 }}>
    {value === index && (
      <Suspense fallback={<OptimizedLoadingSpinner message="Loading dashboard..." />}>
        {children}
      </Suspense>
    )}
  </div>
);

const tabs = [
  { label: 'Overview', value: 'overview', icon: <AnalyticsIcon /> },
  { label: 'Video Analysis', value: 'video', icon: <AnalyticsIcon /> },
  { label: 'Speech Analysis', value: 'speech', icon: <AnalyticsIcon /> },
  { label: 'Chat Analysis', value: 'chat', icon: <AnalyticsIcon /> },
];

export const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    },
    modality: 'all',
    sessionType: 'all',
    riskLevel: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const { showSuccess, showError } = useNotification();

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const analyticsData = await analyticsApi.getAnalytics(filters);
      setData(analyticsData);
      showSuccess('Analytics data loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [filters]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (key: keyof AnalyticsFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExportData = async () => {
    try {
      const exportData = await analyticsApi.exportData(filters);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Analytics data exported successfully');
    } catch (err) {
      showError('Failed to export analytics data');
    }
  };

  const getAlertLevel = () => {
    if (!data) return null;
    
    const highRiskSessions = data.overview.riskDistribution.find(r => r.level === 'High')?.count || 0;
    const totalSessions = data.overview.totalSessions;
    const riskPercentage = (highRiskSessions / totalSessions) * 100;
    
    if (riskPercentage > 20) return 'error';
    if (riskPercentage > 10) return 'warning';
    return 'info';
  };

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Analytics Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Comprehensive insights across all emotion analysis modalities
          </Typography>
        </Box>
      </motion.div>

      {/* Filters and Controls */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Analytics Controls
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Toggle Filters">
                <IconButton onClick={() => setShowFilters(!showFilters)}>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh Data">
                <IconButton onClick={fetchAnalyticsData} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export Data">
                <IconButton onClick={handleExportData}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={filters.dateRange.start.toISOString().split('T')[0]}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: new Date(e.target.value) })}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={filters.dateRange.end.toISOString().split('T')[0]}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: new Date(e.target.value) })}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Modality</InputLabel>
                    <Select
                      value={filters.modality}
                      onChange={(e) => handleFilterChange('modality', e.target.value)}
                    >
                      <MenuItem value="all">All Modalities</MenuItem>
                      <MenuItem value="text">Text Analysis</MenuItem>
                      <MenuItem value="speech">Speech Analysis</MenuItem>
                      <MenuItem value="video">Video Analysis</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Risk Level</InputLabel>
                    <Select
                      value={filters.riskLevel}
                      onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                    >
                      <MenuItem value="all">All Levels</MenuItem>
                      <MenuItem value="low">Low Risk</MenuItem>
                      <MenuItem value="medium">Medium Risk</MenuItem>
                      <MenuItem value="high">High Risk</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Alert Banner */}
      {data && getAlertLevel() && (
        <Alert severity={getAlertLevel()!} sx={{ mb: 4 }} icon={getAlertLevel() === 'error' ? <WarningIcon /> : <InfoIcon />}>
          {getAlertLevel() === 'error' && (
            <Typography>High risk sessions detected. Immediate attention recommended.</Typography>
          )}
          {getAlertLevel() === 'warning' && (
            <Typography>Elevated risk levels observed. Consider reviewing recent sessions.</Typography>
          )}
          {getAlertLevel() === 'info' && (
            <Typography>System operating normally. All metrics within expected ranges.</Typography>
          )}
        </Alert>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          <Typography>{error}</Typography>
          <Button onClick={fetchAnalyticsData} sx={{ mt: 1 }}>
            <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
              <RefreshIcon />
            </Box>
            Retry
          </Button>
        </Alert>
      )}

      {/* Loading State */}
      {loading && !data && (
        <OptimizedLoadingSpinner message="Loading analytics data..." minHeight="400px" />
      )}

      {/* Main Content */}
      {data && (
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              {tabs.map((tab, index) => (
                <Tab key={index} label={tab.label} icon={tab.icon} iconPosition="start" />
              ))}
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <OverviewDashboard data={data.overview} filters={filters} />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <VideoAnalyticsDashboard data={data.video} filters={filters} />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <SpeechAnalyticsDashboard data={data.speech} filters={filters} />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <ChatAnalyticsDashboard data={data.chat} filters={filters} />
          </TabPanel>
        </Card>
      )}
    </Box>
  );
};