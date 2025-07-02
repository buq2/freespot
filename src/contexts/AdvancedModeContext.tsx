import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AdvancedModeContextType {
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
}

const AdvancedModeContext = createContext<AdvancedModeContextType | undefined>(undefined);

export const useAdvancedMode = () => {
  const context = useContext(AdvancedModeContext);
  if (!context) {
    throw new Error('useAdvancedMode must be used within AdvancedModeProvider');
  }
  return context;
};

interface AdvancedModeProviderProps {
  children: ReactNode;
}

export const AdvancedModeProvider: React.FC<AdvancedModeProviderProps> = ({ children }) => {
  // Load initial value from localStorage
  const [showAdvanced, setShowAdvancedState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('showAdvancedOptions');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const setShowAdvanced = (show: boolean) => {
    setShowAdvancedState(show);
    localStorage.setItem('showAdvancedOptions', JSON.stringify(show));
  };

  const value: AdvancedModeContextType = {
    showAdvanced,
    setShowAdvanced,
  };

  return <AdvancedModeContext.Provider value={value}>{children}</AdvancedModeContext.Provider>;
};