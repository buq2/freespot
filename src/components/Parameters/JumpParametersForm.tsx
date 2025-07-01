import React from 'react';
import { Box } from '@mui/material';
import { useAppContext } from '../../contexts/AppContext';
import { ProfileManager } from './ProfileManager';
import { ProfileSection } from './ProfileSection';

export const JumpParametersForm: React.FC = () => {
  const { profiles } = useAppContext();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Profile Manager */}
      <ProfileManager />
      
      {/* Profile Sections */}
      {profiles.map((profile) => (
        <ProfileSection 
          key={profile.id} 
          profile={profile} 
          canDelete={profiles.length > 1}
        />
      ))}
    </Box>
  );
};