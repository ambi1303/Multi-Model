import json
import os
from src.data_loader import DataLoader
from src.emotion_detector import EmotionDetector
from src.visualizer import Visualizer

def main():
    # Initialize components
    data_loader = DataLoader('data/person_1_chat.json')
    emotion_detector = EmotionDetector()
    visualizer = Visualizer()
    
    # Create output directory if it doesn't exist
    os.makedirs('outputs', exist_ok=True)
    
    # Load and preprocess data
    raw_data = data_loader.load_data()
    messages = data_loader.preprocess_messages(raw_data)
    
    # Analyze messages
    analyzed_messages = emotion_detector.analyze_messages(messages)
    
    # Generate visualizations
    visualizer.plot_mental_states(analyzed_messages, 'outputs/mental_states.png')
    visualizer.plot_sentiment_trend(analyzed_messages, 'outputs/sentiment_trend.png')
    
    # Generate summary
    summary = visualizer.generate_summary(analyzed_messages)
    
    # Save results
    results = {
        'analyzed_messages': analyzed_messages,
        'summary': summary
    }
    
    with open('outputs/person_1_results.json', 'w') as f:
        json.dump(results, f, indent=2, default=str)
        
    print("Analysis complete! Check the outputs directory for results.")

if __name__ == "__main__":
    main() 