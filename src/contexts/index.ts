// Focused contexts (recommended for new code)
export { ProfileProvider, useProfileContext } from './ProfileContext';
export { ParametersProvider, useParametersContext, defaultCommonParameters } from './ParametersContext';
export { WeatherProvider, useWeatherContext } from './WeatherContext';
export { PreferencesProvider, usePreferencesContext, defaultUserPreferences } from './PreferencesContext';
export { AdvancedModeProvider, useAdvancedMode } from './AdvancedModeContext';

// Constants
export { createDefaultProfiles, defaultJumpParameters, generateProfileId } from '../constants/profiles';

// Combined provider
export { CombinedProvider } from './CombinedProvider';

// Compatibility layer (maintains original AppContext interface)
export { AppProviderCompat, useAppContext } from './AppContextCompat';

// Legacy exports (for backward compatibility - consider migrating to focused contexts)
export { AppProvider, defaultFullJumpParameters } from './AppContext';