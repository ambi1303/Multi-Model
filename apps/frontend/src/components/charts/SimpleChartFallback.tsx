import React, { useState } from 'react';
import { Box, Typography, useTheme} from '@mui/material';

interface SimpleChartData {
  name: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  data: SimpleChartData[];
  title?: string;
  type?: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar';
  height?: number;
}

export const SimpleChartFallback: React.FC<SimpleChartProps> = ({
  data,
  title,
  type = 'bar',
  height = 300,
}) => {
  const theme = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Validate and filter data
  const validData = data?.filter(item => 
    item && 
    typeof item.value === 'number' && 
    !isNaN(item.value) && 
    item.value > 0 &&
    item.name
  ) || [];
  
  if (validData.length === 0) {
    return (
      <Box sx={{ width: '100%', height, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No valid data available to display
        </Typography>
      </Box>
    );
  }
  
  const maxValue = Math.max(...validData.map(d => d.value));
  const minValue = Math.min(...validData.map(d => d.value));
  
  // Chart dimensions
  const chartWidth = 400;
  const chartHeight = height - 80; // Leave space for title and labels
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const getDefaultColor = (index: number) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
    ];
    return colors[index % colors.length];
  };

  const renderRadarChart = () => {
    const centerX = chartWidth / 2;
    const centerY = chartHeight / 2;
    const radius = Math.min(innerWidth, innerHeight) / 2 - 60;
    const levels = 5; // Number of concentric circles
    
    // Normalize data to 0-1 scale for radar chart
    const normalizedData = validData.map(item => ({
      ...item,
      normalizedValue: item.value / maxValue
    }));

    return (
      <Box sx={{ width: '100%', height, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {title && (
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
            {title}
          </Typography>
        )}
        <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
          {/* Gradient definitions */}
          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
              <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.1} />
            </radialGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={theme.palette.primary.main} />
              <stop offset="100%" stopColor={theme.palette.secondary.main} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background concentric circles with enhanced styling */}
          {Array.from({ length: levels }, (_, i) => {
            const levelRadius = (radius / levels) * (i + 1);
            return (
              <circle
                key={i}
                cx={centerX}
                cy={centerY}
                r={levelRadius}
                fill="none"
                stroke={theme.palette.divider}
                strokeWidth={i === levels - 1 ? "2" : "1"}
                strokeDasharray={i % 2 === 0 ? "5,5" : "none"}
                opacity={0.4}
              />
            );
          })}

          {/* Axis lines with enhanced styling */}
          {normalizedData.map((_, index) => {
            const angle = (index / normalizedData.length) * 2 * Math.PI - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            return (
              <line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke={theme.palette.divider}
                strokeWidth="1.5"
                opacity={0.5}
              />
            );
          })}

          {/* Data polygon with gradient fill */}
          <polygon
            points={normalizedData.map((item, index) => {
              const angle = (index / normalizedData.length) * 2 * Math.PI - Math.PI / 2;
              const x = centerX + (radius * item.normalizedValue) * Math.cos(angle);
              const y = centerY + (radius * item.normalizedValue) * Math.sin(angle);
              return `${x},${y}`;
            }).join(' ')}
            fill="url(#radarGradient)"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            filter="url(#glow)"
            style={{
              transition: 'all 0.3s ease',
              transformOrigin: `${centerX}px ${centerY}px`,
            }}
          />

          {/* Data points with enhanced interactivity */}
          {normalizedData.map((item, index) => {
            const angle = (index / normalizedData.length) * 2 * Math.PI - Math.PI / 2;
            const x = centerX + (radius * item.normalizedValue) * Math.cos(angle);
            const y = centerY + (radius * item.normalizedValue) * Math.sin(angle);
            
            // Label position (outside the circle)
            const labelDistance = radius + 30;
            const labelX = centerX + labelDistance * Math.cos(angle);
            const labelY = centerY + labelDistance * Math.sin(angle);
            
            const isHovered = hoveredIndex === index;
            
            return (
              <g key={index}>
                {/* Enhanced data point */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "8" : "6"}
                  fill={item.color || theme.palette.primary.main}
                  stroke="#fff"
                  strokeWidth="3"
                  filter={isHovered ? "url(#glow)" : "none"}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                
                {/* Enhanced labels */}
                <text
                  x={labelX}
                  y={labelY - 5}
                  textAnchor={labelX > centerX ? 'start' : 'end'}
                  fontSize="11"
                  fill={theme.palette.text.primary}
                  fontWeight="600"
                  style={{
                    transition: 'all 0.3s ease',
                    fontSize: isHovered ? '12px' : '11px',
                  }}
                >
                  {item.name.length > 12 ? item.name.slice(0, 12) + '...' : item.name}
                </text>
                <text
                  x={labelX}
                  y={labelY + 8}
                  textAnchor={labelX > centerX ? 'start' : 'end'}
                  fontSize="10"
                  fill={theme.palette.primary.main}
                  fontWeight="bold"
                  style={{
                    transition: 'all 0.3s ease',
                    fontSize: isHovered ? '11px' : '10px',
                  }}
                >
                  {item.value}
                </text>
                
                {/* Hover tooltip area */}
                <circle
                  cx={x}
                  cy={y}
                  r="15"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* Enhanced scale labels */}
          {Array.from({ length: levels }, (_, i) => {
            const levelValue = Math.round((maxValue / levels) * (i + 1));
            const levelRadius = (radius / levels) * (i + 1);
            return (
              <text
                key={i}
                x={centerX + 8}
                y={centerY - levelRadius + 4}
                fontSize="9"
                fill={theme.palette.text.secondary}
                fontWeight="500"
              >
                {levelValue}
              </text>
            );
          })}
        </svg>
        
        {/* Enhanced legend */}
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          {data.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1,
                backgroundColor: hoveredIndex === index ? theme.palette.action.hover : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: hoveredIndex === index ? 'translateY(-2px)' : 'translateY(0)',
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: item.color || getDefaultColor(index),
                  boxShadow: hoveredIndex === index ? 2 : 0,
                }}
              />
              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                {item.name}: {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderBarChart = () => {
    const barWidth = innerWidth / validData.length * 0.8;
    const barSpacing = innerWidth / validData.length * 0.2;

    return (
      <Box sx={{ width: '100%', height, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {title && (
          <Typography variant="h6" sx={{ mb: 2 }}>
            {title}
          </Typography>
        )}
        <svg width={chartWidth} height={chartHeight}>
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={theme.palette.divider} strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width={chartWidth} height={chartHeight} fill="url(#grid)" opacity="0.3"/>
          
          {/* Y-axis */}
          <line 
            x1={padding.left} 
            y1={padding.top} 
            x2={padding.left} 
            y2={chartHeight - padding.bottom}
            stroke={theme.palette.text.secondary}
            strokeWidth="1"
          />
          
          {/* X-axis */}
          <line 
            x1={padding.left} 
            y1={chartHeight - padding.bottom} 
            x2={chartWidth - padding.right} 
            y2={chartHeight - padding.bottom}
            stroke={theme.palette.text.secondary}
            strokeWidth="1"
          />

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = chartHeight - padding.bottom - (ratio * innerHeight);
            const value = Math.round(minValue + (maxValue - minValue) * ratio);
            return (
              <g key={i}>
                <line 
                  x1={padding.left - 5} 
                  y1={y} 
                  x2={padding.left} 
                  y2={y}
                  stroke={theme.palette.text.secondary}
                />
                <text 
                  x={padding.left - 10} 
                  y={y + 4} 
                  textAnchor="end" 
                  fontSize="12" 
                  fill={theme.palette.text.secondary}
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {validData.map((item, index) => {
            const x = padding.left + (index * (barWidth + barSpacing)) + barSpacing / 2;
            const barHeight = (item.value / maxValue) * innerHeight;
            const y = chartHeight - padding.bottom - barHeight;
            
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.color || getDefaultColor(index)}
                  rx="2"
                />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - padding.bottom + 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill={theme.palette.text.secondary}
                >
                  {item.name.length > 8 ? item.name.slice(0, 8) + '...' : item.name}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill={theme.palette.text.primary}
                  fontWeight="bold"
                >
                  {item.value}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>
    );
  };

  const renderLineChart = () => {
    const pointSpacing = innerWidth / (validData.length - 1);

    return (
      <Box sx={{ width: '100%', height, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {title && (
          <Typography variant="h6" sx={{ mb: 2 }}>
            {title}
          </Typography>
        )}
        <svg width={chartWidth} height={chartHeight}>
          {/* Background grid */}
          <defs>
            <pattern id="grid-line" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={theme.palette.divider} strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width={chartWidth} height={chartHeight} fill="url(#grid-line)" opacity="0.3"/>
          
          {/* Axes */}
          <line 
            x1={padding.left} 
            y1={padding.top} 
            x2={padding.left} 
            y2={chartHeight - padding.bottom}
            stroke={theme.palette.text.secondary}
            strokeWidth="1"
          />
          <line 
            x1={padding.left} 
            y1={chartHeight - padding.bottom} 
            x2={chartWidth - padding.right} 
            y2={chartHeight - padding.bottom}
            stroke={theme.palette.text.secondary}
            strokeWidth="1"
          />

          {/* Line path */}
          <path
            d={`M ${validData.map((item, index) => {
              const x = padding.left + (index * pointSpacing);
              const y = chartHeight - padding.bottom - ((item.value / maxValue) * innerHeight);
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}`}
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {validData.map((item, index) => {
            const x = padding.left + (index * pointSpacing);
            const y = chartHeight - padding.bottom - ((item.value / maxValue) * innerHeight);
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={item.color || theme.palette.primary.main}
                  stroke="#fff"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={chartHeight - padding.bottom + 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill={theme.palette.text.secondary}
                >
                  {item.name.length > 6 ? item.name.slice(0, 6) + '...' : item.name}
                </text>
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill={theme.palette.text.primary}
                  fontWeight="bold"
                >
                  {item.value}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>
    );
  };

  const renderPieChart = () => {
    const total = validData.reduce((sum, item) => sum + item.value, 0);
    const centerX = chartWidth * 0.35; // Move pie chart to the left
    const centerY = chartHeight / 2;
    const radius = Math.min(chartWidth * 0.25, chartHeight / 2) - 20; // Smaller radius
    
    let currentAngle = -90; // Start from top

    return (
      <Box sx={{ width: '100%', height, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {title && (
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
            {title}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, width: '100%' }}>
          {/* Pie Chart */}
          <svg width={chartWidth * 0.7} height={chartHeight}>
            {validData.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (item.value / total) * 360;
              
              if (percentage < 1) return null; // Skip very small slices
              
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle += angle;
              
              const startAngleRad = (startAngle * Math.PI) / 180;
              const endAngleRad = (endAngle * Math.PI) / 180;
              
              const x1 = centerX + radius * Math.cos(startAngleRad);
              const y1 = centerY + radius * Math.sin(startAngleRad);
              const x2 = centerX + radius * Math.cos(endAngleRad);
              const y2 = centerY + radius * Math.sin(endAngleRad);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');
              
              // Label position inside the slice
              const labelAngle = (startAngle + endAngle) / 2;
              const labelAngleRad = (labelAngle * Math.PI) / 180;
              const labelX = centerX + (radius * 0.7) * Math.cos(labelAngleRad);
              const labelY = centerY + (radius * 0.7) * Math.sin(labelAngleRad);
              
              return (
                <g key={index}>
                  <path
                    d={pathData}
                    fill={item.color || getDefaultColor(index)}
                    stroke="#fff"
                    strokeWidth="3"
                  />
                  {percentage > 8 && (
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#fff"
                      fontWeight="bold"
                    >
                      {percentage.toFixed(0)}%
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          
          {/* Legend */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 150 }}>
            {validData.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: item.color || getDefaultColor(index),
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {item.name}: {item.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({((item.value / total) * 100).toFixed(1)}%)
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  };



  switch (type) {
    case 'radar':
      return renderRadarChart();
    case 'pie':
    case 'doughnut':
      return renderPieChart();
    case 'line':
      return renderLineChart();
    case 'bar':
    default:
      return renderBarChart();
  }
};

export default SimpleChartFallback; 