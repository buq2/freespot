import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
  Button,
  Stack
} from '@mui/material';
import { useFormValidation } from '../../hooks/useFormValidation';
import { ValidationFeedback, FormStrengthIndicator } from '../Common/FormFeedback';
import { CollapsibleSection } from '../Common/CollapsibleSection';
import { UnitTextField } from '../Common/FormFields';
import { useProfileContext } from '../../contexts/ProfileContext';
import { usePreferencesContext } from '../../contexts/PreferencesContext';
import type { JumpParameters } from '../../types';

/**
 * Enhanced jump parameters form with real-time validation and feedback.
 * Demonstrates the new form validation system with sanitization and feedback.
 */
export const EnhancedJumpParametersForm: React.FC<{
  profileId: string;
}> = ({ profileId }) => {
  const { profiles, updateProfile } = useProfileContext();
  const { userPreferences } = usePreferencesContext();
  
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return null;

  // Enhanced form validation with real-time feedback
  const form = useFormValidation({
    initialValues: profile.parameters,
    schema: {
      jumpAltitude: {
        required: true,
        sanitize: { type: 'number', options: { min: 500, max: 15000, decimals: 0 } },
        rules: [
          { test: (v) => v >= 500, message: 'Jump altitude must be at least 500m' },
          { test: (v) => v <= 15000, message: 'Jump altitude cannot exceed 15000m' },
          { test: (v) => v >= 1000, message: 'Consider minimum 1000m for safety', severity: 'warning' }
        ],
        validateOnChange: true
      },
      aircraftSpeed: {
        required: true,
        sanitize: { type: 'number', options: { min: 10, max: 200, decimals: 1 } },
        rules: [
          { test: (v) => v >= 10, message: 'Aircraft speed must be at least 10 m/s' },
          { test: (v) => v <= 200, message: 'Aircraft speed cannot exceed 200 m/s' },
          { test: (v) => v >= 25, message: 'Low aircraft speed may affect accuracy', severity: 'warning' }
        ]
      },
      freefallSpeed: {
        required: true,
        sanitize: { type: 'number', options: { min: 30, max: 80, decimals: 2 } },
        rules: [
          { test: (v) => v >= 30, message: 'Freefall speed must be at least 30 m/s' },
          { test: (v) => v <= 80, message: 'Freefall speed cannot exceed 80 m/s' },
          { test: (v) => v >= 50 && v <= 60, message: 'Typical freefall speed is 50-60 m/s', severity: 'warning' }
        ]
      },
      openingAltitude: {
        required: true,
        sanitize: { type: 'number', options: { min: 500, max: 5000, decimals: 0 } },
        rules: [
          { test: (v) => v >= 500, message: 'Opening altitude must be at least 500m' },
          { test: (v) => v <= 5000, message: 'Opening altitude cannot exceed 5000m' }
        ],
        validator: (value) => {
          const jumpAlt = form.getValue('jumpAltitude');
          if (value >= jumpAlt) {
            return 'Opening altitude must be lower than jump altitude';
          }
          return null;
        }
      },
      canopyDescentRate: {
        required: true,
        sanitize: { type: 'number', options: { min: 1, max: 15, decimals: 1 } },
        rules: [
          { test: (v) => v >= 1, message: 'Descent rate must be at least 1 m/s' },
          { test: (v) => v <= 15, message: 'Descent rate cannot exceed 15 m/s' },
          { test: (v) => v >= 4 && v <= 8, message: 'Typical descent rate is 4-8 m/s', severity: 'warning' }
        ]
      },
      glideRatio: {
        required: true,
        sanitize: { type: 'number', options: { min: 1, max: 5, decimals: 2 } },
        rules: [
          { test: (v) => v >= 1, message: 'Glide ratio must be at least 1' },
          { test: (v) => v <= 5, message: 'Glide ratio cannot exceed 5' },
          { test: (v) => v >= 2 && v <= 3, message: 'Typical glide ratio is 2-3', severity: 'warning' }
        ]
      },
      setupAltitude: {
        required: true,
        sanitize: { type: 'number', options: { min: 0, max: 500, decimals: 0 } },
        rules: [
          { test: (v) => v >= 0, message: 'Setup altitude cannot be negative' },
          { test: (v) => v <= 500, message: 'Setup altitude cannot exceed 500m' }
        ],
        validator: (value) => {
          const openingAlt = form.getValue('openingAltitude');
          if (value >= openingAlt) {
            return 'Setup altitude must be lower than opening altitude';
          }
          return null;
        }
      }
    },
    realTimeValidation: true,
    validateOnChange: true,
    validateOnBlur: true,
    formValidator: (values) => {
      const errors: Record<string, string> = {};
      
      // Cross-field validation
      if (values.jumpAltitude <= values.openingAltitude) {
        errors.jumpAltitude = 'Jump altitude must be higher than opening altitude';
      }
      
      if (values.openingAltitude <= values.setupAltitude) {
        errors.openingAltitude = 'Opening altitude must be higher than setup altitude';
      }
      
      return errors;
    }
  });

  // Calculate form strength based on validation and completeness
  const calculateFormStrength = (): number => {
    const requiredFields = Object.keys(form.state.values).length;
    const filledFields = Object.values(form.state.values).filter(v => v !== null && v !== undefined && v !== '').length;
    const errorCount = Object.keys(form.state.errors).length;
    const warningCount = Object.keys(form.state.warnings).length;
    
    let strength = (filledFields / requiredFields) * 100;
    strength -= (errorCount * 15); // Deduct for errors
    strength -= (warningCount * 5); // Deduct for warnings
    
    return Math.max(0, Math.min(100, strength));
  };

  const handleSave = () => {
    if (form.validateAll()) {
      const sanitizedValues = form.getSanitizedValues();
      updateProfile(profileId, { parameters: sanitizedValues });
    }
  };

  const handleReset = () => {
    form.reset();
  };

  return (
    <CollapsibleSection
      title={`${profile.name} Parameters`}
      subtitle="Jump parameters with real-time validation"
      defaultExpanded={true}
    >
      <Box sx={{ p: 2 }}>
        <Grid container spacing={3}>
          {/* Jump Altitude */}
          <Grid item xs={12} sm={6}>
            <UnitTextField
              fullWidth
              label="Jump Altitude"
              value={form.getValue('jumpAltitude')}
              onChange={form.handleFieldChange('jumpAltitude')}
              onBlur={form.handleFieldBlur('jumpAltitude')}
              unitType="altitude"
              error={form.isTouched('jumpAltitude') && !!form.getError('jumpAltitude')}
              helperText={
                form.isTouched('jumpAltitude') 
                  ? form.getError('jumpAltitude') || form.getWarning('jumpAltitude')
                  : 'Altitude from which the jump is made'
              }
            />
          </Grid>

          {/* Aircraft Speed */}
          <Grid item xs={12} sm={6}>
            <UnitTextField
              fullWidth
              label="Aircraft Speed"
              value={form.getValue('aircraftSpeed')}
              onChange={form.handleFieldChange('aircraftSpeed')}
              onBlur={form.handleFieldBlur('aircraftSpeed')}
              unitType="speed"
              error={form.isTouched('aircraftSpeed') && !!form.getError('aircraftSpeed')}
              helperText={
                form.isTouched('aircraftSpeed')
                  ? form.getError('aircraftSpeed') || form.getWarning('aircraftSpeed')
                  : 'Ground speed of the aircraft'
              }
            />
          </Grid>

          {/* Freefall Speed */}
          <Grid item xs={12} sm={6}>
            <UnitTextField
              fullWidth
              label="Freefall Speed"
              value={form.getValue('freefallSpeed')}
              onChange={form.handleFieldChange('freefallSpeed')}
              onBlur={form.handleFieldBlur('freefallSpeed')}
              unitType="speed"
              error={form.isTouched('freefallSpeed') && !!form.getError('freefallSpeed')}
              helperText={
                form.isTouched('freefallSpeed')
                  ? form.getError('freefallSpeed') || form.getWarning('freefallSpeed')
                  : 'Terminal velocity during freefall'
              }
            />
          </Grid>

          {/* Opening Altitude */}
          <Grid item xs={12} sm={6}>
            <UnitTextField
              fullWidth
              label="Opening Altitude"
              value={form.getValue('openingAltitude')}
              onChange={form.handleFieldChange('openingAltitude')}
              onBlur={form.handleFieldBlur('openingAltitude')}
              unitType="altitude"
              error={form.isTouched('openingAltitude') && !!form.getError('openingAltitude')}
              helperText={
                form.isTouched('openingAltitude')
                  ? form.getError('openingAltitude') || form.getWarning('openingAltitude')
                  : 'Altitude at which parachute opens'
              }
            />
          </Grid>

          {/* Canopy Descent Rate */}
          <Grid item xs={12} sm={6}>
            <UnitTextField
              fullWidth
              label="Canopy Descent Rate"
              value={form.getValue('canopyDescentRate')}
              onChange={form.handleFieldChange('canopyDescentRate')}
              onBlur={form.handleFieldBlur('canopyDescentRate')}
              unitType="speed"
              unitOverride="m/s"
              error={form.isTouched('canopyDescentRate') && !!form.getError('canopyDescentRate')}
              helperText={
                form.isTouched('canopyDescentRate')
                  ? form.getError('canopyDescentRate') || form.getWarning('canopyDescentRate')
                  : 'Vertical descent rate under canopy'
              }
            />
          </Grid>

          {/* Glide Ratio */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Glide Ratio"
              value={form.getValue('glideRatio').toFixed(2)}
              onChange={(e) => form.handleFieldChange('glideRatio')(parseFloat(e.target.value) || 0)}
              onBlur={form.handleFieldBlur('glideRatio')}
              type="number"
              inputProps={{ step: 0.1, min: 1, max: 5 }}
              error={form.isTouched('glideRatio') && !!form.getError('glideRatio')}
              helperText={
                form.isTouched('glideRatio')
                  ? form.getError('glideRatio') || form.getWarning('glideRatio')
                  : 'Horizontal to vertical glide ratio'
              }
            />
          </Grid>

          {/* Setup Altitude */}
          <Grid item xs={12} sm={6}>
            <UnitTextField
              fullWidth
              label="Setup Altitude"
              value={form.getValue('setupAltitude')}
              onChange={form.handleFieldChange('setupAltitude')}
              onBlur={form.handleFieldBlur('setupAltitude')}
              unitType="altitude"
              error={form.isTouched('setupAltitude') && !!form.getError('setupAltitude')}
              helperText={
                form.isTouched('setupAltitude')
                  ? form.getError('setupAltitude') || form.getWarning('setupAltitude')
                  : 'Altitude for landing pattern setup'
              }
            />
          </Grid>
        </Grid>

        {/* Form Validation Feedback */}
        <ValidationFeedback
          errors={form.state.errors}
          warnings={form.state.warnings}
          isValid={form.state.isValid}
          isDirty={form.state.isDirty}
        />

        {/* Form Strength Indicator */}
        <FormStrengthIndicator
          strength={calculateFormStrength()}
          labels={['Incomplete', 'Basic', 'Good', 'Complete', 'Validated']}
        />

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.state.isValid}
          >
            Save Parameters
          </Button>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={!form.state.isDirty}
          >
            Reset
          </Button>
        </Stack>
      </Box>
    </CollapsibleSection>
  );
};