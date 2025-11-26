# 🚀 ADMIN FEATURES - Quick Reference Card

## 📦 New Components

### AdminBookingWizard
```tsx
import { AdminBookingWizard } from './components/admin/AdminBookingWizard';

<AdminBookingWizard onClose={() => {}} onComplete={() => {}} />
```
✅ All client steps | ✅ Customer merge | ✅ Admin override | ✅ Price override

### NoShowModal
```tsx
import { NoShowModal } from './components/admin/NoShowModal';

<NoShowModal isOpen={true} reservation={res} onClose={() => {}} onSuccess={() => {}} />
```
✅ Mark no-show | ✅ Auto-block (2x) | ✅ History tracking

---

## 🛠️ New Service

### noShowService
```tsx
import { noShowService } from './services/noShowService';

await noShowService.markAsNoShow(id, 'Admin', 'reason');
await noShowService.isCustomerBlocked(email);
await noShowService.getNoShowHistory(email);
await noShowService.getNoShowStats();
await noShowService.unblockCustomer(email, 'reason', 'Admin');
```

---

## 🎯 Quick Actions

**Mark No-Show:** Click 🚫 Ban icon → Select reason → Confirm  
**Override Booking:** AdminBookingWizard → Check "Force booking"  
**Merge Customer:** Enter name → Modal appears → Click existing  
**Override Price:** Summary step → Check "Prijs aanpassen"  

---

## ⚙️ Configuration

**No-Show Threshold:** `noShowService.ts` line 20 → `const NO_SHOW_THRESHOLD = 2`  
**Auto-Unblock:** `noShowService.ts` line 21 → `const AUTO_UNBLOCK_AFTER_DAYS = 180`  
**Merge Sensitivity:** `AdminBookingWizard.tsx` line 220 → `< 3`  

---

## 🔍 Test Checklist

- [ ] Mark 2 no-shows → Auto-block  
- [ ] Blocked customer cannot book  
- [ ] Customer merge detection  
- [ ] Admin override fully booked  
- [ ] Price override saves  

---

**All systems ready!** 🎉
