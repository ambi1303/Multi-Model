import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Download,
  Refresh,
  FilterList,
  DateRange,
  TrendingUp,
  Warning,
  Info,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { motion } from 'framer-motion';
import { useNotification } from '../contexts/NotificationContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { OverviewDashboard } from '../components/analytics/OverviewDashboard';
import { VideoAnalyticsDashboard } from '../components/analytics/VideoAnalyticsDashboard';
import { SpeechAnalyticsDashboard } from '../components/analytics/SpeechAnalyticsDashboard';
import { ChatAnalyticsDashboard } from '../components/analytics/ChatAnalyticsDashboard';
import { BurnoutAnalyticsDashboard } from '../components/analytics/BurnoutAnalyticsDashboard';
import { analyticsApi } from '../services/analyticsApi';
import { AnalyticsFilters, AnalyticsData } from '../types/analytics';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 24 }}>
    {value === index && children}
  </div>
);

const tabs = [
  { label: 'Overview', value: 'overview', icon: <AnalyticsIcon /> },
  { label: 'Video Analysis', value: 'video', icon: <AnalyticsIcon /> },
  { label: 'Speech Analysis', value: 'speech', icon: <AnalyticsIcon /> },
  { label: 'Chat Analysis', value: 'chat', icon: <AnalyticsIcon /> },
  { label: 'Burnout Assessment', value: 'burnout', icon: <AnalyticsIcon /> },
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                    <FilterList />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh Data">
                  <IconButton onClick={fetchAnalyticsData} disabled={loading}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export Data">
                  <IconButton onClick={handleExportData}>
                    <Download />
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
                    <DatePicker
                      label="Start Date"
                      value={filters.dateRange.start}
                      onChange={(date) => handleFilterChange('dateRange', { ...filters.dateRange, start: date })}
                      renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="End Date"
                      value={filters.dateRange.end}
                      onChange={(date) => handleFilterChange('dateRange', { ...filters.dateRange, end: date })}
                      renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Modality</InputLabel>
                      <Select
                        value={filters.modality}
                        label="Modality"
                        onChange={(e) => handleFilterChange('modality', e.target.value)}
                      >
                        <MenuItem value="all">All Modalities</MenuItem>
                        <MenuItem value="video">Video</MenuItem>
                        <MenuItem value="speech">Speech</MenuItem>
                        <MenuItem value="chat">Chat</MenuItem>
                        <MenuItem value="survey">Survey</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Risk Level</InputLabel>
                      <Select
                        value={filters.riskLevel}
                        label="Risk Level"
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

            {/* Alert Banner */}
            {data && getAlertLevel() && (
              <Alert 
                severity={getAlertLevel()!} 
                sx={{ mt: 2 }}
                icon={getAlertLevel() === 'error' ? <Warning /> : <Info />}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {getAlertLevel() === 'error' ? 'High Risk Alert' : 
                   getAlertLevel() === 'warning' ? 'Moderate Risk Warning' : 
                   'System Status Normal'}
                </Typography>
                <Typography variant="body2">
                  {getAlertLevel() === 'error' ? 
                    'Multiple high-risk sessions detected. Immediate attention recommended.' :
                   getAlertLevel() === 'warning' ? 
                    'Elevated risk levels observed. Monitor closely.' :
                    'All systems operating within normal parameters.'}
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <LoadingSpinner message="Loading analytics data..." />
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Failed to Load Analytics
            </Typography>
            <Typography variant="body2">{error}</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={fetchAnalyticsData}
              sx={{ mt: 1 }}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          </Alert>
        )}

        {/* Analytics Tabs */}
        {data && !loading && (
          <Card>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.value}
                  icon={tab.icon}
                  label={tab.label}
                  iconPosition="start"
                  sx={{ minHeight: 64 }}
                />
              ))}
            </Tabs>

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

            <TabPanel value={activeTab} index={4}>
              <BurnoutAnalyticsDashboard data={data.burnout} filters={filters} />
            </TabPanel>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  );
};