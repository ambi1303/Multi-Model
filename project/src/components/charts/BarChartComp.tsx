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
} from 'chart.js';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

interface BarChartCompProps {
  data: BarChartData[];
  title?: string;
}

const BarChartComp: React.FC<BarChartCompProps> = ({ data, title }) => {
  const theme = useTheme();

  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        label: title || 'Data',
        data: data.map(d => d.value),
        backgroundColor: data.map(d => d.color || theme.palette.primary.main),
        borderColor: data.map(d => d.color || theme.palette.primary.dark),
        borderWidth: 1,
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
        },
      },
      title: {
        display: !!title,
        text: title,
        color: theme.palette.text.primary,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
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
      <Bar options={options} data={chartData} />
    </Box>
  );
};

export default BarChartComp; 