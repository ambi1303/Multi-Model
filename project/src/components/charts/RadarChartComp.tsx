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
        <RadarChart
          data={data}
          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
          aria-label={`Radar chart showing ${title || 'assessment metrics'}`}
        >
          <PolarGrid
            stroke={theme.palette.divider}
            strokeWidth={1}
            strokeOpacity={0.6}
          />
          <PolarAngleAxis
            dataKey="name"
            tick={{
              fontSize: 12,
              fill: theme.palette.text.secondary,
              fontFamily: theme.typography.fontFamily
            }}
            className="recharts-polar-angle-axis"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 'dataMax']}
            tick={{
              fontSize: 10,
              fill: theme.palette.text.secondary,
              fontFamily: theme.typography.fontFamily
            }}
            tickCount={5}
          />
          <Radar
            name="Assessment"
            dataKey={dataKey}
            stroke={theme.palette.primary.main}
            fill={theme.palette.primary.main}
            fillOpacity={0.2}
            strokeWidth={3}
            dot={{
              fill: theme.palette.primary.main,
              strokeWidth: 2,
              stroke: theme.palette.background.paper,
              r: 4
            }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '14px',
              fontFamily: theme.typography.fontFamily,
              color: theme.palette.text.primary
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default RadarChartComp; 