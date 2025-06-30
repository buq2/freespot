import { useTheme, useMediaQuery } from '@mui/material';

/**
 * Custom hook for responsive design utilities
 * Centralizes all mobile/desktop detection and responsive values
 */
export const useResponsive = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  return {
    // Device detection
    isMobile,
    isTablet,
    isDesktop,
    
    // Common responsive values
    getSize: (mobile: string, desktop: string) => isMobile ? mobile : desktop,
    getButtonSize: () => isMobile ? 'medium' : 'small' as 'medium' | 'small',
    
    // Touch targets (following Material Design guidelines)
    touchTarget: {
      minHeight: isMobile ? 48 : 'auto',
      minWidth: isMobile ? 48 : 'auto',
    },
    
    // Spacing
    spacing: {
      container: isMobile ? 1.5 : 2,
      section: isMobile ? 2 : 3,
      gap: isMobile ? 1 : 2,
    },
    
    // Typography
    typography: {
      fontSize: {
        small: isMobile ? '0.9rem' : '0.875rem',
        body: isMobile ? '1rem' : '0.875rem',
      }
    },
    
    // Layout
    layout: {
      maxWidth: isMobile ? '90vw' : '400px',
      direction: isMobile ? 'column' : 'row' as 'column' | 'row',
      orientation: isMobile ? 'vertical' : 'horizontal' as 'vertical' | 'horizontal',
    }
  };
};