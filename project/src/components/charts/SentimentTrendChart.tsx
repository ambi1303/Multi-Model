import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

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
  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 60) return '#4CAF50'; // Green for positive
    if (sentiment >= 40) return '#FF9800'; // Orange for neutral
    return '#F44336'; // Red for negative
  };

  // Validate and transform data for Recharts
  const validData = data.filter(item =>
    item.timestamp &&
    typeof item.sentiment === 'number' &&
    !isNaN(item.sentiment) &&
    item.sentiment >= 0 &&
    item.sentiment <= 100
  );

  const chartData = validData.map((item, index) => ({
    name: item.timestamp,
    sentiment: item.sentiment,
    rawSentiment: item.rawSentiment,
    text: item.text,
    fullTimestamp: item.fullTimestamp,
    color: getSentimentColor(item.sentiment),
  }));

  if (chartData.length === 0) {
    return (
      <Card className="h-96">
        <CardContent>
          <Typography variant="h6" component="h3" className="mb-4 text-center">
            Sentiment Trend Over Time
          </Typography>
          <div className="flex items-center justify-center h-64">
            <Typography variant="body2" color="text.secondary" className="text-center">
              No sentiment trend data available to display
            </Typography>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg max-w-xs">
          <p className="font-semibold">{label}</p>
          <p className="text-blue-600">
            Sentiment: {data.sentiment.toFixed(1)}%
          </p>
          <p className="text-gray-600 text-sm truncate">
            Text: {data.text.length > 50 ? data.text.substring(0, 50) + '...' : data.text}
          </p>
          <p className="text-xs text-gray-500">
            {data.fullTimestamp}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={getSentimentColor(payload.sentiment)}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  };

  return (
    <Card className="h-96">
      <CardContent>
        <Typography variant="h6" component="h3" className="mb-4 text-center">
          Sentiment Trend Over Time
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              fontSize={10}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              domain={[0, 100]}
              fontSize={12}
              label={{ value: 'Sentiment %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines for sentiment ranges */}
            <ReferenceLine y={60} stroke="#4CAF50" strokeDasharray="5 5" opacity={0.5} />
            <ReferenceLine y={40} stroke="#FF9800" strokeDasharray="5 5" opacity={0.5} />
            
            <Line
              type="monotone"
              dataKey="sentiment"
              stroke="#2196F3"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 6, stroke: '#2196F3', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Legend */}
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