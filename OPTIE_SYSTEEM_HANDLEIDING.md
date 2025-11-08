# 🎯 OPTIE SYSTEEM - Snelle Handleiding voor Dagelijks Gebruik

**Laatste Update:** 25 Oktober 2025

---

## 📖 Wat is het Optie Systeem?

Een **optie** is een tijdelijke reservering (1 week geldig) waarbij gasten plaatsen kunnen verzekeren **zonder** volledige boekingsgegevens. Perfect voor klanten die:
- Telefonisch bellen en plaatsen willen reserveren
- Nog moeten overleggen met hun groep
- Details nog niet hebben (arrangement, exacte aantallen, etc.)

### ⚠️ Belangrijk:
- ✅ **Opties TELLEN MEE** in capaciteit (plaatsen worden gereserveerd!)
- ⏰ **Geldig voor 7 dagen** vanaf plaatsing
- 📝 **Minimale info** nodig: Naam + Telefoon + Aantal personen
- 🚫 **Geen arrangement/pricing** nodig bij plaatsing
- 📞 **Follow-up vereist** binnen 7 dagen

---

## 🚀 HOE WERKT HET? - Stap voor Stap

### **STAP 1: Optie Plaatsen** ⏰

1. **Open Admin Panel**
   ```
   Admin → Reserveringen → "Nieuwe Boeking" (rechts bovenin)
   ```

2. **Selecteer "Optie (1 week)"**
   - Kies bovenaan voor "Optie" in plaats van "Volledige Boeking"
   - Toggle knop of radio button

3. **Vul Minimale Gegevens In:**
   - ✅ **Contactpersoon** (verplicht) - Naam van de klant
   - ✅ **Telefoonnummer** (verplicht) - Voor follow-up
   - ✅ **Aantal personen** (verplicht) - Hoeveel plaatsen reserveren
   - ⚪ Bedrijfsnaam (optioneel)
   - ⚪ Email (optioneel - mag leeg!)
   - ⚪ Adres (optioneel - kun je in notities zetten)

4. **Selecteer Event Datum**
   - Kies de datum waarvoor de optie geldt

5. **Voeg Notities Toe** (optioneel)
   - Bijv: "Klant belt terug vrijdag" of "Wacht op bevestiging van directeur"

6. **Klik "⏰ Optie Plaatsen (1 week)"**
   - Optie wordt aangemaakt
   - Vervaldatum = **automatisch 7 dagen later**
   - Plaatsen worden gereserveerd in capaciteit

---

### **STAP 2: Opties Monitoren** 📊

#### **A) Via Alert Sectie (Automatisch)**

Wanneer er opties zijn die actie vereisen, zie je **bovenaan de reserveringen pagina**:

```
┌────────────────────────────────────────────────────────┐
│ ⚠️ Opties Vereisen Actie (3)                          │
│                                                         │
│ De volgende opties zijn verlopen of verlopen          │
│ binnenkort. Neem contact op met de klant!             │
│                                                         │
│ • Jan Jansen • 06-12345678 • 20 personen              │
│   🔴 VERLOPEN                              [Bekijk]   │
│                                                         │
│ • Marie de Vries • 06-87654321 • 15 personen          │
│   ⚠️ Verloopt morgen                        [Bekijk]   │
│                                                         │
│ • Peter Bakker • 06-11223344 • 10 personen            │
│   ⚠️ Verloopt over 2 dagen                  [Bekijk]   │
└────────────────────────────────────────────────────────┘
```

Dit verschijnt alleen als er opties zijn die:
- ✅ Al verlopen zijn (🔴 VERLOPEN)
- ✅ Binnen 2 dagen verlopen (⚠️ Verloopt over X dagen)

#### **B) Via Filter (Handmatig)**

1. Ga naar **Admin → Reserveringen**
2. Gebruik de **Status Filter**:
   - Selecteer "⏰ Opties (1 week)"
3. Zie alle actieve opties gesorteerd op vervaldatum

#### **C) Status Labels**

Elke optie toont een status label:
- 🔴 **VERLOPEN** - Optie is verlopen, direct contact opnemen!
- ⚠️ **Verloopt morgen** - Urgent, klant bellen
- ⚠️ **Verloopt over 2 dagen** - Binnenkort bellen
- ⏰ **Nog 5 dagen** - Actieve optie, nog tijd

---

### **STAP 3: Follow-up & Actie** 📞

#### **Scenario A: Klant Bevestigt Boeking** ✅

1. **Open de Optie**
   - Klik op "Bekijk" in de alert
   - Of vind via reserveringen lijst

2. **Klik "Bewerken"** (Edit knop)

3. **Vul Ontbrekende Gegevens Aan:**
   - ✅ Email adres (nu verplicht)
   - ✅ Adres gegevens
   - ✅ Arrangement (BWF of BWFM)
   - ⚪ Extra's (Pre-drink, After-party)
   - ⚪ Opmerkingen/Dieet wensen

4. **Wijzig Status**
   - Van "⏰ Optie" → naar "✅ Bevestigd"

5. **Prijs Wordt Automatisch Berekend**
   - Zodra arrangement is geselecteerd
   - Toon prijs aan klant

6. **Opslaan**
   - Optie wordt volledige reservering
   - Bevestigingsmail wordt verstuurd (indien geconfigureerd)
   - Plaatsen blijven gereserveerd

#### **Scenario B: Klant Annuleert** ❌

1. **Open de Optie**

2. **Wijzig Status**
   - Van "⏰ Optie" → naar "🚫 Geannuleerd"

3. **Voeg Reden Toe** (optioneel)
   - In notities: "Klant heeft afgezegd - te duur"

4. **Opslaan**
   - Plaatsen komen **direct vrij** in capaciteit
   - Andere klanten kunnen nu boeken

#### **Scenario C: Klant Reageert Niet** 📵

1. **Bel/Mail de Klant**
   - Gebruik telefoonnummer uit optie
   - Vraag of ze willen doorgaan

2. **Log Communicatie**
   - Klik "Communicatie" knop
   - Voeg toe: "Gebeld op 25-10, geen gehoor, voicemail ingesproken"

3. **Markeer als "Followed Up"**
   - Checkbox "Follow-up gedaan"
   - Optie verdwijnt uit alerts (maar blijft zichtbaar)

4. **Als Optie Definitief Verlopen:**
   - Wacht tot klant reageert OF
   - Na 7 dagen: verander status naar "Geannuleerd"

---

## 🔍 Overzicht van Status Overgangen

```
[⏰ OPTIE]
    │
    ├─ Klant bevestigt → [✅ BEVESTIGD]
    ├─ Klant annuleert → [🚫 GEANNULEERD]
    └─ Verloopt → Blijft [⏰ OPTIE] (maar krijgt "VERLOPEN" label)
         └─ Admin besluit → [🚫 GEANNULEERD] of [✅ BEVESTIGD]
```

---

## 📊 Capaciteit & Opties

### Hoe Opties Capaciteit Beïnvloeden:

```
Event Capaciteit: 100 personen

Bevestigde boekingen: 60 personen
Pending boekingen: 10 personen
OPTIES: 15 personen ← 🎯 DEZE TELLEN MEE!
─────────────────────────────────────
Beschikbaar: 15 personen (100 - 60 - 10 - 15)
```

### Waarom Tellen Opties Mee?

- ✅ Voorkomt dubbelboekingen
- ✅ Garandeert plaatsen voor optie-klanten
- ✅ Eerlijke capaciteitsverdeling

### Wat Als Optie Wordt Geannuleerd?

```
Opties: 15 personen → Geannuleerd
→ Beschikbaar: 30 personen (15 + 15) ✅
```
Plaatsen komen **onmiddellijk** vrij!

---

## ⚙️ Technische Details

### Automatische Berekeningen:
- **Plaatsing:** `optionPlacedAt = Nu`
- **Verloop:** `optionExpiresAt = optionPlacedAt + 7 dagen`
- **Status Check:** Elke keer pagina laadt

### Wanneer Verschijnen Alerts?
- Optie verloopt **binnen 2 dagen** OF
- Optie is **al verlopen**
- EN follow-up nog **niet gedaan** (`optionFollowedUp = false`)

### Database Velden:
```typescript
{
  status: 'option',
  optionPlacedAt: Date,        // Wanneer geplaatst
  optionExpiresAt: Date,       // Automatisch: +7 dagen
  optionNotes: string,         // Admin notities
  optionFollowedUp: boolean    // Follow-up gedaan?
}
```

---

## 💡 Best Practices

### ✅ DO's:
- ✅ Plaats optie **direct** bij telefonische aanvraag
- ✅ Check **dagelijks** de alert sectie
- ✅ Bel klanten **2 dagen voor verloop**
- ✅ Log alle communicatie in het systeem
- ✅ Annuleer verlopen opties die niet reageren (na 7 dagen)

### ❌ DON'Ts:
- ❌ Laat verlopen opties **niet te lang staan**
- ❌ Vergeet **niet** follow-up checkbox aan te vinken
- ❌ Geef verlopen optie **geen arrangement** zonder contact
- ❌ Verwijder opties **niet** (annuleren is beter voor historie)

---

## 🎯 Veelgestelde Vragen

### Q: Wat als klant pas na 7 dagen reageert?
**A:** Geen probleem! Optie blijft bestaan (status "VERLOPEN"). Je kunt alsnog:
- Status wijzigen naar "Bevestigd" (als er capaciteit is)
- Of nieuwe optie/boeking aanmaken

### Q: Kan ik de vervaldatum aanpassen?
**A:** Momenteel vast op 7 dagen. Voor langere holds: maak notitie en verleng handmatig.

### Q: Moet ik prijs invullen bij optie?
**A:** Nee! Prijs = €0 totdat status → "Bevestigd" met arrangement.

### Q: Kan klant zelf een optie plaatsen?
**A:** Nee, alleen via admin. Opties zijn voor telefonisch/persoonlijk contact.

### Q: Wat als event al vol is?
**A:** Je krijgt waarschuwing maar kunt alsnog optie plaatsen (overboeking mogelijk).

### Q: Hoe zie ik hoeveel opties er zijn per event?
**A:** Event Command Center toont:
```
⏰ Opties: 3 (25 personen)
```

---

## 📞 Workflow Voorbeeld

### **Typische Optie Flow:**

**Maandag 09:00** - Klant belt
```
"Hallo, ik wil graag 20 plaatsen reserveren voor 15 november,
 maar moet eerst met mijn team overleggen. Kan dat?"
```

**Maandag 09:05** - Admin plaatst optie
- Naam: Jan Jansen
- Tel: 06-12345678
- Personen: 20
- Notitie: "Belt terug na teammeeting vrijdag"
- Verloopt: Maandag 28 oktober (7 dagen later)

**Dinsdag 22 oktober** - Systeem toont alert
```
⚠️ Opties Vereisen Actie (1)
• Jan Jansen • 06-12345678 • 20 personen
  ⚠️ Verloopt over 6 dagen
```

**Donderdag 24 oktober** - Alert wordt urgent
```
⚠️ Verloopt over 4 dagen
```

**Vrijdag 25 oktober** - Admin belt
- Klant bevestigt!
- Admin vult email + adres + arrangement in
- Status → "Bevestigd"
- Prijs wordt berekend
- ✅ Boeking compleet

**Alternatief:** Klant reageert niet
- Maandag 28 oktober: Status = "🔴 VERLOPEN"
- Admin belt nogmaals
- Na 2 dagen geen reactie → Status = "Geannuleerd"
- 20 plaatsen komen vrij ✅

---

## 🎨 Visuele Herkenning

### In Reserveringen Lijst:

```
┌─────────────────────────────────────────────────┐
│ [⏰ OPTIE]  [⚠️ Verloopt morgen]               │
│ Jan Jansen • 06-12345678                        │
│ 📅 15 november • 20 personen                    │
│ [Bekijk] [Bewerken] [Annuleren]                │
└─────────────────────────────────────────────────┘
```

### Alert Sectie (Oranje Achtergrond):
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ⚠️ Opties Vereisen Actie (3)                  ┃
┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ┃
┃ De volgende opties zijn verlopen of verlopen  ┃
┃ binnenkort. Neem contact op met de klant!     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 📚 Meer Info

Voor uitgebreide technische documentatie, zie:
- `OPTION_SYSTEM_GUIDE.md` - Volledige technische gids
- `src/utils/optionHelpers.ts` - Helper functies
- `src/components/admin/ManualBookingManager.tsx` - Admin interface

---

## ✅ Checklist voor Dagelijks Gebruik

**Elke Ochtend:**
- [ ] Check alert sectie voor verlopen/verlopende opties
- [ ] Bel/mail klanten met opties die binnen 2 dagen verlopen
- [ ] Log alle communicatie

**Bij Nieuwe Optie:**
- [ ] Minimale gegevens compleet (naam, tel, aantal)
- [ ] Notities toegevoegd (wanneer klant terugbelt, etc.)
- [ ] Event geselecteerd
- [ ] Plaatsen beschikbaar gecontroleerd

**Bij Follow-up:**
- [ ] Klant gebeld/gemaild
- [ ] Communicatie gelogd
- [ ] Follow-up checkbox aangevinkt
- [ ] Status bijgewerkt (bevestigd of geannuleerd)

**Einde Week:**
- [ ] Verlopen opties die niet reageren → Annuleren
- [ ] Capaciteit vrijgegeven voor nieuwe boekingen

---

## 🎯 Snel Overzicht

| Actie | Locatie | Tijd |
|-------|---------|------|
| Optie plaatsen | Admin → Nieuwe Boeking | 30 sec |
| Opties bekijken | Reserveringen → Filter "Opties" | 5 sec |
| Alerts checken | Bovenaan Reserveringen pagina | Auto |
| Follow-up doen | Optie → Communicatie → Log | 1 min |
| Bevestigen | Optie → Bewerken → Status → Bevestigd | 2 min |
| Annuleren | Optie → Status → Geannuleerd | 10 sec |

---

**💡 TIP:** Gebruik de alert sectie als je dagelijkse to-do lijst voor opties!

---

**Laatste Update:** 25 Oktober 2025  
**Versie:** 1.0  
**Feature Status:** ✅ Volledig Geïmplementeerd en Actief
