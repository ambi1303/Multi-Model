import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Box,  useTheme } from '@mui/material';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title
);

export interface RadarChartData {
  subject: string;
  A: number;
  B?: number;
  fullMark: number;
}

interface RadarChartCompProps {
  data: RadarChartData[];
  title?: string;
  height?: number;
}

const RadarChartComp: React.FC<RadarChartCompProps> = ({ data, title, height = 400 }) => {
  const theme = useTheme();

  const chartData = {
    labels: data.map(d => d.subject),
    datasets: [
      {
        label: 'Current State',
        data: data.map(d => d.A),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
      },
      // You can add a second dataset if needed, for example a baseline or target
      // {
      //   label: 'Target State',
      //   data: data.map(d => d.B),
      //   backgroundColor: 'rgba(255, 99, 132, 0.2)',
      //   borderColor: 'rgba(255, 99, 132, 1)',
      //   borderWidth: 2,
      // },
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
      r: {
        angleLines: {
          color: theme.palette.divider,
        },
        grid: {
          color: theme.palette.divider,
        },
        pointLabels: {
          color: theme.palette.text.secondary,
        },
        ticks: {
          backdropColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      },
    },
  };

  return (
    <Box sx={{ height, width: '100%' }}>
      <Radar data={chartData} options={options} />
    </Box>
  );
};

export default RadarChartComp; 