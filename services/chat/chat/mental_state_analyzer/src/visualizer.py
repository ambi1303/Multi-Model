import matplotlib
# Set backend before importing pyplot to avoid display issues
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from typing import List, Dict
import pandas as pd
from datetime import datetime
import os

class Visualizer:
    def __init__(self):
        # Set style
        sns.set_style("whitegrid")
        plt.rcParams['figure.figsize'] = (12, 6)
        
        # Ensure outputs directory exists
        os.makedirs('outputs', exist_ok=True)
        
    def plot_mental_states(self, analyzed_messages: List[Dict], output_path: str):
        """Create a pie chart of mental states distribution."""
        try:
            # Convert to DataFrame
            df = pd.DataFrame(analyzed_messages)
            
            # Count mental states
            state_counts = df['mental_state'].value_counts()
            
            # Create pie chart
            plt.figure()
            plt.pie(state_counts, labels=state_counts.index, autopct='%1.1f%%')
            plt.title('Distribution of Mental States')
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            plt.savefig(output_path, bbox_inches='tight', dpi=150)
            plt.close()
        except Exception as e:
            print(f"[WARNING] Failed to generate mental states plot: {e}")
            plt.close()
        
    def plot_sentiment_trend(self, analyzed_messages: List[Dict], output_path: str):
        """Create a line plot of sentiment scores over time."""
        try:
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
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            plt.savefig(output_path, bbox_inches='tight', dpi=150)
            plt.close()
        except Exception as e:
            print(f"[WARNING] Failed to generate sentiment trend plot: {e}")
            plt.close()
        
    def generate_summary(self, analyzed_messages: List[Dict]) -> Dict:
        """Generate a summary of the analysis."""
        try:
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
                'most_common_emotion': df['primary_emotion'].mode().iloc[0] if not df['primary_emotion'].empty else 'neutral',
                'dominant_mental_state': mental_state_counts.index[0] if not mental_state_counts.empty else 'neutral',
                'time_span': {
                    'start': start_time,
                    'end': end_time
                }
            }
            
            return summary
        except Exception as e:
            print(f"[WARNING] Failed to generate summary: {e}")
            return {
                'total_messages': len(analyzed_messages),
                'mental_state_distribution': {},
                'average_sentiment': '50% positive',
                'most_common_emotion': 'neutral',
                'dominant_mental_state': 'neutral',
                'time_span': {
                    'start': 'Unknown',
                    'end': 'Unknown'
                }
            }
    
    def get_mental_states_data(self, analyzed_messages: List[Dict]) -> List[Dict]:
        """Get mental states data formatted for React pie chart."""
        try:
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
        except Exception as e:
            print(f"[WARNING] Failed to generate mental states data: {e}")
            return []
    
    def get_sentiment_trend_data(self, analyzed_messages: List[Dict]) -> List[Dict]:
        """Get sentiment trend data formatted for React line chart."""
        try:
            df = pd.DataFrame(analyzed_messages)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp')
            
            # Format data for React Recharts LineChart
            chart_data = []
            for _, row in df.iterrows():
                # Convert sentiment score from -1,1 to 0,100 for better visualization
                sentiment_percentage = ((row['sentiment_score'] + 1) / 2) * 100
                
                # Safely handle text content with potential Unicode
                text_preview = str(row['text'])[:50]
                if len(str(row['text'])) > 50:
                    text_preview += '...'
                
                chart_data.append({
                    'timestamp': row['timestamp'].strftime('%H:%M'),
                    'fullTimestamp': row['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
                    'sentiment': round(sentiment_percentage, 1),
                    'rawSentiment': row['sentiment_score'],
                    'text': text_preview
                })
            
            return chart_data
        except Exception as e:
            print(f"[WARNING] Failed to generate sentiment trend data: {e}")
            return [] 