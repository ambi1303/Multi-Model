# Mental State Analyzer

A Python-based tool for analyzing mental states and emotions from chat messages using natural language processing and machine learning.

## Features

- Emotion detection using transformer models
- Sentiment analysis
- Mental state classification
- Visualization of results
- Data preprocessing and analysis

## Installation

1. Clone the repository:
```bash
git clone https://github.com/arush-gitcodes/emp_chats
cd mental_state_analyzer
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

This project can be used in two ways: as a command-line tool or as a FastAPI backend.

### Command-Line Tool

1. Place your chat data in JSON format in the `data` directory
2. Run the analysis, specifying the input file:
```bash
python main.py --input data/person_1_chat.json
```

   Alternatively, you can use console input:
```bash
python main.py --console
```
   Follow the prompts to enter messages directly.

3. Check the `outputs` directory for:
   - Mental state distribution visualization (`mental_states.png`)
   - Sentiment trend analysis (`sentiment_trend.png`)
   - Detailed results in JSON format (`person_1_results.json` or `console_results.json`)

### FastAPI Backend

1. Install dependencies (if you haven't already):
```bash
pip install -r requirements.txt
```

2. Run the FastAPI server:
```bash
cd mental_state_analyzer
python api.py
```
   The API will run on `http://localhost:8000` by default.

3. Access the interactive API documentation (Swagger UI) at:
   `http://localhost:8000/docs`

   Here you can test the available endpoints:
   - **POST /analyze/single**: Analyze a single message.
   - **POST /analyze/multiple**: Analyze multiple messages.
   - **GET /visualizations/mental-states**: Get the mental states distribution visualization.
   - **GET /visualizations/sentiment-trend**: Get the sentiment trend visualization.
   - **GET /results/latest**: Get the latest analysis results from the API.

## Project Structure

```
mental_state_analyzer/
├── data/               # Input data directory
├── models/            # Model files
├── outputs/           # Generated results
├── src/               # Source code
│   ├── data_loader.py
│   ├── emotion_detector.py
│   └── visualizer.py
├── main.py           # Main entry point
└── requirements.txt  # Project dependencies
```

## Dependencies

- pandas >= 2.0.0
- nltk >= 3.8.1
- textblob >= 0.17.1
- transformers >= 4.30.0
- torch >= 2.0.0
- matplotlib >= 3.7.0
- seaborn >= 0.12.0
- scikit-learn >= 1.0.0


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 