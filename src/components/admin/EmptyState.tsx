/**
 * EmptyState - Herbruikbare empty state component
 * 
 * Toont een vriendelijke lege staat met icoon, titel en actie
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex items-center justify-center h-full text-gray-500 p-8 text-center">
      <div className="max-w-md">
        <div className="bg-gray-700/30 rounded-full p-6 inline-block mb-4">
          <Icon className="w-12 h-12 text-gray-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mb-6">{description}</p>
        )}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
