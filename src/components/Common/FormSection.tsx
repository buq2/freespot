import React from 'react';
import {
  Typography,
  Divider,
  Box,
} from '@mui/material';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  showDivider?: boolean;
}

/**
 * Standardized form section component with consistent spacing and typography
 */
export const FormSection: React.FC<FormSectionProps> = ({ 
  title, 
  children, 
  showDivider = false 
}) => {
  return (
    <>
      {showDivider && (
        <Box sx={{ gridColumn: 'span 12' }}>
          <Divider sx={{ my: 2 }} />
        </Box>
      )}
      
      <Box sx={{ gridColumn: 'span 12' }}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          {title}
        </Typography>
      </Box>
      
      {children}
    </>
  );
};

interface FormFieldGroupProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

/**
 * Standardized form field group with responsive grid layout
 */
export const FormFieldGroup: React.FC<FormFieldGroupProps> = ({ 
  children, 
  cols = { xs: 12, sm: 6 } 
}) => {
  const getGridColumn = () => {
    const { xs = 12, sm = 6 } = cols;
    return {
      gridColumn: {
        xs: `span ${xs}`,
        sm: `span ${sm}`,
      }
    };
  };

  return (
    <Box sx={getGridColumn()}>
      {children}
    </Box>
  );
};