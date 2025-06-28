import React, { Suspense } from 'react';
import { SkeletonLoader } from '../common/OptimizedLoadingSpinner';
import { Box, CircularProgress } from '@mui/material';
import { SimpleChartFallback } from '../charts/SimpleChartFallback';

interface LazyChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: any;
  options?: any;
  height?: number;
}

const ChartLoadingFallback: React.FC = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    height={300}
    sx={{ backgroundColor: 'background.paper' }}
  >
    <CircularProgress size={40} />
  </Box>
);

// Wrapper components with suspense and loading
interface ChartWrapperProps {
  children: React.ReactNode;
  height?: number;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ children, height = 300 }) => (
  <Suspense fallback={
    <SkeletonLoader 
      width="100%" 
      height={height} 
      variant="rectangular" 
      animation="wave" 
    />
  }>
    {children}
  </Suspense>
);

// Simplified chart components using fallback
export const LazyLineChart: React.FC<any> = (props) => (
  <SimpleChartFallback
    data={props.data || []}
    type="line"
    height={props.height}
    title={props.title}
  />
);

export const LazyBarChart: React.FC<any> = (props) => (
  <SimpleChartFallback
    data={props.data || []}
    type="bar"
    height={props.height}
    title={props.title}
  />
);

export const LazyAreaChart: React.FC<any> = (props) => (
  <SimpleChartFallback
    data={props.data || []}
    type="bar"
    height={props.height}
    title={props.title}
  />
);

export const LazyPieChart: React.FC<any> = (props) => (
  <SimpleChartFallback
    data={props.data || []}
    type="pie"
    height={props.height}
    title={props.title}
  />
);

export const LazyScatterChart: React.FC<any> = (props) => (
  <SimpleChartFallback
    data={props.data || []}
    type="bar"
    height={props.height}
    title={props.title}
  />
);

export const LazyRadarChart: React.FC<any> = (props) => (
  <SimpleChartFallback
    data={props.data || []}
    type="bar"
    height={props.height}
    title={props.title}
  />
);

export const LazyComposedChart: React.FC<any> = (props) => (
  <SimpleChartFallback
    data={props.data || []}
    type="bar"
    height={props.height}
    title={props.title}
  />
);

// Export other components as simple divs to maintain compatibility
export const LazyLine: React.FC<any> = () => <div />;
export const LazyBar: React.FC<any> = () => <div />;
export const LazyArea: React.FC<any> = () => <div />;
export const LazyPie: React.FC<any> = () => <div />;
export const LazyScatter: React.FC<any> = () => <div />;
export const LazyRadar: React.FC<any> = () => <div />;
export const LazyCell: React.FC<any> = () => <div />;
export const LazyXAxis: React.FC<any> = () => <div />;
export const LazyYAxis: React.FC<any> = () => <div />;
export const LazyCartesianGrid: React.FC<any> = () => <div />;
export const LazyTooltip: React.FC<any> = () => <div />;
export const LazyResponsiveContainer: React.FC<any> = ({ children }: any) => <div>{children}</div>;
export const LazyPolarGrid: React.FC<any> = () => <div />;
export const LazyPolarAngleAxis: React.FC<any> = () => <div />;
export const LazyPolarRadiusAxis: React.FC<any> = () => <div />;

export const LazyChartComponent: React.FC<LazyChartProps> = (props) => {
  const { type, data, options, height = 300 } = props;

  // Use simple fallback to avoid lodash dependency issues
  const chartData = Array.isArray(data) ? data : data?.datasets?.[0]?.data || [];
  const formattedData = chartData.map((item: any, index: number) => ({
    name: item.name || item.label || `Item ${index + 1}`,
    value: typeof item === 'number' ? item : item.value || item.y || 0,
    color: item.color || `hsl(${index * 60}, 70%, 50%)`,
  }));

  return (
    <SimpleChartFallback
      data={formattedData}
      type={type === 'doughnut' ? 'pie' : type}
      height={height}
    />
  );
};

// Create a separate chart wrapper component
const ChartWrapperComponent = React.memo(({ type, data, options, height = 300 }: LazyChartProps) => {
  return (
    <SimpleChartFallback
      data={data || []}
      type={type}
      height={height}
    />
  );
});

export default ChartWrapperComponent; 