import React from 'react';
import { Box, Typography } from '@mui/material';

// Simple, lightweight chart components to replace heavy libraries
interface SimpleBarData {
  name: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: SimpleBarData[];
  height?: number;
  title?: string;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ 
  data, 
  height = 200, 
  title 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Box sx={{ width: '100%', height }}>
      {title && (
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
          {title}
        </Typography>
      )}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: 1, 
        height: height - (title ? 60 : 20),
        px: 2 
      }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 80);
          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <Typography variant="caption" sx={{ mb: 1, fontWeight: 600 }}>
                {item.value}
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: barHeight,
                  backgroundColor: item.color || '#2563eb',
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    opacity: 0.8,
                    transform: 'scaleY(1.05)',
                  },
                }}
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 1, 
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'center',
                  minHeight: '20px',
                }}
              >
                {item.name}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

interface SimplePieData {
  name: string;
  value: number;
  color: string;
}

interface SimplePieChartProps {
  data: SimplePieData[];
  size?: number;
  title?: string;
}

export const SimplePieChart: React.FC<SimplePieChartProps> = ({ 
  data, 
  size = 200, 
  title 
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {title && (
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <svg width={size} height={size} style={{ marginBottom: 16 }}>
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const startAngle = (cumulativePercentage * 360) / 100;
          const endAngle = ((cumulativePercentage + percentage) * 360) / 100;
          
          cumulativePercentage += percentage;
          
          const startAngleRad = (startAngle * Math.PI) / 180;
          const endAngleRad = (endAngle * Math.PI) / 180;
          
          const largeArcFlag = percentage > 50 ? 1 : 0;
          
          const x1 = size / 2 + (size / 2 - 10) * Math.cos(startAngleRad);
          const y1 = size / 2 + (size / 2 - 10) * Math.sin(startAngleRad);
          const x2 = size / 2 + (size / 2 - 10) * Math.cos(endAngleRad);
          const y2 = size / 2 + (size / 2 - 10) * Math.sin(endAngleRad);
          
          const pathData = `M ${size / 2} ${size / 2} L ${x1} ${y1} A ${size / 2 - 10} ${size / 2 - 10} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
          
          return (
            <path
              key={index}
              d={pathData}
              fill={item.color}
              stroke="#fff"
              strokeWidth="2"
              style={{
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            />
          );
        })}
      </svg>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
        {data.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: item.color,
                borderRadius: '2px',
              }}
            />
            <Typography variant="caption">
              {item.name} ({Math.round((item.value / total) * 100)}%)
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

interface SimpleLineData {
  name: string;
  value: number;
}

interface SimpleLineChartProps {
  data: SimpleLineData[];
  height?: number;
  title?: string;
  color?: string;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ 
  data, 
  height = 200, 
  title,
  color = '#2563eb' 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;
  
  const chartWidth = 300;
  const chartHeight = height - 80;
  
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((item.value - minValue) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Box sx={{ width: '100%', height }}>
      {title && (
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
          {title}
        </Typography>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <svg width={chartWidth} height={chartHeight + 40} style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1="0"
              y1={chartHeight * ratio}
              x2={chartWidth}
              y2={chartHeight * ratio}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}
          
          {/* Line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="3"
            points={points}
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            }}
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * chartWidth;
            const y = chartHeight - ((item.value - minValue) / range) * chartHeight;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={color}
                stroke="#fff"
                strokeWidth="2"
                style={{
                  cursor: 'pointer',
                  transition: 'r 0.2s ease',
                }}
              />
            );
          })}
          
          {/* X-axis labels */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * chartWidth;
            return (
              <text
                key={index}
                x={x}
                y={chartHeight + 20}
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
              >
                {item.name}
              </text>
            );
          })}
        </svg>
      </Box>
    </Box>
  );
}; 