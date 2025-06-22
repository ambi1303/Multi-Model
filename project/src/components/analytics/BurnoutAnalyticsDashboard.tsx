import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { BurnoutAnalyticsData, AnalyticsFilters } from '../../types/analytics';
import { Warning, TrendingUp, People, Assessment } from '@mui/icons-material';

interface BurnoutAnalyticsDashboardProps {
  data: BurnoutAnalyticsData;
  filters: AnalyticsFilters;
}

const RISK_COLORS = {
  Low: '#059669',
  Moderate: '#d97706',
  High: '#dc2626',
  Severe: '#7f1d1d',
};

export const BurnoutAnalyticsDashboard: React.FC<BurnoutAnalyticsDashboardProps> = ({ data, filters }) => {
  const getAlertSeverity = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Severe': return 'error';
      case 'High': return 'warning';
      case 'Moderate': return 'info';
      default: return 'success';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Risk Alert */}
      {data.riskAlerts.length > 0 && (
        <Alert
          severity={getAlertSeverity(data.riskAlerts[0].level)}
          sx={{ mb: 4 }}
          icon={<Warning />}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Burnout Risk Alert
          </Typography>
          <Typography variant="body2">
            {data.riskAlerts[0].message} - {data.riskAlerts[0].count} employees affected.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Risk Level Trends */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Burnout Risk Trends Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.riskTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="low"
                      stroke={RISK_COLORS.Low}
                      strokeWidth={2}
                      dot={{ fill: RISK_COLORS.Low, strokeWidth: 2, r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="moderate"
                      stroke={RISK_COLORS.Moderate}
                      strokeWidth={2}
                      dot={{ fill: RISK_COLORS.Moderate, strokeWidth: 2, r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="high"
                      stroke={RISK_COLORS.High}
                      strokeWidth={2}
                      dot={{ fill: RISK_COLORS.High, strokeWidth: 2, r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="severe"
                      stroke={RISK_COLORS.Severe}
                      strokeWidth={2}
                      dot={{ fill: RISK_COLORS.Severe, strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Current Risk Distribution */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Current Risk Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.currentRiskDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.currentRiskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.level as keyof typeof RISK_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Factor Analysis */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Burnout Factor Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={data.factorAnalysis}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="factor" />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} />
                    <Radar
                      name="Average Score"
                      dataKey="averageScore"
                      stroke="#dc2626"
                      fill="#dc2626"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Risk Threshold"
                      dataKey="riskThreshold"
                      stroke="#d97706"
                      fill="transparent"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Department Comparison */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Risk by Department
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.departmentComparison} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="department" type="category" />
                    <Tooltip />
                    <Bar dataKey="averageRisk" fill="#7c3aed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Intervention Effectiveness */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Intervention Effectiveness
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.interventionEffectiveness}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="beforeIntervention"
                      stroke="#dc2626"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="afterIntervention"
                      stroke="#059669"
                      strokeWidth={2}
                      dot={{ fill: '#059669', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Predictive Indicators */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Predictive Risk Indicators
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {data.predictiveIndicators.map((indicator, index) => (
                    <Box key={indicator.indicator}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {indicator.indicator}
                        </Typography>
                        <Chip
                          label={`${(indicator.importance * 100).toFixed(0)}%`}
                          size="small"
                          color={indicator.importance > 0.7 ? 'error' : indicator.importance > 0.4 ? 'warning' : 'success'}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={indicator.importance * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: indicator.importance > 0.7 ? 
                              'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' :
                              indicator.importance > 0.4 ?
                              'linear-gradient(135deg, #d97706 0%, #92400e 100%)' :
                              'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  AI-Generated Recommendations
                </Typography>
                <Grid container spacing={3}>
                  {data.recommendations.map((rec, index) => (
                    <Grid item xs={12} md={6} lg={4} key={index}>
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 1,
                              backgroundColor: `${rec.priority === 'High' ? '#dc2626' : rec.priority === 'Medium' ? '#d97706' : '#059669'}20`,
                              color: rec.priority === 'High' ? '#dc2626' : rec.priority === 'Medium' ? '#d97706' : '#059669',
                              mr: 2,
                            }}
                          >
                            {rec.priority === 'High' ? <Warning /> : <TrendingUp />}
                          </Box>
                          <Chip
                            label={rec.priority}
                            size="small"
                            color={rec.priority === 'High' ? 'error' : rec.priority === 'Medium' ? 'warning' : 'success'}
                          />
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {rec.category}
                        </Typography>
                        <Typography variant="body2" sx={{ flexGrow: 1, mb: 2 }}>
                          {rec.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Expected Impact: {rec.expectedImpact}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};