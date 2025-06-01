import React from 'react';

function formatError(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (React.isValidElement(error)) return 'Tried to render a React element object as a string.';
  if (typeof error === 'object') return JSON.stringify(error, null, 2);
  return error.toString();
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // Log error if needed
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, color: 'red' }}>
          <h2>Something went wrong.</h2>
          <pre>{formatError(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
} 