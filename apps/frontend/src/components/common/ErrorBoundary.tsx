import  { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { RefreshIcon } from '../../utils/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chart Error Boundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            minHeight: 200,
          }}
        >
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Chart Loading Error
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Unable to render the chart component. This might be due to invalid data or a temporary issue.
            </Typography>
            {this.state.error && (
              <Typography variant="caption" color="text.secondary">
                Error: {this.state.error.message}
              </Typography>
            )}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={this.handleRetry}
            size="small"
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;