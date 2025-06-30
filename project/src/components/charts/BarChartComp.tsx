import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

export interface BarChartData {
  name: string;
  value: number;
  color?: string;
  originalValue?: string;
}

interface BarChartCompProps {
  data: BarChartData[];
  title?: string;
  height?: number;
  dataKey?: string;
  showLegend?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

const BarChartComp: React.FC<BarChartCompProps> = ({
  data,
  title,
  height = 350,
  dataKey = 'value',
  showLegend = true,
  orientation = 'vertical'
}) => {
  const theme = useTheme();

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
        <Typography variant="body2">No data available for bar chart</Typography>
      </Box>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const originalData = data.payload;
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 1.5,
            boxShadow: theme.shadows[4]
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Normalized: {data.value}%
          </Typography>
          {originalData.originalValue && (
            <Typography variant="body2" color="text.secondary">
              Original: {originalData.originalValue}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { payload, ...rest } = props;
    const color = payload?.color || theme.palette.primary.main;
    return <Bar {...rest} fill={color} />;
  };

  return (
    <Box sx={{ width: '100%', height }}>
      {title && (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5 }}
          >
            All values normalized to 0-100% scale for comparison
          </Typography>
        </Box>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          aria-label={`Bar chart showing ${title || 'data comparison'}`}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme.palette.divider}
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="name"
            tick={{
              fontSize: 12,
              fill: theme.palette.text.secondary,
              fontFamily: theme.typography.fontFamily
            }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis
            tick={{
              fontSize: 12,
              fill: theme.palette.text.secondary,
              fontFamily: theme.typography.fontFamily
            }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
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
          <Bar
            dataKey={dataKey}
            fill={theme.palette.primary.main}
            radius={[4, 4, 0, 0]}
            stroke={theme.palette.primary.dark}
            strokeWidth={1}
            name="Value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || theme.palette.primary.main}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default BarChartComp; 