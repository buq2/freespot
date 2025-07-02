import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  Collapse,
  Fade,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import {
  Error,
  Warning,
  Info,
  Security,
  Speed
} from '@mui/icons-material';

export interface ValidationFeedbackProps {
  /** Validation errors */
  errors?: Record<string, string>;
  /** Validation warnings */
  warnings?: Record<string, string>;
  /** Whether form is valid */
  isValid?: boolean;
  /** Whether form is dirty */
  isDirty?: boolean;
  /** Show validation status summary */
  showSummary?: boolean;
  /** Show field-specific feedback */
  showFieldFeedback?: boolean;
  /** Severity level for overall feedback */
  severity?: 'error' | 'warning' | 'info' | 'success';
}

/**
 * Real-time validation feedback component that displays form validation status
 */
export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  errors = {},
  warnings = {},
  isValid = true,
  isDirty = false,
  showSummary = true,
  showFieldFeedback = true,
  severity
}) => {
  const errorCount = Object.keys(errors).length;
  const warningCount = Object.keys(warnings).length;
  
  const determinedSeverity = severity || 
    (errorCount > 0 ? 'error' : 
     warningCount > 0 ? 'warning' : 
     isValid && isDirty ? 'success' : 'info');

  if (!showSummary && !showFieldFeedback) return null;
  if (!isDirty && errorCount === 0 && warningCount === 0) return null;

  return (
    <Fade in timeout={200}>
      <Box sx={{ mt: 2 }}>
        {showSummary && (
          <Alert 
            severity={determinedSeverity}
            sx={{ mb: showFieldFeedback ? 2 : 0 }}
          >
            <AlertTitle>
              {determinedSeverity === 'success' && 'Form Valid'}
              {determinedSeverity === 'error' && `${errorCount} Error${errorCount !== 1 ? 's' : ''} Found`}
              {determinedSeverity === 'warning' && `${warningCount} Warning${warningCount !== 1 ? 's' : ''}`}
              {determinedSeverity === 'info' && 'Form Status'}
            </AlertTitle>
            
            {determinedSeverity === 'success' && 'All fields are valid and ready for submission.'}
            {determinedSeverity === 'error' && 'Please correct the errors below before proceeding.'}
            {determinedSeverity === 'warning' && 'Please review the warnings below.'}
            {determinedSeverity === 'info' && 'Please fill out the required fields.'}
          </Alert>
        )}

        {showFieldFeedback && (errorCount > 0 || warningCount > 0) && (
          <Stack spacing={1}>
            {Object.entries(errors).map(([field, error]) => (
              <FieldFeedbackItem
                key={`error-${field}`}
                field={field}
                message={error}
                type="error"
              />
            ))}
            {Object.entries(warnings).map(([field, warning]) => (
              <FieldFeedbackItem
                key={`warning-${field}`}
                field={field}
                message={warning}
                type="warning"
              />
            ))}
          </Stack>
        )}
      </Box>
    </Fade>
  );
};

interface FieldFeedbackItemProps {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

const FieldFeedbackItem: React.FC<FieldFeedbackItemProps> = ({ field, message, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'error': return <Error fontSize="small" />;
      case 'warning': return <Warning fontSize="small" />;
      default: return <Info fontSize="small" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        border: (theme) => `1px solid ${theme.palette[getColor()].main}`,
        bgcolor: (theme) => `${theme.palette[getColor()].main}08`
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ color: `${getColor()}.main`, mt: 0.25 }}>
          {getIcon()}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight="medium" color={`${getColor()}.main`}>
            {field.charAt(0).toUpperCase() + field.slice(1)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export interface FormStrengthIndicatorProps {
  /** Current strength score (0-100) */
  strength: number;
  /** Custom strength labels */
  labels?: string[];
  /** Show percentage */
  showPercentage?: boolean;
  /** Custom colors for different strength levels */
  colors?: string[];
}

/**
 * Visual indicator for form completion strength/quality
 */
export const FormStrengthIndicator: React.FC<FormStrengthIndicatorProps> = ({
  strength,
  labels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'],
  showPercentage = true,
  colors = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3']
}) => {
  const getStrengthLevel = () => {
    if (strength < 20) return 0;
    if (strength < 40) return 1;
    if (strength < 60) return 2;
    if (strength < 80) return 3;
    return 4;
  };

  const level = getStrengthLevel();
  const color = colors[level];
  const label = labels[level];

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Form Completeness
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label} {showPercentage && `(${Math.round(strength)}%)`}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={strength}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            bgcolor: color,
            borderRadius: 4
          }
        }}
      />
    </Box>
  );
};

export interface SecurityFeedbackProps {
  /** Security level (0-100) */
  securityLevel: number;
  /** Security issues found */
  issues?: string[];
  /** Show detailed feedback */
  showDetails?: boolean;
}

/**
 * Security feedback for sensitive form fields
 */
export const SecurityFeedback: React.FC<SecurityFeedbackProps> = ({
  securityLevel,
  issues = [],
  showDetails = true
}) => {
  const getSeverity = () => {
    if (securityLevel >= 80) return 'success';
    if (securityLevel >= 60) return 'warning';
    return 'error';
  };

  const getSecurityLabel = () => {
    if (securityLevel >= 80) return 'Secure';
    if (securityLevel >= 60) return 'Moderately Secure';
    if (securityLevel >= 40) return 'Weak Security';
    return 'Insecure';
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Alert severity={getSeverity()} icon={<Security />}>
        <AlertTitle>
          {getSecurityLabel()} ({Math.round(securityLevel)}%)
        </AlertTitle>
        
        {showDetails && issues.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Security recommendations:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
              {issues.map((issue, index) => (
                <li key={index}>
                  <Typography variant="body2">{issue}</Typography>
                </li>
              ))}
            </ul>
          </Box>
        )}
      </Alert>
    </Box>
  );
};

export interface PerformanceFeedbackProps {
  /** Performance metrics */
  metrics: {
    responseTime?: number;
    validationTime?: number;
    renderTime?: number;
  };
  /** Show performance tips */
  showTips?: boolean;
}

/**
 * Performance feedback for form interactions
 */
export const PerformanceFeedback: React.FC<PerformanceFeedbackProps> = ({
  metrics,
  showTips = true
}) => {
  const { responseTime = 0, validationTime = 0, renderTime = 0 } = metrics;
  const totalTime = responseTime + validationTime + renderTime;

  const getPerformanceLevel = () => {
    if (totalTime < 100) return 'excellent';
    if (totalTime < 300) return 'good';
    if (totalTime < 1000) return 'fair';
    return 'poor';
  };

  const getPerformanceColor = () => {
    const level = getPerformanceLevel();
    switch (level) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'info';
    }
  };

  const level = getPerformanceLevel();

  return (
    <Collapse in={totalTime > 0}>
      <Box sx={{ mt: 2 }}>
        <Alert severity={getPerformanceColor()} icon={<Speed />}>
          <AlertTitle>
            Performance: {level.charAt(0).toUpperCase() + level.slice(1)} ({totalTime}ms)
          </AlertTitle>
          
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {responseTime > 0 && (
              <Chip
                size="small"
                label={`Response: ${responseTime}ms`}
                variant="outlined"
              />
            )}
            {validationTime > 0 && (
              <Chip
                size="small"
                label={`Validation: ${validationTime}ms`}
                variant="outlined"
              />
            )}
            {renderTime > 0 && (
              <Chip
                size="small"
                label={`Render: ${renderTime}ms`}
                variant="outlined"
              />
            )}
          </Stack>

          {showTips && level === 'poor' && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Consider reducing validation complexity or implementing debouncing for better performance.
            </Typography>
          )}
        </Alert>
      </Box>
    </Collapse>
  );
};