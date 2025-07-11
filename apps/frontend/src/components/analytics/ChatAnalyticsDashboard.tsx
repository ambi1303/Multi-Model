import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import { SimpleChartFallback } from '../charts/SimpleChartFallback';
import { motion } from 'framer-motion';
import { ChatAnalyticsData, AnalyticsFilters } from '../../types/analytics';
import { InfoIcon, TrendingUpIcon, TrendingDownIcon, RemoveIcon } from '../../utils/icons';

interface ChatAnalyticsDashboardProps {
  data: ChatAnalyticsData;
  filters: AnalyticsFilters;
}

export const ChatAnalyticsDashboard: React.FC<ChatAnalyticsDashboardProps> = ({ data}) => {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Box sx={{ color: 'success.main' }}><TrendingUpIcon /></Box>;
      case 'negative': return <Box sx={{ color: 'error.main' }}><TrendingDownIcon /></Box>;
      default: return <Box sx={{ color: 'warning.main' }}><RemoveIcon /></Box>;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={4}>
        {/* Message Volume Trends */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Message Volume and Sentiment Trends
                </Typography>
                <SimpleChartFallback
                  data={data.messageVolumeTrends?.map(item => ({
                    name: item.date,
                    value: item.messageCount,
                    color: '#2563eb'
                  })) || []}
                  type="line"
                  height={300}
                  title=""
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Mental State Distribution */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Mental State Distribution
                </Typography>
                <List>
                  {data.mentalStateDistribution.map((state, index) => (
                    <ListItem key={state.state} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: `hsl(${index * 60}, 70%, 50%)`,
                            width: 32,
                            height: 32,
                          }}
                        >
                          <InfoIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        disableTypography
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                              {state.state}
                            </Typography>
                            <Chip
                              label={`${state.count} (${state.percentage.toFixed(1)}%)`}
                              size="small"
                              color={index < 3 ? 'primary' : 'default'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box
                            sx={{
                              width: '100%',
                              height: 4,
                              backgroundColor: (theme) => theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(0, 0, 0, 0.1)',
                              borderRadius: 2,
                              mt: 1,
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                width: `${state.percentage}%`,
                                height: '100%',
                                backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
                                transition: 'width 0.3s ease-in-out',
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Response Time Analysis */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Response Time Distribution
                </Typography>
                <SimpleChartFallback
                  data={data.responseTimeAnalysis?.map(item => ({
                    name: item.timeRange,
                    value: item.count,
                    color: '#7c3aed'
                  })) || []}
                  type="bar"
                  height={300}
                  title=""
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Conversation Length Analysis */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Conversation Length vs Sentiment
                </Typography>
                <SimpleChartFallback
                  data={data.conversationLengthAnalysis?.map(item => ({
                    name: `${item.messageCount} msgs`,
                    value: item.averageSentiment,
                    color: '#059669'
                  })) || []}
                  type="bar"
                  height={300}
                  title=""
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Keyword Analysis */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Top Keywords by Sentiment
                </Typography>
                <Grid container spacing={2}>
                  {data.keywordAnalysis.map((keyword) => (
                    <Grid item xs={12} sm={6} md={4} key={keyword.word}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {keyword.word}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {keyword.frequency} mentions
                        </Typography>
                        <Chip
                          icon={getSentimentIcon(keyword.sentiment)}
                          label={keyword.sentiment}
                          size="small"
                          color={getSentimentColor(keyword.sentiment) as any}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* User Engagement Metrics */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  User Engagement Metrics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {data.userEngagementMetrics.map((metric) => (
                    <Box key={metric.metric}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {metric.metric}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {metric.value}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: '100%',
                          height: 6,
                          backgroundColor: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(0, 0, 0, 0.1)',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${(metric.value / metric.max) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
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
      </Grid>
    </Box>
  );
};