# 🛠️ Implementation Guide - Step-by-Step Refactoring

**Companion to**: REFACTORING_PLAN.md  
**Date**: November 21, 2025  
**Estimated Total Time**: 6 weeks (1 developer) or 3 weeks (team of 2)

---

## 📋 Pre-Implementation Checklist

Before starting ANY refactoring work:

- [ ] **Git branch created**: `git checkout -b refactor/unify-codebase`
- [ ] **Backup created**: Full workspace backup to safe location
- [ ] **Tests passing**: Run existing test suite and document results
- [ ] **Team notified**: Inform team of upcoming changes
- [ ] **Documentation read**: Review REFACTORING_PLAN.md fully
- [ ] **Local environment**: Ensure dev environment is clean and working

---

## 🎯 Phase 1: Shared Booking Logic (Week 1)

### Step 1.1: Create useBookingLogic Hook ✅ COMPLETE

**Status**: Hook already created at `src/hooks/useBookingLogic.ts`

**Verify**:
```powershell
Test-Path "src\hooks\useBookingLogic.ts"
```

**Next**: Test the hook in isolation before integration

### Step 1.2: Add Tests for useBookingLogic

**Create**: `src/hooks/__tests__/useBookingLogic.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useBookingLogic } from '../useBookingLogic';

describe('useBookingLogic', () => {
  it('should initialize in client mode', () => {
    const { result } = renderHook(() => 
      useBookingLogic({ mode: 'client' })
    );
    
    expect(result.current.mode).toBe('client');
    expect(result.current.currentStep).toBe('calendar');
  });
  
  it('should initialize in admin mode with overrides', () => {
    const { result } = renderHook(() => 
      useBookingLogic({ 
        mode: 'admin',
        adminOverrides: {
          skipEmails: true,
          allowPriceOverride: true
        }
      })
    );
    
    expect(result.current.mode).toBe('admin');
    expect(result.current.overridePrice).toBeDefined();
  });
  
  it('should validate calendar step', () => {
    const { result } = renderHook(() => 
      useBookingLogic({ mode: 'client' })
    );
    
    const validation = result.current.validateCurrentStep();
    expect(validation.valid).toBe(false);
    expect(validation.errors.event).toBeDefined();
  });
  
  // Add more tests...
});
```

**Run Tests**:
```powershell
npm test -- useBookingLogic.test
```

### Step 1.3: Integrate into ReservationWidget

**Backup First**:
```powershell
Copy-Item "src\components\ReservationWidget.tsx" "src\components\ReservationWidget.BACKUP.tsx"
```

**Reference Implementation**: See `REFACTORING_EXAMPLES/ReservationWidget.REFACTORED.tsx`

**Key Changes**:
1. Replace store access with hook
2. Remove local validation logic
3. Remove duplicate price calculation
4. Simplify error handling

**Test Checklist**:
- [ ] Calendar selection works
- [ ] Step navigation works
- [ ] Validation shows errors
- [ ] Price calculation correct
- [ ] Submission succeeds
- [ ] Draft save/load works
- [ ] All existing features preserved

### Step 1.4: Integrate into ManualBookingForm

**Backup First**:
```powershell
Copy-Item "src\components\admin\ManualBookingForm.tsx" "src\components\admin\ManualBookingForm.BACKUP.tsx"
```

**Reference Implementation**: See `REFACTORING_EXAMPLES/ManualBookingForm.REFACTORED.tsx`

**Key Changes**:
1. Use hook in admin mode
2. Enable adminOverrides
3. Add price override UI
4. Test import mode

**Test Checklist**:
- [ ] Admin booking creation works
- [ ] Import mode skips emails
- [ ] Price override works
- [ ] Prefilled data applied
- [ ] All fields available (no missing fields)
- [ ] Wizard mode works

### Step 1.5: Export Hook from Index

**File**: `src/hooks/index.ts`

```typescript
// Add to existing exports
export { useBookingLogic, useStepValidation, useFieldValidation } from './useBookingLogic';
export type { UseBookingLogicOptions, UseBookingLogicReturn } from './useBookingLogic';
```

---

## 🎯 Phase 2: Dashboard Consolidation (Week 2)

### Step 2.1: Audit Dashboard Features

**Create Feature Matrix**:

| Feature | Enhanced | Modern | ModernV3 | Keep? |
|---------|----------|--------|----------|-------|
| KPI Cards | Static | Widget | Quick | V3 + Modern |
| Urgent Actions | Banner | ❌ | Widgets | Both |
| Personalization | ❌ | Full | Presets | Modern |
| Operational Focus | ⚠️ | ❌ | ✅ | V3 |

**Decision**: Merge all three into new `Dashboard.tsx`

### Step 2.2: Create Unified Dashboard

**File**: `src/components/admin/Dashboard.tsx`

```typescript
/**
 * ✨ Unified Dashboard - Best of Enhanced + Modern + ModernV3
 */
import React from 'react';
import { useDashboardLayoutStore } from '../../store/dashboardLayoutStore';
import { DashboardPersonalization } from './DashboardPersonalization';

// Import all widgets
import {
  QuickStatsWidget,
  PendingReservationsWidget,
  NewReservationsWidget,
  ExpiringOptionsWidget,
  UpcomingEventsWidget,
  // ... etc
} from './widgets';

interface DashboardProps {
  preset?: 'host' | 'manager' | 'owner' | 'custom';
  allowPersonalization?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  preset = 'manager',
  allowPersonalization = true
}) => {
  // Combine ModernV3 presets with Modern personalization
  const { widgets, layout } = useDashboardLayoutStore();
  
  return (
    <div className="space-y-6">
      {/* Enhanced: Urgent Actions Banner */}
      <UrgentActionsBanner />
      
      {/* Modern: Personalization Controls */}
      {allowPersonalization && <DashboardPersonalization />}
      
      {/* ModernV3: Operational Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.map(widget => renderWidget(widget))}
      </div>
    </div>
  );
};
```

### Step 2.3: Migrate Widgets

**Create**: `src/components/admin/widgets/index.ts`

```typescript
// Export all widgets from one place
export { QuickStatsWidget } from './QuickStatsWidget';
export { PendingReservationsWidget } from './PendingReservationsWidget';
export { NewReservationsWidget } from './NewReservationsWidget';
// ... etc
```

**Process**:
1. Copy unique widgets from all three dashboards
2. Standardize widget interface
3. Remove duplicates
4. Test each widget independently

### Step 2.4: Update BookingAdminNew2

**File**: `src/components/BookingAdminNew2.tsx`

**Change**:
```typescript
// OLD
import { DashboardEnhanced } from './admin/DashboardEnhanced';

// NEW
import { Dashboard } from './admin/Dashboard';

// ...
case 'dashboard':
  return <Dashboard preset="manager" allowPersonalization />;
```

### Step 2.5: Archive Old Dashboards

**Don't delete yet - move to archive**:
```powershell
New-Item -ItemType Directory -Force -Path "archive\components\admin\dashboards"
Move-Item "src\components\admin\DashboardEnhanced.tsx" "archive\components\admin\dashboards\"
Move-Item "src\components\admin\DashboardModern.tsx" "archive\components\admin\dashboards\"
Move-Item "src\components\admin\DashboardModernV3.tsx" "archive\components\admin\dashboards\"
```

### Step 2.6: Test Dashboard

**Test Checklist**:
- [ ] All KPIs display correctly
- [ ] Urgent actions show when relevant
- [ ] Widgets can be rearranged (if personalization enabled)
- [ ] Presets work (host, manager, owner)
- [ ] Real-time data updates
- [ ] No console errors
- [ ] Performance is acceptable

---

## 🎯 Phase 3: Operations Control Center (Week 3)

### Step 3.1: Compare Implementations

**Command**:
```powershell
code --diff "src\components\admin\OperationsControlCenter.tsx" "src\components\admin\OperationsControlCenterEnhanced.tsx"
```

**Note Differences**:
- Enhanced has keyboard shortcuts
- Enhanced has accessibility improvements
- Enhanced has better TypeScript types
- Original may have features Enhanced dropped

### Step 3.2: Merge Enhanced → Standard

**Backup**:
```powershell
Copy-Item "src\components\admin\OperationsControlCenter.tsx" "archive\components\admin\OperationsControlCenter.ORIGINAL.tsx"
```

**Strategy**: Replace content with Enhanced version, but keep original filename

**Process**:
1. Copy Enhanced content to OperationsControlCenter.tsx
2. Update imports from `operationsStoreEnhanced` → `operationsStore`
3. Test all functionality
4. Archive Enhanced file

### Step 3.3: Consolidate Operations Store

**Files**:
- `src/store/operationsStore.ts` (292 lines)
- `src/store/operationsStoreEnhanced.ts` (773 lines)

**Strategy**: Enhanced becomes the standard

**Backup**:
```powershell
Copy-Item "src\store\operationsStore.ts" "archive\store\operationsStore.ORIGINAL.ts"
```

**Process**:
1. Rename Enhanced → operationsStore
2. Remove "Enhanced" from all exports
3. Update all imports across codebase
4. Test store functionality

**Update Imports**:
```powershell
# Search for all files importing operationsStoreEnhanced
Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts | Select-String "operationsStoreEnhanced"
```

### Step 3.4: Test Operations Control Center

**Test Checklist**:
- [ ] All tabs load correctly
- [ ] Context switching works
- [ ] Filters apply across tabs
- [ ] Keyboard shortcuts work (Alt+1-5, Esc)
- [ ] Breadcrumbs show correct context
- [ ] Slide-out panels function
- [ ] No TypeScript errors

---

## 🎯 Phase 4: Email Service Unification (Week 4)

### Step 4.1: Analyze Email Dependencies

**Find all usages**:
```powershell
Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts | Select-String "emailService" | Group-Object Path
```

**Document**:
- How many files import old emailService?
- Which functions are most used?
- Any custom email templates?

### Step 4.2: Create Migration Plan

**Template**:
| Old Function | New Function | Migration Status |
|--------------|--------------|------------------|
| `generateAdminNewBookingEmail` | `modernEmailService.sendByStatus` | Not Started |
| `sendConfirmationEmail` | `modernEmailService.sendConfirmation` | Not Started |

### Step 4.3: Backup and Rename

**Backup Old**:
```powershell
Move-Item "src\services\emailService.ts" "src\services\emailService.DEPRECATED.ts"
```

**Promote Modern**:
```powershell
Copy-Item "src\services\modernEmailService.ts" "src\services\emailService.ts"
```

**Add Compatibility Layer**:
In new `emailService.ts`, add at bottom:
```typescript
// ============================================================================
// DEPRECATED COMPATIBILITY LAYER
// Remove after full migration (by December 2025)
// ============================================================================

/**
 * @deprecated Use modernEmailService.sendByStatus() instead
 */
export const generateAdminNewBookingEmail = async (
  reservation: Reservation,
  event: Event
): Promise<EmailTemplate> => {
  console.warn('DEPRECATED: generateAdminNewBookingEmail - Use modernEmailService.sendByStatus()');
  // Adapter implementation
  const content = await generateEmailContentByStatus(reservation, event, reservation.status);
  const html = generateEmailHTML(content, reservation, event);
  return { subject: content.subject, html };
};

// Add more compatibility functions as needed...
```

### Step 4.4: Update High-Traffic Files

**Priority Files** (update first):
1. `src/store/reservationsStore.ts`
2. `src/store/reservationStore.ts`
3. `src/store/waitlistStore.ts`

**Process for each**:
1. Search for old email function calls
2. Replace with modern equivalents
3. Test email sending in dev
4. Commit changes

### Step 4.5: Remove Deprecated Code

**After 2 weeks of monitoring**:
```powershell
Remove-Item "src\services\emailService.DEPRECATED.ts"
```

**Remove compatibility layer** from new emailService.ts

---

## 🎯 Phase 5: Type Safety & Validation (Week 5)

### Step 5.1: Audit Reservation Type

**File**: `src/types/index.ts`

**Check for**:
- Missing fields that exist in UI
- Deprecated fields no longer used
- Type inconsistencies

**Create Audit Report**:
```typescript
// AUDIT.md
# Reservation Type Audit

## Fields Present in Type:
- id: string ✅
- email: string ✅
- dietaryRequirements?: string ✅
- allergies?: string ❌ MISSING
- accessibilityNeeds?: string ❌ MISSING

## Fields in UI but Not Type:
- Allergies field in DetailsStep
- Accessibility field in DetailsStep

## Action Items:
1. Add missing fields to Reservation interface
2. Update validation to include new fields
3. Update database schema if needed
```

### Step 5.2: Add Missing Fields

**Update**: `src/types/index.ts`

```typescript
export interface Reservation {
  // ... existing fields ...
  
  // ✨ NEW: Critical fields for customer experience
  allergies?: string;              // Food allergies (separate from dietary)
  accessibilityNeeds?: string;     // Wheelchair, hearing impaired, etc.
  specialRequests?: string;        // Any other special requests
  
  // ... rest of interface ...
}
```

### Step 5.3: Create Zod Validation Schema

**File**: `src/validation/reservationSchema.ts`

```typescript
import { z } from 'zod';

export const ReservationSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  
  // Contact Info (required)
  email: z.string().email('Ongeldig email adres'),
  phone: z.string().min(10, 'Telefoonnummer te kort'),
  
  // Personal Info
  firstName: z.string().min(1, 'Voornaam verplicht').optional(),
  lastName: z.string().min(1, 'Achternaam verplicht').optional(),
  contactPerson: z.string().min(1, 'Contactpersoon verplicht'),
  
  // Booking Details
  numberOfPersons: z.number().int().min(1).max(50),
  arrangement: z.enum(['Standard', 'Premium', 'BWF', 'BWFM']),
  
  // Special Requirements (ALL OPTIONAL)
  dietaryRequirements: z.string().optional(),
  allergies: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
  specialRequests: z.string().optional(),
  comments: z.string().optional(),
  
  // ... rest of schema ...
}).strict(); // Prevent extra fields

export type ValidatedReservation = z.infer<typeof ReservationSchema>;
```

### Step 5.4: Add Runtime Validation

**In useBookingLogic hook**:
```typescript
import { ReservationSchema } from '../validation/reservationSchema';

const submitBooking = async () => {
  // Validate with Zod before submission
  try {
    const validatedData = ReservationSchema.parse(formData);
    // Continue with submission...
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        errors[err.path[0]] = err.message;
      });
      setLocalErrors(errors);
      return { success: false, error: 'Validatie mislukt' };
    }
  }
};
```

### Step 5.5: Update Backend Validation

**Firestore Rules**: `firestore.rules`

Ensure all new fields are allowed:
```javascript
match /reservations/{reservationId} {
  allow create, update: if request.resource.data.keys().hasAll([
    'id', 'eventId', 'email', 'phone', 'contactPerson', 
    'numberOfPersons', 'arrangement'
  ]) && (
    // Optional fields
    !request.resource.data.keys().hasAny(['allergies']) ||
    request.resource.data.allergies is string
  );
}
```

---

## 🎯 Phase 6: Cleanup & Documentation (Week 6)

### Step 6.1: Remove Archived Files

**Verify archive directory**:
```powershell
Get-ChildItem -Path "archive" -Recurse | Measure-Object
```

**Commit to Git** (before deletion):
```powershell
git add archive/
git commit -m "Archive old component versions before deletion"
```

**After 1 week of monitoring**:
```powershell
Remove-Item -Path "archive" -Recurse -Force
```

### Step 6.2: Update README

**File**: `README.md`

Add section:
```markdown
## 🏗️ Architecture (Updated November 2025)

### Unified Booking Logic
All booking flows (client widget, admin manual booking) use the shared `useBookingLogic` hook located in `src/hooks/useBookingLogic.ts`.

**Benefits**:
- ✅ Single source of truth
- ✅ Consistent validation
- ✅ Easier testing
- ✅ No missing fields

### Component Organization
- **No versioned files**: Use git for versions, not filenames
- **Feature flags**: Toggle features without duplicating files
- **Shared logic**: Extract to hooks/services

### Email System
All emails use the modern template system (`src/services/emailService.ts`).
The old email service was deprecated in November 2025.
```

### Step 6.3: Create Migration Guide for Team

**File**: `MIGRATION_GUIDE_FOR_DEVELOPERS.md`

```markdown
# Developer Migration Guide

## If You're Working on Booking Logic

**Old Way**:
```typescript
const { submitReservation } = useReservationStore();
// Manual validation...
// Manual price calculation...
```

**New Way**:
```typescript
const booking = useBookingLogic({ mode: 'client' });
// Validation automatic
// Price calculation automatic
const result = await booking.submitBooking();
```

## If You're Sending Emails

**Old Way**:
```typescript
import { emailService } from '../services/emailService';
await emailService.sendConfirmationEmail(...);
```

**New Way** (same import, new implementation):
```typescript
import { emailService } from '../services/emailService';
await emailService.sendByStatus(reservation, event);
```

## If You're Adding a Dashboard Widget

Create in `src/components/admin/widgets/YourWidget.tsx`:
```typescript
export const YourWidget: React.FC = () => {
  // Widget implementation
};
```

Then add to `widgets/index.ts` and use in Dashboard.
```

### Step 6.4: Team Training

**Schedule**:
- 1-hour presentation on new architecture
- Live demo of useBookingLogic
- Q&A session
- Code review of first PR using new patterns

**Materials**:
- Slides explaining refactoring
- Live coding demonstration
- Example PRs to reference

### Step 6.5: Monitor Performance

**Metrics to Track**:
- Build time (should be similar or faster)
- Bundle size (should be smaller)
- Runtime performance (should be same or better)
- Error rates (should decrease)

**Tools**:
```powershell
# Bundle size
npm run build
# Check dist/ size

# Performance profiling
# Use Chrome DevTools Performance tab
```

### Step 6.6: Final Git Cleanup

**Squash refactoring commits**:
```powershell
git rebase -i main
# Squash into logical commits
```

**Merge to main**:
```powershell
git checkout main
git merge refactor/unify-codebase
git push origin main
```

---

## 🚨 Troubleshooting Common Issues

### Issue: "Cannot find module useBookingLogic"

**Cause**: Import path incorrect or hook not exported from index

**Fix**:
```typescript
// Check src/hooks/index.ts has:
export { useBookingLogic } from './useBookingLogic';

// Use import:
import { useBookingLogic } from '../hooks';
// OR
import { useBookingLogic } from '../hooks/useBookingLogic';
```

### Issue: Validation Errors Not Showing

**Cause**: Local errors not merged with store errors

**Fix**: In useBookingLogic, ensure:
```typescript
formErrors: { ...reservationStore.formErrors, ...localErrors }
```

### Issue: Price Override Not Working in Admin

**Cause**: adminOverrides.allowPriceOverride not set

**Fix**:
```typescript
const booking = useBookingLogic({
  mode: 'admin',
  adminOverrides: {
    allowPriceOverride: true  // ← Must be true
  }
});
```

### Issue: Emails Still Using Old Service

**Cause**: Compatibility layer being used

**Fix**: Update to new API:
```typescript
// OLD
await emailService.sendConfirmationEmail(reservation, event);

// NEW
await emailService.sendByStatus(reservation, event);
```

### Issue: TypeScript Errors After Dashboard Merge

**Cause**: Widget imports or prop types changed

**Fix**:
1. Check widget interface consistency
2. Update imports from new location
3. Ensure all widget props are typed

---

## 📊 Success Checklist

After full implementation, verify:

### Code Quality
- [ ] No files with "Enhanced", "New", "V2", "V3" in name
- [ ] No duplicate components doing same thing
- [ ] All imports working
- [ ] No TypeScript errors
- [ ] No console errors in dev mode

### Functionality
- [ ] Client booking flow works end-to-end
- [ ] Admin manual booking works end-to-end
- [ ] Dashboard loads with all widgets
- [ ] Operations Control Center functional
- [ ] Emails sending correctly
- [ ] All validation working

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] User acceptance testing done

### Documentation
- [ ] README updated
- [ ] Migration guide created
- [ ] Team trained
- [ ] Architecture documented

### Performance
- [ ] Build time acceptable
- [ ] Bundle size not increased
- [ ] No performance regressions
- [ ] Error rates stable or improved

---

## 📞 Support

If you encounter issues during implementation:

1. **Check**: This guide and REFACTORING_PLAN.md
2. **Search**: Existing code for similar patterns
3. **Review**: Refactoring examples in REFACTORING_EXAMPLES/
4. **Ask**: Team lead or senior developer

---

**Last Updated**: November 21, 2025  
**Maintainer**: Lead Software Architect  
**Status**: Ready for Implementation ✅
