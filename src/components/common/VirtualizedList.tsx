/**
 * 🚀 Virtualized List Component
 * 
 * Efficient rendering of large lists using virtualization
 * Only renders visible items + buffer for smooth scrolling
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number; // Number of items to render above/below viewport
  className?: string;
  emptyMessage?: string;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
  emptyMessage = 'Geen items gevonden',
  onScroll
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for the first visible item
  const offsetY = startIndex * itemHeight;

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!containerRef.current) return;

    let scrollTo = index * itemHeight;

    if (align === 'center') {
      scrollTo = scrollTo - containerHeight / 2 + itemHeight / 2;
    } else if (align === 'end') {
      scrollTo = scrollTo - containerHeight + itemHeight;
    }

    containerRef.current.scrollTop = Math.max(0, scrollTo);
  }, [itemHeight, containerHeight]);

  // Expose scrollToIndex via ref
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).scrollToIndex = scrollToIndex;
    }
  }, [scrollToIndex]);

  // Empty state
  if (items.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ height: containerHeight }}
      >
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {items.slice(startIndex, endIndex + 1).map((item, idx) => {
            const actualIndex = startIndex + idx;
            return (
              <div key={actualIndex} style={{ height: itemHeight }}>
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Virtualized Table Row Component
interface VirtualizedTableProps<T> {
  items: T[];
  columns: Array<{
    key: string;
    header: string;
    width?: string;
    render: (item: T) => React.ReactNode;
  }>;
  rowHeight?: number;
  containerHeight?: number;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
  onRowClick?: (item: T, index: number) => void;
}

export function VirtualizedTable<T>({
  items,
  columns,
  rowHeight = 60,
  containerHeight = 600,
  overscan = 5,
  className = '',
  emptyMessage = 'Geen items gevonden',
  onRowClick
}: VirtualizedTableProps<T>) {
  const headerHeight = 48;
  const listHeight = containerHeight - headerHeight;

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Fixed Header */}
      <div 
        className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        style={{ height: headerHeight }}
      >
        <div className="flex items-center h-full px-4">
          {columns.map((column) => (
            <div
              key={column.key}
              className="font-medium text-sm text-gray-700 dark:text-gray-300"
              style={{ width: column.width || 'auto', flex: column.width ? undefined : 1 }}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtualized Rows */}
      <VirtualizedList
        items={items}
        itemHeight={rowHeight}
        containerHeight={listHeight}
        overscan={overscan}
        emptyMessage={emptyMessage}
        renderItem={(item, index) => (
          <div
            className="flex items-center px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => onRowClick?.(item, index)}
          >
            {columns.map((column) => (
              <div
                key={column.key}
                className="text-sm text-gray-900 dark:text-gray-100"
                style={{ width: column.width || 'auto', flex: column.width ? undefined : 1 }}
              >
                {column.render(item)}
              </div>
            ))}
          </div>
        )}
      />
    </div>
  );
}

// Grid virtualization for card layouts
interface VirtualizedGridProps<T> {
  items: T[];
  itemHeight: number;
  itemsPerRow: number;
  gap?: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
}

export function VirtualizedGrid<T>({
  items,
  itemHeight,
  itemsPerRow,
  gap = 16,
  containerHeight,
  renderItem,
  overscan = 2,
  className = '',
  emptyMessage = 'Geen items gevonden'
}: VirtualizedGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate row height (item height + gap)
  const rowHeight = itemHeight + gap;

  // Total number of rows
  const totalRows = Math.ceil(items.length / itemsPerRow);

  // Calculate visible range
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRow = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  );

  // Total height
  const totalHeight = totalRows * rowHeight;

  // Offset for the first visible row
  const offsetY = startRow * rowHeight;

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Empty state
  if (items.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ height: containerHeight }}
      >
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {Array.from({ length: endRow - startRow + 1 }, (_, rowIdx) => {
            const row = startRow + rowIdx;
            const startIdx = row * itemsPerRow;
            const endIdx = Math.min(startIdx + itemsPerRow, items.length);
            
            return (
              <div
                key={row}
                className="flex"
                style={{ 
                  height: itemHeight, 
                  gap: `${gap}px`,
                  marginBottom: `${gap}px`
                }}
              >
                {items.slice(startIdx, endIdx).map((item, idx) => {
                  const actualIndex = startIdx + idx;
                  return (
                    <div 
                      key={actualIndex}
                      style={{ flex: `0 0 calc((100% - ${gap * (itemsPerRow - 1)}px) / ${itemsPerRow})` }}
                    >
                      {renderItem(item, actualIndex)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hook for dynamic item height (for variable-height items)
export const useVariableHeightVirtualization = <T,>(
  items: T[],
  containerHeight: number,
  estimatedItemHeight: number = 60,
  measureItem: (item: T) => number
) => {
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  const [scrollTop, setScrollTop] = useState(0);

  // Get item height (measured or estimated)
  const getItemHeight = useCallback((index: number): number => {
    return itemHeights.get(index) || estimatedItemHeight;
  }, [itemHeights, estimatedItemHeight]);

  // Get total height
  const getTotalHeight = useCallback((): number => {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += getItemHeight(i);
    }
    return total;
  }, [items.length, getItemHeight]);

  // Get item offset
  const getItemOffset = useCallback((index: number): number => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }
    return offset;
  }, [getItemHeight]);

  // Find visible range
  const getVisibleRange = useCallback((overscan: number = 3): [number, number] => {
    let startIndex = 0;
    let currentOffset = 0;
    
    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i);
      if (currentOffset + height > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      currentOffset += height;
    }

    // Find end index
    let endIndex = startIndex;
    currentOffset = getItemOffset(startIndex);
    
    for (let i = startIndex; i < items.length; i++) {
      currentOffset += getItemHeight(i);
      if (currentOffset > scrollTop + containerHeight) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
      endIndex = i;
    }

    return [startIndex, endIndex];
  }, [items.length, scrollTop, containerHeight, getItemHeight, getItemOffset]);

  // Measure item (to be called after render)
  const measureItemHeight = useCallback((index: number, height: number) => {
    setItemHeights(prev => {
      const next = new Map(prev);
      next.set(index, height);
      return next;
    });
  }, []);

  return {
    scrollTop,
    setScrollTop,
    getItemHeight,
    getItemOffset,
    getTotalHeight: getTotalHeight(),
    getVisibleRange,
    measureItemHeight
  };
};
