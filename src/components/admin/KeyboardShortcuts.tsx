/**
 * KeyboardShortcuts - Global Keyboard Shortcuts System
 * 
 * Features:
 * - Global shortcuts for navigation & actions
 * - Context-aware shortcuts
 * - Shortcuts legend modal (Ctrl+K or ?)
 * - Visual feedback on trigger
 * - Customizable bindings
 */

import React, { useEffect, useState, useCallback } from 'react';
import { X, Command, Keyboard } from 'lucide-react';
import { cn } from '../../utils';

export interface ShortcutDefinition {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'bulk' | 'search' | 'general';
  context?: string;
}

interface KeyboardShortcutsProps {
  shortcuts: ShortcutDefinition[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutDefinition[], enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const altMatches = shortcut.alt ? e.altKey : !e.altKey;
        const shiftMatches = shortcut.shift ? e.shiftKey : !e.shiftKey;

        if (keyMatches && ctrlMatches && altMatches && shiftMatches) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
};

export const KeyboardShortcutsLegend: React.FC<{
  shortcuts: ShortcutDefinition[];
  isOpen: boolean;
  onClose: () => void;
}> = ({ shortcuts, isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories = {
    navigation: { title: 'Navigatie', icon: '🧭' },
    actions: { title: 'Acties', icon: '⚡' },
    bulk: { title: 'Bulk Operaties', icon: '📦' },
    search: { title: 'Zoeken & Filteren', icon: '🔍' },
    general: { title: 'Algemeen', icon: '⚙️' }
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutDefinition[]>);

  const formatKey = (shortcut: ShortcutDefinition) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    parts.push(shortcut.key.toUpperCase());
    return parts;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/30 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-xl">
                <Keyboard className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-amber-400">Keyboard Shortcuts</h2>
                <p className="text-sm text-slate-400">Sneltoetsen overzicht</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-amber-500/10 rounded-lg transition-colors group"
            >
              <X className="w-5 h-5 text-slate-400 group-hover:text-amber-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{categories[category as keyof typeof categories].icon}</span>
                  <h3 className="text-lg font-bold text-amber-400">
                    {categories[category as keyof typeof categories].title}
                  </h3>
                  <div className="flex-1 h-px bg-amber-500/20" />
                </div>

                <div className="grid gap-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors group"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-200 group-hover:text-white">
                          {shortcut.description}
                        </p>
                        {shortcut.context && (
                          <p className="text-xs text-slate-500 mt-0.5">{shortcut.context}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {formatKey(shortcut).map((key, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="text-slate-600 mx-1">+</span>}
                            <kbd className="px-2 py-1 bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded text-xs font-bold text-amber-400 shadow-lg min-w-[2rem] text-center">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-500/20 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs">
            <p className="text-slate-400">
              Druk <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-amber-400 font-bold mx-1">?</kbd> 
              of <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-amber-400 font-bold mx-1">Ctrl+K</kbd> 
              om dit overzicht te openen
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold rounded-lg transition-all shadow-lg"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to manage shortcuts legend visibility
export const useShortcutsLegend = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or ? to open legend
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || e.key === '?') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
};

// Default shortcuts definition
export const createDefaultShortcuts = (actions: {
  onNavigateEvents?: () => void;
  onNavigateReservations?: () => void;
  onNavigateWaitlist?: () => void;
  onNavigateCustomers?: () => void;
  onSearch?: () => void;
  onNewEvent?: () => void;
  onNewReservation?: () => void;
  onBulkSelect?: () => void;
  onBulkDelete?: () => void;
  onBulkExport?: () => void;
  onRefresh?: () => void;
  onToggleSidebar?: () => void;
}): ShortcutDefinition[] => [
  // Navigation
  {
    key: '1',
    alt: true,
    description: 'Ga naar Events',
    action: actions.onNavigateEvents || (() => {}),
    category: 'navigation'
  },
  {
    key: '2',
    alt: true,
    description: 'Ga naar Reserveringen',
    action: actions.onNavigateReservations || (() => {}),
    category: 'navigation'
  },
  {
    key: '3',
    alt: true,
    description: 'Ga naar Wachtlijst',
    action: actions.onNavigateWaitlist || (() => {}),
    category: 'navigation'
  },
  {
    key: '4',
    alt: true,
    description: 'Ga naar Klanten',
    action: actions.onNavigateCustomers || (() => {}),
    category: 'navigation'
  },
  
  // Actions
  {
    key: 'n',
    ctrl: true,
    description: 'Nieuw Event',
    action: actions.onNewEvent || (() => {}),
    category: 'actions'
  },
  {
    key: 'n',
    ctrl: true,
    shift: true,
    description: 'Nieuwe Reservering',
    action: actions.onNewReservation || (() => {}),
    category: 'actions'
  },
  {
    key: 'r',
    ctrl: true,
    description: 'Ververs Data',
    action: actions.onRefresh || (() => {}),
    category: 'actions'
  },
  
  // Bulk Operations
  {
    key: 'a',
    ctrl: true,
    description: 'Selecteer Alles',
    action: actions.onBulkSelect || (() => {}),
    category: 'bulk',
    context: 'Wanneer bulk mode actief is'
  },
  {
    key: 'Delete',
    ctrl: true,
    description: 'Verwijder Geselecteerd',
    action: actions.onBulkDelete || (() => {}),
    category: 'bulk',
    context: 'Wanneer items geselecteerd zijn'
  },
  {
    key: 'e',
    ctrl: true,
    description: 'Export Geselecteerd',
    action: actions.onBulkExport || (() => {}),
    category: 'bulk',
    context: 'Wanneer items geselecteerd zijn'
  },
  
  // Search
  {
    key: 'f',
    ctrl: true,
    description: 'Zoeken',
    action: actions.onSearch || (() => {}),
    category: 'search'
  },
  {
    key: '/',
    description: 'Quick Search',
    action: actions.onSearch || (() => {}),
    category: 'search'
  },
  
  // General
  {
    key: 'b',
    ctrl: true,
    description: 'Toggle Sidebar',
    action: actions.onToggleSidebar || (() => {}),
    category: 'general'
  },
  {
    key: 'Escape',
    description: 'Sluit Modals / Wis Selectie',
    action: () => {},
    category: 'general'
  }
];
