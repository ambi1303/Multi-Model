import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Assessment,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion } from 'framer-motion';
import { OverviewData, AnalyticsFilters } from '../../types/analytics';

interface OverviewDashboardProps {
  data: OverviewData;
  filters: AnalyticsFilters;
}

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706'];

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, change, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: `${color}20`,
              color: color,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
          </Box>
        </Box>
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {change >= 0 ? (
              <TrendingUp sx={{ color: 'success.main', mr: 0.5, fontSize: 16 }} />
            ) : (
              <TrendingDown sx={{ color: 'error.main', mr: 0.5, fontSize: 16 }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: change >= 0 ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {Math.abs(change)}% vs last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ data, filters }) => {
  const formatTooltipValue = (value: any, name: string) => [value, name];

  return (
    <Box sx={{ p: 3 }}>
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Sessions"
            value={data.totalSessions.toLocaleString()}
            change={data.sessionGrowth}
            icon={<People />}
            color="#2563eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Confidence"
            value={`${(data.averageConfidence * 100).toFixed(1)}%`}
            change={data.confidenceChange}
            icon={<Assessment />}
            color="#059669"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="High Risk Sessions"
            value={data.highRiskSessions}
            change={data.riskChange}
            icon={<Warning />}
            color="#dc2626"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="System Accuracy"
            value={`${(data.systemAccuracy * 100).toFixed(1)}%`}
            icon={<CheckCircle />}
            color="#7c3aed"
          />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Session Trends */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Session Trends Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.sessionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={formatTooltipValue} />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="highRisk"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Risk Level Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Modality Performance */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Modality Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.modalityPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="modality" />
                  <YAxis />
                  <Tooltip formatter={formatTooltipValue} />
                  <Bar dataKey="accuracy" fill="#2563eb" />
                  <Bar dataKey="usage" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Emotion Distribution */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Top Emotions Detected
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {data.topEmotions.map((emotion, index) => (
                  <Box key={emotion.emotion}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize', fontWeight: 500 }}>
                        {emotion.emotion}
                      </Typography>
                      <Chip
                        label={`${emotion.count} (${emotion.percentage.toFixed(1)}%)`}
                        size="small"
                        color={index === 0 ? 'primary' : 'default'}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={emotion.percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: index === 0 
                            ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                            : `linear-gradient(135deg, ${COLORS[index % COLORS.length]} 0%, ${COLORS[(index + 1) % COLORS.length]} 100%)`,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};