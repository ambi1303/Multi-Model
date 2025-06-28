import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartCompProps {
  data: PieChartData[];
  title?: string;
  height?: number;
  dataKey?: string;
  showLegend?: boolean;
}

const PieChartComp: React.FC<PieChartCompProps> = ({
  data,
  title,
  height = 350,
  dataKey = 'value',
  showLegend = true
}) => {
  const theme = useTheme();

  // Default color palette from theme
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height,
          color: 'text.secondary'
        }}
      >
        <Typography variant="body2">No data available for pie chart</Typography>
      </Box>
    );
  }

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent
  }: any) => {
    if (percent < 0.05) return null; // Don't show labels for very small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={theme.palette.background.paper}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
        fontFamily={theme.typography.fontFamily}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 1,
            boxShadow: theme.shadows[4]
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Value: {data.value}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height }}>
      {title && (
        <Typography
          variant="h6"
          align="center"
          gutterBottom
          sx={{ mb: 2, fontWeight: 600 }}
        >
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart
          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
          aria-label={`Pie chart showing ${title || 'data distribution'}`}
        >
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={Math.min(height * 0.3, 120)}
            fill={theme.palette.primary.main}
            dataKey={dataKey}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || defaultColors[index % defaultColors.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px',
                fontFamily: theme.typography.fontFamily,
                color: theme.palette.text.primary
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PieChartComp; 