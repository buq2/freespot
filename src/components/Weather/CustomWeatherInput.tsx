import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Typography,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { Add, Delete, Upload, Download } from '@mui/icons-material';
import type { ForecastData } from '../../types';

interface CustomWeatherInputProps {
  open: boolean;
  onClose: () => void;
  onSave: (weatherData: ForecastData[]) => void;
  initialData?: ForecastData[];
}

interface WeatherDataRow {
  id: string;
  altitude: string;
  direction: string;
  speed: string;
  temperature: string;
}

const createEmptyRow = (id: string): WeatherDataRow => ({
  id,
  altitude: '',
  direction: '',
  speed: '',
  temperature: ''
});

export const CustomWeatherInput: React.FC<CustomWeatherInputProps> = ({
  open,
  onClose,
  onSave,
  initialData = []
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [rows, setRows] = useState<WeatherDataRow[]>(() => {
    if (initialData.length > 0) {
      return initialData.map((data, index) => ({
        id: `row-${index}`,
        altitude: data.altitude.toString(),
        direction: data.direction.toString(),
        speed: data.speed.toString(),
        temperature: data.temperature?.toString() || ''
      }));
    }
    return [createEmptyRow('row-0')];
  });
  const [importText, setImportText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddRow = useCallback(() => {
    setRows(prev => [...prev, createEmptyRow(`row-${Date.now()}`)]);
  }, []);

  const handleDeleteRow = useCallback((id: string) => {
    setRows(prev => prev.filter(row => row.id !== id));
  }, []);

  const handleRowChange = useCallback((id: string, field: keyof WeatherDataRow, value: string) => {
    setRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  }, []);

  const validateAndParseRows = (): ForecastData[] | null => {
    const weatherData: ForecastData[] = [];
    
    for (const row of rows) {
      const altitude = parseFloat(row.altitude);
      const direction = parseFloat(row.direction);
      const speed = parseFloat(row.speed);
      const temperature = row.temperature ? parseFloat(row.temperature) : undefined;
      
      if (isNaN(altitude) || isNaN(direction) || isNaN(speed)) {
        setError('All altitude, direction, and speed values must be valid numbers');
        return null;
      }
      
      if (direction < 0 || direction >= 360) {
        setError('Wind direction must be between 0 and 359 degrees');
        return null;
      }
      
      if (speed < 0) {
        setError('Wind speed cannot be negative');
        return null;
      }
      
      const forecast: ForecastData = {
        altitude,
        direction,
        speed
      };
      
      if (temperature !== undefined && !isNaN(temperature)) {
        forecast.temperature = temperature;
      }
      
      weatherData.push(forecast);
    }
    
    // Sort by altitude
    weatherData.sort((a, b) => a.altitude - b.altitude);
    
    setError(null);
    return weatherData;
  };

  const handleSave = () => {
    const weatherData = validateAndParseRows();
    if (weatherData) {
      onSave(weatherData);
      onClose();
    }
  };

  const handleImport = () => {
    try {
      const lines = importText.trim().split('\n');
      const newRows: WeatherDataRow[] = [];
      
      // Skip header line if it contains column names
      const startIndex = lines[0].toLowerCase().includes('height') || 
                        lines[0].toLowerCase().includes('altitude') ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Split by whitespace or tabs
        const values = line.split(/\s+/);
        
        if (values.length < 3) {
          setError(`Line ${i + 1}: Expected at least 3 values (altitude, direction, speed)`);
          return;
        }
        
        newRows.push({
          id: `imported-${i}`,
          altitude: values[0],
          direction: values[1],
          speed: values[2],
          temperature: values[3] || ''
        });
      }
      
      if (newRows.length === 0) {
        setError('No valid data found in import text');
        return;
      }
      
      setRows(newRows);
      setError(null);
      setTabValue(0); // Switch to manual entry tab
    } catch {
      setError('Failed to parse import data. Please check the format.');
    }
  };

  const handleExport = () => {
    const weatherData = validateAndParseRows();
    if (!weatherData) return;
    
    let exportText = 'Height\n(m)\tDir\n(°)\tSpeed\n(m/s)\tTemp.\n(°C)\n';
    weatherData.forEach(data => {
      exportText += `${data.altitude}\t${data.direction}\t${data.speed}\t${data.temperature || ''}\n`;
    });
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-weather-data.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Custom Weather Data</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Manual Entry" />
            <Tab label="Import Data" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {tabValue === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Weather Data Entry</Typography>
              <Box>
                <Button
                  startIcon={<Add />}
                  onClick={handleAddRow}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Add Row
                </Button>
                <Button
                  startIcon={<Download />}
                  onClick={handleExport}
                  variant="outlined"
                  size="small"
                >
                  Export
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Height (m)</TableCell>
                    <TableCell>Direction (°)</TableCell>
                    <TableCell>Speed (m/s)</TableCell>
                    <TableCell>Temperature (°C)</TableCell>
                    <TableCell width={60}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={row.altitude}
                          onChange={(e) => handleRowChange(row.id, 'altitude', e.target.value)}
                          placeholder="0"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={row.direction}
                          onChange={(e) => handleRowChange(row.id, 'direction', e.target.value)}
                          placeholder="0-359"
                          inputProps={{ min: 0, max: 359 }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={row.speed}
                          onChange={(e) => handleRowChange(row.id, 'speed', e.target.value)}
                          placeholder="0"
                          inputProps={{ min: 0 }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={row.temperature}
                          onChange={(e) => handleRowChange(row.id, 'temperature', e.target.value)}
                          placeholder="Optional"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRow(row.id)}
                          disabled={rows.length === 1}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Import Weather Data
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Paste data in the format: Height(m) Direction(°) Speed(m/s) Temperature(°C)
              <br />
              Example:
              <br />
              0 329 5 18
              <br />
              300 320 8 15
            </Typography>
            
            <TextField
              multiline
              rows={10}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="0 329 5 18&#10;300 320 8 15&#10;500 321 11 12"
              fullWidth
              sx={{ mb: 2 }}
            />
            
            <Button
              startIcon={<Upload />}
              onClick={handleImport}
              variant="contained"
              disabled={!importText.trim()}
            >
              Import Data
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Weather Data
        </Button>
      </DialogActions>
    </Dialog>
  );
};