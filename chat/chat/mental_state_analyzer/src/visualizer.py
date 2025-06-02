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
        
        summary = {
            'total_messages': len(df),
            'mental_state_distribution': df['mental_state'].value_counts().to_dict(),
            'average_sentiment': df['sentiment_score'].mean(),
            'most_common_emotion': df['primary_emotion'].mode().iloc[0],
            'time_span': {
                'start': df['timestamp'].min().isoformat(),
                'end': df['timestamp'].max().isoformat()
            }
        }
        
        return summary 