import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, Typography } from '@mui/material';

interface SentimentTrendData {
  timestamp: string;
  fullTimestamp: string;
  sentiment: number;
  rawSentiment: number;
  text: string;
}

interface SentimentTrendChartProps {
  data: SentimentTrendData[];
}

const SentimentTrendChart: React.FC<SentimentTrendChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-xs">
          <p className="font-semibold">{data.fullTimestamp}</p>
          <p className="text-sm text-blue-600">
            Sentiment: {data.sentiment}% positive
          </p>
          <p className="text-xs text-gray-600 mt-1">
            "{data.text}"
          </p>
        </div>
      );
    }
    return null;
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 60) return '#4CAF50'; // Green for positive
    if (sentiment >= 40) return '#FF9800'; // Orange for neutral
    return '#F44336'; // Red for negative
  };

  // Add gradient definitions for the line
  const gradientOffset = () => {
    const dataMax = Math.max(...data.map(d => d.sentiment));
    const dataMin = Math.min(...data.map(d => d.sentiment));
    
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    
    return dataMax / (dataMax - dataMin);
  };

  const off = gradientOffset();

  return (
    <Card className="h-96">
      <CardContent>
        <Typography variant="h6" component="h3" className="mb-4 text-center">
          Sentiment Trend Over Time
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor="#4CAF50" stopOpacity={1} />
                <stop offset={off} stopColor="#F44336" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{ value: 'Sentiment (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="sentiment" 
              stroke="url(#splitColor)"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
            {/* Reference line at 50% (neutral) */}
            <Line 
              type="monotone" 
              dataKey={() => 50} 
              stroke="#ccc" 
              strokeDasharray="5 5" 
              dot={false} 
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 text-center">
          <div className="flex justify-center items-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
              <span>Positive (≥60%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded mr-1"></div>
              <span>Neutral (40-60%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
              <span>Negative (≤40%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SentimentTrendChart; 