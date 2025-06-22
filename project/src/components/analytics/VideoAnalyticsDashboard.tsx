import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion } from 'framer-motion';
import { VideoAnalyticsData, AnalyticsFilters } from '../../types/analytics';

interface VideoAnalyticsDashboardProps {
  data: VideoAnalyticsData;
  filters: AnalyticsFilters;
}

export const VideoAnalyticsDashboard: React.FC<VideoAnalyticsDashboardProps> = ({ data, filters }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={4}>
        {/* Confidence Distribution */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Confidence Score Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.confidenceDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#2563eb"
                      fill="url(#confidenceGradient)"
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Emotion Accuracy */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Emotion Detection Accuracy
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={data.emotionAccuracy}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="emotion" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Accuracy"
                      dataKey="accuracy"
                      stroke="#7c3aed"
                      fill="#7c3aed"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Processing Time Analysis */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Processing Time vs Confidence
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={data.processingTimeAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="processingTime" name="Processing Time (ms)" />
                    <YAxis dataKey="confidence" name="Confidence" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Sessions" data={data.processingTimeAnalysis} fill="#059669" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Feature Importance */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Feature Importance
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {data.featureImportance.map((feature, index) => (
                    <Box key={feature.feature}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {feature.feature}
                        </Typography>
                        <Chip
                          label={`${(feature.importance * 100).toFixed(1)}%`}
                          size="small"
                          color={index < 3 ? 'primary' : 'default'}
                        />
                      </Box>
                      <Box
                        sx={{
                          width: '100%',
                          height: 6,
                          backgroundColor: 'grey.200',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${feature.importance * 100}%`,
                            height: '100%',
                            background: index < 3 
                              ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                              : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
                            transition: 'width 0.3s ease-in-out',
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Session Details Table */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Recent Video Analysis Sessions
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Session ID</TableCell>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Dominant Emotion</TableCell>
                        <TableCell>Confidence</TableCell>
                        <TableCell>Processing Time</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.recentSessions.map((session) => (
                        <TableRow key={session.id} hover>
                          <TableCell sx={{ fontFamily: 'monospace' }}>
                            {session.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {new Date(session.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={session.dominantEmotion}
                              size="small"
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {(session.confidence * 100).toFixed(1)}%
                              </Typography>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 4,
                                  backgroundColor: 'grey.200',
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${session.confidence * 100}%`,
                                    height: '100%',
                                    backgroundColor: session.confidence > 0.8 ? 'success.main' : 
                                                   session.confidence > 0.6 ? 'warning.main' : 'error.main',
                                  }}
                                />
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{session.processingTime}ms</TableCell>
                          <TableCell>
                            <Chip
                              label={session.status}
                              size="small"
                              color={session.status === 'completed' ? 'success' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};