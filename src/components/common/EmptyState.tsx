/**
 * 🎨 Empty States Component
 * 
 * Beautiful empty state messages with actions
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: 'search' | 'empty' | 'error' | 'success';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  illustration = 'empty'
}) => {
  const gradients = {
    search: 'from-blue-500 to-indigo-500',
    empty: 'from-gray-400 to-gray-500',
    error: 'from-red-500 to-pink-500',
    success: 'from-green-500 to-emerald-500'
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon with gradient background */}
      <div className={`relative mb-6`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${gradients[illustration]} opacity-20 blur-2xl rounded-full`} />
        <div className={`relative p-6 bg-gradient-to-br ${gradients[illustration]} rounded-full`}>
          <Icon className="w-12 h-12 text-white" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/30"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Preset empty states for common scenarios
interface PresetEmptyStateProps {
  onAction?: () => void;
  onSecondaryAction?: () => void;
}

export const NoResultsEmptyState: React.FC<PresetEmptyStateProps> = ({ onAction }) => {
  const { Search } = require('lucide-react');
  return (
    <EmptyState
      icon={Search}
      title="Geen resultaten gevonden"
      description="Probeer je zoekopdracht aan te passen of filter te wijzigen"
      illustration="search"
      action={onAction ? {
        label: 'Filters wissen',
        onClick: onAction
      } : undefined}
    />
  );
};

export const NoDataEmptyState: React.FC<PresetEmptyStateProps & { entityName: string }> = ({ 
  entityName,
  onAction 
}) => {
  const { Inbox } = require('lucide-react');
  return (
    <EmptyState
      icon={Inbox}
      title={`Geen ${entityName}`}
      description={`Er zijn nog geen ${entityName} aangemaakt. Begin door de eerste toe te voegen.`}
      illustration="empty"
      action={onAction ? {
        label: `Nieuwe ${entityName}`,
        onClick: onAction
      } : undefined}
    />
  );
};

export const ErrorEmptyState: React.FC<PresetEmptyStateProps> = ({ onAction }) => {
  const { AlertCircle } = require('lucide-react');
  return (
    <EmptyState
      icon={AlertCircle}
      title="Er is iets misgegaan"
      description="We konden de gegevens niet laden. Probeer het opnieuw."
      illustration="error"
      action={onAction ? {
        label: 'Opnieuw proberen',
        onClick: onAction
      } : undefined}
    />
  );
};

export const SuccessEmptyState: React.FC<PresetEmptyStateProps & { message?: string }> = ({ 
  message,
  onAction 
}) => {
  const { CheckCircle } = require('lucide-react');
  return (
    <EmptyState
      icon={CheckCircle}
      title="Alles is verwerkt!"
      description={message || "Er zijn geen openstaande items meer."}
      illustration="success"
      action={onAction ? {
        label: 'Terug naar overzicht',
        onClick: onAction
      } : undefined}
    />
  );
};
