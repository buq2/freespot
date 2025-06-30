import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Box,
  Chip,
  Stack,
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

  const handleModelToggle = (modelId: string) => {
    if (modelId === 'custom') {
      if (selectedModels.includes(modelId)) {
        // Remove custom model
        onModelSelectionChange(selectedModels.filter(id => id !== modelId));
      } else {
        // Add custom model - open dialog if no data exists
        if (!customWeatherData) {
          setShowCustomWeatherDialog(true);
        } else {
          onModelSelectionChange([...selectedModels, modelId]);
        }
      }
    } else {
      if (selectedModels.includes(modelId)) {
        onModelSelectionChange(selectedModels.filter(id => id !== modelId));
      } else {
        onModelSelectionChange([...selectedModels, modelId]);
      }
    }
  };

  const handleCustomWeatherSave = (weatherData: any[]) => {
    setCustomWeatherData(weatherData);
    onModelSelectionChange([...selectedModels, 'custom']);
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Weather Models
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Select one or more weather models for comparison
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {WEATHER_MODELS.map((model) => (
          <Box key={model.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip
              label={model.name}
              clickable
              color={selectedModels.includes(model.id) ? 'primary' : 'default'}
              variant={selectedModels.includes(model.id) ? 'filled' : 'outlined'}
              onClick={() => handleModelToggle(model.id)}
            />
            {model.id === 'custom' && customWeatherData && (
              <Button
                size="small"
                startIcon={<Settings />}
                onClick={() => setShowCustomWeatherDialog(true)}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                Edit
              </Button>
            )}
          </Box>
        ))}
      </Stack>

      {selectedModels.length === 0 && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          Please select at least one weather model
        </Typography>
      )}

      <CustomWeatherInput
        open={showCustomWeatherDialog}
        onClose={() => setShowCustomWeatherDialog(false)}
        onSave={handleCustomWeatherSave}
        initialData={customWeatherData || undefined}
      />
    </Paper>
  );
};