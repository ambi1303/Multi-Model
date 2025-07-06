import matplotlib.pyplot as plt
import seaborn as sns
from typing import List, Dict
import pandas as pd
from datetime import datetime

class Visualizer:
    def __init__(self):
        # Set style
        sns.set_style("whitegrid")
        plt.rcParams['figure.figsize'] = (12, 6)
        
    def plot_mental_states(self, analyzed_messages: List[Dict], output_path: str):
        """Create a pie chart of mental states distribution."""
        # Convert to DataFrame
        df = pd.DataFrame(analyzed_messages)
        
        # Count mental states
        state_counts = df['mental_state'].value_counts()
        
        # Create pie chart
        plt.figure()
        plt.pie(state_counts, labels=state_counts.index, autopct='%1.1f%%')
        plt.title('Distribution of Mental States')
        plt.savefig(output_path)
        plt.close()
        
    def plot_sentiment_trend(self, analyzed_messages: List[Dict], output_path: str):
        """Create a line plot of sentiment scores over time."""
        # Convert to DataFrame
        df = pd.DataFrame(analyzed_messages)
        
        # Convert timestamp strings to datetime objects
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Sort by timestamp
        df = df.sort_values('timestamp')
        
        # Create line plot
        plt.figure()
        plt.plot(df['timestamp'], df['sentiment_score'], marker='o')
        plt.title('Sentiment Score Trend Over Time')
        plt.xlabel('Time')
        plt.ylabel('Sentiment Score')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(output_path)
        plt.close()
        
    def generate_summary(self, analyzed_messages: List[Dict]) -> Dict:
        """Generate a summary of the analysis."""
        df = pd.DataFrame(analyzed_messages)
        
        # Convert timestamp strings to datetime objects
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Format mental state distribution with better presentation
        mental_state_counts = df['mental_state'].value_counts()
        total_messages = len(df)
        mental_state_formatted = {}
        for state, count in mental_state_counts.items():
            percentage = (count / total_messages) * 100
            mental_state_formatted[state] = f"{count} messages ({percentage:.0f}%)"
        
        # Format average sentiment as percentage
        avg_sentiment = df['sentiment_score'].mean()
        sentiment_percentage = ((avg_sentiment + 1) / 2) * 100  # Convert from -1,1 to 0,100
        
        # Format timestamps in human-readable format
        start_time = df['timestamp'].min().strftime("%B %d, %Y at %I:%M %p")
        end_time = df['timestamp'].max().strftime("%B %d, %Y at %I:%M %p")
        
        summary = {
            'total_messages': total_messages,
            'mental_state_distribution': mental_state_formatted,
            'average_sentiment': f"{sentiment_percentage:.0f}% positive",
            'most_common_emotion': df['primary_emotion'].mode().iloc[0],
            'dominant_mental_state': mental_state_counts.index[0],  # Most common mental state
            'time_span': {
                'start': start_time,
                'end': end_time
            }
        }
        
        return summary 
    
    def get_mental_states_data(self, analyzed_messages: List[Dict]) -> List[Dict]:
        """Get mental states data formatted for React pie chart."""
        df = pd.DataFrame(analyzed_messages)
        state_counts = df['mental_state'].value_counts()
        
        # Format data for React Recharts PieChart
        chart_data = []
        colors = {
            'Positive': '#4CAF50',
            'Negative': '#F44336', 
            'Neutral': '#FF9800',
            'Stressed': '#E91E63',
            'Anxious': '#9C27B0',
            'Happy': '#2196F3',
            'Sad': '#607D8B'
        }
        
        for state, count in state_counts.items():
            percentage = (count / len(df)) * 100
            chart_data.append({
                'name': state,
                'value': count,
                'percentage': round(percentage, 1),
                'color': colors.get(state, '#757575')
            })
        
        return chart_data
    
    def get_sentiment_trend_data(self, analyzed_messages: List[Dict]) -> List[Dict]:
        """Get sentiment trend data formatted for React line chart."""
        df = pd.DataFrame(analyzed_messages)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Format data for React Recharts LineChart
        chart_data = []
        for _, row in df.iterrows():
            # Convert sentiment score from -1,1 to 0,100 for better visualization
            sentiment_percentage = ((row['sentiment_score'] + 1) / 2) * 100
            
            chart_data.append({
                'timestamp': row['timestamp'].strftime('%H:%M'),
                'fullTimestamp': row['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
                'sentiment': round(sentiment_percentage, 1),
                'rawSentiment': row['sentiment_score'],
                'text': row['text'][:50] + '...' if len(row['text']) > 50 else row['text']
            })
        
        return chart_data 