/**
 * ⌨️ Keyboard Navigation Hook
 * 
 * Advanced keyboard shortcuts for power users
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

interface UseKeyboardNavigationOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  preventDefault?: boolean;
}

export const useKeyboardNavigation = ({
  shortcuts,
  enabled = true,
  preventDefault = true
}: UseKeyboardNavigationOptions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger if user is typing in an input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !shortcut.ctrl || event.ctrlKey || event.metaKey;
      const shiftMatches = !shortcut.shift || event.shiftKey;
      const altMatches = !shortcut.alt || event.altKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        if (preventDefault) {
          event.preventDefault();
        }
        shortcut.action();
        break;
      }
    }
  }, [shortcuts, enabled, preventDefault]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Common keyboard shortcuts
export const COMMON_SHORTCUTS = {
  SEARCH: { key: 'k', ctrl: true, description: 'Zoeken' },
  NEW: { key: 'n', ctrl: true, description: 'Nieuw' },
  SAVE: { key: 's', ctrl: true, description: 'Opslaan' },
  DELETE: { key: 'Delete', description: 'Verwijderen' },
  ESCAPE: { key: 'Escape', description: 'Sluiten' },
  REFRESH: { key: 'r', ctrl: true, description: 'Vernieuwen' },
  HELP: { key: '?', shift: true, description: 'Help' },
  EXPORT: { key: 'e', ctrl: true, shift: true, description: 'Exporteren' },
  FILTER: { key: 'f', ctrl: true, description: 'Filteren' },
  SELECT_ALL: { key: 'a', ctrl: true, description: 'Alles selecteren' }
};

/**
 * List Navigation Hook
 * 
 * Navigate through lists with arrow keys
 */
interface UseListNavigationOptions {
  items: any[];
  onSelect: (item: any, index: number) => void;
  enabled?: boolean;
  loop?: boolean;
}

export const useListNavigation = ({
  items,
  onSelect,
  enabled = true,
  loop = true
}: UseListNavigationOptions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || items.length === 0) return;

    const activeElement = document.activeElement;
    const currentIndex = Array.from(document.querySelectorAll('[data-list-item]')).indexOf(activeElement as Element);

    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = currentIndex + 1;
        if (newIndex >= items.length) {
          newIndex = loop ? 0 : items.length - 1;
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex - 1;
        if (newIndex < 0) {
          newIndex = loop ? items.length - 1 : 0;
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      case 'Enter':
        if (currentIndex >= 0 && currentIndex < items.length) {
          event.preventDefault();
          onSelect(items[currentIndex], currentIndex);
        }
        return;
      default:
        return;
    }

    // Focus the new item
    const listItems = document.querySelectorAll('[data-list-item]');
    const targetItem = listItems[newIndex] as HTMLElement;
    if (targetItem) {
      targetItem.focus();
      onSelect(items[newIndex], newIndex);
    }
  }, [items, onSelect, enabled, loop]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Modal Navigation Hook
 * 
 * Tab trapping and escape handling for modals
 */
interface UseModalNavigationOptions {
  isOpen: boolean;
  onClose: () => void;
  modalRef: React.RefObject<HTMLElement>;
}

export const useModalNavigation = ({
  isOpen,
  onClose,
  modalRef
}: UseModalNavigationOptions) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // Tab trapping
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    // Focus first element on open
    if (modalRef.current) {
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, modalRef]);
};

/**
 * Command Palette Hook
 * 
 * Quick command execution with fuzzy search
 */
export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  keywords?: string[];
  action: () => void;
  shortcut?: string;
}

interface UseCommandPaletteOptions {
  commands: Command[];
  onExecute?: (command: Command) => void;
}

export const useCommandPalette = ({ commands, onExecute }: UseCommandPaletteOptions) => {
  const executeCommand = useCallback((commandId: string) => {
    const command = commands.find(c => c.id === commandId);
    if (command) {
      command.action();
      onExecute?.(command);
    }
  }, [commands, onExecute]);

  const searchCommands = useCallback((query: string): Command[] => {
    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => {
      const labelMatch = cmd.label.toLowerCase().includes(lowerQuery);
      const descMatch = cmd.description?.toLowerCase().includes(lowerQuery);
      const keywordMatch = cmd.keywords?.some(k => k.toLowerCase().includes(lowerQuery));
      return labelMatch || descMatch || keywordMatch;
    });
  }, [commands]);

  return { executeCommand, searchCommands };
};
