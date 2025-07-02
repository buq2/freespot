import React from 'react';
import { Box, Collapse } from '@mui/material';
import { useAdvancedMode } from '../../contexts/AdvancedModeContext';

interface AdvancedOptionProps {
  children: React.ReactNode;
  forceShow?: boolean; // Allow overriding to always show
}

/**
 * Wrapper component that conditionally shows content based on advanced mode setting
 * Usage: <AdvancedOption>{your content}</AdvancedOption>
 */
export const AdvancedOption: React.FC<AdvancedOptionProps> = ({ children, forceShow = false }) => {
  const { showAdvanced } = useAdvancedMode();
  
  if (forceShow || showAdvanced) {
    return <>{children}</>;
  }
  
  return null;
};