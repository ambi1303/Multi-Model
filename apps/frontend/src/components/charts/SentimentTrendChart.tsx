import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Box,  useTheme } from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SentimentTrendChartProps {
  data: Array<{
    timestamp: string;
    sentiment: number;
    text?: string;
    fullTimestamp?: string;
  }>;
}

const SentimentTrendChart: React.FC<SentimentTrendChartProps> = ({ data }) => {
  const theme = useTheme();

  const validData = data.filter(item => {
    const d = new Date(item.fullTimestamp || item.timestamp);
    return !isNaN(d.getTime()) && typeof item.sentiment === 'number' && !isNaN(item.sentiment);
  });

  const allSentimentsSame = validData.length > 1 && validData.every(d => d.sentiment === validData[0].sentiment);
  const allTimestampsInvalid = validData.length === 0;

  const chartData = {
    labels: validData.map(item => {
      const d = new Date(item.fullTimestamp || item.timestamp);
      return isNaN(d.getTime()) ? '-' : d.toLocaleString();
    }),
    datasets: [
      {
        label: 'Sentiment Trend',
        data: validData.map(item => item.sentiment),
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4,
      },
    ],
  };

  if (allTimestampsInvalid || validData.length === 0) {
    return <Box sx={{ height: 350, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span>No valid sentiment trend data to display.</span>
    </Box>;
  }
  if (allSentimentsSame) {
    return <Box sx={{ height: 350, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span>Sentiment did not change over time.</span>
    </Box>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Sentiment Over Time',
        color: theme.palette.text.primary,
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const point = validData[context.dataIndex];
            return `Sentiment: ${point.sentiment.toFixed(1)}%`;
          },
          afterLabel: function (context: any) {
            const point = validData[context.dataIndex];
            return point.text ? `Text: "${point.text}"` : '';
          }
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: theme.palette.text.secondary,
          callback: function(value: number) { return value + '%'; }
        },
        grid: {
          color: theme.palette.divider,
        },
      },
      x: {
        ticks: {
          color: theme.palette.text.secondary,
        },
        grid: {
          color: theme.palette.divider,
        },
      },
    },
  };

  return (
    <Box sx={{ height: 350, width: '100%' }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

export default SentimentTrendChart; 