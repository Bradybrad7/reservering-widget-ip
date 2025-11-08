# ✅ Producten Beheer Module - Transformatie (Gedeeltelijk Compleet)

## 🎯 Doel
Transformeer de ProductsManager van een statische tab-container naar een volledig dynamisch en interactief beheercentrum met volledige CRUD functionaliteit voor alle producttypes.

---

## ✅ Wat Is Geïmplementeerd

### 1. **Types Definitie** ✨ COMPLEET
**Bestand:** `src/types/index.ts`

Nieuwe types toegevoegd:

```typescript
// ArrangementProduct - Full product definition
export interface ArrangementProduct {
  id: string;
  name: string;
  code: Arrangement; // 'BWF' | 'BWFM'
  description: string;
  minPersons?: number;
  maxPersons?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Promotion - Discount codes
export interface Promotion {
  id: string;
  name: string;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  validFrom: Date | string;
  validTo: Date | string;
  minBookingValue?: number;
  applicableTo: 'all' | 'arrangements' | 'merchandise';
  applicableItemIds?: string[];
  isActive: boolean;
  usageCount?: number;
  maxUsage?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// VoucherTemplate - What you sell
export interface VoucherTemplate {
  id: string;
  name: string;
  description: string;
  value: number;
  validityDays: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// IssuedVoucher - Actual voucher given to customer
export interface IssuedVoucher {
  id: string;
  code: string;
  templateId: string;
  issuedTo: string;
  issueDate: Date | string;
  expiryDate: Date | string;
  initialValue: number;
  remainingValue: number;
  status: 'active' | 'used' | 'expired';
  usedInReservationIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
```

---

### 2. **AdminStore Uitbreiding** ✨ COMPLEET
**Bestand:** `src/store/adminStore.ts`

#### State Toegevoegd:
```typescript
// Arrangements (Products)
arrangements: ArrangementProduct[];
isLoadingArrangements: boolean;

// Promotions/Discounts
promotionCodes: Promotion[];
isLoadingPromotionCodes: boolean;

// Voucher Templates
voucherTemplates: VoucherTemplate[];
isLoadingVoucherTemplates: boolean;

// Issued Vouchers
issuedVouchers: IssuedVoucher[];
isLoadingIssuedVouchers: boolean;
```

#### Actions Toegevoegd:
```typescript
// Arrangements
loadArrangements: () => Promise<void>;
createArrangement: (arrangement: Omit<ArrangementProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
updateArrangement: (arrangementId: string, updates: Partial<ArrangementProduct>) => Promise<boolean>;
deleteArrangement: (arrangementId: string) => Promise<boolean>;

// Promotions
loadPromotionCodes: () => Promise<void>;
createPromotionCode: (promotion: Omit<Promotion, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
updatePromotionCode: (promotionId: string, updates: Partial<Promotion>) => Promise<boolean>;
deletePromotionCode: (promotionId: string) => Promise<boolean>;

// Voucher Templates
loadVoucherTemplates: () => Promise<void>;
createVoucherTemplate: (template: Omit<VoucherTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
updateVoucherTemplate: (templateId: string, updates: Partial<VoucherTemplate>) => Promise<boolean>;
deleteVoucherTemplate: (templateId: string) => Promise<boolean>;

// Issued Vouchers
findIssuedVouchers: (query: string) => Promise<void>;
updateIssuedVoucher: (voucherId: string, updates: Partial<IssuedVoucher>) => Promise<boolean>;
```

**Status:** Implementatie compleet, maar API service methods moeten nog worden toegevoegd.

---

### 3. **ArrangementsManagerNew Component** ✨ COMPLEET
**Bestand:** `src/components/admin/ArrangementsManagerNew.tsx`

Volledig functionele CRUD manager voor arrangements, gebaseerd op MerchandiseManager patroon.

**Features:**
- ✅ Grid weergave van alle arrangements
- ✅ "Nieuw Arrangement" knop
- ✅ Modal voor create/edit met volledig formulier
- ✅ Arrangement code selectie (BWF/BWFM)
- ✅ Min/Max personen configuratie
- ✅ Image URL met preview
- ✅ Active/Inactive toggle
- ✅ Delete functionaliteit met confirmatie
- ✅ Loading states
- ✅ Empty state

**Formulier Velden:**
- Naam (required)
- Code (BWF/BWFM) - niet wijzigbaar na aanmaak
- Beschrijving (required)
- Min. Personen (optioneel)
- Max. Personen (optioneel)
- Afbeelding URL (optioneel met preview)
- Actief toggle

---

## ⚠️ Wat Nog Moet Gebeuren

### 1. **PromotionsManager Aanpassing** 🔄
**Bestand:** `src/components/admin/PromotionsManager.tsx`

**Probleem:** Er bestaat al een PromotionsManager die het oude `PromotionCode` type gebruikt.

**Actie Vereist:**
- Update bestaande PromotionsManager om nieuwe `Promotion` type te gebruiken
- OF: Hernoem oude en gebruik nieuwe implementatie
- Zorg voor date pickers voor `validFrom` en `validTo`
- Voeg type selector toe (percentage vs fixed_amount)
- Implementeer applicableTo logica

---

### 2. **VoucherManager Component** ❌ NOG TE MAKEN
**Bestand:** `src/components/admin/VoucherManager.tsx` (nieuw)

**Vereiste Functionaliteit:**

#### Sub-Tab Structuur:
- **Tab 1: Sjablonen** - CRUD voor VoucherTemplate
- **Tab 2: Uitgegeven Vouchers** - Zoeken en beheren van IssuedVoucher

#### Sjablonen Tab Features:
- Grid van voucher templates
- Create/Edit modal voor sjablonen
- Velden:
  - Naam (bijv. "€25 Cadeaubon")
  - Beschrijving
  - Waarde (vast bedrag)
  - Geldigheid in dagen
  - Afbeelding URL
  - Actief toggle

#### Uitgegeven Vouchers Tab Features:
- Zoekbalk (code of email)
- Lijst van gevonden vouchers met:
  - Code
  - Template naam
  - Uitgegeven aan
  - Geldig tot
  - Restwaarde
  - Status (active/used/expired)
- Edit mogelijkheid voor vervaldatum/status

---

### 3. **ProductsManager Integratie** 🔄
**Bestand:** `src/components/admin/ProductsManager.tsx`

**Actie Vereist:**

```typescript
const renderContent = () => {
  switch (activeTab) {
    case 'arrangements':
      return <ArrangementsManagerNew />;  // ← Update dit
    case 'pricing':
      return <PricingConfigManager />;
    case 'addons':
      return <AddOnsManagerEnhanced />;
    case 'merchandise':
      return <MerchandiseManager />;
    case 'promotions':
      return <PromotionsManager />;  // ← Update/verify dit
    case 'vouchers':
      return <VoucherManager />;  // ← Vervang placeholder
    default:
      return <ArrangementsManagerNew />;
  }
};
```

---

### 4. **API Service Methods** ❌ KRITIEK - NOG TE MAKEN
**Bestand:** `src/services/apiService.ts`

**Vereiste Methods:**

```typescript
// Arrangements
getArrangements(): Promise<ApiResponse<ArrangementProduct[]>>;
createArrangement(data: Omit<ArrangementProduct, 'id'>): Promise<ApiResponse<ArrangementProduct>>;
updateArrangement(id: string, updates: Partial<ArrangementProduct>): Promise<ApiResponse<ArrangementProduct>>;
deleteArrangement(id: string): Promise<ApiResponse<void>>;

// Promotions
getPromotionCodes(): Promise<ApiResponse<Promotion[]>>;
createPromotionCode(data: Omit<Promotion, 'id' | 'usageCount'>): Promise<ApiResponse<Promotion>>;
updatePromotionCode(id: string, updates: Partial<Promotion>): Promise<ApiResponse<Promotion>>;
deletePromotionCode(id: string): Promise<ApiResponse<void>>;

// Voucher Templates
getVoucherTemplates(): Promise<ApiResponse<VoucherTemplate[]>>;
createVoucherTemplate(data: Omit<VoucherTemplate, 'id'>): Promise<ApiResponse<VoucherTemplate>>;
updateVoucherTemplate(id: string, updates: Partial<VoucherTemplate>): Promise<ApiResponse<VoucherTemplate>>;
deleteVoucherTemplate(id: string): Promise<ApiResponse<void>>;

// Issued Vouchers
findIssuedVouchers(query: string): Promise<ApiResponse<IssuedVoucher[]>>;
updateIssuedVoucher(id: string, updates: Partial<IssuedVoucher>): Promise<ApiResponse<IssuedVoucher>>;
```

**Implementatie Voorbeeld:**

```typescript
// Arrangements
async getArrangements(): Promise<ApiResponse<ArrangementProduct[]>> {
  try {
    const data = localStorageService.getArrangements() || [];
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to load arrangements' };
  }
},

async createArrangement(arrangement: Omit<ArrangementProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ArrangementProduct>> {
  try {
    const newArrangement: ArrangementProduct = {
      ...arrangement,
      id: `arr-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const arrangements = localStorageService.getArrangements() || [];
    arrangements.push(newArrangement);
    localStorageService.saveArrangements(arrangements);
    
    return { success: true, data: newArrangement };
  } catch (error) {
    return { success: false, error: 'Failed to create arrangement' };
  }
},

// ... similar for update, delete
```

---

### 5. **LocalStorage Service Methods** ❌ NOG TE MAKEN
**Bestand:** `src/services/localStorageService.ts`

**Vereiste Methods:**

```typescript
// Arrangements
getArrangements(): ArrangementProduct[];
saveArrangements(arrangements: ArrangementProduct[]): void;

// Promotions
getPromotionCodes(): Promotion[];
savePromotionCodes(promotions: Promotion[]): void;

// Voucher Templates
getVoucherTemplates(): VoucherTemplate[];
saveVoucherTemplates(templates: VoucherTemplate[]): void;

// Issued Vouchers
getIssuedVouchers(): IssuedVoucher[];
saveIssuedVouchers(vouchers: IssuedVoucher[]): void;
```

---

## 📋 Implementatie Volgorde (Aanbevolen)

### Fase 1: API & Storage (PRIORITEIT)
1. ✅ LocalStorage methods toevoegen
2. ✅ API service methods implementeren
3. ✅ Testen dat adminStore actions werken

### Fase 2: Components Voltooien
4. ✅ PromotionsManager aanpassen voor nieuwe Promotion type
5. ✅ VoucherManager volledig implementeren
6. ✅ ProductsManager integreren

### Fase 3: Testen & Polish
7. ✅ Alle CRUD operaties testen
8. ✅ Error handling verbeteren
9. ✅ Loading states optimaliseren
10. ✅ UI/UX polish

---

## 🎨 Design Patronen Gebruikt

### Component Structuur (van MerchandiseManager)
```
1. State Management (useState, useEffect)
2. Admin Store Hook
3. Modal State
4. Form Data State
5. CRUD Handlers (Create, Edit, Delete, Submit)
6. Loading Check
7. Main Content:
   - Header met titel en "Nieuw" knop
   - Grid van items
   - Empty state
8. Modal:
   - Header
   - Form met validatie
   - Actions (Annuleren/Opslaan)
```

### Styling Conventions
- Card: `card-theatre p-4 hover:shadow-gold transition-all duration-300`
- Button Primary: `bg-gold-500 text-white rounded-lg hover:bg-gold-600`
- Input: `bg-neutral-900 border-2 border-gold-500/20 rounded-lg text-white focus:border-gold-500`
- Toggle: Green/Neutral met sliding indicator

---

## 🐛 Bekende Issues

### 1. **API Service Methods Ontbreken**
**Error:** `Property 'getArrangements' does not exist on type...`

**Fix:** Implementeer alle API service methods (zie sectie 4 hierboven)

### 2. **PromotionCode vs Promotion Type Conflict**
Oude `PromotionCode` type wordt nog gebruikt in bestaande PromotionsManager.

**Fix:** Update naar nieuwe `Promotion` type of hernoem component

---

## 📖 Gebruik Voorbeelden

### ArrangementsManagerNew Gebruiken:
```typescript
import { ArrangementsManagerNew } from './components/admin/ArrangementsManagerNew';

// In ProductsManager:
<ArrangementsManagerNew />
```

### Arrangement CRUD via Store:
```typescript
import { useAdminStore } from './store/adminStore';

const {
  arrangements,
  loadArrangements,
  createArrangement,
  updateArrangement,
  deleteArrangement
} = useAdminStore();

// Load all arrangements
await loadArrangements();

// Create new arrangement
await createArrangement({
  name: "Premium Winterfeest",
  code: "BWF",
  description: "Luxe 4-gangen menu",
  minPersons: 50,
  isActive: true
});

// Update arrangement
await updateArrangement("arr-123", {
  description: "Updated description"
});

// Delete arrangement
await deleteArrangement("arr-123");
```

---

## ✅ Volgende Stappen Voor Voltooiing

1. **Implementeer API Service Methods** (PRIORITEIT)
   - Voeg alle methods toe aan `apiService.ts`
   - Test dat ze correct werken met localStorage

2. **Implementeer LocalStorage Methods**
   - Voeg storage methods toe aan `localStorageService.ts`
   - Zorg voor type-safe opslag

3. **Creëer VoucherManager**
   - Maak nieuw component met sub-tabs
   - Implementeer templates tab
   - Implementeer issued vouchers tab

4. **Update ProductsManager**
   - Integreer ArrangementsManagerNew
   - Integreer VoucherManager
   - Verify PromotionsManager

5. **Testen**
   - Test alle CRUD operaties
   - Test validatie
   - Test error scenarios

---

**Status:** 60% Compleet  
**Laatste Update:** 24 oktober 2025  
**Developer:** GitHub Copilot

---

## 📎 Gerelateerde Bestanden

- ✅ `src/types/index.ts` - Type definities
- ✅ `src/store/adminStore.ts` - Store met nieuwe state/actions
- ✅ `src/components/admin/ArrangementsManagerNew.tsx` - Nieuwe manager
- 🔄 `src/components/admin/PromotionsManager.tsx` - Te updaten
- ❌ `src/components/admin/VoucherManager.tsx` - Te creëren
- 🔄 `src/components/admin/ProductsManager.tsx` - Te integreren
- ❌ `src/services/apiService.ts` - Methods toe te voegen
- ❌ `src/services/localStorageService.ts` - Methods toe te voegen
