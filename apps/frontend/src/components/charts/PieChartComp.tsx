import React from 'react';
import { Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  Title,
  Colors // Add Colors plugin for better default colors
} from 'chart.js';
import { Box, Typography, useTheme } from '@mui/material';
import { ErrorBoundary } from '../common/ErrorBoundary';

ChartJS.register(ArcElement, Tooltip, Legend, Title, Colors);

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartCompProps {
  data: PieChartData[];
  title?: string;
  height?: number;
}

const PieChartComp: React.FC<PieChartCompProps> = ({ data, title, height = 350 }) => {
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
          No data available for pie chart
        </Typography>
      </Box>
    );
  }

  const chartData = {
    labels: validData.map(item => item.name),
    datasets: [
      {
        data: validData.map(item => item.value),
        backgroundColor: validData.map((item, index) => {
          if (item.color) return item.color;
          // Better default colors
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
        borderColor: theme.palette.background.paper,
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBorderColor: theme.palette.divider,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: theme.palette.text.primary,
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
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
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  return (
    <ErrorBoundary>
      <Box sx={{ height, width: '100%' }}>
        <Pie data={chartData} options={options} />
      </Box>
    </ErrorBoundary>
  );
};

export default PieChartComp; 