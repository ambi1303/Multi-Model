import React, { useState, Suspense, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
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
import SEO from '../components/common/SEO';
import { 
  OverviewDashboard, 
  VideoAnalyticsDashboard, 
  SpeechAnalyticsDashboard, 
  ChatAnalyticsDashboard 
} from '../components/LazyComponents';
import SentimentTrendChart from '../components/charts/SentimentTrendChart';
import SimpleChartFallback from '../components/charts/SimpleChartFallback';

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

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
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

  const { data, error, isLoading, isSuccess, isError, refetch } = useQuery<AnalyticsData, Error>({
    queryKey: ['analytics', filters],
    queryFn: () => analyticsApi.getAnalytics(filters),
    notifyOnChangeProps: ['data', 'error'],
  });

  const notificationSent = React.useRef({ success: false, error: false });

  useEffect(() => {
    if (isSuccess && !notificationSent.current.success) {
      showSuccess('Analytics data loaded successfully.');
      notificationSent.current.success = true;
      notificationSent.current.error = false;
    }
  }, [isSuccess, showSuccess]);

  useEffect(() => {
    if (isError && !notificationSent.current.error) {
      showError(error?.message || 'An unknown error occurred.');
      notificationSent.current.error = true;
      notificationSent.current.success = false;
    }
  }, [isError, error, showError]);

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
    const riskPercentage = totalSessions > 0 ? (highRiskSessions / totalSessions) * 100 : 0;
    
    if (riskPercentage > 20) return 'error';
    if (riskPercentage > 10) return 'warning';
    return 'info';
  };

  return (
    <Box>
      <SEO
        title="Analytics Dashboard"
        description="Dive deep into emotion analytics. Explore comprehensive dashboards for video, speech, and text analysis to gain actionable insights."
      />
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
                <span>
                  <IconButton onClick={() => refetch()} disabled={isLoading}>
                    <RefreshIcon />
                  </IconButton>
                </span>
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

          {isLoading && <OptimizedLoadingSpinner message="Fetching analytics data..." />}
          {isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed to load analytics data: {error?.message}
            </Alert>
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

      {/* Main Content */}
      {data && (
        <Card>
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} icon={tab.icon} />
            ))}
          </Tabs>
          <CardContent>
            <TabPanel value={activeTab} index={0}>
              {data?.overview && <OverviewDashboard data={data.overview} filters={filters} />}
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              {data?.video && <VideoAnalyticsDashboard data={data.video} />}
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
              {data?.speech && <SpeechAnalyticsDashboard data={data.speech} filters={filters} />}
            </TabPanel>
            <TabPanel value={activeTab} index={3}>
              {data?.chat && <ChatAnalyticsDashboard data={data.chat} filters={filters} />}
            </TabPanel>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Analytics;