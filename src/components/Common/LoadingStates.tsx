import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Typography,
  Paper,
  Stack,
  Fade,
  Backdrop
} from '@mui/material';
import { CloudDownload, Calculate, Map as MapIcon } from '@mui/icons-material';

export interface LoadingOverlayProps {
  /** Whether the loading overlay is visible */
  loading: boolean;
  /** Loading message to display */
  message?: string;
  /** Submessage or additional details */
  submessage?: string;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Custom icon to display */
  icon?: React.ReactNode;
  /** Whether to show backdrop */
  backdrop?: boolean;
  /** Custom styles */
  sx?: object;
}

/**
 * Full-screen loading overlay for major operations
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  message = 'Loading...',
  submessage,
  progress,
  icon,
  backdrop = true,
  sx = {}
}) => {
  if (!loading) return null;

  const content = (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 3,
        zIndex: 1300,
        bgcolor: backdrop ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
        backdropFilter: backdrop ? 'blur(4px)' : 'none',
        ...sx
      }}
    >
      <Paper
        elevation={backdrop ? 8 : 0}
        sx={{
          p: 4,
          borderRadius: 2,
          minWidth: 300,
          textAlign: 'center',
          bgcolor: backdrop ? 'background.paper' : 'transparent'
        }}
      >
        <Stack spacing={2} alignItems="center">
          {icon || <CircularProgress size={60} />}
          
          <Typography variant="h6" color="text.primary">
            {message}
          </Typography>
          
          {submessage && (
            <Typography variant="body2" color="text.secondary">
              {submessage}
            </Typography>
          )}
          
          {typeof progress === 'number' && (
            <Box sx={{ width: '100%' }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {Math.round(progress)}%
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );

  return backdrop ? (
    <Backdrop open={loading} sx={{ zIndex: 1300 }}>
      {content}
    </Backdrop>
  ) : (
    <Fade in={loading}>{content}</Fade>
  );
};

/**
 * Inline loading spinner for smaller components
 */
export const InlineLoader: React.FC<{
  size?: number;
  message?: string;
  color?: 'primary' | 'secondary' | 'inherit';
}> = ({ size = 24, message, color = 'primary' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
    <CircularProgress size={size} color={color} />
    {message && (
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    )}
  </Box>
);

/**
 * Skeleton loading for content placeholders
 */
export const ContentSkeleton: React.FC<{
  lines?: number;
  height?: number;
  width?: string | number;
}> = ({ lines = 3, height = 20, width = '100%' }) => (
  <Stack spacing={1}>
    {Array.from({ length: lines }, (_, index) => (
      <Skeleton
        key={index}
        variant="text"
        height={height}
        width={index === lines - 1 ? '70%' : width}
      />
    ))}
  </Stack>
);

/**
 * Loading placeholder for weather table
 */
export const WeatherTableSkeleton: React.FC = () => (
  <Paper elevation={1} sx={{ p: 2 }}>
    <Skeleton variant="text" height={32} width="60%" sx={{ mb: 2 }} />
    <Stack spacing={1}>
      {Array.from({ length: 8 }, (_, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="text" width={60} height={24} />
          <Skeleton variant="text" width={80} height={24} />
          <Skeleton variant="text" width={70} height={24} />
          <Skeleton variant="text" width={60} height={24} />
        </Box>
      ))}
    </Stack>
  </Paper>
);

/**
 * Loading placeholder for map
 */
export const MapSkeleton: React.FC = () => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <Skeleton
      variant="rectangular"
      width="100%"
      height="100%"
      sx={{ bgcolor: 'grey.100' }}
    />
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}
    >
      <MapIcon sx={{ fontSize: 64, color: 'grey.400', mb: 1 }} />
      <Typography variant="body2" color="text.secondary">
        Loading map...
      </Typography>
    </Box>
  </Box>
);

/**
 * Predefined loading states for common operations
 */
export const LoadingStates = {
  WeatherFetching: (props?: Partial<LoadingOverlayProps>) => (
    <LoadingOverlay
      loading={true}
      message="Fetching Weather Data"
      submessage="Getting latest atmospheric conditions..."
      icon={<CloudDownload sx={{ fontSize: 60, color: 'primary.main' }} />}
      {...props}
    />
  ),
  
  Calculating: (props?: Partial<LoadingOverlayProps>) => (
    <LoadingOverlay
      loading={true}
      message="Calculating Exit Points"
      submessage="Processing wind data and trajectories..."
      icon={<Calculate sx={{ fontSize: 60, color: 'primary.main' }} />}
      {...props}
    />
  ),
  
  InitialLoad: (props?: Partial<LoadingOverlayProps>) => (
    <LoadingOverlay
      loading={true}
      message="Initializing FreeSpot"
      submessage="Setting up your skydiving calculator..."
      {...props}
    />
  )
};

/**
 * Higher-order component that shows loading state while async operation is in progress
 */
export const withLoading = <P extends object>(
  Component: React.ComponentType<P>,
  LoadingComponent: React.ComponentType<any> = () => <InlineLoader />
) => {
  return React.forwardRef<any, P & { loading?: boolean }>((props, ref) => {
    const { loading, ...componentProps } = props;
    
    if (loading) {
      return <LoadingComponent />;
    }
    
    return <Component ref={ref} {...(componentProps as P)} />;
  });
};