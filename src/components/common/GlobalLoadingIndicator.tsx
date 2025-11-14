/**
 * ⏳ Global Loading Indicator
 * 
 * Shows loading state at top of screen
 */

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLoadingStore } from '../../store/loadingStore';

export const GlobalLoadingIndicator: React.FC = () => {
  const { globalLoading, loadingMessages } = useLoadingStore();
  const [progress, setProgress] = useState(0);

  // Simulate progress bar
  useEffect(() => {
    if (!globalLoading) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90; // Stop at 90% until done
        return prev + Math.random() * 10;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [globalLoading]);

  // Complete animation when loading stops
  useEffect(() => {
    if (!globalLoading && progress > 0) {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timeout);
    }
  }, [globalLoading, progress]);

  if (!globalLoading && progress === 0) return null;

  return (
    <>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Loading Message */}
      {loadingMessages.global && (
        <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 animate-fade-in">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {loadingMessages.global}
          </span>
        </div>
      )}
    </>
  );
};

/**
 * Loading Overlay for specific sections
 */
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  transparent?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message,
  transparent = false
}) => {
  if (!isLoading) return null;

  return (
    <div className={`absolute inset-0 z-10 flex items-center justify-center ${
      transparent 
        ? 'bg-white/80 dark:bg-gray-900/80' 
        : 'bg-white dark:bg-gray-900'
    } backdrop-blur-sm`}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Inline Loading Spinner
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center gap-2">
      <Loader2 className={`${sizes[size]} text-indigo-600 animate-spin`} />
      {message && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {message}
        </span>
      )}
    </div>
  );
};
