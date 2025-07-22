import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors, // Add Colors plugin
} from 'chart.js';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ErrorBoundary } from '../common/ErrorBoundary';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors
);

export interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

interface BarChartCompProps {
  data: BarChartData[];
  title?: string;
  height?: number;
}

const BarChartComp: React.FC<BarChartCompProps> = ({ data, title, height = 350 }) => {
  const theme = useTheme();

  // Validate data
  const validData = data?.filter(item => 
    item && 
    typeof item.value === 'number' && 
    !isNaN(item.value) && 
    item.value >= 0 &&
    item.name?.trim()
  ) || [];

  if (validData.length === 0) {
    return (
      <Box sx={{ height, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available for bar chart
        </Typography>
      </Box>
    );
  }

  const chartData = {
    labels: validData.map(d => d.name),
    datasets: [
      {
        label: title || 'Data',
        data: validData.map(d => d.value),
        backgroundColor: validData.map((d, index) => {
          if (d.color) return d.color;
          // Better default colors with transparency
          const colors = [
            theme.palette.primary.main,
            theme.palette.secondary.main,
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.error.main,
            theme.palette.info.main,
          ];
          return colors[index % colors.length];
        }),
        borderColor: validData.map((d, index) => {
          if (d.color) return d.color;
          const colors = [
            theme.palette.primary.dark,
            theme.palette.secondary.dark,
            theme.palette.success.dark,
            theme.palette.warning.dark,
            theme.palette.error.dark,
            theme.palette.info.dark,
          ];
          return colors[index % colors.length];
        }),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.palette.text.primary,
          padding: 15,
          usePointStyle: true,
        },
      },
      title: {
        display: !!title,
        text: title,
        color: theme.palette.text.primary,
        font: {
          size: 16,
          weight: '600',
        },
        padding: 20,
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: theme.palette.text.secondary,
          callback: function(value: any) {
            return typeof value === 'number' ? value.toLocaleString() : value;
          },
        },
        grid: {
          color: theme.palette.divider,
        },
        title: {
          display: false,
          text: 'Value',
          color: theme.palette.text.secondary,
        },
      },
      x: {
        ticks: {
          color: theme.palette.text.secondary,
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          color: theme.palette.divider,
          display: false, // Hide vertical grid lines for cleaner look
        },
      },
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart',
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <ErrorBoundary>
      <Box sx={{ height, width: '100%' }}>
        <Bar options={options} data={chartData} />
      </Box>
    </ErrorBoundary>
  );
};

export default BarChartComp; 