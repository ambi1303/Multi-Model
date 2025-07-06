import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Box, Typography, useTheme } from '@mui/material';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartCompProps {
  data: PieChartData[];
  title?: string;
  height?: number;
}

const PieChartComp: React.FC<PieChartCompProps> = ({ data, title, height = 350 }) => {
  const theme = useTheme();

  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: data.map(item => item.color),
        borderColor: theme.palette.background.paper,
        borderWidth: 2,
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
        },
      },
      title: {
        display: !!title,
        text: title,
        color: theme.palette.text.primary,
        font: {
          size: 16,
        },
      },
    },
  };

  return (
    <Box sx={{ height, width: '100%' }}>
      {title && <Typography variant="h6" align="center">{title}</Typography>}
      <Pie data={chartData} options={options} />
    </Box>
  );
};

export default PieChartComp; 