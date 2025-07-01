import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, GetApp, Publish, MoreVert } from '@mui/icons-material';
import { useAppContext, createDefaultProfiles } from '../../contexts/AppContext';
import type { JumpProfile } from '../../types';

interface ProfileManagerProps {
  onClose?: () => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({ onClose }) => {
  const { profiles, addProfile, setProfiles } = useAppContext();
  const primaryProfile = profiles.find(p => p.enabled) || profiles[0];
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateProfile = () => {
    if (newProfileName.trim()) {
      // Create new profile based on first enabled profile or sport jumpers
      const baseProfile = profiles.find(p => p.enabled) || profiles.find(p => p.id === 'sport_jumpers') || profiles[0];
      const colors = ['#2196F3', '#FF9800', '#4CAF50', '#9C27B0', '#F44336', '#00BCD4', '#FFEB3B', '#795548'];
      const usedColors = profiles.map(p => p.color);
      const availableColor = colors.find(color => !usedColors.includes(color)) || colors[0];

      addProfile({
        name: newProfileName.trim(),
        enabled: false,
        color: availableColor,
        showDriftVisualization: false,
        parameters: baseProfile ? { ...baseProfile.parameters } : { ...primaryProfile?.parameters },
      });

      setNewProfileName('');
      setShowCreateDialog(false);
    }
  };

  const handleExportProfile = (profile: JumpProfile) => {
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

  const handleExportAllProfiles = () => {
    const dataStr = JSON.stringify(profiles, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'freespot_profiles.json';
    link.click();
    URL.revokeObjectURL(url);
    setMenuAnchor(null);
  };

  const handleImportProfile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setLoading(true);
      setImportError(null);

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (Array.isArray(data)) {
          // Importing multiple profiles
          const validProfiles = data.filter(item => 
            item && typeof item === 'object' && 
            item.name && item.parameters
          ) as JumpProfile[];

          if (validProfiles.length === 0) {
            throw new Error('No valid profiles found in file');
          }

          // Generate new IDs and update landing zone
          const newProfiles = validProfiles.map(profile => ({
            ...profile,
            id: 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            parameters: {
              ...profile.parameters,
              landingZone: primaryProfile?.parameters.landingZone || { lat: 0, lon: 0 }, // Use current landing zone
              jumpTime: new Date(profile.parameters.jumpTime || Date.now()),
            }
          }));

          setProfiles([...profiles, ...newProfiles]);
        } else if (data && typeof data === 'object' && data.name && data.parameters) {
          // Importing single profile
          const newProfile: JumpProfile = {
            ...data,
            id: 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            parameters: {
              ...data.parameters,
              landingZone: primaryProfile?.parameters.landingZone || { lat: 0, lon: 0 }, // Use current landing zone
              jumpTime: new Date(data.parameters.jumpTime || Date.now()),
            }
          };

          addProfile(newProfile);
        } else {
          throw new Error('Invalid profile format');
        }
      } catch (error) {
        setImportError(error instanceof Error ? error.message : 'Failed to import profile');
      } finally {
        setLoading(false);
      }
    };
    input.click();
    setMenuAnchor(null);
  };

  const handleResetToDefaults = () => {
    const defaultProfiles = createDefaultProfiles(primaryProfile?.parameters.landingZone || { lat: 0, lon: 0 });
    setProfiles(defaultProfiles);
    setMenuAnchor(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Profile Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => setShowCreateDialog(true)}
            sx={{ mr: 1 }}
          >
            New Profile
          </Button>
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {importError && (
        <Alert severity="error" onClose={() => setImportError(null)} sx={{ mb: 2 }}>
          {importError}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={handleImportProfile}>
          <Publish sx={{ mr: 1 }} />
          Import Profile(s)
        </MenuItem>
        <MenuItem onClick={handleExportAllProfiles}>
          <GetApp sx={{ mr: 1 }} />
          Export All Profiles
        </MenuItem>
        <MenuItem onClick={handleResetToDefaults}>
          Reset to Defaults
        </MenuItem>
      </Menu>

      {/* Create Profile Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
        <DialogTitle>Create New Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Profile Name"
            fullWidth
            variant="outlined"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateProfile();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateProfile} 
            variant="contained"
            disabled={!newProfileName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};