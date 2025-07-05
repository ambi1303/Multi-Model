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
  }>;
}

const SentimentTrendChart: React.FC<SentimentTrendChartProps> = ({ data }) => {
  const theme = useTheme();

  const chartData = {
    labels: data.map(item => new Date(item.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Sentiment Trend',
        data: data.map(item => item.sentiment),
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4,
      },
    ],
  };

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
            const point = data[context.dataIndex];
            return `Sentiment: ${point.sentiment.toFixed(2)}`;
          },
          afterLabel: function (context: any) {
            const point = data[context.dataIndex];
            return point.text ? `Text: "${point.text}"` : '';
          }
        },
      },
    },
    scales: {
      y: {
        min: -1,
        max: 1,
        ticks: {
          color: theme.palette.text.secondary,
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