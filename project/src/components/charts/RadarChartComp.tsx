import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

export interface RadarChartData {
  name: string;
  value: number;
  fullMark?: number;
}

interface RadarChartCompProps {
  data: RadarChartData[];
  title?: string;
  height?: number;
  dataKey?: string;
}

const RadarChartComp: React.FC<RadarChartCompProps> = ({
  data,
  title,
  height = 350,
  dataKey = 'value'
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
        <Typography variant="body2">No data available for radar chart</Typography>
      </Box>
    );
  }

  // Normalize data to ensure consistent scaling
  const maxValue = Math.max(...data.map(d => d.value));
  const normalizedData = data.map(item => ({
    ...item,
    value: item.value,
    fullMark: maxValue > 10 ? Math.ceil(maxValue / 10) * 10 : 10
  }));

  // Custom tick component for better label positioning
  const CustomTick = ({ payload, x, y, textAnchor, ...rest }: any) => {
    return (
      <g className="recharts-layer recharts-polar-angle-axis-tick">
        <text
          {...rest}
          x={x}
          y={y}
          className="recharts-text recharts-polar-angle-axis-tick-value"
          textAnchor={textAnchor}
          fill={theme.palette.text.primary}
          fontSize="13"
          fontWeight="600"
          fontFamily={theme.typography.fontFamily}
        >
          <tspan x={x} dy="0em">{payload.value}</tspan>
        </text>
      </g>
    );
  };

  return (
    <Box sx={{ width: '100%', height }}>
      {title && (
        <Typography
          variant="h6"
          align="center"
          gutterBottom
          sx={{ 
            mb: 2, 
            fontWeight: 600,
            color: theme.palette.text.primary,
            fontSize: '1.1rem'
          }}
        >
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height="85%">
        <RadarChart
          data={normalizedData}
          margin={{ top: 60, right: 80, bottom: 60, left: 80 }}
          aria-label={`Radar chart showing ${title || 'assessment metrics'}`}
        >
          <defs>
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
              <stop offset="25%" stopColor={theme.palette.secondary.main} stopOpacity={0.6} />
              <stop offset="50%" stopColor={theme.palette.success.main} stopOpacity={0.5} />
              <stop offset="75%" stopColor={theme.palette.info.main} stopOpacity={0.4} />
              <stop offset="100%" stopColor={theme.palette.warning.main} stopOpacity={0.3} />
            </linearGradient>
            <radialGradient id="radarRadialGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.4} />
              <stop offset="50%" stopColor={theme.palette.secondary.main} stopOpacity={0.3} />
              <stop offset="100%" stopColor={theme.palette.info.main} stopOpacity={0.1} />
            </radialGradient>
          </defs>
          <PolarGrid
            stroke={theme.palette.divider}
            strokeWidth={1}
            strokeOpacity={0.3}
            gridType="polygon"
            radialLines={true}
          />
          <PolarAngleAxis
            dataKey="name"
            tick={<CustomTick />}
            tickSize={12}
            className="recharts-polar-angle-axis"
          />
          <PolarRadiusAxis
            domain={[0, 'dataMax']}
            tick={{
              fontSize: 11,
              fill: theme.palette.text.disabled,
              fontFamily: theme.typography.fontFamily
            }}
            tickCount={5}
            axisLine={false}
            tickLine={false}
          />
          <Radar
            name="Assessment Score"
            dataKey={dataKey}
            stroke={theme.palette.primary.main}
            fill="url(#radarRadialGradient)"
            fillOpacity={1}
            strokeWidth={2.5}
            dot={{
              fill: theme.palette.primary.main,
              strokeWidth: 2,
              stroke: theme.palette.background.paper,
              r: 5,
              fillOpacity: 1
            }}
            activeDot={{
              r: 7,
              fill: theme.palette.primary.dark,
              stroke: theme.palette.background.paper,
              strokeWidth: 3
            }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '15px',
              fontSize: '12px',
              fontFamily: theme.typography.fontFamily,
              color: theme.palette.text.primary,
              fontWeight: '500'
            }}
            iconType="rect"
          />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default RadarChartComp; 