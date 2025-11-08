# 🎯 Bulk Event Creation - Integratie Guide

## ✅ WAT IS ER VERBETERD

De **BulkEventModal** is nu volledig geïntegreerd met de **PricingConfigManager**!

---

## 🔄 HOE HET WERKT

### Workflow: Van Configuratie naar Events

```
┌─────────────────────────────────────────────────┐
│  1️⃣ CONFIGURATIE                               │
│  Producten → Prijzen                            │
├─────────────────────────────────────────────────┤
│  📍 Shows aanmaken                              │
│  📍 Event Types configureren (met tijden)       │
│  📍 Prijzen instellen                           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  2️⃣ BULK EVENTS AANMAKEN                       │
│  Evenementen → Kalender → [+ Bulk]             │
├─────────────────────────────────────────────────┤
│  ✅ Selecteer datums in kalender                │
│  ✅ Kies Show (uit jouw geconfigureerde shows)  │
│  ✅ Kies Event Type (tijden auto-invullen!)     │
│  ✅ Pas tijden aan indien nodig                 │
│  ✅ Stel capaciteit in                          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  3️⃣ RESULTAAT                                   │
│  Meerdere events in één keer aangemaakt!        │
└─────────────────────────────────────────────────┘
```

---

## 🎨 NIEUWE FEATURES

### 1. Smart Show Selection

**Wat zie je:**
```
Show *                    💡 Tip: Ga naar Producten → Prijzen
┌─────────────────────────────────────────────────┐
│ Selecteer een show                              │
│ Memories of Motown ✓                            │
│ The Beatles Experience ✓                        │
│ ───── Inactieve Shows ─────                     │
│ Old Show (Inactief)                             │
└─────────────────────────────────────────────────┘
```

**Features:**
- ✅ Actieve shows eerst (met ✓ checkmark)
- ✅ Inactieve shows onderaan (met separator)
- ✅ Direct link naar configuratie als er geen shows zijn
- ✅ Automatische sorting

**Als geen shows:**
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Geen shows beschikbaar.                      │
│ Ga naar Producten → Prijzen → Shows             │
│ om shows aan te maken.                          │
└─────────────────────────────────────────────────┘
```

---

### 2. Smart Event Type Selection

**Wat zie je:**
```
Type Evenement            💡 Tijden worden automatisch ingevuld
┌─────────────────────────────────────────────────┐
│ Reguliere Show (20:00 - 22:30)                  │
│ Matinee (14:00 - 18:00)                         │
│ Zorgzame Helden (20:00 - 22:30)                 │
│ Op Aanvraag                                     │
└─────────────────────────────────────────────────┘
```

**Features:**
- ✅ Toont tijden direct in dropdown
- ✅ Auto-fill tijden wanneer je type selecteert
- ✅ Tijden zijn aanpasbaar indien nodig
- ✅ Alleen enabled types worden getoond

**Automatische tijd-invulling:**
```javascript
// Kies "Matinee" → tijden worden automatisch:
Deuren Open: 13:00
Start:       14:00
Einde:       18:00

// Handmatig nog aanpasbaar!
```

---

## 📋 STAP-VOOR-STAP VOORBEELD

### Scenario: 10 Weekend Shows Toevoegen

**STAP 1: Configuratie** (eenmalig)
```
Ga naar: Admin → Producten → Prijzen

[Shows Tab]
+ Nieuwe Show
  - Naam: "Memories of Motown"
  - Beschrijving: "Betoverende Motown muziek"
  - Actief: ✓
  [Opslaan]

[Event Types Tab]
✏️ Reguliere Show
  - Tijden: 19:00 - 20:00 - 22:30
  - Enabled: ✓
  - Show on Calendar: ✓
  [Opslaan]
```

**STAP 2: Bulk Events Aanmaken**
```
Ga naar: Admin → Evenementen → [Lijst] → [+ Bulk Toevoegen]

1. Selecteer datums:
   - Klik [+ Alle Zaterdagen]
   - Of klik individuele datums
   - Zie: "10 datum(s) geselecteerd"

2. Configureer event:
   Show: Memories of Motown ✓
   Type: Reguliere Show (20:00 - 22:30)
   
   Tijden (auto-ingevuld):
   Deuren: 19:00
   Start:  20:00
   Einde:  22:30
   
   Capaciteit: 230

3. Klik [10 Events Toevoegen]
```

**RESULTAAT:**
- ✅ 10 events aangemaakt in 30 seconden!
- ✅ Alle met correcte show
- ✅ Alle met correcte tijden
- ✅ Klaar voor reserveringen

---

## 💡 HANDIGE TIPS

### Quick Actions
```
[+ Alle Zaterdagen]   → Voegt alle zaterdagen toe
[+ Alle Vrijdagen]    → Voegt alle vrijdagen toe
[+ Alle Weekends]     → Voegt vrijdag + zaterdag toe
```

### Visual Indicators
```
🔵 Blauw bolletje  = Regulier event aanwezig
🟣 Paars bolletje  = Matinee event aanwezig
🟢 Groen bolletje  = Care Heroes event aanwezig
[2] Badge          = Meerdere events op deze datum
🔴 Rood stipje     = Bevat inactief event
```

### Bestaande Events
```
⚠️ Als je een datum selecteert met al events:
   "1 van de geselecteerde datum(s) heeft al 
    evenement(en). Deze worden toegevoegd als 
    extra evenement op dezelfde datum."

→ Je kunt dus meerdere events per dag hebben!
  (bijv. Matinee + Avondshow)
```

---

## 🎯 VOORBEELDEN

### Voorbeeld 1: Hele Maand Reguliere Shows
```
1. Klik [+ Alle Weekends]
2. Type: Reguliere Show
3. Show: Memories of Motown
4. [20 Events Toevoegen]
```

### Voorbeeld 2: Mix van Types
```
Dag 1: Reguliere Show (avond)
       → Bulk: Selecteer zaterdagen
       → Type: Reguliere Show
       
Dag 2: Matinee Shows (middag)
       → Bulk: Selecteer zondagen
       → Type: Matinee
       
Resultaat: 2 events per weekend!
```

### Voorbeeld 3: Speciale Events
```
Care Heroes Show (1x per maand):
1. Selecteer 1 specifieke datum
2. Type: Zorgzame Helden
3. Show: Memories of Motown
4. Capaciteit: 150 (kleiner!)
5. [1 Event Toevoegen]
```

---

## 🔗 INTEGRATIE OVERZICHT

### Data Flow
```
PricingConfigManager
  ↓
  Shows → BulkEventModal (dropdown)
  Event Types → BulkEventModal (auto-fill tijden)
  Pricing → Events (gebruikt voor prijs berekening)
  ↓
Bulk Events Created
  ↓
Booking Widget (gebruikt events voor reserveringen)
```

### Velden Mapping
```
┌─────────────────────┬──────────────────────────┐
│ Configuratie        │ Gebruikt in Bulk Modal   │
├─────────────────────┼──────────────────────────┤
│ Show.name           │ Show dropdown label      │
│ Show.isActive       │ Sorting & visual marker  │
│ EventType.name      │ Type dropdown label      │
│ EventType.enabled   │ Visibility in dropdown   │
│ EventType.times     │ Auto-fill tijden velden  │
│ Pricing.byDayType   │ Event pricing (achtergrond)│
└─────────────────────┴──────────────────────────┘
```

---

## ✅ CHECKLIST: Bulk Events Succesvol Gebruiken

### Voorbereiding (1x)
- [ ] Minimaal 1 show aangemaakt (Producten → Prijzen → Shows)
- [ ] Show is actief (checkbox aangevinkt)
- [ ] Event types geconfigureerd (Producten → Prijzen → Event Types)
- [ ] Tijden per type ingesteld

### Bulk Creation (elke keer)
- [ ] Datums geselecteerd in kalender
- [ ] Show gekozen uit dropdown
- [ ] Event type gekozen
- [ ] Tijden gecontroleerd (auto-ingevuld maar aanpasbaar)
- [ ] Capaciteit ingesteld
- [ ] Geen rode error meldingen
- [ ] Klik "X Events Toevoegen"

### Verificatie (na aanmaak)
- [ ] Events verschijnen in kalender
- [ ] Events hebben correcte show
- [ ] Events hebben correcte tijden
- [ ] Capaciteit is juist ingesteld
- [ ] Events zijn actief

---

## ❓ TROUBLESHOOTING

**Q: Dropdown "Show" is leeg**
```
A: Ga naar Producten → Prijzen → Shows tab
   Klik [+ Nieuwe Show] en maak een show aan
   Zorg dat "Actief" aangevinkt is
```

**Q: Tijden worden niet auto-ingevuld**
```
A: Check of Event Types geconfigureerd zijn:
   Producten → Prijzen → Event Types tab
   Controleer dat defaultTimes ingesteld zijn
```

**Q: Kan geen events toevoegen**
```
A: Check de error melding:
   - "Geen datums geselecteerd" → Klik datums in kalender
   - "Geen show geselecteerd" → Maak eerst een show aan
   - Andere fout → Check console logs
```

**Q: Events verschijnen niet in booking widget**
```
A: Controleer:
   1. Event.isActive = true
   2. Event.date is in de toekomst
   3. Show.isActive = true
   4. Event heeft bookingOpensAt/closesAt (optioneel)
```

---

## 🚀 BEST PRACTICES

### 1. Plan vooruit
```
✅ Maak shows aan voor heel seizoen
✅ Configureer event types met standaard tijden
✅ Gebruik bulk voor terugkerende shows
```

### 2. Consistentie
```
✅ Gebruik dezelfde show naam voor hele serie
✅ Gebruik event types voor verschillende tijden
✅ Houd capaciteit consistent (tenzij speciale reden)
```

### 3. Efficiency
```
✅ Gebruik quick actions (Alle Zaterdagen, etc.)
✅ Maak eerst configuratie compleet
✅ Daarna bulk creation in minuten
```

### 4. Organisatie
```
✅ Actieve shows bovenaan (automatisch)
✅ Inactieve shows onderaan
✅ Gebruik duidelijke show namen
```

---

## 📊 VOORDELEN

### Voor Admin
- ⏱️ **90% tijdsbesparing** - 10 events in 30 sec vs 10 min handmatig
- 🎯 **Consistentie** - Alle events hebben correcte tijden/show
- 🔄 **Flexibiliteit** - Mix types, capaciteiten, shows
- 📋 **Overzicht** - Zie bestaande events tijdens selectie

### Voor Systeem
- 🔗 **Integratie** - Alles werkt samen (shows, types, pricing)
- ✅ **Validatie** - Kan niet zonder show/type
- 📈 **Schaalbaarheid** - Makkelijk 50+ events aanmaken
- 🛡️ **Data Integriteit** - Referenties naar shows blijven kloppen

---

✅ **KLAAR VOOR GEBRUIK!**

De bulk event creation werkt nu perfect samen met de configuratie manager. Maak shows en event types aan, en creëer daarna in seconden bulk events! 🚀
