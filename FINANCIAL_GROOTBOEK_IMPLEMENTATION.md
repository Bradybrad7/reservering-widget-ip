# 💰 Financieel Grootboek Systeem - Implementation Guide

**Datum:** 12 november 2025  
**Status:** 🚧 Deel 1 & 2 Compleet - Deel 3 In Progress

---

## 🎯 Overzicht

Het **Financiële Grootboek Systeem** transformeert de admin van een simpel "betaald/niet betaald" systeem naar een volledig audit-proof grootboek met gescheiden payments en refunds tracking.

### De Drie Pijlers

1. **✅ DEEL 1: Betalingen Grootboek** - Van status naar transactie-geschiedenis
2. **✅ DEEL 2: Restitutie Systeem** - Formele registratie van terugbetalingen  
3. **🚧 DEEL 3: Archief met Financials** - Onveranderbaar bewijs

---

## ✅ DEEL 1: Het Betalingen Grootboek

### Data Model Updates (`src/types/index.ts`)

#### Nieuwe Types

```typescript
// Payment - Inkomende betalingen
export interface Payment {
  id: string;              // "pay_123"
  amount: number;          // Altijd positief
  date: Date;             // Betaaldatum
  method: PaymentMethod;  // iDEAL, Bank, Pin, etc.
  reference?: string;      // Transactie-ID
  note?: string;          // Interne notitie
  processedBy?: string;   // Admin naam
}

// Payment Methods
export type PaymentMethod = 
  | 'ideal' 
  | 'bank_transfer' 
  | 'pin' 
  | 'cash' 
  | 'invoice' 
  | 'voucher' 
  | 'other';
```

#### Reservation Type Updates

```typescript
export interface Reservation extends CustomerFormData {
  // ... bestaande velden ...
  
  // 💰 HET GROOTBOEK
  payments: Payment[];              // Alle inkomende betalingen
  refunds: Refund[];                // Alle uitgaande restituties
  
  // DEPRECATED (behouden voor backward compatibility)
  paymentStatus?: PaymentStatus;
  paymentTransactions?: PaymentTransaction[];
}
```

### Helper Functions (`src/utils/financialHelpers.ts`)

Complete set van 20+ helper functies:

#### Totals Berekeningen
- `getTotalPaid(reservation)` - Som van alle payments
- `getTotalRefunded(reservation)` - Som van alle refunds  
- `getNetRevenue(reservation)` - Paid - Refunded
- `getOutstandingBalance(reservation)` - Nog te betalen

#### Status Checks
- `isFullyPaid(reservation)` - Boolean
- `isFullyRefunded(reservation)` - Boolean
- `hasPayments(reservation)` - Boolean
- `hasRefunds(reservation)` - Boolean

#### Afgeleide Status
- `getPaymentStatus(reservation)` - Berekent dynamische status
  - `'pending'` - Niet of deels betaald
  - `'paid'` - Volledig betaald
  - `'refunded'` - Heeft restituties
  - `'overdue'` - Te laat
- `getPaymentStatusLabel(reservation)` - User-friendly tekst
- `getPaymentStatusColor(reservation)` - UI color (green/yellow/orange/red/purple)

#### Timeline
- `getFinancialTimeline(reservation)` - Gecombineerde, gesorteerde lijst van alle transacties

#### Validation
- `validatePaymentAmount(reservation, amount)` - Check of bedrag geldig is
- `validateRefundAmount(reservation, amount)` - Check met max refund validation

#### Summary
- `getFinancialSummary(reservation)` - Complete overview object

---

## ✅ DEEL 2: Het Restitutie Systeem

### Data Model (`src/types/index.ts`)

```typescript
// Refund - Uitgaande restituties
export interface Refund {
  id: string;              // "ref_123"
  amount: number;          // Altijd positief
  date: Date;             // Restitutiedatum
  reason: RefundReason;   // Waarom?
  method: PaymentMethod;  // Hoe terugbetaald?
  reference?: string;      // Transactie-ID
  note?: string;          // VERPLICHT - audit trail
  processedBy?: string;   // Admin naam
}

// Refund Reasons
export type RefundReason = 
  | 'cancellation'   // Annulering door klant
  | 'rebooking'      // Overboeking naar andere datum
  | 'goodwill'       // Coulance
  | 'discount'       // Korting achteraf
  | 'overpayment'    // Te veel betaald
  | 'other';
```

### UI Components

#### 1. AddPaymentModal (`src/components/admin/financial/AddPaymentModal.tsx`)

**Features:**
- ✅ Financiële context: Totaalprijs, reeds betaald, nog te betalen
- ✅ Alle Payment velden met validatie
- ✅ Realtime validatie: `validatePaymentAmount()`
- ✅ Suggestie: Default bedrag = outstanding balance
- ✅ Methode dropdown: iDEAL, Bank, Pin, Cash, Invoice, Voucher, Other
- ✅ Referentie veld voor transactie-ID's
- ✅ Optionele notitie

**UI Design:**
```
┌────────────────────────────────────────────────┐
│  💚 Betaling Registreren                       │
│  Bedrijf X                                     │
├────────────────────────────────────────────────┤
│  Financieel Overzicht                          │
│  [Totaal: €1200] [Betaald: €0] [Te betalen: €1200] │
├────────────────────────────────────────────────┤
│  Bedrag: € [1200.00]                           │
│  Datum: [2025-11-12]                           │
│  Methode: [iDEAL ▼]                            │
│  Referentie: [TR123456789]                     │
│  Notitie: [Optioneel...]                       │
│                                                 │
│  [Annuleren] [✓ Betaling Registreren]         │
└────────────────────────────────────────────────┘
```

#### 2. AddRefundModal (`src/components/admin/financial/AddRefundModal.tsx`)

**Features:**
- ✅ Financiële context: Totaal betaald, reeds gerestitueerd, max refund
- ✅ KRITISCHE VALIDATIE: Max bedrag = totalPaid - totalRefunded
- ✅ Alle Refund velden inclusief reason dropdown
- ✅ **VERPLICHTE notitie** voor audit trail
- ✅ Two-step proces: Form → Confirmation screen
- ✅ Waarschuwing: "Permanente actie"
- ✅ Kan-niet-restitueren screen als totalPaid = 0

**UI Design:**
```
┌────────────────────────────────────────────────┐
│  💜 Restitutie Registreren                     │
│  Bedrijf X                                     │
├────────────────────────────────────────────────┤
│  Financieel Overzicht                          │
│  [Totaal: €1200] [Betaald: €1200] [Max: €1200] │
├────────────────────────────────────────────────┤
│  Bedrag: € [____] Max: €1200                   │
│  Datum: [2025-11-12]                           │
│  Reden: [Annulering ▼]                         │
│  Methode: [Bankoverschrijving ▼]               │
│  Referentie: [NL12...]                         │
│  Notitie *: [Klant annuleerde, volledige      │
│             terugbetaling volgens voorwaarden] │
│                                                 │
│  [Annuleren] [Volgende: Bevestigen]           │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  ⚠️ Let op: Permanente Actie                   │
│  Je staat op het punt €1200 terug te betalen.  │
│  Dit kan niet ongedaan worden gemaakt.         │
│                                                 │
│  Samenvatting:                                 │
│  - Bedrag: €1200                               │
│  - Reden: Annulering door klant                │
│  - Methode: Bankoverschrijving                 │
│                                                 │
│  [Terug] [✓ Bevestigen & Registreren]         │
└────────────────────────────────────────────────┘
```

---

## 🚧 DEEL 3: Het Archief Systeem (TODO)

### ArchivedRecord Type (`src/types/index.ts`) ✅ DONE

```typescript
export interface ArchivedRecord {
  id: string;
  archivedAt: Date;
  archivedBy: string;
  archiveReason: string;
  
  reservation: {
    // Snapshot van reservering data
    companyName: string;
    contactPerson: string;
    eventDate: Date;
    // ... etc
  };
  
  // 💰 DE KERN: Financieel Grootboek
  financials: {
    totalPrice: number;
    totalPaid: number;        // Afgeleid bij archivering
    totalRefunded: number;    // Afgeleid bij archivering
    netRevenue: number;       // Afgeleid: paid - refunded
    
    // Onveranderbare bewijslast
    payments: Payment[];      // Volledige kopie
    refunds: Refund[];        // Volledige kopie
    
    invoiceNumber?: string;
    paymentDueDate?: Date;
  };
  
  communication: {
    emailsSent: number;
    emailLog?: EmailLog[];
    communicationLog?: CommunicationLog[];
  };
  
  // Voor super-search
  searchMetadata: {
    keywords: string[];
    paymentReferences: string[];  // Alle payment references
    refundReferences: string[];   // Alle refund references
    hasRefunds: boolean;
    isFullyRefunded: boolean;
    hasOutstandingBalance: boolean;
  };
}
```

### Nog Te Bouwen

#### 1. ReservationDetailPanel Financial Tab (TODO)
- [ ] Nieuwe "Financieel" tab toevoegen
- [ ] Financial Timeline component (payments + refunds gesorteerd)
- [ ] Knoppen "Betaling Toevoegen" en "Restitutie Toevoegen"
- [ ] Financial Summary card (totals, status, badges)

#### 2. PaymentsManager Rebuild (TODO)
- [ ] Vervang simpele status kolom door afgeleide status
- [ ] Toon payments count en total per reservering
- [ ] Filter: "Heeft Restituties"
- [ ] Filter: "Volledig Terugbetaald"
- [ ] Zoek op payment/refund reference
- [ ] Click → Open detail met financial timeline

#### 3. ArchiveCenter Component (TODO)
- [ ] Vervangt `ArchivedReservationsManager.tsx`
- [ ] Super-Search:
  - Zoek op klant naam/email
  - Zoek op event datum
  - Zoek op payment reference (iDEAL-ID)
  - Zoek op refund reference
- [ ] Geavanceerde Filters:
  - "Alle"
  - "Met Restituties"
  - "Volledig Terugbetaald"
  - "Deels Terugbetaald"
  - "Openstaand Saldo"
- [ ] Master-detail layout
- [ ] Export naar CSV met financial data

#### 4. ArchivedDetailPanel Component (TODO)
- [ ] Read-only view van `ArchivedRecord`
- [ ] **Financiële Tijdlijn** sectie (key feature):
  ```
  Reservering Totaal: €1.200,00
  
  Financiële Historie:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  15 jan 2024  | 💚 Betaling (iDEAL)         | € 600,00
               | Ref: TR123456789             |
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  01 feb 2024  | 💚 Betaling (Bank)          | € 600,00
               | Ref: Factuur 2024-001        |
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  05 feb 2024  | ℹ️ Boeking Geannuleerd       |
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  06 feb 2024  | 💜 Restitutie (Bank)        | - € 1.000,00
               | Reden: Annulering            |
               | Ref: NL12BANK0123456789      |
               | Notitie: Klant annuleerde,   |
               | volledige terugbetaling      |
               | minus €200 annuleringskosten |
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  Financiële Samenvatting:
  ├─ Totaal Betaald:        € 1.200,00
  ├─ Totaal Gerestitueerd:  € 1.000,00
  └─ Netto Inkomsten:       €   200,00 ✓
  ```
- [ ] Klantinformatie sectie
- [ ] Event details sectie
- [ ] Communicatie log sectie

#### 5. eventArchiving.ts Service Update (TODO)
- [ ] Bij archiveren: Bereken en sla op:
  - `financials.totalPaid` = getTotalPaid()
  - `financials.totalRefunded` = getTotalRefunded()
  - `financials.netRevenue` = getNetRevenue()
- [ ] Kopieer volledige `payments[]` array
- [ ] Kopieer volledige `refunds[]` array
- [ ] Genereer `searchMetadata`:
  - Extract alle payment references
  - Extract alle refund references
  - Set boolean flags

---

## 🎨 Design System

### Color Coding

- **Groen**: Payments (inkomend geld)
- **Paars**: Refunds (uitgaand geld)
- **Oranje**: Outstanding balance
- **Rood**: Overdue / validation errors

### Status Badges

```typescript
// getPaymentStatusColor() returns:
{
  paid: 'green',        // Volledig betaald
  pending: 'yellow',    // Niet betaald
  pending: 'orange',    // Deels betaald (als totalPaid > 0)
  overdue: 'red',       // Te laat
  refunded: 'purple'    // Heeft restituties
}
```

---

## 📊 Usage Examples

### Example 1: Registreer Betaling

```typescript
// In ReservationDetailPanel:
<AddPaymentModal
  reservation={reservation}
  isOpen={showPaymentModal}
  onClose={() => setShowPaymentModal(false)}
  onSuccess={() => {
    // Refresh data
    loadReservation();
  }}
/>

// Result in Firestore:
reservation.payments = [
  {
    id: "pay_1699876543_abc123",
    amount: 1200,
    date: "2025-11-12",
    method: "ideal",
    reference: "TR123456789",
    note: "Volledige betaling via iDEAL",
    processedBy: "Admin"
  }
];
```

### Example 2: Registreer Restitutie

```typescript
// Klant annuleert - admin doet restitutie
<AddRefundModal
  reservation={reservation}
  isOpen={showRefundModal}
  onClose={() => setShowRefundModal(false)}
  onSuccess={() => loadReservation()}
/>

// Result:
reservation.refunds = [
  {
    id: "ref_1699876600_xyz789",
    amount: 1000,
    date: "2025-11-12",
    reason: "cancellation",
    method: "bank_transfer",
    reference: "NL12BANK0123456789",
    note: "Klant annuleerde 3 weken voor event. Volledige terugbetaling minus €200 annuleringskosten volgens voorwaarden.",
    processedBy: "Admin"
  }
];

// Afgeleide status:
getPaymentStatus(reservation) // => "refunded"
getTotalPaid(reservation)     // => 1200
getTotalRefunded(reservation) // => 1000
getNetRevenue(reservation)    // => 200 (annuleringskosten)
```

### Example 3: Financial Timeline

```typescript
const timeline = getFinancialTimeline(reservation);
// Returns:
[
  {
    id: "ref_...",
    type: "refund",
    amount: 1000,
    date: "2025-11-12",
    method: "bank_transfer",
    // ...
  },
  {
    id: "pay_...",
    type: "payment",
    amount: 1200,
    date: "2025-10-15",
    method: "ideal",
    // ...
  }
]
// Gesorteerd op datum (nieuwste eerst)
```

---

## ✅ Benefits

### Voor Gebruikers

1. **Transparantie** 📊
   - Elke euro is traceable
   - Complete financiële geschiedenis per reservering
   - Duidelijk overzicht van wat betaald/terugbetaald is

2. **Audit-Proof** 🔒
   - Elke transactie heeft een ID, datum, en notitie
   - Restituties hebben verplichte reden + notitie
   - Onveranderbare geschiedenis in archief

3. **Flexibiliteit** 🔄
   - Deelbetalingen mogelijk
   - Meerdere betalingsmethoden
   - Gedetailleerde refund tracking

### Voor Beheer

1. **Compliance** ✅
   - Voldoet aan boekhouding-eisen
   - Complete audit trail
   - Bewijs van alle transacties

2. **Inzicht** 📈
   - Netto inkomsten per reservering
   - Refund patterns zichtbaar
   - Betaalgedrag analyse mogelijk

3. **Professionaliteit** 💼
   - Van "simpel" naar "enterprise-grade"
   - Klaar voor groei
   - Externe accountant-friendly

---

## 🚀 Next Steps

### Prioriteit 1: Integratie in Detail Panels
- [ ] Add Financial tab to ReservationDetailPanelV4
- [ ] Add payment/refund buttons
- [ ] Show financial timeline

### Prioriteit 2: PaymentsManager Upgrade
- [ ] Replace simple status with derived status
- [ ] Add refund filters
- [ ] Add reference search

### Prioriteit 3: Archive System
- [ ] Build ArchiveCenter component
- [ ] Build ArchivedDetailPanel
- [ ] Update eventArchiving service

---

## 📁 File Structure

```
src/
├── types/
│   └── index.ts                    ← ✅ Payment, Refund, ArchivedRecord types
├── utils/
│   └── financialHelpers.ts         ← ✅ 20+ helper functions
├── components/admin/financial/
│   ├── AddPaymentModal.tsx         ← ✅ Payment registration
│   ├── AddRefundModal.tsx          ← ✅ Refund registration
│   ├── FinancialTimeline.tsx       ← 🚧 TODO: Timeline component
│   └── FinancialSummaryCard.tsx    ← 🚧 TODO: Summary widget
├── components/admin/
│   ├── ReservationDetailPanelV4.tsx ← 🚧 TODO: Add Financial tab
│   ├── PaymentsManager.tsx          ← 🚧 TODO: Rebuild with grootboek
│   ├── ArchiveCenter.tsx            ← 🚧 TODO: New archive component
│   └── ArchivedDetailPanel.tsx      ← 🚧 TODO: Read-only detail view
└── services/
    └── eventArchiving.ts            ← 🚧 TODO: Update with financials
```

---

*Implementation by: AI Assistant*  
*Date: November 12, 2025*  
*Version: 2.0.0 - Grootboek Foundation*
