# Speech-to-Text Emotion Analyzer Frontend

The frontend component of the Speech-to-Text Emotion Analyzer application. Built with React and modern web technologies.

## Features

- 🎤 Real-time audio recording with Web Audio API
- 🎨 Modern, responsive UI with smooth animations
- 📱 Mobile-friendly design
- ⚡ Fast and efficient processing
- 🎯 Clear error handling and user feedback

## Prerequisites

- Node.js 14 or higher
- npm or yarn
- Modern web browser with microphone access

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

The application will open in your default browser at `http://localhost:3000`.

## Development

### Project Structure

```
frontend/
├── public/              # Static files
├── src/                 # Source files
│   ├── App.js          # Main application component
│   ├── App.css         # Main styles
│   ├── index.js        # Application entry point
│   └── index.css       # Global styles
└── package.json        # Project dependencies and scripts
```

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App

### Key Features

1. **Audio Recording**
   - Uses Web Audio API for high-quality recording
   - Configurable audio settings (sample rate, channels)
   - Real-time recording timer

2. **UI Components**
   - Recording button with state indicators
   - Loading spinner during processing
   - Error message display
   - Results display with confidence bar

3. **Error Handling**
   - Microphone access errors
   - Network errors
   - Processing errors

## Customization

### Styling

The application uses CSS for styling. Key style files:
- `App.css`: Main application styles
- `index.css`: Global styles

### Configuration

Audio recording settings can be modified in `App.js`:
```javascript
const stream = await navigator.mediaDevices.getUserMedia({ 
  audio: {
    channelCount: 1,
    sampleRate: 16000,
    sampleSize: 16
  } 
});
```

## Troubleshooting

### Common Issues

1. **Microphone Access**
   - Ensure browser has permission to access microphone
   - Check if microphone is properly connected
   - Try refreshing the page

2. **Recording Issues**
   - Check browser console for errors
   - Verify audio settings
   - Ensure backend is running

3. **Display Issues**
   - Clear browser cache
   - Check for CSS conflicts
   - Verify responsive design breakpoints

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
