# Real-Time Facial Emotion Recognition

This project uses your computer's webcam to detect and analyze facial emotions in real-time. It captures your facial expressions for 10 seconds and determines the most frequently detected emotion.

## Features

- Real-time facial emotion detection
- Live video feed with emotion display
- 10-second emotion tracking
- Support for 7 basic emotions:
  - Happy
  - Sad
  - Angry
  - Neutral
  - Fear
  - Surprise
  - Disgust

## Prerequisites

- Python 3.7 or higher
- Webcam
- Internet connection (for first-time setup)

## Installation

1. Clone this repository or download the files

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install the required packages:
```bash
pip install opencv-python deepface
```

## Usage

1. Make sure your webcam is connected and accessible

2. Run the program:
```bash
python face2.py
```

3. The program will:
   - Open your webcam
   - Show a live feed with detected emotions
   - Run for 10 seconds
   - Display the most common emotion detected

4. To exit early:
   - Press 'q' on your keyboard
   - Or wait for the 10-second duration to complete

## Troubleshooting

If you encounter any issues:

1. **Webcam not detected**:
   - Ensure your webcam is properly connected
   - Check if other applications can access your webcam
   - Try changing the camera index in the code (currently set to 0)

2. **Package installation errors**:
   - Make sure you have the latest pip version: `pip install --upgrade pip`
   - Try installing packages individually if batch installation fails

3. **Face detection issues**:
   - Ensure good lighting conditions
   - Face the camera directly
   - Remove any obstructions (glasses, masks, etc.)

## Requirements

- opencv-python
- deepface
- collections (built-in)
- time (built-in)

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues and enhancement requests! 