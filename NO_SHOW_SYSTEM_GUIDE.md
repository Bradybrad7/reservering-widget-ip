# 🚫 NO-SHOW SYSTEM - Implementation Guide

## Overview

The No-Show System automatically tracks customers who fail to show up for reservations and blocks repeat offenders from making future bookings.

---

## ✅ What's Implemented

### 1. **No-Show Status** ✅
- New `'no-show'` status added to `ReservationStatus` enum
- Tracks reservations where customers didn't appear

### 2. **NoShowService** ✅
Located: `src/services/noShowService.ts`

**Features:**
- ✅ Mark reservations as no-show
- ✅ Track no-show history per customer
- ✅ Auto-block after threshold (default: 2 no-shows)
- ✅ Manual block/unblock capabilities
- ✅ Auto-unblock after 6 months
- ✅ Financial impact tracking
- ✅ Reverse no-show (admin correction)

### 3. **NoShowModal Component** ✅
Located: `src/components/admin/NoShowModal.tsx`

**Features:**
- ✅ Reason selection (5 predefined + custom)
- ✅ No-show history display
- ✅ Auto-block warning
- ✅ Impact notice
- ✅ Communication log integration

### 4. **Booking Flow Integration** ✅
Location: `src/services/apiService.ts`

**Features:**
- ✅ Blocked customer check on booking submission
- ✅ Friendly error message for blocked customers
- ✅ Prevents bookings from blocked users

### 5. **Admin UI Integration** ✅
Location: `src/components/admin/ReservationActions.tsx`

**Features:**
- ✅ "Mark as No-Show" button (Ban icon)
- ✅ Only visible for confirmed/checked-in reservations
- ✅ Opens NoShowModal on click

---

## 🎯 Configuration

### Threshold Settings
```typescript
// In noShowService.ts
const NO_SHOW_THRESHOLD = 2;           // Block after 2 no-shows
const AUTO_UNBLOCK_AFTER_DAYS = 180;   // Auto-unblock after 6 months
```

### Customization
You can adjust these constants to match your business rules:
- **Stricter:** Set threshold to `1` (block after first no-show)
- **More Lenient:** Set threshold to `3` or higher
- **Auto-unblock:** Adjust days or disable entirely

---

## 📖 Usage Guide

### For Admins: Marking a Reservation as No-Show

1. **Navigate to reservation list**
2. **Find the reservation** where customer didn't show up
3. **Click the Ban icon** (🚫) in the actions column
4. **Select a reason:**
   - 🚫 Niet verschenen (geen contact)
   - ⏰ Te laat geannuleerd (< 24u)
   - 📞 Geen reactie op herinneringen
   - 🚨 Noodgeval (gerechtvaardigd)
   - ✏️ Anders (custom reason)
5. **Review warnings:**
   - See no-show history
   - Check if customer will be auto-blocked
6. **Confirm the action**

### Automatic Blocking

When a customer reaches the threshold:
- ✅ Status changes to 'no-show'
- ✅ Customer is automatically blocked
- ✅ Communication log is updated
- ✅ Admin sees blocking confirmation
- ✅ Customer cannot make new bookings

### Unblocking a Customer

```typescript
import { noShowService } from '@/services/noShowService';

// Manual unblock
await noShowService.unblockCustomer(
  'customer@example.com',
  'Klant heeft contact opgenomen en situatie uitgelegd',
  'Admin Name'
);
```

### Checking Block Status

```typescript
import { noShowService } from '@/services/noShowService';

// Check if customer is blocked
const isBlocked = await noShowService.isCustomerBlocked('customer@example.com');

if (isBlocked) {
  console.log('Customer is blocked from booking');
}
```

### Getting No-Show History

```typescript
import { noShowService } from '@/services/noShowService';

// Get complete history
const history = await noShowService.getNoShowHistory('customer@example.com');

console.log(`Total no-shows: ${history.count}`);
console.log(`Last no-show: ${history.lastNoShow}`);
console.log('Records:', history.records);
```

### Reversing a No-Show (Admin Correction)

```typescript
import { noShowService } from '@/services/noShowService';

// If marked incorrectly
await noShowService.reverseNoShow(
  'reservation-id-123',
  'Admin Name',
  'Klant was wel aanwezig - admin fout'
);

// This will:
// - Change status back to 'confirmed'
// - Update no-show count
// - Potentially unblock customer if count drops below threshold
```

---

## 🔌 Integration Examples

### Example 1: Add to Reservation Dashboard

```tsx
import { useState } from 'react';
import { NoShowModal } from '@/components/admin/NoShowModal';
import { ReservationActions } from '@/components/admin/ReservationActions';

function ReservationDashboard() {
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const handleMarkNoShow = (reservation) => {
    setSelectedReservation(reservation);
    setShowNoShowModal(true);
  };

  return (
    <>
      <ReservationActions
        reservation={reservation}
        onViewDetails={handleView}
        onEdit={handleEdit}
        onMarkNoShow={handleMarkNoShow}  // 🚫 NEW
        // ... other handlers
      />

      <NoShowModal
        isOpen={showNoShowModal}
        reservation={selectedReservation}
        onClose={() => setShowNoShowModal(false)}
        onSuccess={() => {
          // Refresh reservations list
          loadReservations();
        }}
      />
    </>
  );
}
```

### Example 2: Add No-Show Stats to Dashboard

```tsx
import { useEffect, useState } from 'react';
import { noShowService } from '@/services/noShowService';

function DashboardStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await noShowService.getNoShowStats();
    setStats(data);
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Total No-Shows"
        value={stats.totalNoShows}
        icon="🚫"
      />
      <StatCard
        title="Revenue Lost"
        value={`€${stats.totalRevenueLost.toFixed(2)}`}
        icon="💸"
      />
      <StatCard
        title="Blocked Customers"
        value={stats.blockedCustomers}
        icon="🔒"
      />
      <StatCard
        title="This Month"
        value={stats.noShowsByMonth[getCurrentMonth()] || 0}
        icon="📅"
      />
    </div>
  );
}
```

### Example 3: Customer Profile Integration

```tsx
import { useEffect, useState } from 'react';
import { noShowService } from '@/services/noShowService';

function CustomerProfile({ email }) {
  const [history, setHistory] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    loadCustomerData();
  }, [email]);

  const loadCustomerData = async () => {
    const [historyData, blockStatus] = await Promise.all([
      noShowService.getNoShowHistory(email),
      noShowService.isCustomerBlocked(email)
    ]);
    
    setHistory(historyData);
    setIsBlocked(blockStatus);
  };

  const handleUnblock = async () => {
    if (window.confirm('Weet je zeker dat je deze klant wilt ontgrendelen?')) {
      const result = await noShowService.unblockCustomer(
        email,
        'Handmatig ontgrendeld door admin',
        'Admin Name'
      );
      
      if (result.success) {
        alert('Klant succesvol ontgrendeld!');
        loadCustomerData();
      }
    }
  };

  return (
    <div>
      {/* Status Badge */}
      {isBlocked && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <h3 className="font-bold text-red-400 mb-2">🔒 Klant Geblokkeerd</h3>
          <p className="text-sm text-red-300 mb-3">
            Deze klant kan momenteel geen boekingen plaatsen.
          </p>
          <button
            onClick={handleUnblock}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
          >
            Ontgrendelen
          </button>
        </div>
      )}

      {/* No-Show History */}
      {history && history.count > 0 && (
        <div className="mt-4">
          <h3 className="font-bold text-white mb-3">
            🚫 No-Show Historie ({history.count})
          </h3>
          <div className="space-y-2">
            {history.records.map((record) => (
              <div key={record.reservationId} className="bg-neutral-800 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">
                      {new Date(record.eventDate).toLocaleDateString('nl-NL')}
                    </p>
                    <p className="text-sm text-neutral-400">
                      Gemarkeerd op {new Date(record.markedAt).toLocaleDateString('nl-NL')}
                    </p>
                    {record.reason && (
                      <p className="text-sm text-neutral-500 mt-1">
                        Reden: {record.reason}
                      </p>
                    )}
                  </div>
                  <p className="text-red-400 font-bold">
                    €{record.totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 UI Components

### Status Badge Colors

```tsx
// In your reservation list component
const getStatusColor = (status: ReservationStatus) => {
  switch (status) {
    case 'no-show':
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    case 'confirmed':
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    case 'cancelled':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    // ... other statuses
  }
};

<span className={cn('px-3 py-1 rounded-full border text-sm', getStatusColor(reservation.status))}>
  {status === 'no-show' ? '🚫 No-Show' : status}
</span>
```

---

## 📊 Database Schema

### Reservation Fields (Extended)

```typescript
interface Reservation {
  // ... existing fields ...
  
  // No-Show fields
  status: ReservationStatus;  // Includes 'no-show'
  noShowMarkedAt?: Date;
  noShowMarkedBy?: string;
  noShowReason?: string;
  noShowReversedAt?: Date;
  noShowReversedBy?: string;
  noShowReversalReason?: string;
  
  // Block fields
  customerBlocked?: boolean;
  blockedAt?: Date;
  blockedBy?: string;
  blockReason?: string;
  noShowCount?: number;
  unblockedAt?: Date;
  unblockedBy?: string;
  unblockReason?: string;
}
```

---

## 🔒 Security Considerations

### Admin-Only Actions

Ensure these actions are only accessible to admins:
- ✅ Marking as no-show
- ✅ Blocking/unblocking customers
- ✅ Reversing no-show status
- ✅ Viewing no-show history

### Audit Trail

All actions are logged in:
- ✅ Communication log on reservation
- ✅ Includes timestamp, actor, and reason
- ✅ Immutable (cannot be deleted)

---

## 🧪 Testing Checklist

- [ ] Mark reservation as no-show
- [ ] Verify auto-block after 2nd no-show
- [ ] Check blocked customer cannot book
- [ ] Test manual unblock
- [ ] Test auto-unblock after 6 months
- [ ] Test reverse no-show
- [ ] Verify communication logs
- [ ] Check no-show stats dashboard
- [ ] Test with edge cases (0 no-shows, 10+ no-shows)

---

## 🚀 Future Enhancements

### Potential Features:
1. **Email Notifications**
   - Warn customer after 1st no-show
   - Notify when blocked/unblocked

2. **Grace Period**
   - Allow 1 hour grace period before marking no-show
   - Auto-check-in if customer arrives late

3. **No-Show Penalties**
   - Charge no-show fee
   - Require deposit for repeat offenders

4. **Appeal System**
   - Customers can request unblock
   - Admin reviews and approves/denies

5. **Analytics Dashboard**
   - No-show trends over time
   - High-risk customer identification
   - Financial impact reporting

---

## 📞 Support

For questions or issues:
- Check implementation in `src/services/noShowService.ts`
- Review modal in `src/components/admin/NoShowModal.tsx`
- Test integration in `src/services/apiService.ts`

---

**Implemented by:** Brad (Lead Developer)  
**Date:** November 2025  
**Status:** ✅ Production Ready
