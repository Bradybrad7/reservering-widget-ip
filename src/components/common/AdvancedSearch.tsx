/**
 * 🔍 Advanced Search Component
 * 
 * Search met fuzzy matching, filters, en highlighting
 */

import React, { useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal, Sparkles } from 'lucide-react';
import { fuzzySearch, advancedSearch, getHighlightedParts, type FuzzySearchResult, type AdvancedSearchOptions } from '../../utils/fuzzySearch';
import { useDebounce } from '../../hooks/useDebounce';

interface AdvancedSearchProps<T> {
  items: T[];
  searchKeys: string[];
  onResultsChange?: (results: FuzzySearchResult<T>[]) => void;
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  filters?: AdvancedSearchOptions<T>['filters'];
  dateFilters?: AdvancedSearchOptions<T>['dateFilters'];
  threshold?: number;
}

export function AdvancedSearchComponent<T>({
  items,
  searchKeys,
  onResultsChange,
  placeholder = 'Zoeken...',
  className = '',
  showFilters = false,
  filters,
  dateFilters,
  threshold = 0.3
}: AdvancedSearchProps<T>) {
  const [query, setQuery] = useState('');
  const [showFuzzy, setShowFuzzy] = useState(true);
  const debouncedQuery = useDebounce(query, 300);

  // Perform search
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) {
      const allResults = items.map(item => ({ item, score: 1, matches: [] }));
      onResultsChange?.(allResults);
      return allResults;
    }

    const searchResults = showFuzzy
      ? advancedSearch(items, debouncedQuery, {
          keys: searchKeys,
          threshold,
          filters,
          dateFilters,
          sortByScore: true
        })
      : items
          .filter(item => {
            // Exact match fallback
            return searchKeys.some(key => {
              const value = String((item as any)[key] || '').toLowerCase();
              return value.includes(debouncedQuery.toLowerCase());
            });
          })
          .map(item => ({ item, score: 1, matches: [] }));

    onResultsChange?.(searchResults);
    return searchResults;
  }, [items, debouncedQuery, searchKeys, showFuzzy, threshold, filters, dateFilters, onResultsChange]);

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
          <Search className="w-5 h-5" />
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-24 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
        />

        {/* Right Actions */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Fuzzy Toggle */}
          <button
            onClick={() => setShowFuzzy(!showFuzzy)}
            title={showFuzzy ? 'Fuzzy search ingeschakeld' : 'Exacte zoeken'}
            className={`p-1.5 rounded transition-colors ${
              showFuzzy
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Filters Toggle (if enabled) */}
          {showFilters && (
            <button
              className="p-1.5 rounded text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}

          {/* Clear Button */}
          {query && (
            <button
              onClick={handleClear}
              className="p-1.5 rounded text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Wissen"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {query && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {results.length === 0 ? (
            <span className="text-red-600 dark:text-red-400">Geen resultaten gevonden</span>
          ) : (
            <span>
              {results.length} resultaat{results.length !== 1 ? 'en' : ''} gevonden
              {showFuzzy && results.length > 0 && (
                <span className="ml-1 text-gray-400 dark:text-gray-500">
                  (gemiddelde score: {(results.reduce((sum, r) => sum + r.score, 0) / results.length * 100).toFixed(0)}%)
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Highlighted Text Component voor rendering in results
export const HighlightedText: React.FC<{
  text: string;
  query: string;
  caseSensitive?: boolean;
  className?: string;
}> = ({ text, query, caseSensitive = false, className = '' }) => {
  const parts = getHighlightedParts(text, query, caseSensitive);

  return (
    <span className={className}>
      {parts.map((part, index) => 
        part.highlighted ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-800 text-gray-900 dark:text-gray-100 px-0.5 rounded"
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  );
};

// Search Results Component
interface SearchResultsProps<T> {
  results: FuzzySearchResult<T>[];
  query: string;
  renderItem: (result: FuzzySearchResult<T>, index: number) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function SearchResults<T>({
  results,
  query,
  renderItem,
  emptyMessage = 'Geen resultaten gevonden',
  className = ''
}: SearchResultsProps<T>) {
  if (!query.trim()) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 dark:text-gray-500 mb-2">
          <Search className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {results.map((result, index) => renderItem(result, index))}
    </div>
  );
}

// Compact Search Bar (voor in header/toolbar)
export const CompactSearchBar: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Zoeken...', className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        </button>
      )}
    </div>
  );
};

// Search with instant results dropdown
export const SearchWithDropdown: React.FC<{
  items: any[];
  searchKeys: string[];
  renderResult: (item: any) => React.ReactNode;
  onSelect: (item: any) => void;
  placeholder?: string;
  className?: string;
}> = ({ items, searchKeys, renderResult, onSelect, placeholder, className }) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedQuery = useDebounce(query, 200);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    
    return fuzzySearch(items, debouncedQuery, {
      keys: searchKeys,
      threshold: 0.3,
      maxResults: 10,
      sortByScore: true
    });
  }, [items, debouncedQuery, searchKeys]);

  const handleSelect = (item: any) => {
    onSelect(item);
    setQuery('');
    setShowDropdown(false);
  };

  return (
    <div className={`relative ${className}`}>
      <CompactSearchBar
        value={query}
        onChange={(value) => {
          setQuery(value);
          setShowDropdown(true);
        }}
        placeholder={placeholder}
      />

      {/* Dropdown Results */}
      {showDropdown && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Geen resultaten
            </div>
          ) : (
            results.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelect(result.item)}
                className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
              >
                {renderResult(result.item)}
              </button>
            ))
          )}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {showDropdown && query.trim() && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};
