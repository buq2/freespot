import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Stack,
  Divider
} from '@mui/material';
import { Refresh, BugReport, Home } from '@mui/icons-material';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom error message to display */
  fallbackMessage?: string;
  /** Whether to show technical details */
  showDetails?: boolean;
  /** Custom action buttons */
  actions?: ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * Error boundary component that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI instead of crashing the entire app.
 * 
 * Features:
 * - Graceful error handling with user-friendly messages
 * - Optional technical details for debugging
 * - Error reporting capabilities
 * - Recovery actions (refresh, reset)
 * - Error tracking with unique IDs
 * 
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallbackMessage="Something went wrong with the weather data"
 *   showDetails={process.env.NODE_ENV === 'development'}
 *   onError={(error, errorInfo) => {
 *     console.error('Weather error:', error);
 *     // Send to error reporting service
 *   }}
 * >
 *   <WeatherComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for debugging
    console.group(`🚨 Error Boundary Caught Error [${this.state.errorId}]`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // In production, you would send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorReport(error, errorInfo, this.state.errorId);
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallbackMessage, showDetails = false, actions } = this.props;
      const { error, errorInfo, errorId } = this.state;

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 3
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%'
            }}
          >
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Something went wrong</AlertTitle>
              {fallbackMessage || 'An unexpected error occurred. Please try refreshing the page.'}
            </Alert>

            <Stack spacing={3}>
              {/* Error Actions */}
              <Stack direction="row" spacing={2} justifyContent="center">
                {actions || (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<Refresh />}
                      onClick={this.handleRefresh}
                      color="primary"
                    >
                      Refresh Page
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Home />}
                      onClick={this.handleGoHome}
                    >
                      Go Home
                    </Button>
                    <Button
                      variant="text"
                      onClick={this.handleReset}
                    >
                      Try Again
                    </Button>
                  </>
                )}
              </Stack>

              {/* Technical Details (Development/Debug Mode) */}
              {showDetails && error && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BugReport />
                      Technical Details
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Error ID: {errorId}
                    </Typography>

                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Error Message:
                      </Typography>
                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          color: 'error.main',
                          mb: 2
                        }}
                      >
                        {error.message}
                      </Typography>

                      {error.stack && (
                        <>
                          <Typography variant="subtitle2" gutterBottom>
                            Stack Trace:
                          </Typography>
                          <Typography
                            variant="body2"
                            component="pre"
                            sx={{
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              color: 'text.secondary',
                              maxHeight: 200,
                              overflow: 'auto',
                              mb: 2
                            }}
                          >
                            {error.stack}
                          </Typography>
                        </>
                      )}

                      {errorInfo?.componentStack && (
                        <>
                          <Typography variant="subtitle2" gutterBottom>
                            Component Stack:
                          </Typography>
                          <Typography
                            variant="body2"
                            component="pre"
                            sx={{
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              color: 'text.secondary',
                              maxHeight: 200,
                              overflow: 'auto'
                            }}
                          >
                            {errorInfo.componentStack}
                          </Typography>
                        </>
                      )}
                    </Paper>
                  </Box>
                </>
              )}
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component that wraps a component with an error boundary.
 * Useful for wrapping specific sections of the app.
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};