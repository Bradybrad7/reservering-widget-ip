# 💰 Payment Tracking System - Quick Start Guide

## 🎯 What's New?

Je hebt nu een compleet betalings- en vervaltracering systeem! Hier is hoe je het gebruikt:

---

## 📍 Waar vind je het?

### 1. **Dashboard Widgets** (Hoofdpagina)
Bovenaan je dashboard zie je nu 2 nieuwe widgets:

#### 💰 Betalingen Widget (Rood-Oranje)
- **Te Laat**: Aantal reserveringen met te late betaling
- **Onbetaald**: Aantal onbetaalde reserveringen
- **Deelbetaling**: Aantal reserveringen met deelbetaling
- **Totaal Openstaand**: Totaal bedrag dat nog betaald moet worden

#### ⏰ Opties Widget (Oranje-Geel)
- **Verloopt Binnenkort**: Opties die binnen 7 dagen verlopen
- **Verlopen**: Opties die al verlopen zijn

### 2. **Filter Knoppen** (Boven in header)
Na de tijd filters (Alle, Vandaag, Week, Maand) zie je nu:

#### Payment Filters:
- **🔴 Te Laat**: Toon alleen reserveringen met te late betaling
- **🟡 Onbetaald**: Toon alleen onbetaalde reserveringen

#### Expiration Filters:
- **⏰ Verloopt Snel**: Toon opties die binnen 7 dagen verlopen
- **❌ Verlopen**: Toon verlopen opties

### 3. **Status Badges** (Op elke reservation card)
Elke reservering toont nu:
- ✓ **Status badge** (Nieuw/Bevestigd/etc)
- 💰 **Betaalstatus badge** (Onbetaald/Deelbetaling/Betaald/Te Laat)
- ⏰ **Expiration badge** (als van toepassing)

Badges zijn kleurgecodeerd:
- 🔴 **Rood** = Te laat / Onbetaald - Urgente actie!
- 🟡 **Geel** = Deelbetaling - In behandeling
- 🟢 **Groen** = Betaald - Alles OK
- 🔵 **Blauw** = Teveel betaald - Check restitutie
- 🟠 **Oranje** = Verloopt binnenkort - Opvolging nodig

---

## 🔍 Hoe gebruik je het?

### Scenario 1: "Welke reserveringen moet ik opvolgen voor betaling?"

1. Ga naar Dashboard
2. Kijk naar de **Betalingen widget**
3. Zie je rode cijfers bij "Te Laat"? → Klik op **🔴 Te Laat** filter
4. Je ziet nu ALLEEN reserveringen met te late betaling
5. Open een reservering → Zie volledige payment details

### Scenario 2: "Welke opties verlopen binnenkort?"

1. Ga naar Dashboard
2. Kijk naar de **Opties widget**
3. Zie je cijfers bij "Verloopt Binnenkort"? → Klik op **⏰ Verloopt Snel** filter
4. Je ziet nu ALLEEN opties die binnen 7 dagen verlopen
5. Bel de klant om te bevestigen of te annuleren

### Scenario 3: "Hoeveel moet klant X nog betalen?"

1. Open de reservering (via lijst of zoeken)
2. Scroll naar de **💰 Betaalstatus** sectie (groene gradient box)
3. Zie in één oogopslag:
   - **Totaal**: Volledige prijs
   - **Betaald**: Reeds betaald bedrag
   - **Openstaand**: Nog te betalen (rood als > 0)
   - **Betaal Voor**: Uiterste betaaldatum (rood als te laat)

### Scenario 4: "Wat heeft klant X al betaald?"

1. Open de reservering
2. Ga naar **Betaalstatus** sectie
3. Scroll naar **Betalingshistorie** tabel
4. Zie alle betalingen met:
   - Bedrag + categorie (🍽️ Arrangement / 🛍️ Merchandise)
   - Datum + tijd + betaalmethode
   - Referentie (bijv. transactienummer)
   - Notities

---

## 📊 Betaalstatus Betekenis

### 🟢 Betaald
- ✅ Volledige betaling ontvangen
- Balance = €0.00
- Geen actie nodig

### 🟡 Deelbetaling
- ⚠️ Gedeeltelijke betaling ontvangen
- Balance > €0 (nog openstaand)
- Opvolging nodig voor restbedrag

### 🔴 Onbetaald
- ❌ Nog geen betaling ontvangen
- Balance = Totaal bedrag
- Urgente opvolging nodig

### 🔴 Te Laat!
- ⚠️ Betaling niet ontvangen voor deadline
- Deadline = 1 week voor event datum
- **KRITISCHE ACTIE VEREIST**

### 🔵 Teveel Betaald
- ℹ️ Meer ontvangen dan totaalprijs
- Mogelijk fout of extra betaling
- Check of restitutie nodig is

---

## 🗓️ Betaal Deadline Regel

**Standaard regel**: Betaling moet binnen zijn **1 week voor event datum**

### Voorbeelden:
- Event op **30 November** → Betaaldatum **23 November**
- Event op **15 December** → Betaaldatum **8 December**

**Waarschuwingen**:
- 3 dagen voor deadline → Oranje tekst
- Na deadline → Rode tekst "X dagen te laat"

---

## ⏰ Optie Vervaldatum

### Regels:
- Alleen voor reserveringen met status **"option"**
- Gebaseerd op `optionExpiresAt` veld
- Automatische detectie

### Warnings:
- **7 dagen of minder** → "⏰ Verloopt Binnenkort" badge
- **Verstreken** → "❌ Verlopen" badge

### Acties:
1. Contact klant voor bevestiging
2. Converteer naar bevestigde boeking
3. Of annuleer als klant niet reageert

---

## 🎨 Visuele Guide

### Payment Summary Section (in modal):
```
┌─────────────────────────────────────────────┐
│ 💰 Betaalstatus          [🔴 Onbetaald]     │
├─────────────────────────────────────────────┤
│  Totaal    Betaald   Openstaand  Betaal Voor│
│  €850.00   €400.00   €450.00     23 Nov 2025│
│                       (rood)     Over 5 dagen│
├─────────────────────────────────────────────┤
│ Betalingshistorie:                          │
│ • €400.00 [🍽️ Arrangement]                  │
│   20 Nov 2025 14:30 • iDEAL                 │
│   Ref: TR-20251120-001                      │
│   "Vooruitbetaling arrangement"             │
└─────────────────────────────────────────────┘
```

### Card Badges:
```
[✓ Bevestigd] [🟡 Deelbetaling] [⏰ Verloopt Binnenkort]
```

---

## 🚀 Workflow Tips

### Daily Routine:
1. **Ochtend**: Check Dashboard widgets
   - Rode cijfers? → Prioriteit!
2. **Check "Te Laat"**: Bel deze klanten vandaag nog
3. **Check "Verloopt Snel"**: Plan follow-up calls
4. **Check "Onbetaald"**: Stuur herinnering als deadline nadert

### Weekly Routine:
1. Filter op **🟡 Onbetaald**
2. Voor elke reservering binnen 2 weken:
   - Stuur payment reminder email
   - Of bel klant voor bevestiging

### Monthly Routine:
1. Review "Deelbetaling" reserveringen
2. Check of volledige betaling ontvangen is
3. Registreer restbetalingen (Phase 3 komt eraan!)

---

## ❓ FAQ

### Q: Hoe weet ik of een betaling te laat is?
**A**: Kijk naar:
1. **Badge op card**: Als status = "🔴 Te Laat!"
2. **In modal**: "Betaal Voor" datum is rood + "X dagen te laat"
3. **Dashboard widget**: Cijfer bij "Te Laat"

### Q: Wat betekent "Deelbetaling"?
**A**: Klant heeft een deel betaald, maar niet alles. Bijvoorbeeld:
- Totaal: €850
- Betaald: €400 (arrangement)
- Openstaand: €450 (merchandise + drankjes)

### Q: Hoe zie ik welk deel betaald is?
**A**: Open reservering → Kijk in Betalingshistorie → Zie categorie:
- 🍽️ **Arrangement**: Alleen arrangement betaald
- 🛍️ **Merchandise**: Alleen merchandise betaald
- 💯 **Volledig**: Alles in één keer betaald
- 📋 **Overig**: Anders (bijv. borg, extra's)

### Q: Kan ik zelf betalingen registreren?
**A**: Nog niet! Phase 3 (Payment Registration Modal) komt binnenkort.  
Voor nu: vraag developer om betalingen toe te voegen via Firebase.

### Q: Wat als klant terugbetaling krijgt (refund)?
**A**: Refunds worden automatisch verwerkt in balance:
- Betaald: €850
- Refund: €100 (bijv. merchandise niet leverbaar)
- Netto omzet: €750 (850 - 100)
- Zie in modal onder "Restituties" sectie (rode box)

### Q: Hoe verander ik de deadline (1 week)?
**A**: Momenteel niet instelbaar. Fixed op 7 dagen voor event.  
Toekomstige versie zal custom deadline ondersteunen.

---

## 🎯 Snelle Actielijst

**Vandaag**:
- [ ] Check Dashboard → Rode cijfers?
- [ ] Filter **🔴 Te Laat** → Bel deze klanten
- [ ] Filter **⏰ Verloopt Snel** → Plan follow-up

**Deze Week**:
- [ ] Filter **🟡 Onbetaald** → Stuur reminders
- [ ] Check opties die binnen 3 dagen verlopen
- [ ] Update betalingen in systeem (via developer)

**Deze Maand**:
- [ ] Review alle deelbetalingen
- [ ] Check "Teveel Betaald" reserveringen
- [ ] Plan follow-up voor openstaande bedragen

---

## 🆘 Problemen?

### Badge toont niet?
- Check of reservering `payments` array heeft
- Refresh de pagina (Ctrl+F5)

### Status klopt niet?
- Controleer of event datum correct is
- Check of payments correct zijn geregistreerd
- Bekijk "Betaalstatus" sectie in modal voor details

### Filter werkt niet?
- Klik nog een keer (filters zijn toggles)
- Combineer niet te veel filters tegelijk
- Check of er überhaupt data is die matcht

---

## 🚀 Wat komt er nog?

### Phase 3 (Binnenkort):
- ✨ "Betaling Registreren" knop in modal
- 💳 Formulier om betalingen toe te voegen
- 📝 Kies categorie (arrangement/merchandise/etc)
- ✅ Live balance calculator tijdens invoeren

### Phase 4 (Later):
- 💸 "Restitutie Aanmaken" knop
- 📋 Refund formulier met reden
- 🔄 Automatische netto omzet berekening

### Phase 5 (Toekomst):
- 📊 Maandelijkse rapporten
- 📤 Export naar Excel/CSV
- 📈 Payment statistieken dashboard

---

**Veel succes met het nieuwe payment tracking systeem! 💰✨**

*Voor vragen of problemen: zie developer*
