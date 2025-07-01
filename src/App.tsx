import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CombinedProvider } from './contexts/CombinedProvider';
import { AppProviderCompat } from './contexts/AppContextCompat';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { AppLayout } from './components/Layout';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary
      fallbackMessage="FreeSpot encountered an unexpected error"
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        console.error('App Error Boundary:', error, errorInfo);
        // In production, send to error reporting service
      }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <CombinedProvider>
          <AppProviderCompat>
            <ErrorBoundary
              fallbackMessage="Error in main application layout"
              showDetails={process.env.NODE_ENV === 'development'}
            >
              <AppLayout />
            </ErrorBoundary>
          </AppProviderCompat>
        </CombinedProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;