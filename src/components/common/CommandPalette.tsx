/**
 * 🎯 Command Palette Component
 * 
 * Quick actions for power users (Ctrl+K)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Zap, X } from 'lucide-react';
import { useCommandPalette, useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import type { Command } from '../../hooks/useKeyboardNavigation';

interface CommandPaletteProps {
  commands: Command[];
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  commands,
  isOpen,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { executeCommand, searchCommands } = useCommandPalette({
    commands,
    onExecute: () => {
      onClose();
      setQuery('');
      setSelectedIndex(0);
    }
  });

  const filteredCommands = query ? searchCommands(query) : commands;

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useKeyboardNavigation({
    shortcuts: [
      {
        key: 'Escape',
        description: 'Sluiten',
        action: onClose
      },
      {
        key: 'ArrowDown',
        description: 'Volgende',
        action: () => {
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
        }
      },
      {
        key: 'ArrowUp',
        description: 'Vorige',
        action: () => {
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
        }
      },
      {
        key: 'Enter',
        description: 'Uitvoeren',
        action: () => {
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex].id);
          }
        }
      }
    ],
    enabled: isOpen
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[20vh] p-4">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Zoek een actie..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Geen acties gevonden</p>
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => executeCommand(command.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-indigo-50 dark:bg-indigo-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {command.icon && (
                    <div className="flex-shrink-0 w-5 h-5 text-gray-400">
                      {command.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {command.label}
                    </p>
                    {command.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {command.description}
                      </p>
                    )}
                  </div>
                  {command.shortcut && (
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                      {command.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑↓</kbd>
              Navigeer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↵</kbd>
              Selecteer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd>
              Sluit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
