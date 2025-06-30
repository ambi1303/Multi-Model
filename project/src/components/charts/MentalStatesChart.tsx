import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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
  // Validate and transform data for Recharts
  const validData = data.filter(item => 
    item.name && 
    typeof item.value === 'number' && 
    !isNaN(item.value) && 
    item.value > 0 &&
    typeof item.percentage === 'number' &&
    !isNaN(item.percentage)
  );

  const chartData = validData.map((item) => ({
    name: item.name,
    value: item.value,
    percentage: item.percentage.toFixed(1),
    color: item.color || '#8884d8',
  }));

  if (chartData.length === 0) {
    return (
      <Card className="h-96">
        <CardContent>
          <Typography variant="h6" component="h3" className="mb-4 text-center">
            Mental States Distribution
          </Typography>
          <div className="flex items-center justify-center h-64">
            <Typography variant="body2" color="text.secondary" className="text-center">
              No mental state data available to display
            </Typography>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{data.payload.name}</p>
          <p className="text-blue-600">
            Count: {data.value}
          </p>
          <p className="text-gray-600">
            Percentage: {data.payload.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="h-96">
      <CardContent>
        <Typography variant="h6" component="h3" className="mb-4 text-center">
          Mental States Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MentalStatesChart; 