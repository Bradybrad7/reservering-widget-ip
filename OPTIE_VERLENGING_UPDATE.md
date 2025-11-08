# 🆕 OPTIE SYSTEEM UPDATE - Custom Termijn & Verlenging

**Datum:** 25 Oktober 2025  
**Feature:** Flexibele opti termijnen & vervaldatum verlengen

---

## ✅ WAT IS ER TOEGEVOEGD?

### 1. **Custom Termijn bij Plaatsen** 🎯

Bij het aanmaken van een nieuwe optie kun je nu **zelf kiezen** hoe lang de optie geldig is:

#### **Quick Select Buttons:**
- 3 dagen (korte termijn)
- 7 dagen (**standaard**)
- 14 dagen (2 weken)
- 21 dagen (3 weken)

#### **Custom Input:**
- Type je eigen aantal dagen (1-90)
- Voorbeeld: 10 dagen, 28 dagen, etc.

#### **Live Preview:**
- Ziet direct de exacte vervaldatum
- Toont: "Verloopt op: woensdag 1 november 2025"

---

### 2. **Vervaldatum Verlengen** 📅

Voor **bestaande opties** kun je nu de vervaldatum verlengen:

#### **Locatie:**
- Open optie → Klik "Bewerken"
- Nieuwe sectie: "⏰ Optie Beheer"
- Klik "Vervaldatum Verlengen"

#### **Features:**
- **Huidige status** - Toont wanneer optie verloopt + status
- **Quick extends** - +3d, +7d, +14d, +30d
- **Custom extend** - Type eigen aantal dagen
- **Live preview** - Ziet nieuwe vervaldatum direct
- **One-click save** - Bevestig verlenging

#### **Visuele Feedback:**
- 🔴 Rood = Verlopen
- ⚠️ Oranje = Verloopt binnen 2 dagen  
- ✓ Groen = Nog geldig

---

## 🚀 HOE TE GEBRUIKEN

### **Scenario 1: Nieuwe Optie met Custom Termijn**

```
Admin → Reserveringen → Nieuwe Boeking

1. Selecteer "Optie" type
2. Kies geldigheidsduur:
   - Klik op "14 dagen" (2 weken)
   OF
   - Klik "Custom" en type "10"
3. Ziet vervaldatum preview
4. Vul rest van gegevens in
5. Klik "Optie Plaatsen"
```

**Voorbeeld Output:**
```
✅ Optie aangemaakt
📅 Geldig tot: dinsdag 5 november 2025, 14:30
🎯 20 plaatsen gereserveerd
```

---

### **Scenario 2: Bestaande Optie Verlengen**

**Situatie:** Klant belt op dag 6, vraagt om extra tijd

```
1. Open de optie (via Bekijk of Bewerken)
2. Scroll naar "⏰ Optie Beheer" sectie
3. Zie huidige status:
   ┌─────────────────────────────────────┐
   │ Verloopt op: Maandag 28 oktober     │
   │ ⚠️ VERLOOPT MORGEN                  │
   └─────────────────────────────────────┘

4. Klik "Vervaldatum Verlengen"
5. Kies verlenging:
   - Klik "+7d" (1 week extra)
   OR
   - Type "5" (5 dagen extra)
   
6. Zie nieuwe datum:
   Nieuwe vervaldatum: zaterdag 2 november 2025
   
7. Klik "✓ Bevestig Verlenging"
```

**Result:**
```
✅ Vervaldatum verlengd met 7 dagen!
📅 Nieuwe vervaldatum: zaterdag 2 november 2025
```

---

## 📊 TECHNISCHE DETAILS

### **Helper Functies (Vernieuwd)**

```typescript
// Bereken vervaldatum met custom dagen
calculateOptionExpiryDate(placedAt: Date, days: number = 7): Date

// Verleng bestaande optie
extendOptionExpiryDate(currentExpiryDate: Date, additionalDays: number): Date

// Stel custom vervaldatum in
setCustomOptionExpiryDate(newExpiryDate: Date): Date
```

### **Database Updates**

Bij verlengen wordt alleen `optionExpiresAt` bijgewerkt:
```typescript
{
  optionExpiresAt: Date, // Nieuwe vervaldatum
  updatedAt: Date        // Automatisch bijgewerkt
}
```

---

## 🎨 VISUELE INTERFACE

### **Bij Plaatsen (ManualBookingManager):**

```
┌──────────────────────────────────────────────┐
│ ⏰ Geldigheidsduur Optie                     │
├──────────────────────────────────────────────┤
│ [3 dagen] [7 dagen] [14 dagen] [21 dagen]   │
│                                              │
│ + Custom aantal dagen                        │
│                                              │
│ Verloopt op: woensdag 1 november 2025       │
└──────────────────────────────────────────────┘
```

### **Bij Bewerken (ReservationEditModal):**

```
┌──────────────────────────────────────────────┐
│ ⏰ Optie Beheer                              │
├──────────────────────────────────────────────┤
│ Geplaatst op: ma 21 oktober 2025, 14:30    │
│ Verloopt op:  ma 28 oktober 2025, 14:30    │
│                                              │
│ ⚠️ VERLOOPT MORGEN                          │
├──────────────────────────────────────────────┤
│ [Vervaldatum Verlengen]                     │
└──────────────────────────────────────────────┘

↓ Na klikken:

┌──────────────────────────────────────────────┐
│ Verlengen met aantal dagen:                  │
│ [+3d] [+7d] [+14d] [+30d]                   │
│                                              │
│ Custom: [____7____] dagen                    │
│                                              │
│ Nieuwe vervaldatum:                          │
│ zaterdag 2 november 2025                    │
├──────────────────────────────────────────────┤
│ [✓ Bevestig Verlenging] [Annuleren]        │
└──────────────────────────────────────────────┘
```

---

## 💡 USE CASES

### **Korte Termijn (3 dagen)**
```
Gebruik: Walk-in klant, morgen beslissing
Voorbeeld: "Ik check vanavond met mijn vrouw"
```

### **Standaard (7 dagen)**
```
Gebruik: Normale telefonische reservering
Voorbeeld: "Ik bel volgende week terug"
```

### **Lange Termijn (14-21 dagen)**
```
Gebruik: Grote groepen, budget overleg
Voorbeeld: "Directie vergadert over 2 weken"
```

### **Custom (bijv. 10 dagen)**
```
Gebruik: Specifieke afspraak met klant
Voorbeeld: "Ik heb op de 4e antwoord van mijn team"
```

### **Verlengen**
```
Scenario: Klant vraagt uitstel op laatste dag
Actie: Verleng met +3 of +7 dagen
Result: Klant krijgt extra tijd, plaatsen blijven gereserveerd
```

---

## ⚙️ CONFIGURATIE

### **Standaard Waarden:**
- Nieuwe optie: **7 dagen** (als geen custom gekozen)
- Minimum: **1 dag**
- Maximum: **90 dagen** (veiligheid)
- Verlengen: Snelle keuzes van **3, 7, 14, 30 dagen**

### **Alerts blijven werken:**
- Waarschuwing bij < 2 dagen voor alle termijnen
- Status berekening is dynamisch
- Works with alle custom termijnen

---

## 📞 PRAKTIJK VOORBEELDEN

### **Voorbeeld 1: Korte Optie**

**Ma 09:00** - Klant belt
```
"Ik wil 15 plaatsen, maar check eerst budget vandaag"
```

**Admin:** Plaatst 3-daagse optie
```
Vervaldatum: Donderdag 24 oktober
```

**Di 10:00** - Klant belt terug, bevestigt
```
Admin: Wijzig status → Bevestigd
Vul arrangement in
✅ Boeking compleet
```

---

### **Voorbeeld 2: Verlenging Nodig**

**Ma 21 okt** - 7-daagse optie geplaatst
```
Vervaldatum: Maandag 28 oktober
```

**Vr 25 okt** - Klant belt
```
"Sorry, kan ik 5 dagen extra krijgen? 
 Onze manager is ziek"
```

**Admin:** Verlengt optie
```
Open optie → Bewerken → Optie Beheer
Klik "Verlengen" → +5 dagen → Bevestig
Nieuwe datum: Zaterdag 2 november
✅ Verlengd!
```

**Za 2 nov** - Klant bevestigt
```
Status → Bevestigd
✅ Definitieve boeking
```

---

### **Voorbeeld 3: Lange Optie voor Groot Event**

**Ma 21 okt** - Corporate client belt
```
"We willen 50 plaatsen reserveren voor december,
 maar board meeting is pas 10 november"
```

**Admin:** Plaatst 21-daagse optie
```
Custom: 21 dagen
Vervaldatum: Vrijdag 15 november
(Na hun meeting op de 10e)
```

---

## ✅ VOORDELEN

### **Voor Admin:**
- ✅ Meer controle over termijnen
- ✅ Flexibiliteit per situatie
- ✅ Makkelijk verlengen zonder nieuwe optie
- ✅ Behoud historie (geen nieuwe ID)

### **Voor Klanten:**
- ✅ Passende termijnen voor hun situatie
- ✅ Mogelijkheid tot verlenging
- ✅ Geen stress over korte deadlines
- ✅ Plaatsen blijven gereserveerd

### **Voor Theater:**
- ✅ Betere capaciteitsplanning
- ✅ Minder verloren boekingen
- ✅ Duidelijke follow-up momenten
- ✅ Professionele service

---

## 🔧 BACKWARDS COMPATIBLE

### **Bestaande Opties:**
- ✅ Blijven gewoon 7 dagen (zoals voorheen)
- ✅ Kunnen alsnog verlengd worden
- ✅ Alle functionaliteit blijft werken

### **Migratie:**
- ⚠️ **Niet nodig** - Alles werkt out-of-the-box
- ✅ Helper functies zijn backwards compatible
- ✅ Default parameter = 7 dagen

---

## 📋 CHECKLIST VOOR GEBRUIK

**Bij Nieuwe Optie:**
- [ ] Overweeg situatie klant (kort/lang termijn?)
- [ ] Kies passende termijn (3/7/14/21 dagen)
- [ ] Of type custom aantal
- [ ] Check vervaldatum preview
- [ ] Plaats optie

**Bij Verlengingsverzoek:**
- [ ] Open optie
- [ ] Ga naar "Optie Beheer"
- [ ] Check huidige status
- [ ] Kies verlenging (quick of custom)
- [ ] Bevestig nieuwe datum
- [ ] Log contact in communicatie

**Follow-up:**
- [ ] Noteer nieuwe vervaldatum in agenda
- [ ] Stel reminder in
- [ ] Contact klant 2 dagen voor nieuwe deadline

---

## 🎯 TIPS & BEST PRACTICES

### ✅ DO's:
- ✅ Bespreek termijn met klant ("Wanneer heb je antwoord?")
- ✅ Geef iets meer tijd dan nodig (veiligheid)
- ✅ Log verlenging in communicatie
- ✅ Gebruik korte termijn voor walk-ins
- ✅ Gebruik lange termijn voor corporate

### ❌ DON'Ts:
- ❌ Te lange termijn zonder goede reden
- ❌ Vergeet niet nieuwe datum te communiceren
- ❌ Verleng niet zonder contact met klant
- ❌ Maak geen nieuwe optie, verleng bestaande

---

## 🚨 TROUBLESHOOTING

### **Q: Ik zie de custom input niet?**
**A:** Klik eerst op "+ Custom aantal dagen" link

### **Q: Kan ik vervaldatum verkorten?**
**A:** Ja! Type lagere waarde in custom input (bijv. -3 dagen via extend)

### **Q: Wat als ik verkeerde termijn heb gekozen?**
**A:** Open optie → Bewerken → Pas aan via Optie Beheer

### **Q: Blijft capaciteit gereserveerd na verlengen?**
**A:** Ja! Plaatsen blijven gereserveerd tot status wijzigt

### **Q: Kan klant zelf verlengen?**
**A:** Nee, alleen admin. Klant moet bellen/mailen.

---

## 📞 SUPPORT

Bij vragen over het nieuwe optie systeem:
- Check `OPTIE_SYSTEEM_HANDLEIDING.md` voor basisgebruik
- Check `OPTION_SYSTEM_GUIDE.md` voor technische details
- Check deze file voor verlengingsinstructies

---

**💡 TIP:** Communiceer altijd de nieuwe vervaldatum duidelijk met de klant!

---

**Laatste Update:** 25 Oktober 2025  
**Versie:** 2.0 (met custom termijn & verlenging)  
**Status:** ✅ Volledig Geïmplementeerd en Getest
