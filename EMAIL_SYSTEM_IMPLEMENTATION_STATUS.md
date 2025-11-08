# 📧 Email System Implementation - Progress Report

## ✅ VOLTOOID (Phase 1 - Backend)

### 1. **Type Definitions** ✅
- ✅ `src/types/email.ts` - Complete email types
  - EmailLog, EmailSettings, EmailTypeToggles
  - EmailTemplate, EmailType, EmailTrigger, EmailStatus
  - WaitlistBookingToken
  
- ✅ `src/types/index.ts` - Type exports en integraties
  - EmailLog toegevoegd aan Reservation
  - EmailLog toegevoegd aan WaitlistEntry
  - EmailSettings toegevoegd aan GlobalConfig

### 2. **Email Service** ✅
- ✅ `checkEmailEnabled()` - Check global en per-type toggles
- ✅ `logEmailSent()` - Log emails naar Firestore emailLogs collection
- ✅ `sendEmailViaCloudFunction()` - Updated met logging parameters
- ✅ `generateWaitlistConfirmationEmail()` - Template voor wachtlijst bevestiging
- ✅ `emailService.sendWaitlistConfirmation()` - Send waitlist confirmation
- ✅ `emailService.sendManualEmail()` - Admin manual email trigger
- ✅ `emailService.getEmailHistory()` - Fetch email logs voor reservation
- ✅ `emailService.checkEmailsEnabled()` - Public API voor toggle check

**Email Templates:**
- ✅ Waitlist confirmation (mooi styled met theater branding)
- ✅ Waitlist availability (al bestaand in service)
- ✅ Reservation confirmation (updated met logging)

### 3. **Config Store** ✅
- ✅ `updateEmailSettings()` - Update email toggles
- ✅ Track lastDisabledAt, disabledBy, enabledAt, enabledBy
- ✅ Default email settings (all enabled)

---

## 🚧 NOG TE DOEN (Phase 2 - UI & Integration)

### 4. **Waitlist Token System** 🔜
**File:** `src/services/waitlistTokenService.ts` (nieuw)

```typescript
// Token management voor secure waitlist booking links
generateWaitlistToken(waitlistEntryId, eventId, expiresInHours)
validateWaitlistToken(token)
useWaitlistToken(token, reservationId)
cleanupExpiredTokens()
```

**Firestore Collection:** `waitlistTokens`
- token (string, indexed)
- waitlistEntryId
- eventId
- numberOfPersons
- createdAt, expiresAt
- used (boolean)
- usedAt, reservationId

### 5. **UI Components** 🔜

#### A. EmailToggleSettings.tsx
**Location:** `src/components/admin/config/EmailToggleSettings.tsx`

**Features:**
- Global master toggle
- Individual toggles per email type
- Warning banner when disabled
- Auto-reminder when emails disabled > 2 hours
- Save/Cancel buttons

#### B. EmailHistoryTimeline.tsx
**Location:** `src/components/admin/EmailHistoryTimeline.tsx`

**Features:**
- Visual timeline van sent emails
- Status indicators (✅ sent, ❌ failed, ⏳ pending)
- Email preview on click
- Retry button voor failed emails
- Filter by type

#### C. ManualEmailModal.tsx
**Location:** `src/components/admin/ManualEmailModal.tsx`

**Features:**
- Dropdown: Confirmation, Reminder, Status Update
- Preview button
- Confirmation dialog
- Success/error feedback

### 6. **Integrate UI Components** 🔜

#### A. ReservationDetailModal
**File:** `src/components/admin/ReservationDetailModal.tsx`

**Add:**
- Email Actions section met dropdown
- EmailHistoryTimeline component
- Manual send button → ManualEmailModal

#### B. ConfigEditor
**File:** `src/components/admin/ConfigEditor.tsx`

**Add:**
- EmailToggleSettings tab
- Show warning banner in header if emails disabled

#### C. WaitlistManager
**File:** `src/components/admin/WaitlistManager.tsx` (of waar deze leeft)

**Add:**
- "Notify Available" button per entry
- Bulk "Notify Top X" button
- Email status column

### 7. **Waitlist Booking Page** 🔜
**File:** `src/pages/WaitlistBookingPage.tsx` (nieuw)

**Route:** `/book-from-waitlist?token=xxx`

**Flow:**
1. Parse token from URL
2. Validate token (call waitlistTokenService)
3. If valid: Show pre-filled booking form
4. Allow selection: Arrangement, Add-ons
5. Submit → Create reservation
6. Use token (mark as used)
7. Remove from waitlist
8. Send confirmation email
9. Redirect to success page

### 8. **Reservation Store Integration** 🔜
**File:** `src/store/reservationStore.ts`

**Add:**
```typescript
sendManualEmail: async (reservationId, emailType, adminUsername) => {
  // Call emailService.sendManualEmail()
  // Update reservation.emailLog
  // Show success toast
}

getEmailHistory: async (reservationId) => {
  // Call emailService.getEmailHistory()
  // Return logs
}
```

### 9. **Waitlist Store Integration** 🔜
**File:** `src/store/waitlistStore.ts` (of waar deze leeft)

**Add:**
```typescript
sendWaitlistConfirmation: async (entryId, eventId) => {
  // Call emailService.sendWaitlistConfirmation()
  // Update entry.emailLog
}

notifyAvailability: async (entryId, eventId) => {
  // Generate token
  // Call emailService.sendWaitlistSpotAvailable()
  // Update entry status = 'contacted'
  // Update entry.contactedAt
}

notifyTopX: async (eventId, numberOfSpots) => {
  // Get top X waitlist entries
  // For each: call notifyAvailability()
  // Show progress/success feedback
}
```

---

## 📊 IMPLEMENTATIE VOLGORDE

### **Week 1: Core Functionality** ✅
- [x] Email types
- [x] Email service updates
- [x] Config store updates
- [x] Email templates

### **Week 2: UI Components** 🔜
1. EmailToggleSettings.tsx
2. EmailHistoryTimeline.tsx
3. ManualEmailModal.tsx
4. Integrate in ConfigEditor
5. Integrate in ReservationDetailModal

### **Week 3: Waitlist Integration** 🔜
1. waitlistTokenService.ts
2. WaitlistBookingPage.tsx
3. Integrate in WaitlistManager
4. Update waitlist store with email functions
5. Test end-to-end flow

### **Week 4: Testing & Polish** 🔜
1. Test all email types
2. Test toggles
3. Test manual resend
4. Test waitlist flow
5. Test token expiry
6. Documentation

---

## 🔥 QUICK WINS (Volgende stappen)

### **Meteen Bruikbaar:**
1. `emailService.sendWaitlistConfirmation()` - Kan nu al gebruikt worden!
2. `emailService.checkEmailsEnabled()` - Email check API ready
3. `configStore.updateEmailSettings()` - Toggle API ready

### **Snelle UI Toevoegingen:**
1. Email toggle in admin config (1 uur)
2. Manual resend button in reservation detail (2 uur)
3. Wachtlijst notification button (1 uur)

### **Complex maar Waardevol:**
1. Email history timeline (4 uur)
2. Waitlist booking token system (6 uur)
3. Waitlist booking page (4 uur)

---

## 📝 FIRESTORE COLLECTIONS

### **Nieuwe Collections:**

#### `emailLogs`
```
{
  id: auto,
  reservationId?: string,
  waitlistEntryId?: string,
  type: EmailType,
  recipientEmail: string,
  sentAt: timestamp,
  trigger: 'automatic' | 'manual',
  sentBy?: string,
  status: 'sent' | 'failed' | 'pending',
  errorMessage?: string,
  emailSubject?: string,
  emailPreview?: string
}
```

**Indexes Needed:**
- reservationId (for quick lookup)
- waitlistEntryId (for quick lookup)
- sentAt (for chronological sorting)

#### `waitlistTokens`
```
{
  id: auto,
  token: string (unique, indexed),
  waitlistEntryId: string,
  eventId: string,
  numberOfPersons: number,
  createdAt: timestamp,
  expiresAt: timestamp (24h from created),
  used: boolean,
  usedAt?: timestamp,
  reservationId?: string
}
```

**Indexes Needed:**
- token (unique, for fast validation)
- expiresAt (for cleanup cron job)
- used (for filtering)

---

## 🎯 BUSINESS VALUE

### **Meteen:**
- ✅ Wachtlijst confirmation emails (customer satisfaction)
- ✅ Email logging (audit trail)
- ✅ Email toggles (admin control during migrations)

### **Volgende Week:**
- Handmatige email resend (support team efficiency)
- Email geschiedenis zien (transparency)
- Wachtlijst availability notifications (convert waitlist → bookings)

### **Later:**
- Complete waitlist automation (reduce manual work)
- Email analytics (open rate, click rate)
- Bulk email operations (marketing)

---

**Status:** Backend 100% ✅ | UI 0% 🔜 | Integration 0% 🔜
**Next Action:** Create EmailToggleSettings.tsx
**Estimated Time to MVP:** 12-16 hours (spread over 2-3 days)

