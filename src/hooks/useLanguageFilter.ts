/**
 * useLanguageFilter Hook
 * 
 * Language filtering en grouping voor admin:
 * - Filter customers/reservations by language
 * - Group by language in exports
 * - Track language preferences
 */

import { useMemo } from 'react';

export type Language = 'nl' | 'en';

export interface LanguageStats {
  nl: number;
  en: number;
  unknown: number;
}

export function useLanguageFilter<T extends { language?: Language }>(
  items: T[]
): {
  stats: LanguageStats;
  filterByLanguage: (lang: Language | 'all') => T[];
  groupByLanguage: () => Record<Language | 'unknown', T[]>;
} {
  const stats = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const lang = item.language || 'unknown';
        acc[lang as keyof LanguageStats]++;
        return acc;
      },
      { nl: 0, en: 0, unknown: 0 }
    );
  }, [items]);

  const filterByLanguage = (lang: Language | 'all'): T[] => {
    if (lang === 'all') return items;
    return items.filter(item => item.language === lang);
  };

  const groupByLanguage = (): Record<Language | 'unknown', T[]> => {
    return items.reduce(
      (acc, item) => {
        const lang = (item.language || 'unknown') as Language | 'unknown';
        if (!acc[lang]) {
          acc[lang] = [];
        }
        acc[lang].push(item);
        return acc;
      },
      { nl: [], en: [], unknown: [] } as Record<Language | 'unknown', T[]>
    );
  };

  return {
    stats,
    filterByLanguage,
    groupByLanguage
  };
}
