import type { AuditLogEntry } from '../types';

/**
 * Find Changes Utility
 * 
 * Vergelijkt twee objecten en retourneert een array van wijzigingen
 * voor de audit logger. Ondersteunt nested objecten en arrays.
 * 
 * @param original - Het originele object (voor de wijziging)
 * @param updates - Het object met updates
 * @returns Array van wijzigingen met field, oldValue en newValue
 */
export const findChanges = (
  original: any,
  updates: any
): AuditLogEntry['changes'] => {
  const changes: AuditLogEntry['changes'] = [];
  
  if (!original) return [];

  // Loop door alle sleutels in de 'updates'
  for (const key in updates) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      const oldValue = original[key];
      const newValue = updates[key];

      // Negeer functies of identieke waarden
      if (typeof newValue === 'function' || oldValue === newValue) {
        continue;
      }

      // Specifieke check voor objecten (zoals dietaryRequirements)
      if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
        const nestedChanges = findChanges(oldValue, newValue);
        if (nestedChanges) {
          nestedChanges.forEach(change => {
            changes.push({
              field: `${key}.${change.field}`,
              oldValue: change.oldValue,
              newValue: change.newValue,
            });
          });
        }
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        // Check voor simpele waarden of arrays
        changes.push({
          field: key,
          oldValue: oldValue,
          newValue: newValue,
        });
      }
    }
  }
  
  return changes;
};
