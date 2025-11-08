# 🎉 EMAIL SYSTEEM - PHASE 2 UPDATE

**Datum**: 6 November 2025  
**Status**: ✅ **BACKEND + CORE UI COMPLEET**  
**Build Status**: ✅ **PASSED**

---

## ✅ NIEUWE COMPONENTEN TOEGEVOEGD

### **1. EmailHistoryTimeline.tsx** ✅
**Location:** `src/components/admin/EmailHistoryTimeline.tsx`

**Features:**
- ✅ Visual timeline met verticale lijn
- ✅ Status indicators per email:
  - 🟢 Verzonden (groen)
  - 🔴 Mislukt (rood)
  - 🟡 In behandeling (geel)
- ✅ Email details per entry:
  - Type (Bevestiging, Status Update, Herinnering, etc.)
  - Ontvanger (email + naam)
  - Timestamp
  - Manual/Automatic trigger
  - Verzonden door (admin naam)
- ✅ Email preview modal
  - Volledige email details
  - Subject, Van, Naar, Timestamp
  - Preview van email content
  - Error message (bij failed emails)
- ✅ Retry button voor failed emails
- ✅ Loading state en empty state
- ✅ Auto-fetch from Firestore (via emailService.getEmailHistory)

**Props:**
```typescript
{
  reservationId?: string;        // Fetch logs for reservation
  waitlistEntryId?: string;      // Fetch logs for waitlist entry
  emailLogs?: EmailLog[];        // Or provide logs directly
  onRetry?: (log) => void;       // Callback for retry button
}
```

**Usage:**
```tsx
<EmailHistoryTimeline 
  reservationId={reservation.id}
  onRetry={(log) => handleRetryEmail(log)}
/>
```

---

### **2. ManualEmailModal.tsx** ✅
**Location:** `src/components/admin/ManualEmailModal.tsx`

**Features:**
- ✅ Modal interface voor manual email sending
- ✅ Email type selection:
  - Bevestigingsmail (volledig met QR code)
  - Herinnering
  - Status Update
- ✅ Recipient info display:
  - Naam, Email, Reservering ID
- ✅ Two-step confirmation:
  1. Select type → Preview & Bevestig
  2. Bevestig → Verstuur Email
- ✅ Warning message (klant wordt direct gemaild)
- ✅ Loading states tijdens versturen
- ✅ Success/Error feedback
- ✅ Auto-close na success (2 seconden)
- ✅ Disabled state tijdens verzenden

**Props:**
```typescript
{
  reservation: Reservation;      // Reservation to send email for
  event: Event;                  // Event details
  isOpen: boolean;               // Modal visibility
  onClose: () => void;           // Close handler
  onSuccess?: () => void;        // Success callback
}
```

**Usage:**
```tsx
const [showEmailModal, setShowEmailModal] = useState(false);

<ManualEmailModal
  reservation={reservation}
  event={event}
  isOpen={showEmailModal}
  onClose={() => setShowEmailModal(false)}
  onSuccess={() => {
    // Refresh email history
    loadEmailHistory();
  }}
/>
```

---

### **3. waitlistTokenService.ts** ✅
**Location:** `src/services/waitlistTokenService.ts`

**Features:**
- ✅ Secure token generation (32 char nanoid)
- ✅ Token validation (check expired, used, exists)
- ✅ Token usage tracking
- ✅ Token cancellation
- ✅ Expired token cleanup
- ✅ Booking link generation

**Functions:**

#### `generateWaitlistToken()`
```typescript
await waitlistTokenService.generateWaitlistToken(
  waitlistEntryId: string,
  eventId: string,
  numberOfPersons: number,
  expiresInHours: number = 24
);

// Returns: WaitlistBookingToken
// - Saves to Firestore waitlistTokens collection
// - Token expires after specified hours (default 24)
```

#### `validateWaitlistToken()`
```typescript
const validation = await waitlistTokenService.validateWaitlistToken(token);

if (validation.valid) {
  // Token is valid, show booking form
  const tokenData = validation.token;
} else {
  // Show error: validation.reason
}

// Checks:
// - Token exists
// - Not already used
// - Not expired
```

#### `useWaitlistToken()`
```typescript
await waitlistTokenService.useWaitlistToken(
  tokenId: string,
  reservationId: string
);

// Marks token as used
// Links to reservation
// Cannot be used again
```

#### `generateBookingLink()`
```typescript
const link = waitlistTokenService.generateBookingLink(token);
// Returns: https://your-domain.com/book-from-waitlist?token=xxx
```

#### `cleanupExpiredTokens()`
```typescript
const deleted = await waitlistTokenService.cleanupExpiredTokens();
// Deletes all expired & unused tokens
// Returns number of deleted tokens
// Run periodically (cron job)
```

---

## 📊 FIRESTORE COLLECTION: waitlistTokens

```typescript
{
  id: auto,
  token: string (32 chars, unique),    // Secure random token
  waitlistEntryId: string,             // Link to waitlist entry
  eventId: string,                     // Event they want to book
  numberOfPersons: number,             // How many people
  createdAt: timestamp,                // When token was created
  expiresAt: timestamp,                // When token expires (24h)
  used: boolean,                       // Has token been used?
  usedAt?: timestamp,                  // When was it used
  reservationId?: string               // Reservation created from token
}
```

**Indexes Needed:**
```
- token (unique) - for fast validation
- expiresAt - for cleanup queries
- used - for filtering
- waitlistEntryId - for tracking
```

---

## 🎯 IMPLEMENTATIE STATUS

### ✅ **COMPLEET (Phase 1 & 2):**
1. ✅ Email type system (EmailLog, EmailSettings, EmailTemplate, etc.)
2. ✅ Email service functionaliteit (logging, toggles, templates)
3. ✅ Config store integration (updateEmailSettings)
4. ✅ EmailToggleSettings component (admin UI)
5. ✅ EmailHistoryTimeline component (email timeline)
6. ✅ ManualEmailModal component (resend emails)
7. ✅ waitlistTokenService (secure booking tokens)
8. ✅ Build test passed (no compile errors)

### 🔜 **NOG TE DOEN (Integratie):**
1. 🔜 Integreer EmailToggleSettings in ConfigEditor
2. 🔜 Integreer EmailHistoryTimeline + ManualEmailModal in ReservationDetailModal
3. 🔜 Update WaitlistManager met notify buttons
4. 🔜 Maak WaitlistBookingPage (booking via token link)
5. 🔜 Auto-notify logic bij annulering
6. 🔜 Test end-to-end flow

---

## 💻 HOW TO USE (Voor Developers)

### **Email History Timeline**

In ReservationDetailModal:
```tsx
import { EmailHistoryTimeline } from '../EmailHistoryTimeline';

<EmailHistoryTimeline 
  reservationId={reservation.id}
  onRetry={async (log) => {
    // Open ManualEmailModal to resend
    setShowEmailModal(true);
  }}
/>
```

### **Manual Email Sending**

In ReservationDetailModal:
```tsx
import { ManualEmailModal } from '../ManualEmailModal';

const [showEmailModal, setShowEmailModal] = useState(false);

// Button to open modal
<button onClick={() => setShowEmailModal(true)}>
  📧 Verstuur Email
</button>

// Modal
<ManualEmailModal
  reservation={reservation}
  event={event}
  isOpen={showEmailModal}
  onClose={() => setShowEmailModal(false)}
  onSuccess={() => {
    // Refresh email timeline
    // Show success message
  }}
/>
```

### **Waitlist Token Flow**

#### **Step 1: Generate Token (When notifying waitlist)**
```typescript
import { waitlistTokenService } from '../services/waitlistTokenService';
import { emailService } from '../services/emailService';

// Generate token
const token = await waitlistTokenService.generateWaitlistToken(
  waitlistEntry.id,
  event.id,
  waitlistEntry.numberOfPersons
);

// Generate link
const bookingLink = waitlistTokenService.generateBookingLink(token.token);

// Send email with link
await emailService.sendWaitlistSpotAvailable(
  waitlistEntry,
  event,
  token.token
);

// Update waitlist entry
await updateDoc(doc(db, 'waitlistEntries', waitlistEntry.id), {
  status: 'contacted',
  contactedAt: serverTimestamp()
});
```

#### **Step 2: Validate Token (In WaitlistBookingPage)**
```typescript
// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Validate
const validation = await waitlistTokenService.validateWaitlistToken(token);

if (!validation.valid) {
  // Show error page
  return <ErrorPage message={validation.reason} />;
}

// Token is valid - show booking form
const tokenData = validation.token;
```

#### **Step 3: Use Token (After successful booking)**
```typescript
// Create reservation
const reservation = await createReservation({
  ...bookingData,
  source: 'waitlist',
  waitlistEntryId: tokenData.waitlistEntryId
});

// Mark token as used
await waitlistTokenService.useWaitlistToken(
  tokenData.id!,
  reservation.id
);

// Remove from waitlist
await deleteDoc(doc(db, 'waitlistEntries', tokenData.waitlistEntryId));

// Send confirmation email
await emailService.sendReservationConfirmation(reservation, event);
```

---

## 🧪 TESTING CHECKLIST

### **EmailHistoryTimeline:**
- [ ] Shows loading state while fetching
- [ ] Displays timeline correctly with all emails
- [ ] Status icons correct (green/red/yellow)
- [ ] Preview modal opens and shows details
- [ ] Retry button visible for failed emails
- [ ] Empty state shows when no emails

### **ManualEmailModal:**
- [ ] Modal opens and closes correctly
- [ ] All 3 email types selectable
- [ ] Recipient info displayed correctly
- [ ] Two-step confirmation works
- [ ] Loading state during send
- [ ] Success message shows and auto-closes
- [ ] Error message displays if send fails

### **waitlistTokenService:**
- [ ] Token generates with correct expiry
- [ ] Token saves to Firestore
- [ ] Validation returns correct for valid token
- [ ] Validation fails for expired token
- [ ] Validation fails for used token
- [ ] Validation fails for non-existent token
- [ ] Using token marks it as used
- [ ] Cannot use same token twice
- [ ] Booking link generates correctly
- [ ] Cleanup deletes expired tokens

---

## 📦 DEPENDENCIES

**New:**
- `nanoid` - Secure random ID generation voor tokens

**Install if not present:**
```bash
npm install nanoid
```

---

## 🚀 NEXT STEPS

### **Priority 1: Integration (2-3 uur)**
1. Voeg EmailToggleSettings toe aan ConfigEditor tabs
2. Voeg EmailHistoryTimeline + manual button toe aan ReservationDetailModal
3. Test integration

### **Priority 2: Waitlist Manager (2-3 uur)**
1. Voeg "Notify" button toe aan WaitlistManager per entry
2. Voeg bulk "Notify Top X" functie toe
3. Show email status column in waitlist table
4. Test notify flow

### **Priority 3: WaitlistBookingPage (3-4 uur)**
1. Create new page component
2. Token validation on load
3. Pre-filled booking form
4. Submit → create reservation + use token
5. Error handling voor invalid/expired tokens
6. Success page redirect

### **Priority 4: Auto-notify Logic (1-2 uur)**
1. Bij cancellation: check waitlist
2. Show prompt: "Notify waitlist? (X people waiting)"
3. If yes: generate tokens + send emails
4. Update waitlist entries

---

**Totale tijd geschat:** 8-12 uur voor complete implementatie

**Status:** 
- Backend: ✅ 100%
- Components: ✅ 100%
- Services: ✅ 100%
- Integration: 🔜 0%

**Next Session:** Start met ReservationDetailModal integration

