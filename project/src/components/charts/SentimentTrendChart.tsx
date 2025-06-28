import React from 'react';
import { SimpleChartFallback } from './SimpleChartFallback';
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
  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 60) return '#4CAF50'; // Green for positive
    if (sentiment >= 40) return '#FF9800'; // Orange for neutral
    return '#F44336'; // Red for negative
  };

  // Transform data for SimpleChartFallback
  const chartData = data.map((item, index) => ({
    name: item.timestamp,
    value: item.sentiment,
    color: getSentimentColor(item.sentiment),
  }));

  return (
    <Card className="h-96">
      <CardContent>
        <Typography variant="h6" component="h3" className="mb-4 text-center">
          Sentiment Trend Over Time
        </Typography>
        <SimpleChartFallback
          data={chartData}
          type="line"
          height={300}
          title=""
        />
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