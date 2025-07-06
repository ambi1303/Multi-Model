import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import { Box, useTheme } from '@mui/material';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface MentalStatesChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const MentalStatesChart: React.FC<MentalStatesChartProps> = ({ data }) => {
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
          boxWidth: 20,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: 'Mental State Distribution',
        color: theme.palette.text.primary,
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += `${context.label}: ${context.raw}%`;
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <Box sx={{ height: 350, width: '100%' }}>
      <Pie data={chartData} options={options} />
    </Box>
  );
};

export default MentalStatesChart; 