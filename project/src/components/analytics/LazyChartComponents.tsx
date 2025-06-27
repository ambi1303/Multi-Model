import React, { lazy, Suspense } from 'react';
import { SkeletonLoader } from '../common/OptimizedLoadingSpinner';

// Lazy load chart components to reduce initial bundle size
const LineChart = lazy(() => 
  import('recharts').then(module => ({ default: module.LineChart }))
);

const BarChart = lazy(() => 
  import('recharts').then(module => ({ default: module.BarChart }))
);

const AreaChart = lazy(() => 
  import('recharts').then(module => ({ default: module.AreaChart }))
);

const PieChart = lazy(() => 
  import('recharts').then(module => ({ default: module.PieChart }))
);

const ScatterChart = lazy(() => 
  import('recharts').then(module => ({ default: module.ScatterChart }))
);

const RadarChart = lazy(() => 
  import('recharts').then(module => ({ default: module.RadarChart }))
);

const ComposedChart = lazy(() => 
  import('recharts').then(module => ({ default: module.ComposedChart }))
);

// Other chart components
const Line = lazy(() => 
  import('recharts').then(module => ({ default: module.Line }))
);

const Bar = lazy(() => 
  import('recharts').then(module => ({ default: module.Bar }))
);

const Area = lazy(() => 
  import('recharts').then(module => ({ default: module.Area }))
);

const Pie = lazy(() => 
  import('recharts').then(module => ({ default: module.Pie }))
);

const Scatter = lazy(() => 
  import('recharts').then(module => ({ default: module.Scatter }))
);

const Radar = lazy(() => 
  import('recharts').then(module => ({ default: module.Radar }))
);

const Cell = lazy(() => 
  import('recharts').then(module => ({ default: module.Cell }))
);

// Chart utility components
const XAxis = lazy(() => 
  import('recharts').then(module => ({ default: module.XAxis }))
);

const YAxis = lazy(() => 
  import('recharts').then(module => ({ default: module.YAxis }))
);

const CartesianGrid = lazy(() => 
  import('recharts').then(module => ({ default: module.CartesianGrid }))
);

const Tooltip = lazy(() => 
  import('recharts').then(module => ({ default: module.Tooltip }))
);

const ResponsiveContainer = lazy(() => 
  import('recharts').then(module => ({ default: module.ResponsiveContainer }))
);

const PolarGrid = lazy(() => 
  import('recharts').then(module => ({ default: module.PolarGrid }))
);

const PolarAngleAxis = lazy(() => 
  import('recharts').then(module => ({ default: module.PolarAngleAxis }))
);

const PolarRadiusAxis = lazy(() => 
  import('recharts').then(module => ({ default: module.PolarRadiusAxis }))
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

// Export wrapped components
export const LazyLineChart: React.FC<any> = (props) => (
  <ChartWrapper height={props.height}>
    <LineChart {...props} />
  </ChartWrapper>
);

export const LazyBarChart: React.FC<any> = (props) => (
  <ChartWrapper height={props.height}>
    <BarChart {...props} />
  </ChartWrapper>
);

export const LazyAreaChart: React.FC<any> = (props) => (
  <ChartWrapper height={props.height}>
    <AreaChart {...props} />
  </ChartWrapper>
);

export const LazyPieChart: React.FC<any> = (props) => (
  <ChartWrapper height={props.height}>
    <PieChart {...props} />
  </ChartWrapper>
);

export const LazyScatterChart: React.FC<any> = (props) => (
  <ChartWrapper height={props.height}>
    <ScatterChart {...props} />
  </ChartWrapper>
);

export const LazyRadarChart: React.FC<any> = (props) => (
  <ChartWrapper height={props.height}>
    <RadarChart {...props} />
  </ChartWrapper>
);

export const LazyComposedChart: React.FC<any> = (props) => (
  <ChartWrapper height={props.height}>
    <ComposedChart {...props} />
  </ChartWrapper>
);

// Export other components with suspense
export const LazyLine: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <Line {...props} />
  </Suspense>
);

export const LazyBar: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <Bar {...props} />
  </Suspense>
);

export const LazyArea: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <Area {...props} />
  </Suspense>
);

export const LazyPie: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <Pie {...props} />
  </Suspense>
);

export const LazyScatter: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <Scatter {...props} />
  </Suspense>
);

export const LazyRadar: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <Radar {...props} />
  </Suspense>
);

export const LazyCell: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <Cell {...props} />
  </Suspense>
);

export const LazyXAxis: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <XAxis {...props} />
  </Suspense>
);

export const LazyYAxis: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <YAxis {...props} />
  </Suspense>
);

export const LazyCartesianGrid: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <CartesianGrid {...props} />
  </Suspense>
);

export const LazyTooltip: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <Tooltip {...props} />
  </Suspense>
);

export const LazyResponsiveContainer: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <ResponsiveContainer {...props} />
  </Suspense>
);

export const LazyPolarGrid: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <PolarGrid {...props} />
  </Suspense>
);

export const LazyPolarAngleAxis: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <PolarAngleAxis {...props} />
  </Suspense>
);

export const LazyPolarRadiusAxis: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <PolarRadiusAxis {...props} />
  </Suspense>
); 