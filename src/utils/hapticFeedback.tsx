import React from 'react';

/**
 * Haptic Feedback Utility
 * 
 * Provides tactile feedback for mobile users to enhance UX
 */

export const hapticFeedback = {
  /**
   * Light tap feedback for button presses
   */
  light: (): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium feedback for interactions
   */
  medium: (): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Success feedback pattern
   */
  success: (): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Error feedback pattern
   */
  error: (): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  },

  /**
   * Warning feedback
   */
  warning: (): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  },

  /**
   * Selection feedback (short pulse)
   */
  selection: (): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  },

  /**
   * Impact feedback (strong pulse)
   */
  impact: (): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },

  /**
   * Check if vibration API is supported
   */
  isSupported: (): boolean => {
    return 'vibrate' in navigator;
  },

  /**
   * Custom vibration pattern
   * @param pattern - Array of vibration durations in ms [vibrate, pause, vibrate, ...]
   */
  custom: (pattern: number[]): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },

  /**
   * Stop all vibrations
   */
  stop: (): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }
};

/**
 * React Hook for Haptic Feedback
 * 
 * Usage:
 * ```tsx
 * const { triggerHaptic } = useHaptic();
 * 
 * <button onClick={() => {
 *   triggerHaptic('light');
 *   handleSubmit();
 * }}>
 *   Submit
 * </button>
 * ```
 */
export const useHaptic = () => {
  const triggerHaptic = (type: keyof typeof hapticFeedback) => {
    if (typeof hapticFeedback[type] === 'function') {
      (hapticFeedback[type] as () => void)();
    }
  };

  return { triggerHaptic, isSupported: hapticFeedback.isSupported() };
};

/**
 * HOC to add haptic feedback to any component
 * 
 * Usage:
 * ```tsx
 * const HapticButton = withHaptic(Button);
 * 
 * <HapticButton hapticType="light" onClick={handleClick}>
 *   Click Me
 * </HapticButton>
 * ```
 */
export const withHaptic = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return ({
    hapticType = 'light',
    onClick,
    ...props
  }: P & {
    hapticType?: 'light' | 'medium' | 'success' | 'error' | 'warning' | 'selection' | 'impact';
    onClick?: (event: React.MouseEvent) => void;
  }) => {
    const handleClick = (event: React.MouseEvent) => {
      hapticFeedback[hapticType]?.();
      onClick?.(event);
    };

    return <Component {...(props as P)} onClick={handleClick} />;
  };
};

/**
 * Utility function to add haptic feedback to any click handler
 */
export const withHapticFeedback = (
  callback: () => void,
  feedbackType: keyof typeof hapticFeedback = 'light'
) => {
  return () => {
    if (typeof hapticFeedback[feedbackType] === 'function') {
      (hapticFeedback[feedbackType] as () => void)();
    }
    callback();
  };
};

export default hapticFeedback;

/**
 * Usage Examples:
 * 
 * 1. Direct usage:
 *    hapticFeedback.light();
 *    hapticFeedback.success();
 * 
 * 2. In event handlers:
 *    <button onClick={() => {
 *      hapticFeedback.light();
 *      handleSubmit();
 *    }}>
 * 
 * 3. With custom pattern:
 *    hapticFeedback.custom([50, 100, 50, 100, 50]);
 * 
 * 4. Check support:
 *    if (hapticFeedback.isSupported()) {
 *      // Use haptic feedback
 *    }
 */
