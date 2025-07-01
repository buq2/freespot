import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Box,
  Button
} from '@mui/material';
import { Settings } from '@mui/icons-material';
import { useAppContext } from '../../contexts/AppContext';
import { WEATHER_MODELS } from '../../services/weather';
import { CustomWeatherInput } from '../Weather/CustomWeatherInput';

interface WeatherModelSelectorProps {
  selectedModels: string[];
  onModelSelectionChange: (models: string[]) => void;
}

export const WeatherModelSelector: React.FC<WeatherModelSelectorProps> = ({
  selectedModels,
  onModelSelectionChange
}) => {
  const { customWeatherData, setCustomWeatherData } = useAppContext();
  const [showCustomWeatherDialog, setShowCustomWeatherDialog] = useState(false);
  
  // Get the currently selected model (first one from the array)
  const selectedModel = selectedModels[0] || 'best_match';

  const handleModelChange = (event: any) => {
    const modelId = event.target.value;
    
    if (modelId === 'custom') {
      // If custom is selected but no data exists, open dialog
      if (!customWeatherData) {
        setShowCustomWeatherDialog(true);
        return;
      }
    }
    
    // Always replace with single selection
    onModelSelectionChange([modelId]);
  };

  const handleCustomWeatherSave = (weatherData: any[]) => {
    setCustomWeatherData(weatherData);
    // Set custom as the only selected model
    onModelSelectionChange(['custom']);
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Weather Models
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Select weather model for calculations
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Weather Model</InputLabel>
          <Select
            value={selectedModel}
            label="Weather Model"
            onChange={handleModelChange}
          >
            {WEATHER_MODELS.map((model) => (
              <MenuItem key={model.id} value={model.id}>
                {model.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {selectedModel === 'custom' && customWeatherData && (
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setShowCustomWeatherDialog(true)}
            sx={{ minWidth: 120 }}
          >
            Edit Custom
          </Button>
        )}
      </Box>

      <CustomWeatherInput
        open={showCustomWeatherDialog}
        onClose={() => setShowCustomWeatherDialog(false)}
        onSave={handleCustomWeatherSave}
        initialData={customWeatherData || undefined}
      />
    </Paper>
  );
};