import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CombinedProvider } from './contexts/CombinedProvider';
import { AppProviderCompat } from './contexts/AppContextCompat';
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CombinedProvider>
        <AppProviderCompat>
          <AppLayout />
        </AppProviderCompat>
      </CombinedProvider>
    </ThemeProvider>
  );
}

export default App;