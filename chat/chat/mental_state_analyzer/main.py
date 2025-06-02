import json
import os
import argparse
from src.data_loader import DataLoader
from src.emotion_detector import EmotionDetector
from src.visualizer import Visualizer
from datetime import datetime

def main():
    parser = argparse.ArgumentParser(description="Analyze mental state from chat messages.")
    parser.add_argument('--input', type=str, help='Path to the input chat JSON file')
    parser.add_argument('--console', action='store_true', help='Input messages directly in the console')
    args = parser.parse_args()

    emotion_detector = EmotionDetector()
    visualizer = Visualizer()
    os.makedirs('outputs', exist_ok=True)

    if args.console:
        print("Console input mode selected.")
        mode = input("Enter 'single' for a single message or 'multi' for multiple messages: ").strip().lower()
        messages = []
        person_id = input("Enter person ID (or leave blank for 'user_console'): ").strip() or 'user_console'
        if mode == 'single':
            text = input("Enter your message: ").strip()
            timestamp = input("Enter timestamp (YYYY-MM-DDTHH:MM:SS) or leave blank for now: ").strip()
            if not timestamp:
                timestamp = datetime.now().isoformat(timespec='seconds')
            messages.append({
                'timestamp': datetime.fromisoformat(timestamp),
                'text': text,
                'person_id': person_id
            })
        elif mode == 'multi':
            print("Enter your messages one by one. Type 'done' to finish.")
            while True:
                text = input("Message: ").strip()
                if text.lower() == 'done':
                    break
                timestamp = datetime.now().isoformat(timespec='seconds')
                messages.append({
                    'timestamp': datetime.fromisoformat(timestamp),
                    'text': text,
                    'person_id': person_id
                })
        else:
            print("Invalid mode. Exiting.")
            return
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
        with open('outputs/console_results.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print("Analysis complete! Check the outputs directory for results.")
        print(json.dumps(summary, indent=2, default=str))
    elif args.input:
        # File-based input (existing behavior)
        data_loader = DataLoader(args.input)
        raw_data = data_loader.load_data()
        messages = data_loader.preprocess_messages(raw_data)
        analyzed_messages = emotion_detector.analyze_messages(messages)
        visualizer.plot_mental_states(analyzed_messages, 'outputs/mental_states.png')
        visualizer.plot_sentiment_trend(analyzed_messages, 'outputs/sentiment_trend.png')
        summary = visualizer.generate_summary(analyzed_messages)
        results = {
            'analyzed_messages': analyzed_messages,
            'summary': summary
        }
        with open('outputs/person_1_results.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print("Analysis complete! Check the outputs directory for results.")
    else:
        print("Please provide either --input <file> or --console.")

if __name__ == "__main__":
    main() 