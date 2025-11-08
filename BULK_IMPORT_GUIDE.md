# 📊 Bulk Import Reserveringen - Handleiding

## Overzicht

Met de **Bulk Import** functie kun je snel meerdere reserveringen voor een evenement tegelijk importeren via een Excel bestand. Perfect voor groepsboekingen, bedrijfsreserveringen of wanneer je reserveringen uit een andere bron hebt ontvangen.

## Hoe te Gebruiken

### Stap 1: Open de Bulk Import

1. Ga naar **Admin** → **Reserveringen**
2. Klik op de **"Bulk Import"** knop (paars)
3. Kies het evenement waarvoor je reserveringen wilt importeren
4. Het import venster opent

### Stap 2: Download de Template

1. Klik op **"Download Excel Template"**
2. Het systeem genereert automatisch een Excel bestand met:
   - Alle verplichte velden
   - 2 voorbeeldreserveringen
   - Juiste formaat en headers

### Stap 3: Vul de Template In

Open het Excel bestand en vul de volgende velden in:

#### Verplichte Velden (*)
- **Contactpersoon*** - Volledige naam van de contactpersoon
- **Email*** - Geldig email adres (wordt gevalideerd)
- **Telefoonnummer*** - Telefoonnummer (bijv. 0612345678)
- **Landcode** - Default: +31 (voor Nederland)
- **Aantal Personen*** - Minimum 1, maximum 50
- **Arrangement*** - Kies uit: `BWF` of `BWFM`

#### Optionele Velden
- **Bedrijfsnaam** - Naam van het bedrijf (indien zakelijke boeking)
- **BTW Nummer** - BTW nummer (bijv. NL123456789B01)
- **Adres** - Straatnaam
- **Huisnummer** - Huisnummer (inclusief toevoeging)
- **Postcode** - Postcode (bijv. 1234AB)
- **Stad** - Plaatsnaam
- **Land** - Standaard: Nederland
- **Opmerkingen** - Extra opmerkingen of wensen
- **Status** - `confirmed` of `pending` (standaard: confirmed)

### Stap 4: Upload het Bestand

1. Klik op **"Kies Excel Bestand"**
2. Selecteer je ingevulde Excel bestand
3. Het systeem valideert automatisch alle data

### Stap 5: Controleer de Preview

Je ziet nu een overzicht met:
- ✅ **Geldige rijen** (groen) - Deze kunnen worden geïmporteerd
- ❌ **Ongeldige rijen** (rood) - Deze bevatten fouten
- ⚠️ **Waarschuwingen** (geel) - Bijvoorbeeld grote groepen of dubbele emails

De tabel toont per rij:
- Rijnummer (uit Excel)
- Status (geldig/ongeldig)
- Contactpersoon
- Email
- Aantal personen
- Arrangement
- Eventuele foutmeldingen

### Stap 6: Importeer

1. Bekijk de validatie resultaten
2. Klik op **"Importeer X Reserveringen"**
3. Het systeem:
   - Maakt alle geldige reserveringen aan
   - Berekent automatisch de prijzen
   - Past de event capaciteit aan
   - Voegt een "Bulk Import" tag toe
   - Logt de import actie

### Stap 7: Resultaat

Na de import zie je:
- ✅ Aantal succesvol geïmporteerde reserveringen
- ❌ Aantal mislukte reserveringen (indien van toepassing)
- Eventuele foutmeldingen per rij

## Validatie Regels

### Automatische Validatie

Het systeem controleert automatisch:

1. **Verplichte velden**
   - Alle velden met * moeten ingevuld zijn
   - Leeg laten resulteert in een fout

2. **Email formaat**
   - Moet een geldig email adres zijn
   - Voorbeeld: naam@domein.nl

3. **Aantal personen**
   - Minimum: 1 persoon
   - Waarschuwing bij > 50 personen

4. **Arrangement**
   - Moet exact `BWF` of `BWFM` zijn (hoofdlettergevoelig)
   - Andere waarden worden afgekeurd

5. **Dubbele emails**
   - Wordt gedetecteerd binnen de import
   - Geeft waarschuwing maar staat import toe

### Prijs Berekening

Prijzen worden automatisch berekend:
- **BWF**: €32,50 per persoon
- **BWFM**: €37,50 per persoon
- Merchandise: nog niet ondersteund in bulk import
- Voor- en nadrankje: nog niet ondersteund in bulk import

## Tips & Best Practices

### ✅ Do's

- **Download altijd de template** - Dit garandeert het juiste formaat
- **Test eerst met 2-3 rijen** - Voordat je grote bestanden importeert
- **Controleer email adressen** - Deze worden gebruikt voor communicatie
- **Gebruik dubbele namen** - Bijvoorbeeld "Jan de Vries" in Contactpersoon
- **Bewaar je Excel bestanden** - Voor eventuele correcties later

### ❌ Don'ts

- **Verander geen kolomnamen** - Het systeem verwacht exacte headers
- **Gebruik geen speciale tekens** - In arrangement veld (alleen BWF/BWFM)
- **Laat verplichte velden niet leeg** - Dit voorkomt fouten
- **Overschrijd capaciteit niet** - Check eerst beschikbare plaatsen

## Veelvoorkomende Fouten

### "Email is verplicht"
**Oplossing**: Vul een geldig email adres in kolom "Email*"

### "Arrangement moet BWF of BWFM zijn"
**Oplossing**: Zorg dat je exact `BWF` of `BWFM` gebruikt (hoofdletters!)

### "Aantal personen moet minimaal 1 zijn"
**Oplossing**: Vul een getal in (geen tekst) in kolom "Aantal Personen*"

### "Ongeldig email formaat"
**Oplossing**: Controleer of email adres correct is: naam@domein.nl

## Capaciteit Management

Let op:
- Elke geïmporteerde reservering telt mee voor de event capaciteit
- Status `confirmed` reserveert direct de plaatsen
- Status `pending` reserveert ook plaatsen (ter bevestiging)
- Bij overschrijding wordt automatisch de wachtlijst geactiveerd

## Na de Import

### Wat gebeurt er automatisch?

1. ✅ Reserveringen worden aangemaakt met status `confirmed` of `pending`
2. 💰 Payment status wordt gezet op `pending`
3. 🏷️ Tag "Bulk Import" wordt toegevoegd
4. 📊 Event capaciteit wordt bijgewerkt
5. 📝 Import actie wordt gelogd in communicatie log

### Volgende Stappen

Na succesvolle import kun je:
- Reserveringen bekijken in de lijst
- Details controleren per reservering
- Payment status bijwerken
- Bevestigingsmails versturen (handmatig)
- Extra notities toevoegen

## Geavanceerde Features

### Status Types

- **confirmed** - Direct bevestigde reservering (aanbevolen voor bulk import)
- **pending** - Nog te bevestigen reservering

### Tags

Alle geïmporteerde reserveringen krijgen automatisch:
- Tag: `Bulk Import`
- Dit helpt bij filteren en rapportage

### Communication Log

Elke import wordt gelogd:
```
Type: Note
Message: "Reservering geïmporteerd via bulk import"
Author: Admin
Timestamp: [import datum/tijd]
```

## Troubleshooting

### Import lijkt te hangen
**Mogelijk**: Grote hoeveelheid data wordt verwerkt
**Actie**: Wacht even, de voortgangsbalk toont de status

### Sommige rijen niet geïmporteerd
**Mogelijk**: Validatie fouten in die rijen
**Actie**: Bekijk de foutmeldingen in de preview tabel

### Capaciteit overschreden
**Mogelijk**: Meer reserveringen dan beschikbare plaatsen
**Actie**: Geldige reserveringen worden alsnog geïmporteerd, wachtlijst wordt geactiveerd

### Excel bestand wordt niet herkend
**Mogelijk**: Verkeerd formaat of beschadigd bestand
**Actie**: Download opnieuw de template en vul die in

## Support

Bij vragen of problemen:
1. Controleer eerst deze handleiding
2. Test met de template voorbeelddata
3. Check de validatie berichten in de preview
4. Neem contact op met de systeembeheerder

---

## Quick Reference

### Minimale Reservering (alleen verplichte velden)

| Contactpersoon* | Email* | Telefoonnummer* | Landcode | Aantal Personen* | Arrangement* |
|-----------------|---------|-----------------|----------|------------------|--------------|
| Jan Jansen | jan@email.com | 0612345678 | +31 | 4 | BWF |

### Volledige Reservering (alle velden)

| Contactpersoon* | Email* | Telefoonnummer* | Landcode | Aantal Personen* | Arrangement* | Bedrijfsnaam | BTW Nummer | Adres | Huisnummer | Postcode | Stad | Land | Opmerkingen | Status |
|-----------------|---------|-----------------|----------|------------------|--------------|--------------|------------|-------|------------|----------|------|------|-------------|--------|
| Marie Bakker | marie@bedrijf.nl | 0687654321 | +31 | 8 | BWFM | Bedrijf BV | NL123456789B01 | Bedrijfslaan | 456 | 5678CD | Rotterdam | Nederland | Graag bij elkaar | confirmed |

---

**Laatste update**: Oktober 2025
**Versie**: 1.0
