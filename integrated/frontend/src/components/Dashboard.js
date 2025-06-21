import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Divider, LinearProgress, CircularProgress, Chip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocation } from 'react-router-dom';

const sentimentColors = {
  Positive: { bg: '#111', color: '#fff' },
  Neutral: { bg: '#f4f4f4', color: '#222' },
  Negative: { bg: '#f44336', color: '#fff' },
};

const modelOrder = [
  { label: 'Voice', key: 'Audio' },
  { label: 'Chat', key: 'Chat' },
  { label: 'Video', key: 'Video' },
  { label: 'Survey', key: 'Survey' },
];

function formatAgo(minutes) {
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  return `${minutes} minutes ago`;
}

function Dashboard() {
  const location = useLocation();
  const results = location.state?.results || {};
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:9000/dashboard-stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fake times for demo
  const times = [2, 5, 12, 18];

  return (
    <Box>
      {/* Original Dashboard Stats and Chart */}
      <Box sx={{ maxWidth: 900, mx: 'auto', mt: 6 }}>
        {loading || !stats ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><CircularProgress /></Box>
        ) : (
          <>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              <span role="img" aria-label="brain">🧠</span> Mental Health Dashboard
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Work Hours</Typography>
                <Typography variant="h5" color="primary">{stats.work_hours} hours</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Meeting Load</Typography>
                <Typography variant="h5" color="primary">{stats.meeting_load} hours</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Stress Score</Typography>
                <Typography variant="h5" color="primary">{stats.stress_score}%</Typography>
              </Box>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Work-Life Balance Score: <b>{stats.work_life_balance}%</b>
              </Typography>
              <LinearProgress variant="determinate" value={stats.work_life_balance} sx={{ height: 8, borderRadius: 5, mt: 1, bgcolor: 'grey.900', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />
            </Box>
            <Divider sx={{ my: 3, bgcolor: 'grey.800' }} />
            <Typography variant="h6" sx={{ mb: 2 }}>Recent Activity</Typography>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Stress Level Trend</Typography>
            <Paper elevation={1} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 3, minHeight: 220, mb: 4 }}>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={stats.stress_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[50, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="stress" stroke="#6C63FF" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
            {/* Recent Analysis Activity (now below the graph) */}
            <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
              <Paper elevation={1} sx={{ p: 4, borderRadius: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Recent Analysis Activity
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'grey.600', mb: 3 }}>
                  Latest sentiment analysis results across all models
                </Typography>
                <Box>
                  {modelOrder.map((model, idx) => {
                    const res = results[model.key];
                    let sentiment = res?.sentiment || 'Neutral';
                    let score = res?.score;
                    let color = sentimentColors[sentiment] || sentimentColors['Neutral'];
                    return (
                      <Box key={model.key} sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Chip label={model.label} sx={{ fontWeight: 700, fontSize: 16, mr: 2, px: 2, bgcolor: '#fff', border: '1px solid #ddd' }} />
                        <Typography sx={{ color: 'grey.600', minWidth: 120 }}>{formatAgo(times[idx])}</Typography>
                        <Box sx={{ flex: 1 }} />
                        <Chip
                          label={sentiment}
                          sx={{
                            fontWeight: 700,
                            fontSize: 16,
                            bgcolor: color.bg,
                            color: color.color,
                            px: 2,
                            mr: 2,
                            ...(sentiment === 'Neutral' && { bgcolor: '#f4f4f4', color: '#222', border: '1px solid #eee' }),
                            ...(sentiment === 'Negative' && { bgcolor: '#f44336', color: '#fff' }),
                          }}
                        />
                        <Typography sx={{ fontWeight: 700, fontSize: 18, minWidth: 60, textAlign: 'right' }}>
                          {score !== undefined ? `${score.toFixed(1)}%` : '--'}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

export default Dashboard; 