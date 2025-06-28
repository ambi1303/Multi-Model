import React from 'react';
import { SimpleChartFallback } from './SimpleChartFallback';
import { Card, CardContent, Typography } from '@mui/material';

interface MentalStatesData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface MentalStatesChartProps {
  data: MentalStatesData[];
}

const MentalStatesChart: React.FC<MentalStatesChartProps> = ({ data }) => {
  // Transform data for SimpleChartFallback
  const chartData = data.map((item) => ({
    name: `${item.name} (${item.percentage}%)`,
    value: item.value,
    color: item.color,
  }));

  return (
    <Card className="h-96">
      <CardContent>
        <Typography variant="h6" component="h3" className="mb-4 text-center">
          Mental States Distribution
        </Typography>
        <SimpleChartFallback
          data={chartData}
          type="pie"
          height={300}
          title=""
        />
      </CardContent>
    </Card>
  );
};

export default MentalStatesChart; 