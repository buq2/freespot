import React, { useState } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Box,
  InputAdornment,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Collapse,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import { 
  ExpandMore, 
  ExpandLess, 
  MoreVert, 
  Delete, 
  Edit, 
  GetApp, 
  Palette 
} from '@mui/icons-material';
import { useAppContext } from '../../contexts';
import { convertSpeed, convertAltitude } from '../../utils/units';
import { calculateCanopyAirSpeed } from '../../physics/constants';
import type { JumpProfile } from '../../types';

interface ProfileSectionProps {
  profile: JumpProfile;
  canDelete?: boolean;
}

const PROFILE_COLORS = [
  '#2196F3', // Blue
  '#FF9800', // Orange  
  '#4CAF50', // Green
  '#9C27B0', // Purple
  '#F44336', // Red
  '#00BCD4', // Cyan
  '#FFEB3B', // Yellow
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#E91E63', // Pink
];

export const ProfileSection: React.FC<ProfileSectionProps> = ({ 
  profile, 
  canDelete = true 
}) => {
  const { updateProfile, deleteProfile, userPreferences } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newName, setNewName] = useState(profile.name);

  const handleParameterChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0;
    updateProfile(profile.id, {
      parameters: {
        ...profile.parameters,
        [field]: value
      }
    });
  };


  const handleEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile(profile.id, { enabled: event.target.checked });
  };

  const handleShowDriftChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile(profile.id, { showDriftVisualization: event.target.checked });
  };


  const handleRename = () => {
    if (newName.trim() && newName.trim() !== profile.name) {
      updateProfile(profile.id, { name: newName.trim() });
    }
    setShowRenameDialog(false);
    setMenuAnchor(null);
  };

  const handleDelete = () => {
    deleteProfile(profile.id);
    setShowDeleteDialog(false);
    setMenuAnchor(null);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(profile, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_profile.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMenuAnchor(null);
  };

  const handleColorChange = (color: string) => {
    updateProfile(profile.id, { color });
    setShowColorPicker(false);
    setMenuAnchor(null);
  };

  // Convert values for display
  const displayJumpAltitude = convertAltitude(profile.parameters.jumpAltitude, 'meters', userPreferences.units.altitude);
  const displayOpeningAltitude = convertAltitude(profile.parameters.openingAltitude, 'meters', userPreferences.units.altitude);
  const displaySetupAltitude = convertAltitude(profile.parameters.setupAltitude, 'meters', userPreferences.units.altitude);
  const displayAircraftSpeed = convertSpeed(profile.parameters.aircraftSpeed, 'ms', userPreferences.units.speed);
  const displayFreefallSpeed = convertSpeed(profile.parameters.freefallSpeed, 'ms', userPreferences.units.speed);
  const displayCanopyDescentRate = convertSpeed(profile.parameters.canopyDescentRate, 'ms', userPreferences.units.speed);
  
  // Calculate derived canopy air speed for display
  const canopyAirSpeed = calculateCanopyAirSpeed(profile.parameters.canopyDescentRate, profile.parameters.glideRatio);
  const displayCanopyAirSpeed = convertSpeed(canopyAirSpeed, 'ms', userPreferences.units.speed);

  return (
    <Paper elevation={2} sx={{ mb: 2 }}>
      <Box sx={{ p: 2 }}>
        {/* Profile Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: profile.color,
                border: '2px solid #ccc',
              }}
            />
            <Typography variant="h6" sx={{ flex: 1 }}>
              {profile.name}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={profile.enabled}
                  onChange={handleEnabledChange}
                  size="small"
                />
              }
              label="Enabled"
              sx={{ mr: 0 }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
            >
              <MoreVert />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {/* Profile Options */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          {profile.enabled && (
            <Chip size="small" label="Active" color="success" />
          )}
          {profile.showDriftVisualization && (
            <Chip size="small" label="Drift Visualization" variant="outlined" />
          )}
        </Box>

        {/* Collapsible Content */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Profile Settings */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Profile Settings
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.showDriftVisualization}
                      onChange={handleShowDriftChange}
                      size="small"
                    />
                  }
                  label="Show freefall drift visualization"
                />
              </Grid>


              {/* Altitudes */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Altitudes
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Jump Altitude"
                  value={displayJumpAltitude.toFixed(0)}
                  onChange={(e) => {
                    const displayValue = parseFloat(e.target.value) || 0;
                    const metersValue = convertAltitude(displayValue, userPreferences.units.altitude, 'meters');
                    updateProfile(profile.id, {
                      parameters: {
                        ...profile.parameters,
                        jumpAltitude: metersValue
                      }
                    });
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">
                      {userPreferences.units.altitude === 'meters' ? 'm' : 'ft'}
                    </InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Opening Altitude"
                  value={displayOpeningAltitude.toFixed(0)}
                  onChange={(e) => {
                    const displayValue = parseFloat(e.target.value) || 0;
                    const metersValue = convertAltitude(displayValue, userPreferences.units.altitude, 'meters');
                    updateProfile(profile.id, {
                      parameters: {
                        ...profile.parameters,
                        openingAltitude: metersValue
                      }
                    });
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">
                      {userPreferences.units.altitude === 'meters' ? 'm' : 'ft'}
                    </InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Setup Altitude"
                  value={displaySetupAltitude.toFixed(0)}
                  onChange={(e) => {
                    const displayValue = parseFloat(e.target.value) || 0;
                    const metersValue = convertAltitude(displayValue, userPreferences.units.altitude, 'meters');
                    updateProfile(profile.id, {
                      parameters: {
                        ...profile.parameters,
                        setupAltitude: metersValue
                      }
                    });
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">
                      {userPreferences.units.altitude === 'meters' ? 'm' : 'ft'}
                    </InputAdornment>
                  }}
                  helperText="Altitude AGL to be on top of landing zone"
                />
              </Grid>

              {/* Speeds */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Speeds
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Aircraft Speed"
                  value={displayAircraftSpeed.toFixed(1)}
                  onChange={(e) => {
                    const displayValue = parseFloat(e.target.value) || 0;
                    const msValue = convertSpeed(displayValue, userPreferences.units.speed, 'ms');
                    updateProfile(profile.id, {
                      parameters: {
                        ...profile.parameters,
                        aircraftSpeed: msValue
                      }
                    });
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">
                      {userPreferences.units.speed === 'ms' ? 'm/s' : 
                       userPreferences.units.speed === 'kmh' ? 'km/h' :
                       userPreferences.units.speed === 'mph' ? 'mph' : 'kts'}
                    </InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Freefall Speed"
                  value={displayFreefallSpeed.toFixed(1)}
                  onChange={(e) => {
                    const displayValue = parseFloat(e.target.value) || 0;
                    const msValue = convertSpeed(displayValue, userPreferences.units.speed, 'ms');
                    updateProfile(profile.id, {
                      parameters: {
                        ...profile.parameters,
                        freefallSpeed: msValue
                      }
                    });
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">
                      {userPreferences.units.speed === 'ms' ? 'm/s' : 
                       userPreferences.units.speed === 'kmh' ? 'km/h' :
                       userPreferences.units.speed === 'mph' ? 'mph' : 'kts'}
                    </InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Canopy Descent Rate"
                  value={displayCanopyDescentRate.toFixed(1)}
                  onChange={(e) => {
                    const displayValue = parseFloat(e.target.value) || 0;
                    const msValue = convertSpeed(displayValue, userPreferences.units.speed, 'ms');
                    updateProfile(profile.id, {
                      parameters: {
                        ...profile.parameters,
                        canopyDescentRate: msValue
                      }
                    });
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">
                      {userPreferences.units.speed === 'ms' ? 'm/s' : 
                       userPreferences.units.speed === 'kmh' ? 'km/h' :
                       userPreferences.units.speed === 'mph' ? 'mph' : 'kts'}
                    </InputAdornment>
                  }}
                />
              </Grid>

              {/* Canopy Performance */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Canopy Performance
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Glide Ratio"
                  value={profile.parameters.glideRatio}
                  onChange={handleParameterChange('glideRatio')}
                  type="number"
                  step="0.1"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">:1</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Canopy Air Speed (calculated)"
                  value={displayCanopyAirSpeed.toFixed(1)}
                  InputProps={{
                    readOnly: true,
                    endAdornment: <InputAdornment position="end">
                      {userPreferences.units.speed === 'ms' ? 'm/s' : 
                       userPreferences.units.speed === 'kmh' ? 'km/h' :
                       userPreferences.units.speed === 'mph' ? 'mph' : 'kts'}
                    </InputAdornment>
                  }}
                  sx={{ 
                    '& .MuiInputBase-input': { 
                      backgroundColor: 'action.hover' 
                    } 
                  }}
                />
              </Grid>

            </Grid>
          </Box>
        </Collapse>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setShowRenameDialog(true)}>
          <Edit sx={{ mr: 1 }} />
          Rename
        </MenuItem>
        <MenuItem onClick={() => setShowColorPicker(true)}>
          <Palette sx={{ mr: 1 }} />
          Change Color
        </MenuItem>
        <MenuItem onClick={handleExport}>
          <GetApp sx={{ mr: 1 }} />
          Export
        </MenuItem>
        {canDelete && (
          <MenuItem onClick={() => setShowDeleteDialog(true)} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onClose={() => setShowRenameDialog(false)}>
        <DialogTitle>Rename Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Profile Name"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRenameDialog(false)}>Cancel</Button>
          <Button onClick={handleRename} variant="contained">Rename</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Delete Profile</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the profile "{profile.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Color Picker Dialog */}
      <Dialog open={showColorPicker} onClose={() => setShowColorPicker(false)}>
        <DialogTitle>Choose Profile Color</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, p: 1 }}>
            {PROFILE_COLORS.map((color) => (
              <Box
                key={color}
                onClick={() => handleColorChange(color)}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: profile.color === color ? '3px solid #000' : '2px solid #ccc',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowColorPicker(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};