# 💰 Payment Tracking & Expiratie Systeem - Implementatie Plan

**Datum**: 15 November 2025  
**Status**: In Ontwikkeling

## 🎯 Doelstellingen

### 1. Expiratie Tracking
- [ ] Zie welke reserveringen verlopen zijn  
- [ ] Zie welke reserveringen binnenkort verlopen (binnen 7 dagen)
- [ ] Filter op expiratiestatus
- [ ] Automatische waarschuwingen

### 2. Betalingsstatus Management
- [ ] **Betaaltermijn**: 1 week voor voorstelling = deadline
- [ ] **Payment Status Calculator**: 
  - `unpaid` - Nog geen betalingen
  - `partial` - Deelbetaling ontvangen
  - `paid` - Volledig betaald
  - `overdue` - Te laat met betalen
- [ ] **Deelbetalingen**: 
  - Arrangement apart kunnen markeren
  - Merchandise apart kunnen markeren
  - Restbedrag live tracking
- [ ] Opmerkingen per betaling
- [ ] Betalingsgeschiedenis per reservering

### 3. Restitutie Systeem
- [ ] Restitutie aanmaken met reden
- [ ] Partial refunds mogelijk
- [ ] Restit

utie geschiedenis
- [ ] Maandrapportage exporteren

## 📊 Data Structuur

### Payment (bestaat al in types/index.ts)
```typescript
interface Payment {
  id: string;
  amount: number;
  date: Date;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  processedBy?: string;
  // 🆕 NIEUWE VELDEN:
  category?: 'arrangement' | 'merchandise' | 'full' | 'other';
}
```

### Refund (bestaat al)
```typescript
interface Refund {
  id: string;
  amount: number;
  date: Date;
  reason: RefundReason;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  processedBy?: string;
}
```

### Berekende Status
```typescript
interface PaymentSummary {
  totalPrice: number;
  totalPaid: number;
  totalRefunded: number;
  balance: number; // totalPrice - totalPaid + totalRefunded
  status: 'unpaid' | 'partial' | 'paid' | 'overpaid' | 'overdue';
  dueDate: Date;
  daysUntilDue: number;
  isOverdue: boolean;
  payments: Payment[];
  refunds: Refund[];
}
```

## 🏗️ Implementatie Fases

### FASE 1: Betalingsstatus Calculator ✅ (NU)
**Locatie**: `src/components/admin/ReservationsDashboard.tsx`

**Functies**:
1. `calculatePaymentSummary(reservation)` - Bereken volledige betalingsstatus
2. `getPaymentStatus(summary)` - Bepaal status badge (color, text)
3. Payment display in reservation detail modal

**UI Components**:
- Payment status badge in reservation card
- Detailed payment summary in detail modal
- Payment timeline/history

### FASE 2: Expiratie Tracking & Warnings
**Nieuwe filters**:
- "Verloopt Binnenkort" (binnen 7 dagen)
- "Verlopen" (past expiry date)

**Warnings**:
- Dashboard widget: aantal verlopende reserveringen
- Orange badge op reservering cards
- Email notifications (optioneel)

### FASE 3: Betalings Management Modal
**Features**:
- Button: "Betaling Registreren"
- Modal met form:
  - Bedrag
  - Categorie (Arrangement / Merchandise / Volledig / Anders)
  - Methode
  - Referentie
  - Opmerking
- Live restbedrag calculator
- Payment history list

### FASE 4: Restitutie Systeem
**Features**:
- Button: "Restitutie Aanmaken"
- Modal met form:
  - Bedrag
  - Reden (dropdown)
  - Methode
  - Opmerking (verplicht!)
- Refund history
- Monthly report export

### FASE 5: Rapportages
**Export functies**:
- Maandoverzicht restituties (CSV/Excel)
- Betalingsoverzicht per periode
- Outstanding payments report

## 🎨 UI Design

### Payment Status Badge Colors
```
🔴 Unpaid / Overdue - Red
🟡 Partial - Yellow/Orange  
🟢 Paid - Green
🔵 Overpaid - Blue
⚪ No Due Date - Gray
```

### Detail Modal Sections
1. **Betalingsstatus** (top, prominent)
   - Total Due
   - Total Paid
   - Balance
   - Status badge
   - Days until/past due

2. **Betalingsgeschiedenis**
   - Table met alle payments
   - Datum, Bedrag, Methode, Categorie, Referentie

3. **Restituties**
   - Table met alle refunds
   - Datum, Bedrag, Reden, Opmerking

4. **Acties**
   - [+ Betaling Registreren]
   - [↩ Restitutie Aanmaken]

## 📅 Timeline

- **Week 1**: FASE 1 & 2 (Calculator + Expiratie)
- **Week 2**: FASE 3 (Payment Management)
- **Week 3**: FASE 4 & 5 (Restitutie + Rapportage)

## ✅ Acceptatie Criteria

- [ ] Elke reservering toont correcte betalingsstatus
- [ ] Deelbetalingen worden correct getracked (arrangement vs merchandise)
- [ ] Overdue warnings zijn zichtbaar
- [ ] Payment modal werkt en update storage
- [ ] Refund modal werkt en update storage
- [ ] Maandrapport kan geëxporteerd worden
- [ ] Alle wijzigingen worden gelogd (audit trail)

---

**Next Steps**: Begin met FASE 1 implementatie
