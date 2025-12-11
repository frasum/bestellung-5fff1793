/**
 * Hook for haptic feedback on touch devices
 * Uses the Vibration API where available
 */
export const useHapticFeedback = () => {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  // Light tap - for quantity changes, toggles
  const lightTap = () => {
    if (isSupported) {
      navigator.vibrate(10);
    }
  };

  // Medium tap - for favorites, selections
  const mediumTap = () => {
    if (isSupported) {
      navigator.vibrate(25);
    }
  };

  // Heavy tap - for submit, confirmations
  const heavyTap = () => {
    if (isSupported) {
      navigator.vibrate(50);
    }
  };

  // Success pattern - for order completion
  const success = () => {
    if (isSupported) {
      navigator.vibrate([30, 50, 30]);
    }
  };

  // Error pattern - for validation errors
  const error = () => {
    if (isSupported) {
      navigator.vibrate([50, 30, 50, 30, 50]);
    }
  };

  return {
    isSupported,
    lightTap,
    mediumTap,
    heavyTap,
    success,
    error,
  };
};
