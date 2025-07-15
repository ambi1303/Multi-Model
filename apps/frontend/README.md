# 🎨 Frontend - Multi-Modal Emotion Analyzer

A modern, responsive React application built with Vite, Material-UI, and TypeScript for comprehensive emotion and mental state analysis.

## 🚀 Features

### Core Analysis Interfaces
- **🎥 Video Analysis**: Real-time webcam emotion detection with frame capture
- **🎤 Speech Analysis**: Audio recording, transcription, and emotion analysis
- **💬 Chat Analysis**: Single message and batch file analysis with export capabilities
- **📊 Survey Assessment**: Interactive burnout prediction survey with results
- **🤖 EmoBuddy Integration**: AI therapeutic companion accessible from all analysis pages

### Advanced UI Components
- **📈 Analytics Dashboard**: Real-time charts and metrics visualization
- **🎯 Interactive Charts**: Emotion trends, sentiment analysis, and mental state tracking
- **🔄 Real-time Updates**: Live data streaming and WebSocket connections
- **📱 Responsive Design**: Mobile-first approach with adaptive layouts
- **🌙 Dark Mode**: Full theme switching with system preference detection
- **♿ Accessibility**: WCAG 2.1 AA compliance with screen reader support

### User Experience Features
- **🔐 Authentication**: JWT-based login/register with persistent sessions
- **📊 Service Health**: Real-time backend service status monitoring
- **💾 Data Persistence**: Local storage for user preferences and history
- **🎨 Modern UI**: Material Design 3 with custom theming
- **⚡ Performance**: Optimized bundle size with lazy loading
- **🔍 Search & Filter**: Advanced filtering for analysis results

## 🏗️ Technology Stack

### Core Technologies
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development with strict mode
- **Vite** - Fast build tool with HMR and optimized bundling
- **Material-UI v5** - Comprehensive component library
- **Emotion** - CSS-in-JS styling with theme support

### State Management & Data
- **Zustand** - Lightweight state management
- **React Query** - Server state management with caching
- **React Hook Form** - Form handling with validation
- **Yup** - Schema validation
- **Axios** - HTTP client with interceptors

### Visualization & Charts
- **Chart.js** - Interactive charts and graphs
- **React-Chartjs-2** - React wrapper for Chart.js
- **Framer Motion** - Smooth animations and transitions
- **React Window** - Virtualized lists for performance

### Development Tools
- **ESLint** - Code linting with TypeScript support
- **Prettier** - Code formatting
- **Vite PWA** - Progressive Web App capabilities
- **Size Limit** - Bundle size monitoring
- **Lighthouse CI** - Performance auditing

## 📁 Project Structure

```
src/
├── components/
│   ├── analytics/          # Analytics dashboard components
│   ├── auth/              # Authentication forms
│   ├── burnout/           # Burnout survey components
│   ├── charts/            # Chart components and visualizations
│   ├── common/            # Reusable UI components
│   ├── landing/           # Landing page components
│   └── layout/            # Layout components (header, sidebar, footer)
├── contexts/
│   ├── NotificationContext.tsx  # Toast notifications
│   ├── ThemeContext.tsx        # Theme management
│   └── ThemeHandler.tsx        # Theme switching logic
├── hooks/
│   ├── useAnalysisProgress.ts  # Progress tracking
│   ├── useAudioRecorder.ts     # Audio recording functionality
│   ├── useChatAnalysis.ts      # Chat analysis logic
│   └── useWebcam.ts           # Webcam access and control
├── pages/
│   ├── Analytics.tsx      # Analytics dashboard
│   ├── ChatAnalysis.tsx   # Chat analysis interface
│   ├── EmoBuddy.tsx       # AI companion interface
│   ├── Home.tsx           # Landing page
│   ├── LoginPage.tsx      # Authentication
│   ├── Settings.tsx       # User preferences
│   ├── SpeechAnalysis.tsx # Speech analysis interface
│   ├── VideoAnalysis.tsx  # Video analysis interface
│   └── wellness/          # Wellness and meditation components
├── services/
│   ├── analyticsApi.ts    # Analytics API calls
│   ├── api.ts            # Core API client
│   ├── mockApi.ts        # Mock data for development
│   ├── socket.ts         # WebSocket connections
│   ├── speechApi.ts      # Speech analysis API
│   └── videoApi.ts       # Video analysis API
├── store/
│   └── useAppStore.ts    # Global state management
├── theme/
│   ├── components.ts     # Component theme overrides
│   ├── palette.ts        # Color palette definitions
│   ├── spacing.ts        # Spacing system
│   ├── theme.ts          # Main theme configuration
│   └── typography.ts     # Typography settings
├── types/
│   ├── analytics.ts      # Analytics type definitions
│   ├── index.ts          # Core type exports
│   └── survey.ts         # Survey type definitions
└── utils/
    ├── dynamicImports.ts # Dynamic component loading
    ├── icons.tsx         # Icon components
    ├── lazyLoad.tsx      # Lazy loading utilities
    └── webVitals.ts      # Performance monitoring
```

## 🛠️ Setup & Installation

### Prerequisites
- **Node.js 16+** (18+ recommended)
- **npm 8+** or **yarn 1.22+**

### Quick Start
```bash
# Clone and navigate
cd apps/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Available Scripts
```bash
# Development
npm run dev                    # Start dev server with HMR
npm run build                  # Production build
npm run preview               # Preview production build

# Code Quality
npm run lint                  # Run ESLint
npm run lint:fix             # Fix ESLint issues
npm run type-check           # TypeScript type checking

# Analysis & Monitoring
npm run build:analyze        # Bundle analysis
npm run size-limit           # Check bundle size
npm run lighthouse           # Performance audit
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend directory:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:9000
VITE_CORE_API_URL=http://localhost:8000
VITE_CHAT_API_URL=http://localhost:8003
VITE_VIDEO_API_URL=http://localhost:8001
VITE_STT_API_URL=http://localhost:8002
VITE_SURVEY_API_URL=http://localhost:8004
VITE_EMOBUDDY_API_URL=http://localhost:8005

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true
VITE_ENABLE_MOCK_DATA=false

# Development
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
```

### Build Configuration
The project uses Vite with custom configuration for:
- **Path Aliases**: Simplified imports with `@/` prefix
- **Bundle Optimization**: Tree shaking and code splitting
- **PWA Support**: Service worker and offline capabilities
- **Asset Optimization**: Image compression and optimization

## 🎯 Key Features Guide

### 1. Video Analysis
- **Real-time Detection**: Live emotion recognition from webcam
- **Image Upload**: Analyze emotions from uploaded images
- **Results Visualization**: Confidence scores and emotion breakdown
- **Export Options**: Save results and analysis history

### 2. Speech Analysis
- **Audio Recording**: Built-in microphone recording with visualization
- **File Upload**: Support for various audio formats
- **Transcription**: Speech-to-text conversion
- **Emotion Detection**: Voice-based emotion analysis
- **EmoBuddy Integration**: Automatic therapeutic support based on speech

### 3. Chat Analysis
- **Single Message**: Analyze individual messages
- **Batch Processing**: Upload and analyze chat files
- **Mental State Tracking**: Comprehensive mental health indicators
- **Export Results**: CSV and JSON export capabilities

### 4. Survey Assessment
- **Interactive Forms**: Step-by-step burnout assessment
- **Progress Tracking**: Visual progress indicators
- **Personalized Results**: Tailored recommendations and insights
- **Historical Data**: Track assessments over time

### 5. EmoBuddy AI Companion
- **Therapeutic Conversations**: Evidence-based therapeutic techniques
- **Crisis Detection**: Automatic crisis identification and support
- **Session Management**: Persistent conversation history
- **Multi-Modal Integration**: Access from all analysis pages

## 📊 Analytics & Monitoring

### Performance Metrics
- **Bundle Size**: Monitored with size-limit
- **Core Web Vitals**: LCP, FID, CLS tracking
- **User Interactions**: Click and navigation analytics
- **Error Tracking**: Comprehensive error monitoring

### Service Health Monitoring
- **Real-time Status**: Live backend service monitoring
- **Health Indicators**: Visual service status in header
- **Automatic Retry**: Failed request retry logic
- **Fallback Handling**: Graceful degradation for offline scenarios

## 🎨 Theming & Customization

### Theme System
- **Material Design 3**: Latest design system implementation
- **Dark/Light Mode**: System preference detection
- **Custom Palette**: Brand-specific color schemes
- **Component Overrides**: Customized Material-UI components

### Accessibility Features
- **WCAG 2.1 AA**: Comprehensive accessibility compliance
- **Screen Reader**: Full screen reader support
- **Keyboard Navigation**: Complete keyboard accessibility
- **High Contrast**: Enhanced contrast modes
- **Focus Management**: Proper focus handling

## 🔍 Testing & Quality

### Testing Strategy
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API integration testing
- **E2E Tests**: End-to-end user flow testing
- **Performance Tests**: Bundle size and runtime performance

### Code Quality
- **TypeScript**: Strict type checking
- **ESLint**: Code linting with custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality gates

## 🚀 Deployment

### Production Build
```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview

# Analyze bundle size
npm run build:analyze
```

### Docker Deployment
```bash
# Build Docker image
docker build -t emotion-analyzer-frontend .

# Run container
docker run -p 5173:5173 emotion-analyzer-frontend
```

### Environment-specific Builds
```bash
# Development build
npm run build

# Production build with optimizations
npm run build:production

# Build with bundle analysis
npm run build:analyze
```

## 🔧 Development Guidelines

### Code Organization
- **Component Structure**: Consistent component architecture
- **Custom Hooks**: Reusable logic extraction
- **Service Layer**: API abstraction and error handling
- **Type Safety**: Comprehensive TypeScript usage

### Performance Best Practices
- **Lazy Loading**: Route-based code splitting
- **Memoization**: React.memo and useMemo optimization
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Asset Optimization**: Image compression and lazy loading

### State Management
- **Zustand Store**: Global state management
- **React Query**: Server state caching
- **Local State**: Component-specific state with hooks
- **Context API**: Theme and notification management

## 📈 Recent Updates

### Latest Features
- ✅ Enhanced EmoBuddy accessibility with multiple access points
- ✅ Automatic transcription integration with therapeutic AI
- ✅ Improved speech analysis with real-time feedback
- ✅ Advanced analytics dashboard with interactive charts
- ✅ Comprehensive accessibility improvements
- ✅ Performance optimizations and bundle size reduction

### UI/UX Improvements
- ⚡ Faster loading times with optimized bundling
- 🎨 Enhanced visual design with Material Design 3
- 📱 Improved mobile responsiveness
- ♿ Better accessibility compliance
- 🔄 Smoother animations and transitions

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Follow the coding standards
4. Add tests for new features
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Follow the configured rules
- **Prettier**: Use consistent formatting
- **Conventional Commits**: Follow commit message format

## 📄 Browser Support

### Supported Browsers
- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

### Progressive Web App
- **Service Worker**: Offline functionality
- **App Manifest**: Native app-like experience
- **Push Notifications**: Real-time updates
- **Background Sync**: Offline data synchronization

## 🆘 Troubleshooting

### Common Issues
- **Build Errors**: Check Node.js version compatibility
- **API Errors**: Verify backend service status
- **Performance Issues**: Check bundle size and network requests
- **Accessibility Issues**: Run lighthouse audit

### Debug Mode
Enable debug mode for detailed logging:
```env
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

---

**Built with modern web technologies for optimal user experience and accessibility** 