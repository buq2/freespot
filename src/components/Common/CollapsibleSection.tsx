import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Collapse,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

interface CollapsibleSectionProps extends Omit<React.ComponentProps<typeof Paper>, 'children'> {
  /** The main title of the section */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Content to display when expanded */
  children: React.ReactNode;
  /** Whether the section should be expanded by default */
  defaultExpanded?: boolean;
  /** Additional actions to show in the header (e.g., menu button) */
  actions?: React.ReactNode;
  /** Custom styles for the content area */
  contentSx?: object;
  /** Whether to show the expand/collapse button */
  collapsible?: boolean;
}

/**
 * A reusable collapsible section component that provides consistent styling
 * and behavior across the application. Used for grouping related form fields
 * or content that can be hidden to save space.
 * 
 * @example
 * ```tsx
 * <CollapsibleSection
 *   title="Jump Parameters"
 *   subtitle="Configure altitude and timing settings"
 *   defaultExpanded={true}
 *   actions={<MenuButton />}
 * >
 *   <Grid container spacing={2}>
 *     <Grid item xs={12}>
 *       <TextField label="Jump Altitude" />
 *     </Grid>
 *   </Grid>
 * </CollapsibleSection>
 * ```
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  children,
  defaultExpanded = true,
  actions,
  contentSx = {},
  collapsible = true,
  sx,
  ...paperProps
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    if (collapsible) {
      setExpanded(!expanded);
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        mb: 3, 
        ...sx 
      }} 
      {...paperProps}
    >
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: collapsible ? 'pointer' : 'default',
          }}
          onClick={collapsible ? handleToggle : undefined}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body2" 
                color="textSecondary"
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {actions}
            
            {collapsible && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent double-triggering when clicking the button
                  handleToggle();
                }}
                aria-label={expanded ? 'Collapse section' : 'Expand section'}
                sx={{ ml: 1 }}
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Collapsible Content */}
        {collapsible ? (
          <Collapse in={expanded}>
            <Box sx={{ mt: 2, ...contentSx }}>
              {children}
            </Box>
          </Collapse>
        ) : (
          <Box sx={{ mt: 2, ...contentSx }}>
            {children}
          </Box>
        )}
      </Box>
    </Paper>
  );
};