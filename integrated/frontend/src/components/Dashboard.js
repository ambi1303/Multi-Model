import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Divider, LinearProgress, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard() {
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

  if (loading || !stats) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
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
      <Paper elevation={1} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 3, minHeight: 220 }}>
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
    </Box>
  );
}

export default Dashboard; 