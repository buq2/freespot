import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Box,
  Chip,
  Stack
} from '@mui/material';
import { useAppContext } from '../../contexts/AppContext';
import { WEATHER_MODELS } from '../../services/weather';

interface WeatherModelSelectorProps {
  selectedModels: string[];
  onModelSelectionChange: (models: string[]) => void;
}

export const WeatherModelSelector: React.FC<WeatherModelSelectorProps> = ({
  selectedModels,
  onModelSelectionChange
}) => {
  const handleModelToggle = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onModelSelectionChange(selectedModels.filter(id => id !== modelId));
    } else {
      onModelSelectionChange([...selectedModels, modelId]);
    }
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
          <Chip
            key={model.id}
            label={model.name}
            clickable
            color={selectedModels.includes(model.id) ? 'primary' : 'default'}
            variant={selectedModels.includes(model.id) ? 'filled' : 'outlined'}
            onClick={() => handleModelToggle(model.id)}
          />
        ))}
      </Stack>

      {selectedModels.length === 0 && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          Please select at least one weather model
        </Typography>
      )}
    </Paper>
  );
};