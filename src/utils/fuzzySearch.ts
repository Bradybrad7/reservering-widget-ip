/**
 * 🔍 Fuzzy Search Utilities
 * 
 * Advanced search met fuzzy matching, highlighting, en relevance scoring
 */

import * as React from 'react';

export interface FuzzySearchResult<T> {
  item: T;
  score: number; // 0-1, higher is better
  matches: Array<{
    field: string;
    indices: number[][]; // Character positions that match
  }>;
}

export interface FuzzySearchOptions {
  keys: string[]; // Fields to search in
  threshold?: number; // Minimum score to include (0-1), default 0.3
  caseSensitive?: boolean;
  maxResults?: number;
  sortByScore?: boolean;
}

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
};

/**
 * Calculate similarity score (0-1) based on Levenshtein distance
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
};

/**
 * Find all match indices for substring search
 */
const findMatchIndices = (text: string, query: string, caseSensitive = false): number[][] => {
  const indices: number[][] = [];
  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchQuery = caseSensitive ? query : query.toLowerCase();
  
  let startIndex = 0;
  while (startIndex < searchText.length) {
    const index = searchText.indexOf(searchQuery, startIndex);
    if (index === -1) break;
    
    indices.push([index, index + searchQuery.length - 1]);
    startIndex = index + 1;
  }
  
  return indices;
};

/**
 * Score a match based on various factors
 */
const scoreMatch = (
  text: string,
  query: string,
  indices: number[][],
  caseSensitive = false
): number => {
  if (indices.length === 0) return 0;

  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchQuery = caseSensitive ? query : query.toLowerCase();

  // Exact match = perfect score
  if (searchText === searchQuery) return 1;

  // Starts with query = high score
  if (searchText.startsWith(searchQuery)) return 0.95;

  // Contains query as whole word = good score
  const wordBoundaryRegex = new RegExp(`\\b${searchQuery}\\b`, caseSensitive ? '' : 'i');
  if (wordBoundaryRegex.test(searchText)) return 0.85;

  // Contains query = decent score
  if (searchText.includes(searchQuery)) return 0.7;

  // Use Levenshtein distance for fuzzy matching
  const similarity = calculateSimilarity(searchText, searchQuery);
  
  // Boost score if match is at start
  const firstMatchIndex = indices[0][0];
  const positionBoost = firstMatchIndex === 0 ? 0.1 : firstMatchIndex < 3 ? 0.05 : 0;

  // Boost score based on match coverage
  const matchLength = indices.reduce((sum, [start, end]) => sum + (end - start + 1), 0);
  const coverageBoost = (matchLength / searchQuery.length) * 0.1;

  return Math.min(1, similarity + positionBoost + coverageBoost);
};

/**
 * Get nested property value from object by path
 */
const getNestedValue = (obj: any, path: string): string => {
  const parts = path.split('.');
  let value = obj;
  
  for (const part of parts) {
    if (value === null || value === undefined) return '';
    value = value[part];
  }
  
  return String(value || '');
};

/**
 * Fuzzy search through array of objects
 */
export const fuzzySearch = <T>(
  items: T[],
  query: string,
  options: FuzzySearchOptions
): FuzzySearchResult<T>[] => {
  if (!query.trim()) return [];

  const {
    keys,
    threshold = 0.3,
    caseSensitive = false,
    maxResults,
    sortByScore = true
  } = options;

  const results: FuzzySearchResult<T>[] = [];

  for (const item of items) {
    let bestScore = 0;
    const matches: Array<{ field: string; indices: number[][] }> = [];

    // Search in all specified fields
    for (const key of keys) {
      const fieldValue = getNestedValue(item, key);
      if (!fieldValue) continue;

      // Try exact substring match first
      const indices = findMatchIndices(fieldValue, query, caseSensitive);
      
      if (indices.length > 0) {
        const score = scoreMatch(fieldValue, query, indices, caseSensitive);
        if (score > bestScore) bestScore = score;
        matches.push({ field: key, indices });
      } else {
        // Try fuzzy match
        const similarity = calculateSimilarity(
          caseSensitive ? fieldValue : fieldValue.toLowerCase(),
          caseSensitive ? query : query.toLowerCase()
        );
        
        if (similarity >= threshold) {
          if (similarity > bestScore) bestScore = similarity;
          matches.push({ field: key, indices: [] }); // No specific indices for fuzzy match
        }
      }
    }

    // Include if score meets threshold
    if (bestScore >= threshold) {
      results.push({ item, score: bestScore, matches });
    }
  }

  // Sort by score if requested
  if (sortByScore) {
    results.sort((a, b) => b.score - a.score);
  }

  // Limit results if requested
  if (maxResults && results.length > maxResults) {
    return results.slice(0, maxResults);
  }

  return results;
};

/**
 * Highlight matches in text (returns HTML string)
 */
export const highlightMatches = (
  text: string,
  indices: number[][],
  highlightClass = 'bg-yellow-200 dark:bg-yellow-800'
): string => {
  if (indices.length === 0) return text;

  // Sort indices by start position
  const sortedIndices = [...indices].sort((a, b) => a[0] - b[0]);

  let result = '';
  let lastIndex = 0;

  for (const [start, end] of sortedIndices) {
    // Add text before match
    result += text.substring(lastIndex, start);
    
    // Add highlighted match
    result += `<span class="${highlightClass}">${text.substring(start, end + 1)}</span>`;
    
    lastIndex = end + 1;
  }

  // Add remaining text
  result += text.substring(lastIndex);

  return result;
};

/**
 * Get highlighted text parts (for React rendering)
 */
export const getHighlightedParts = (
  text: string,
  query: string,
  caseSensitive = false
): Array<{ text: string; highlighted: boolean }> => {
  const indices = findMatchIndices(text, query, caseSensitive);
  
  if (indices.length === 0) {
    return [{ text, highlighted: false }];
  }

  const parts: Array<{ text: string; highlighted: boolean }> = [];
  let lastIndex = 0;

  for (const [start, end] of indices) {
    // Add text before match
    if (start > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, start),
        highlighted: false
      });
    }
    
    // Add highlighted match
    parts.push({
      text: text.substring(start, end + 1),
      highlighted: true
    });
    
    lastIndex = end + 1;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      highlighted: false
    });
  }

  return parts;
};

/**
 * Advanced search with multiple filters
 */
export interface AdvancedSearchOptions<T> extends FuzzySearchOptions {
  filters?: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
    value: any;
  }>;
  dateFilters?: Array<{
    field: string;
    start?: Date;
    end?: Date;
  }>;
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export const advancedSearch = <T>(
  items: T[],
  query: string,
  options: AdvancedSearchOptions<T>
): FuzzySearchResult<T>[] => {
  let results = items;

  // Apply filters first
  if (options.filters && options.filters.length > 0) {
    results = results.filter(item => {
      return options.filters!.every(filter => {
        const value = getNestedValue(item, filter.field);
        
        switch (filter.operator) {
          case 'eq':
            return value === filter.value;
          case 'ne':
            return value !== filter.value;
          case 'gt':
            return value > filter.value;
          case 'lt':
            return value < filter.value;
          case 'gte':
            return value >= filter.value;
          case 'lte':
            return value <= filter.value;
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value);
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          default:
            return true;
        }
      });
    });
  }

  // Apply date filters
  if (options.dateFilters && options.dateFilters.length > 0) {
    results = results.filter(item => {
      return options.dateFilters!.every(dateFilter => {
        const dateValue = new Date(getNestedValue(item, dateFilter.field));
        
        if (dateFilter.start && dateValue < dateFilter.start) return false;
        if (dateFilter.end && dateValue > dateFilter.end) return false;
        
        return true;
      });
    });
  }

  // Apply fuzzy search
  const searchResults = query.trim()
    ? fuzzySearch(results, query, options)
    : results.map(item => ({ item, score: 1, matches: [] }));

  // Apply sorting
  if (options.sortBy) {
    searchResults.sort((a, b) => {
      const aValue = getNestedValue(a.item, options.sortBy!.field);
      const bValue = getNestedValue(b.item, options.sortBy!.field);
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return options.sortBy!.direction === 'asc' ? comparison : -comparison;
    });
  }

  return searchResults;
};
