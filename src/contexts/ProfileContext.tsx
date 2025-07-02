import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { JumpProfile, JumpParameters } from '../types';
import { defaultJumpParameters, createDefaultProfiles, generateProfileId } from '../constants/profiles';

interface ProfileContextType {
  profiles: JumpProfile[];
  setProfiles: (profiles: JumpProfile[]) => void;
  addProfile: (profile: Omit<JumpProfile, 'id'>) => void;
  updateProfile: (id: string, updates: Partial<JumpProfile>) => void;
  deleteProfile: (id: string) => void;
  getEnabledProfile: () => JumpProfile | undefined;
  getActiveParameters: () => JumpParameters;
}


const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  // Load initial values from localStorage
  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Initialize profiles
  const [profiles, setProfilesState] = useState<JumpProfile[]>(() => {
    const storedProfiles = loadFromStorage<JumpProfile[]>('jumpProfiles', []);
    
    if (storedProfiles.length > 0) {
      // Update stored profiles and ensure they have all required fields
      return storedProfiles.map(profile => ({
        ...profile,
        // Default new visualization fields to true if not present
        showSafetyCircle: profile.showSafetyCircle !== undefined ? profile.showSafetyCircle : true,
        showGroupExitPoints: profile.showGroupExitPoints !== undefined ? profile.showGroupExitPoints : true,
        showFlightPath: profile.showFlightPath !== undefined ? profile.showFlightPath : true,
        parameters: {
          jumpAltitude: profile.parameters.jumpAltitude || defaultJumpParameters.jumpAltitude,
          aircraftSpeed: profile.parameters.aircraftSpeed || defaultJumpParameters.aircraftSpeed,
          freefallSpeed: profile.parameters.freefallSpeed || defaultJumpParameters.freefallSpeed,
          openingAltitude: profile.parameters.openingAltitude || defaultJumpParameters.openingAltitude,
          canopyDescentRate: profile.parameters.canopyDescentRate || defaultJumpParameters.canopyDescentRate,
          glideRatio: profile.parameters.glideRatio || defaultJumpParameters.glideRatio,
          setupAltitude: profile.parameters.setupAltitude || defaultJumpParameters.setupAltitude,
        }
      }));
    }
    
    // Create default profiles
    return createDefaultProfiles();
  });

  // Profile management functions
  const setProfiles = (newProfiles: JumpProfile[]) => {
    setProfilesState(newProfiles);
    localStorage.setItem('jumpProfiles', JSON.stringify(newProfiles));
  };

  const addProfile = (profileData: Omit<JumpProfile, 'id'>) => {
    const newProfile: JumpProfile = {
      ...profileData,
      id: generateProfileId(),
    };
    const newProfiles = [...profiles, newProfile];
    setProfiles(newProfiles);
  };

  const updateProfile = (id: string, updates: Partial<JumpProfile>) => {
    const newProfiles = profiles.map(profile => 
      profile.id === id ? { ...profile, ...updates } : profile
    );
    setProfiles(newProfiles);
  };

  const deleteProfile = (id: string) => {
    // Prevent deletion if it's the last profile
    if (profiles.length <= 1) return;
    
    const newProfiles = profiles.filter(profile => profile.id !== id);
    setProfiles(newProfiles);
  };

  const getEnabledProfile = (): JumpProfile | undefined => {
    return profiles.find(p => p.enabled);
  };

  const getActiveParameters = (): JumpParameters => {
    const enabledProfile = getEnabledProfile();
    return enabledProfile?.parameters || profiles[0]?.parameters || defaultJumpParameters;
  };

  const value: ProfileContextType = {
    profiles,
    setProfiles,
    addProfile,
    updateProfile,
    deleteProfile,
    getEnabledProfile,
    getActiveParameters,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};