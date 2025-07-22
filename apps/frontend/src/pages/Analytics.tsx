import React, { useState, useEffect, Suspense } from 'react';
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
import { getAnalyticsData, exportAnalytics } from '../services/analyticsApi';
import { getOptimizedAnalyticsData, optimizedAnalyticsService } from '../services/optimizedAnalyticsApi';
import { AnalyticsFilters, AnalyticsData } from '../types/analytics';
import SEO from '../components/common/SEO';
import { 
  OverviewDashboard, 
  VideoAnalyticsDashboard, 
  SpeechAnalyticsDashboard, 
  ChatAnalyticsDashboard 
} from '../components/LazyComponents';
import { SurveyAnalyticsDashboard } from '../components/analytics/SurveyAnalyticsDashboard';
import SentimentTrendChart from '../components/charts/SentimentTrendChart';
import ChartWrapper from '../components/charts/ChartWrapper';
import { useAppStore } from '../store/useAppStore';
import { socketService } from '../services/socket';

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
  { label: 'Survey', value: 'survey', icon: <AnalyticsIcon /> },
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
  const { overviewData, setOverviewData, isSocketConnected } = useAppStore();
  const [loading, setLoading] = useState(true);

  // State for performance monitoring
  const [useOptimized, setUseOptimized] = useState(true);
  const [performanceStats, setPerformanceStats] = useState<any>(null);

  const { data, error, isLoading, isSuccess, isError, refetch } = useQuery<AnalyticsData, Error>({
    queryKey: ['analytics', filters, useOptimized],
    queryFn: async () => {
      if (useOptimized) {
        try {
          const optimizedData = await getOptimizedAnalyticsData(filters);
          setPerformanceStats(optimizedData.performance);
          return optimizedData;
        } catch (error) {
          console.warn('📊 Optimized analytics failed, falling back to original API:', error);
          setUseOptimized(false);
          return getAnalyticsData(filters);
        }
      } else {
        return getAnalyticsData(filters);
      }
    },
    notifyOnChangeProps: ['data', 'error'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const notificationSent = React.useRef({ success: false, error: false });

  useEffect(() => {
    socketService.connect();

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        let data;
        if (useOptimized) {
          try {
            data = await getOptimizedAnalyticsData(filters);
            setPerformanceStats(data.performance);
          } catch (error) {
            console.warn('📊 Optimized analytics failed during initial load, falling back:', error);
            setUseOptimized(false);
            data = await getAnalyticsData(filters);
          }
        } else {
          data = await getAnalyticsData(filters);
        }
        setOverviewData(data.overview);
      } catch (error) {
        console.error("Failed to fetch initial analytics data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      socketService.disconnect();
    };
  }, [filters, setOverviewData]);

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
      const exportData = await exportAnalytics(filters);
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
    if (!data || !data.overview || !data.overview.riskDistribution) return null;
    const highRiskSessions = data.overview.riskDistribution.find(r => r.level === 'high')?.count || 0;
    const totalSessions = data.overview.totalSessions || 0;
    const riskPercentage = totalSessions > 0 ? (highRiskSessions / totalSessions) * 100 : 0;
    
    if (riskPercentage > 20) return 'error';
    if (riskPercentage > 10) return 'warning';
    return 'info';
  };

  if (loading && !overviewData) {
    return <OptimizedLoadingSpinner />;
  }

  return (
    <Box>
      <SEO
        title="Analytics Dashboard"
        description="Dive deep into emotion analytics. Explore comprehensive dashboards for video, speech, text analysis, and survey results to gain actionable insights."
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
                      <MenuItem value="video">Video Analysis</MenuItem>
                      <MenuItem value="speech">Speech Analysis</MenuItem>
                      <MenuItem value="chat">Chat Analysis</MenuItem>
                      <MenuItem value="survey">Survey Results</MenuItem>
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
                      <MenuItem value="moderate">Moderate Risk</MenuItem>
                      <MenuItem value="high">High Risk</MenuItem>
                      <MenuItem value="severe">Severe Risk</MenuItem>
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

      {/* Performance Metrics */}
      {performanceStats && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                📊 Performance Metrics
                {performanceStats.cache_hit && (
                  <Typography variant="caption" sx={{ bgcolor: 'success.light', color: 'success.contrastText', px: 1, py: 0.5, borderRadius: 1 }}>
                    CACHED
                  </Typography>
                )}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  Response: {performanceStats.response_time ? `${performanceStats.response_time}ms` : `${(performanceStats.query_time * 1000).toFixed(0)}ms`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  API Calls: {useOptimized ? '1 (unified)' : '6 (individual)'}
                </Typography>
                {performanceStats.endpoints_consolidated > 0 && (
                  <Typography variant="body2" color="success.main">
                    {performanceStats.endpoints_consolidated}x faster
                  </Typography>
                )}
                <Tooltip title="Clear Analytics Cache">
                  <IconButton
                    size="small"
                    onClick={async () => {
                      try {
                        optimizedAnalyticsService.clearCache();
                        await optimizedAnalyticsService.clearBackendCache();
                        showSuccess('Analytics cache cleared');
                        refetch();
                      } catch (error) {
                        showError('Failed to clear cache');
                      }
                    }}
                  >
                    🗑️
                  </IconButton>
                </Tooltip>
                <Tooltip title={useOptimized ? "Switch to Original API" : "Switch to Optimized API"}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setUseOptimized(!useOptimized);
                      showSuccess(`Switched to ${!useOptimized ? 'optimized' : 'original'} API`);
                    }}
                  >
                    {useOptimized ? '🚀' : '🐌'}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

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
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} icon={tab.icon} />
            ))}
          </Tabs>
          <CardContent>
            <TabPanel value={activeTab} index={0}>
              {data && data.overview ? <OverviewDashboard data={data.overview} filters={filters} /> : <ChartWrapper data={[]} title="Overview" type="bar" />}
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              {data && data.video ? <VideoAnalyticsDashboard data={data.video} /> : <ChartWrapper data={[]} title="Video Analysis" type="bar" />}
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
              {data && data.speech ? <SpeechAnalyticsDashboard data={data.speech} filters={filters} /> : <ChartWrapper data={[]} title="Speech Analysis" type="line" />}
            </TabPanel>
            <TabPanel value={activeTab} index={3}>
              {data && data.chat ? <ChatAnalyticsDashboard data={data.chat} filters={filters} /> : <ChartWrapper data={[]} title="Chat Analysis" type="line" />}
            </TabPanel>
            <TabPanel value={activeTab} index={4}>
              {data && data.survey ? <SurveyAnalyticsDashboard data={data.survey} /> : <ChartWrapper data={[]} title="Survey" type="bar" />}
            </TabPanel>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Analytics;