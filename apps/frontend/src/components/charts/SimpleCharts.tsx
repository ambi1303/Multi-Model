import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Box, useTheme } from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      tension?: number;
      fill?: boolean;
    }>;
  };
  options?: any;
}

const commonOptions = (theme: any) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: theme.palette.text.primary,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: theme.palette.text.secondary },
      grid: { color: theme.palette.divider },
    },
    x: {
      ticks: { color: theme.palette.text.secondary },
      grid: { color: theme.palette.divider },
    },
  },
});

export const SimpleBarChart: React.FC<ChartProps> = ({ data, options }) => {
  const theme = useTheme();
  return (
    <Box sx={{ height: 300 }}>
      <Bar options={{ ...commonOptions(theme), ...options }} data={data} />
    </Box>
  );
};

export const SimpleLineChart: React.FC<ChartProps> = ({ data, options }) => {
  const theme = useTheme();
  return (
    <Box sx={{ height: 300 }}>
      <Line options={{ ...commonOptions(theme), ...options }} data={data} />
    </Box>
  );
}; 