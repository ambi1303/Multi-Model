import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { ErrorBoundary } from '../common/ErrorBoundary';
import PieChartComp from './PieChartComp';
import BarChartComp from './BarChartComp';
import SimpleChartFallback from './SimpleChartFallback';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface ChartWrapperProps {
  data: ChartData[];
  title?: string;
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  height?: number;
  preferChartJs?: boolean; // Allow forcing Chart.js usage
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  data,
  title,
  type,
  height = 300,
  preferChartJs = true,
}) => {
  const [useChartJs, setUseChartJs] = useState(preferChartJs);
  const [hasError, setHasError] = useState(false);

  // Reset error state when data changes
  useEffect(() => {
    setHasError(false);
    setUseChartJs(preferChartJs);
  }, [data, preferChartJs]);

  // Validate data quality
  const hasValidData = data && data.length > 0 && data.some(item => 
    item && 
    typeof item.value === 'number' && 
    !isNaN(item.value) && 
    item.name?.trim()
  );

  // Handle Chart.js component errors
  const handleChartError = () => {
    console.warn('Chart.js component failed, falling back to SimpleChartFallback');
    setHasError(true);
    setUseChartJs(false);
  };

  // Determine which component to render
  const renderChart = () => {
    if (!hasValidData) {
      return (
        <Box sx={{ width: '100%', height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No valid data available
          </Typography>
        </Box>
      );
    }

    // Use Chart.js components if preferred and no errors
    if (useChartJs && !hasError) {
      try {
        switch (type) {
          case 'pie':
          case 'doughnut':
            return (
              <ErrorBoundary 
                fallback={
                  <SimpleChartFallback 
                    data={data} 
                    title={title} 
                    type={type} 
                    height={height} 
                  />
                }
              >
                <PieChartComp data={data} title={title} height={height} />
              </ErrorBoundary>
            );
          case 'bar':
            return (
              <ErrorBoundary 
                fallback={
                  <SimpleChartFallback 
                    data={data} 
                    title={title} 
                    type={type} 
                    height={height} 
                  />
                }
              >
                <BarChartComp data={data} title={title} height={height} />
              </ErrorBoundary>
            );
          case 'line':
          default:
            // For line charts and others, use SimpleChartFallback for now
            return (
              <SimpleChartFallback 
                data={data} 
                title={title} 
                type={type} 
                height={height} 
              />
            );
        }
      } catch (error) {
        console.warn('Error rendering Chart.js component:', error);
        handleChartError();
      }
    }

    // Fallback to SimpleChartFallback
    return (
      <SimpleChartFallback 
        data={data} 
        title={title} 
        type={type} 
        height={height} 
      />
    );
  };

  return (
    <Box sx={{ width: '100%', height }}>
      {renderChart()}
    </Box>
  );
};

export default ChartWrapper; 