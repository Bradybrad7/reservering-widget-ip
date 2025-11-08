# 💰 VASTE PRIJZEN SYSTEEM

## 📋 Overzicht

De app werkt met **vaste prijzen** die door de admin geconfigureerd worden. Prijzen kunnen NIET per individueel evenement worden aangepast.

---

## 🎯 PRIJZEN STRUCTUUR

### **Default Prijzen (config/defaults.ts)**

```
Doordeweeks (ma-do):  BWF €70  | BWFM €85
Weekend (vr-za):      BWF €80  | BWFM €95
Matinee:              BWF €70  | BWFM €85
Zorgzame Helden:      BWF €65  | BWFM €80
```

### **Add-ons (vast):**
```
Voorborrel:  €15 per persoon (min. 25 personen)
AfterParty:  €15 per persoon (min. 25 personen)
```

---

## ⚙️ PRIJZEN CONFIGUREREN

### **Via Admin Panel:**

```
1. Ga naar: Instellingen → Prijzen Tab
2. Pas prijzen aan per event type
3. Wijzigingen gelden voor ALLE evenementen
4. Klik "Opslaan"
```

### **Hoe het werkt:**

```
Event Type → Bepaalt prijs groep
    ↓
REGULAR → Weekday/Weekend (op basis van datum)
MATINEE → Matinee prijzen
CARE_HEROES → Zorgzame helden korting
    ↓
Prijs wordt automatisch berekend
    ↓
Vastgelegd bij reservering (pricing snapshot)
```

---

## 🔒 WAAROM VASTE PRIJZEN?

### **Voordelen:**

1. **Consistentie**
   - Klanten weten waar ze aan toe zijn
   - Geen verwarring over verschillende prijzen

2. **Eenvoud**
   - Admin hoeft niet elke keer prijzen in te stellen
   - Minder kans op fouten

3. **Transparantie**
   - Duidelijke prijsstructuur
   - Makkelijk te communiceren

4. **Pricing Snapshot**
   - Bij reservering wordt prijs vastgelegd
   - Toekomstige prijswijzigingen hebben geen invloed

---

## 📊 PRIJS BEREKENING

### **Voorbeeld: Weekend Event**

```
Event Details:
- Datum: Vrijdag 15 december 2025
- Type: REGULAR
- → Weekend pricing (vrijdag/zaterdag)

Klant Booking:
- 20 personen
- BWFM arrangement
- Voorborrel: Ja

Berekening:
BWF/BWFM prijs:   20 × €95 = €1.900
Voorborrel:       20 × €15 = €300
                  ─────────────────
TOTAAL:                      €2.200
```

### **Automatische Dag Detectie:**

```typescript
getDayType(datum, eventType):
  if (eventType === 'MATINEE') → matinee
  if (eventType === 'CARE_HEROES') → care_heroes
  if (eventType === 'REGULAR'):
    if (vrijdag of zaterdag) → weekend
    else → weekday
```

---

## 🎭 EVENT AANMAKEN

### **Wat je WEL instelt:**

- ✅ Datum & Tijden
- ✅ Event Type (bepaalt prijs)
- ✅ Show (welke voorstelling)
- ✅ Capaciteit
- ✅ Toegestane arrangementen (BWF/BWFM)

### **Wat je NIET instelt:**

- ❌ Custom prijzen per event
- ❌ Aparte pricing
- ❌ Kortingen per event

**→ Prijzen komen altijd uit centrale configuratie!**

---

## 💡 SPECIALE SITUATIES

### **"Maar ik wil korting geven voor groep X?"**

**Oplossingen:**

1. **Promotie Codes**
   - Maak kortingscode aan
   - Verstuur naar groep
   - Klant voert in bij boeking

2. **Admin Manual Booking**
   - ManualBookingManager
   - Prijs override optie
   - Alleen voor individuele boekingen

3. **Pricing Aanpassing**
   - Pas globale prijzen tijdelijk aan
   - Specifieke dag type pricing
   - Geldt dan wel voor alle events

### **"Ik wil actieprijs voor matinee voorstellingen?"**

```
1. Instellingen → Prijzen
2. Pas Matinee prijzen aan:
   BWF: €60 (was €70)
   BWFM: €75 (was €85)
3. Opslaan
4. ALLE matinee events gebruiken nu deze prijs
```

---

## 🔄 WORKFLOW OVERZICHT

### **Admin Setup:**
```
1. Configureer prijzen (eenmalig)
   Instellingen → Prijzen Tab

2. Maak Shows aan
   ShowManager → Nieuwe Show

3. Maak Events aan
   EventManager → Nieuw Event
   (Prijzen worden automatisch bepaald)

4. Klanten boeken
   (Prijzen automatisch berekend)
```

### **Prijzen Wijzigen:**
```
1. Instellingen → Prijzen
2. Wijzig gewenste prijzen
3. Opslaan
4. ✅ Nieuwe reserveringen gebruiken nieuwe prijzen
5. ✅ Oude reserveringen behouden originele prijs
```

---

## 🛡️ PRICING SNAPSHOT

### **Wat gebeurt er bij reservering?**

```typescript
Bij elke reservering wordt opgeslagen:
{
  basePrice: 80,              // Prijs per persoon
  numberOfPersons: 20,
  arrangementTotal: 1600,     // 20 × €80
  preDrinkTotal: 300,
  finalTotal: 1900,
  calculatedAt: "2025-10-29..." // Tijdstempel
}
```

### **Waarom is dit belangrijk?**

- ✅ Klant betaalt altijd boekingsprijs
- ✅ Prijswijzigingen niet retroactief
- ✅ Juridisch beschermd
- ✅ Financiële transparantie

---

## 📖 GEBRUIK IN VERSCHILLENDE SCENARIOS

### **Scenario 1: Normale Booking**
```
Event: Weekend show
Prijs: Automatisch weekend rate
Result: €80/€95 per persoon
```

### **Scenario 2: Matinee**
```
Event Type: MATINEE
Prijs: Automatisch matinee rate
Result: €70/€85 per persoon
```

### **Scenario 3: Telefoonreservering**
```
Admin: ManualBookingManager
Optie: Prijs override mogelijk
Result: Admin kan handmatig aanpassen
```

### **Scenario 4: Groepskorting**
```
Methode: Promotie code
Admin: Maak kortingscode
Result: Klant gebruikt code bij checkout
```

---

## 🎯 KEY POINTS

1. **Prijzen zijn centraal geconfigureerd**
   - Instellingen → Prijzen Tab
   - Geldt voor alle events

2. **Event type bepaalt prijs categorie**
   - REGULAR → weekday/weekend
   - MATINEE → matinee
   - CARE_HEROES → zorgzame helden

3. **Geen custom pricing per event**
   - Voorkomt verwarring
   - Eenvoudiger beheer
   - Consistente ervaring

4. **Pricing snapshot bij boeking**
   - Beschermt klant en bedrijf
   - Prijswijzigingen niet retroactief

5. **Manual override alleen via admin**
   - ManualBookingManager
   - Voor speciale gevallen
   - Per individuele reservering

---

## ✅ SAMENVATTING

**Prijzen werken zo:**
```
Config → Event Type → Auto Calculate → Snapshot bij Boeking
```

**Admin controle:**
- ✅ Centrale prijzen aanpassen
- ✅ Promotie codes maken
- ✅ Manual booking overrides
- ❌ GEEN custom pricing per event

**Resultaat:**
- Consistent
- Eenvoudig
- Transparant
- Betrouwbaar

---

Dit systeem zorgt ervoor dat prijzen altijd correct en consistent zijn, zonder verwarring of fouten!
