# 📊 Bulk Import Reserveringen - Herziene Handleiding

**October 31, 2025** - Template matcht nu exact met het boekingssysteem!

---

## ✅ Wat is er veranderd?

De bulk import template is **volledig herzien** om exact overeen te komen met hoe het boekingssysteem werkt:

### **Oude Problemen (Opgelost!):**
❌ ~~EventId invullen (dat kan niet!)~~  
❌ ~~Naam was samengevoegd (moet apart zijn)~~  
❌ ~~Miste veel velden die het systeem gebruikt~~  

### **Nieuwe Oplossing:**
✅ **Selecteer eerst het event** → Importeer PER event  
✅ **Voornaam en Achternaam apart** → Zoals in het systeem  
✅ **Alle velden beschikbaar** → Dieetwensen, add-ons, factuuradres, etc.  
✅ **Exacte template structuur** → Matcht 100% met boekingsformulier  

---

## 🚀 Hoe te gebruiken

### **Stap 1: Selecteer Event**
1. Open **Reserveringen** in admin panel
2. **Selecteer een specifiek event** (bijv. "31 oktober 2025")
3. Klik op **"Bulk Import"** knop

### **Stap 2: Download Template**
Klik op **"Download Template"** → Je krijgt een Excel bestand met:
- **Alle velden** uit het boekingssysteem
- **2 voorbeelden** (simpel + volledig)
- **Duidelijke headers** met * voor verplichte velden

### **Stap 3: Vul Template In**
Open het Excel bestand en vul de reserveringen in:

#### **Verplichte Velden (*):**
- `Voornaam*`
- `Achternaam*`
- `Email*`
- `Telefoonnummer*`
- `Adres*`
- `Huisnummer*`
- `Postcode*`
- `Stad*`
- `Land*`
- `Aantal Personen*`
- `Arrangement* (BWF/BWFM)`

#### **Optionele Velden:**
- Aanhef (Dhr/Mevr)
- Bedrijfsnaam
- BTW Nummer
- Factuuradres (apart als afwijkend)
- Feestvierder
- Pre-drink (ja/nee + aantal)
- After-party (ja/nee + aantal)
- Dieetwensen (vegetarisch, vegan, glutenvrij, etc.)
- Promocode / Vouchercode
- Opmerkingen
- Status (confirmed/pending)
- Betaalstatus (pending/paid)
- Tags

### **Stap 4: Upload & Preview**
1. Klik **"Upload Excel"**
2. Selecteer je ingevulde bestand
3. **Preview** → Zie alle rijen met validatie
   - ✅ Groen = Geldig
   - ❌ Rood = Fout (zie foutmeldingen)
   - ⚠️ Oranje = Waarschuwing

### **Stap 5: Importeer**
1. Controleer de preview
2. Klik **"Importeer X Reserveringen"**
3. Wacht tot klaar (progress bar)
4. **Resultaat:** Zie hoeveel succesvol / gefaald

---

## 📋 Template Structuur

De nieuwe template heeft **precies dezelfde velden** als het boekingsformulier:

### **Persoonlijke Gegevens**
```excel
Aanhef | Voornaam* | Achternaam* | Email* | Landcode Telefoon | Telefoonnummer*
```

### **Bedrijfsgegevens (optioneel)**
```excel
Bedrijfsnaam | BTW Nummer
```

### **Adres**
```excel
Adres* | Huisnummer* | Postcode* | Stad* | Land*
```

### **Factuuradres (optioneel)**
```excel
Factuur Adres | Factuur Huisnummer | Factuur Postcode | Factuur Stad | Factuur Land | Factuur Instructies
```
*Laat leeg als gelijk aan hoofdadres*

### **Boeking Details**
```excel
Aantal Personen* | Arrangement* (BWF/BWFM) | Feestvierder
```

### **Add-ons**
```excel
Pre-drink (ja/nee) | Pre-drink Aantal | After-party (ja/nee) | After-party Aantal
```

### **Dieetwensen**
```excel
Vegetarisch | Vegetarisch Aantal | Veganistisch | Veganistisch Aantal
Glutenvrij | Glutenvrij Aantal | Lactosevrij | Lactosevrij Aantal
Overig Dieet | Overig Dieet Aantal
```

### **Promoties & Admin**
```excel
Promocode | Vouchercode | Opmerkingen
Status (confirmed/pending) | Betaalstatus (pending/paid)
Factuurnummer | Betaalmethode | Tags (komma gescheiden)
```

---

## ✨ Automatische Berekeningen

Het systeem berekent automatisch:
- ✅ **Totaalprijs** op basis van:
  - Aantal personen × arrangement (BWF/BWFM)
  - Pre-drink (indien ja)
  - After-party (indien ja)
  - Event-specifieke prijzen
- ✅ **Contactpersoon** → Voornaam + Achternaam
- ✅ **Pricing Snapshot** → Volledige prijsopbouw
- ✅ **Event Koppeling** → Automatisch aan geselecteerd event

---

## 📝 Voorbeelden

### **Voorbeeld 1: Eenvoudig (Minimale velden)**
```
Voornaam: Jan
Achternaam: Jansen
Email: jan@email.com
Telefoonnummer: 0612345678
Adres: Voorbeeldstraat
Huisnummer: 123
Postcode: 1234AB
Stad: Amsterdam
Land: Nederland
Aantal Personen: 4
Arrangement: BWF
```

### **Voorbeeld 2: Volledig (Bedrijf met alles)**
```
Aanhef: Mevr
Voornaam: Marie
Achternaam: Bakker
Email: marie@bedrijf.nl
Telefoonnummer: 0687654321
Bedrijfsnaam: Bedrijf BV
BTW Nummer: NL123456789B01
Adres: Bedrijfslaan
Huisnummer: 456
Postcode: 5678CD
Stad: Rotterdam
Land: Nederland
Factuur Adres: Factuurafdeling
Factuur Huisnummer: 789
Factuur Postcode: 5678EF
Factuur Stad: Rotterdam
Aantal Personen: 8
Arrangement: BWFM
Feestvierder: Directeur Henk
Pre-drink: ja
Pre-drink Aantal: 8
After-party: ja
After-party Aantal: 6
Vegetarisch: ja
Vegetarisch Aantal: 2
Glutenvrij: ja
Glutenvrij Aantal: 1
Overig Dieet: Notenalergie
Overig Dieet Aantal: 1
Opmerkingen: Graag bij elkaar
Status: confirmed
Betaalstatus: paid
Tags: Bulk Import, VIP, Corporate
```

---

## ⚠️ Belangrijke Opmerkingen

### **Per Event Importeren**
- ✅ Selecteer ALTIJD eerst het event
- ✅ Alle reserveringen in het bestand gaan naar DÁT event
- ✅ Meerdere events? → Meerdere imports nodig

### **Geen EventId Veld!**
- ❌ **EventId is VERWIJDERD uit template**
- ✅ Event wordt automatisch gekoppeld aan geselecteerd event
- ✅ Dit voorkomt fouten (gebruikers weten eventId niet)

### **Naam Apart**
- ✅ Voornaam en Achternaam zijn **aparte velden**
- ✅ Contactpersoon wordt automatisch: `Voornaam + Achternaam`
- ✅ Dit matcht exact met het boekingsformulier

### **Ja/Nee Velden**
Voor velden zoals dieetwensen en add-ons:
- Type: `ja`, `yes`, `1`, `true` → TRUE
- Type: `nee`, `no`, `0`, `false` → FALSE
- Hoofdletters maakt niet uit

### **Tags**
- Meerdere tags? → Scheid met komma's
- Voorbeeld: `Bulk Import, VIP, Corporate`
- `Bulk Import` tag wordt altijd automatisch toegevoegd

---

## 🔧 Validatie

Het systeem controleert automatisch:

### **Fouten (Rood) - Blokkeert import:**
- ❌ Missende verplichte velden
- ❌ Ongeldig email formaat
- ❌ Arrangement niet BWF of BWFM
- ❌ Aantal personen < 1

### **Waarschuwingen (Oranje) - Import mogelijk:**
- ⚠️ Groot aantal personen (>50)
- ⚠️ Duplicate email in import bestand
- ⚠️ Missende optionele velden

---

## 🎯 Workflow Overzicht

```
1. ADMIN:        Selecteert event (bijv. "31 okt 2025")
                 ↓
2. ADMIN:        Klikt "Bulk Import"
                 ↓
3. ADMIN:        Download template
                 ↓
4. ADMIN:        Vult Excel in met alle reserveringen
                 ↓
5. ADMIN:        Upload ingevuld Excel bestand
                 ↓
6. SYSTEEM:      Valideert alle rijen
                 ↓
7. ADMIN:        Controleert preview (groen/rood)
                 ↓
8. ADMIN:        Klikt "Importeer"
                 ↓
9. SYSTEEM:      Importeert alle geldige reserveringen
                 ├─ Berekent prijzen
                 ├─ Koppelt aan event
                 ├─ Creëert communication log
                 └─ Voegt "Bulk Import" tag toe
                 ↓
10. RESULTAAT:   X succesvol, Y gefaald
```

---

## 🆕 Wat Werkt Nu Anders?

### **VOOR (Oud Systeem):**
```
❌ EventId invullen → Gebruiker weet dit niet!
❌ "Contactpersoon" veld → Naam was samengevoegd
❌ Weinig velden → Veel data ontbrak
❌ Geen dieetwensen, add-ons, etc.
```

### **NU (Nieuw Systeem):**
```
✅ Selecteer event eerst → EventId automatisch
✅ Voornaam + Achternaam apart → Exact zoals formulier
✅ ALLE velden beschikbaar → Complete data
✅ Dieetwensen, add-ons, factuuradres → Alles werkt!
```

---

## 📚 Veelgestelde Vragen

**Q: Moet ik eventId invullen?**  
A: **NEE!** Selecteer eerst het event, dan importeren. EventId wordt automatisch gekoppeld.

**Q: Kan ik meerdere events in 1 bestand?**  
A: **NEE.** Bulk import is altijd PER event. Meerdere events = meerdere imports.

**Q: Hoe vul ik dieetwensen in?**  
A: Type `ja` bij bijv. "Vegetarisch" en vul het aantal in bij "Vegetarisch Aantal".

**Q: Moet ik factuuradres invullen?**  
A: Alleen als het AFWIJKT van het hoofdadres. Anders leeg laten.

**Q: Wat als ik een fout maak?**  
A: Het systeem valideert alles VOOR import. Rode rijen worden niet geïmporteerd.

**Q: Kan ik merchandise importeren?**  
A: Nog niet. Voeg merchandise toe via "Bewerken" na import.

---

## ✅ Klaar!

De bulk import is nu **volledig aangepast** aan het echte boekingssysteem. 

**Template downloaden → Invullen → Importeren → Klaar!** 🎉

