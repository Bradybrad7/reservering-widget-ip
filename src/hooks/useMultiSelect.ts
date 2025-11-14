/**
 * 🎯 USE MULTI SELECT HOOK
 * 
 * Reusable hook for managing multi-selection state in lists
 * 
 * Features:
 * - Select/deselect individual items
 * - Select/deselect all
 * - Toggle selection
 * - Check if item is selected
 * - Get selected items array
 */

import { useState, useCallback, useMemo } from 'react';

export interface UseMultiSelectReturn<T> {
  selectedIds: Set<string>;
  selectedItems: T[];
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectMultiple: (ids: string[]) => void;
  selectedCount: number;
}

export function useMultiSelect<T extends { id: string }>(
  items: T[]
): UseMultiSelectReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  return {
    selectedIds,
    selectedItems,
    isSelected,
    toggleSelect,
    selectAll,
    deselectAll,
    selectMultiple,
    selectedCount: selectedIds.size,
  };
}
