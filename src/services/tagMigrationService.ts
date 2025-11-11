/**
 * 🏷️ Tag Migration Utility
 * 
 * One-time utility om automatische tags toe te voegen aan bestaande reserveringen
 * Die nog geen tags hebben of waar de automatische tags ontbreken.
 * 
 * RUN THIS ONCE after deploying the new tag system!
 */

import { reservationsService } from './firestoreService';
import type { Reservation } from '../types';

/**
 * Generate automatic tags based on reservation data
 */
function generateAutomaticTagsForMigration(reservation: Partial<Reservation>): string[] {
  const automaticTags: string[] = [];
  
  // 🌟 DELUXE: BWFM arrangement
  if (reservation.arrangement === 'BWFM') {
    automaticTags.push('DELUXE');
  }
  
  // 🍷 BORREL: Pre-drink or After-party
  const hasPreDrink = reservation.preDrink?.enabled && (reservation.preDrink?.quantity || 0) > 0;
  const hasAfterParty = reservation.afterParty?.enabled && (reservation.afterParty?.quantity || 0) > 0;
  
  if (hasPreDrink || hasAfterParty) {
    automaticTags.push('BORREL');
  }
  
  // 🛍️ MERCHANDISE: Has merchandise items
  if (reservation.merchandise && reservation.merchandise.length > 0) {
    automaticTags.push('MERCHANDISE');
  }
  
  return automaticTags;
}

/**
 * Migrate all existing reservations to have automatic tags
 */
export async function migrateReservationTags(): Promise<{
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}> {
  console.log('🏷️ Starting tag migration...');
  
  let success = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  try {
    // Get all reservations
    const reservations = await reservationsService.getAll();
    console.log(`📊 Found ${reservations.length} reservations to check`);
    
    for (const reservation of reservations) {
      try {
        // Generate automatic tags
        const automaticTags = generateAutomaticTagsForMigration(reservation);
        
        // Get existing tags (manual tags)
        const existingTags = reservation.tags || [];
        
        // Remove old automatic tags from existing tags (if any)
        const manualTags = existingTags.filter(tag => 
          !['DELUXE', 'BORREL', 'MERCHANDISE'].includes(tag)
        );
        
        // Combine manual tags with new automatic tags
        const newTags = [...new Set([...manualTags, ...automaticTags])];
        
        // Check if update is needed
        const tagsChanged = JSON.stringify(existingTags.sort()) !== JSON.stringify(newTags.sort());
        
        if (!tagsChanged && existingTags.length > 0) {
          // Tags already correct
          skipped++;
          continue;
        }
        
        // Update reservation with new tags
        await reservationsService.update(reservation.id, {
          tags: newTags
        });
        
        console.log(`✅ Updated ${reservation.id}: ${reservation.contactPerson}`);
        console.log(`   Old tags: [${existingTags.join(', ') || 'none'}]`);
        console.log(`   New tags: [${newTags.join(', ') || 'none'}]`);
        
        success++;
      } catch (error) {
        console.error(`❌ Failed to update ${reservation.id}:`, error);
        errors.push(`${reservation.id}: ${error instanceof Error ? error.message : String(error)}`);
        failed++;
      }
    }
    
    console.log('\n🎉 Migration complete!');
    console.log(`✅ Success: ${success}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    
    return { success, failed, skipped, errors };
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

/**
 * Test function to preview what tags would be added (no actual updates)
 */
export async function previewTagMigration(): Promise<Array<{
  id: string;
  name: string;
  currentTags: string[];
  newTags: string[];
  changes: string[];
}>> {
  const reservations = await reservationsService.getAll();
  const preview: Array<{
    id: string;
    name: string;
    currentTags: string[];
    newTags: string[];
    changes: string[];
  }> = [];
  
  for (const reservation of reservations) {
    const automaticTags = generateAutomaticTagsForMigration(reservation);
    const existingTags = reservation.tags || [];
    const manualTags = existingTags.filter(tag => 
      !['DELUXE', 'BORREL', 'MERCHANDISE'].includes(tag)
    );
    const newTags = [...new Set([...manualTags, ...automaticTags])];
    
    const changes: string[] = [];
    
    // Check what's added
    const addedTags = newTags.filter(tag => !existingTags.includes(tag));
    if (addedTags.length > 0) {
      changes.push(`Added: ${addedTags.join(', ')}`);
    }
    
    // Check what's removed
    const removedTags = existingTags.filter(tag => !newTags.includes(tag));
    if (removedTags.length > 0) {
      changes.push(`Removed: ${removedTags.join(', ')}`);
    }
    
    if (changes.length > 0) {
      preview.push({
        id: reservation.id,
        name: reservation.contactPerson,
        currentTags: existingTags,
        newTags: newTags,
        changes: changes
      });
    }
  }
  
  return preview;
}

/**
 * Browser console helper - paste this in browser console to run migration
 */
export const consoleHelpers = {
  /**
   * Preview what tags would be added (safe, no changes)
   */
  previewTags: async () => {
    const { previewTagMigration } = await import('./tagMigrationService');
    const preview = await previewTagMigration();
    console.table(preview);
    return preview;
  },
  
  /**
   * Run the actual migration (UPDATES DATABASE!)
   */
  runMigration: async () => {
    const confirmed = confirm(
      '⚠️ This will update ALL reservations with automatic tags.\n\n' +
      'Manual tags will be preserved.\n' +
      'Automatic tags (DELUXE, BORREL, MERCHANDISE) will be added/updated.\n\n' +
      'Continue?'
    );
    
    if (!confirmed) {
      console.log('❌ Migration cancelled');
      return;
    }
    
    const { migrateReservationTags } = await import('./tagMigrationService');
    const result = await migrateReservationTags();
    
    console.log('\n📊 Migration Results:');
    console.table([result]);
    
    if (result.errors.length > 0) {
      console.error('\n❌ Errors:');
      result.errors.forEach(err => console.error(err));
    }
    
    return result;
  }
};

// Export for window access in browser console
if (typeof window !== 'undefined') {
  (window as any).tagMigration = consoleHelpers;
}
