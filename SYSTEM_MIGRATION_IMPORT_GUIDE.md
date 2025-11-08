# 🔄 Systeem Migratie Import - Handleiding

## Overzicht

Met de **Systeem Migratie Import** functie kun je alle reserveringen uit je oude reserveringssysteem importeren in het nieuwe systeem. Dit is een eenmalige migratie-tool die speciaal is ontworpen voor het overzetten van historische en toekomstige reserveringen.

## Wanneer Gebruiken?

- ✅ **Eerste keer setup**: Je lanceert het nieuwe systeem en wilt alle bestaande reserveringen overzetten
- ✅ **Historische data**: Je wilt oude reserveringen behouden voor rapportage en klantgeschiedenis
- ✅ **Bulk migratie**: Je hebt honderden reserveringen die je in één keer wilt importeren

## Verschil met Bulk Import

| Feature | Systeem Migratie Import | Bulk Import (per event) |
|---------|------------------------|------------------------|
| **Gebruik** | Eenmalige migratie oud → nieuw systeem | Reguliere bulk reserveringen per event |
| **Event selectie** | Meerdere events in één CSV | Alleen voor 1 specifiek event |
| **Status** | Alle statussen (confirmed, pending, cancelled, etc.) | Meestal alleen confirmed/pending |
| **Timestamps** | Behoudt originele createdAt | Gebruikt huidige datum |
| **Payment tracking** | Volledige payment historie | Basis betaalstatus |
| **Metadata** | Extra import tracking velden | Standaard velden |

## Hoe te Gebruiken

### Voorbereiding (Belangrijk!)

#### 1. **Maak eerst alle events aan**
   
   ⚠️ **KRITISCH**: Voordat je importeert, moeten alle events al in het nieuwe systeem bestaan!
   
   - Ga naar **Admin → Evenementen**
   - Maak alle events aan (datum, tijden, capaciteit, etc.)
   - Noteer de **Event ID's** (bijv. `evt_abc123`) - deze heb je nodig voor de CSV

#### 2. **Exporteer data uit oud systeem**
   
   - Haal alle reserveringen uit je oude systeem
   - Exporteer als CSV of Excel
   - Zorg dat je alle relevante data hebt (contactgegevens, betaalstatus, etc.)

### Stap-voor-Stap Import

#### Stap 1: Open de Import Tool

1. Ga naar **Admin → Reserveringen**
2. Klik op de **"Systeem Import"** knop (paars, naast "Nieuwe Reservering")
3. Het import scherm opent

#### Stap 2: Download het Template

1. Klik op **"Download Template"**
2. Een Excel bestand wordt gedownload met:
   - Alle benodigde kolommen met correcte namen
   - 2 voorbeeldrijen met correcte data formaten
   - Automatische datum/tijd formatting

#### Stap 3: Vul het Template In

Open het template in Excel of Google Sheets en vul de data in:

##### 🔴 Verplichte Velden

| Veld | Beschrijving | Voorbeeld |
|------|-------------|-----------|
| `eventId` | ID van het event in nieuw systeem | `evt_abc123example` |
| `contactPerson` | Volledige naam contactpersoon | `Jan de Vries` |
| `email` | Email adres | `jan@voorbeeld.nl` |
| `phone` | Telefoonnummer | `0612345678` |
| `numberOfPersons` | Aantal personen | `10` |
| `arrangement` | Type arrangement | `BWF` of `BWFM` |
| `totalPrice` | Totaalprijs in euro's | `750.00` |
| `status` | Reserveringsstatus | `confirmed`, `pending`, `cancelled`, `rejected`, `checked-in`, `request`, `option` |
| `paymentStatus` | Betaalstatus | `paid`, `pending`, `overdue`, `refunded`, `not_applicable` |
| `createdAt` | Aanmaak datum/tijd (ISO format) | `2024-10-25T14:30:00.000Z` |

##### 🟡 Aanbevolen Velden

| Veld | Beschrijving | Voorbeeld |
|------|-------------|-----------|
| `eventDate` | Event datum (referentie) | `2025-10-20` |
| `phoneCountryCode` | Landcode telefoon | `+31` |
| `companyName` | Bedrijfsnaam | `Voorbeeld BV` |
| `vatNumber` | BTW nummer | `NL123456789B01` |
| `address` | Straatnaam | `Voorbeeldstraat` |
| `houseNumber` | Huisnummer | `123` |
| `postalCode` | Postcode | `1234AB` |
| `city` | Plaatsnaam | `Amsterdam` |
| `country` | Land | `Nederland` |
| `comments` | Klant opmerkingen | `Graag bij het raam` |
| `notes` | Interne admin notities | `VIP klant - extra aandacht` |
| `isWaitlist` | Op wachtlijst? | `TRUE` of `FALSE` |
| `paymentMethod` | Betaalmethode | `bank`, `cash`, `card` |
| `invoiceNumber` | Factuurnummer | `INV-2024-001` |

#### Tips voor het Invullen

**Event ID's ophalen:**
```
1. Ga naar Admin → Evenementen
2. Klik op een event
3. De ID staat in de URL: /admin/events/evt_abc123
4. Kopieer deze ID naar je CSV
```

**Datum Formaat:**
- `createdAt` moet ISO 8601 format zijn: `2024-10-25T14:30:00.000Z`
- Excel tip: Gebruik `=TEXT(A1,"yyyy-mm-dd")&"T"&TEXT(B1,"hh:mm:ss")&".000Z"`
- Of handmatig: `YYYY-MM-DDTHH:MM:SS.000Z`

**Status waarden:**
- `confirmed` - Bevestigde reservering (meest gebruikt bij migratie)
- `pending` - Nog te bevestigen (admin moet actie ondernemen)
- `cancelled` - Geannuleerd
- `rejected` - Afgewezen
- `checked-in` - Al ingecheckt (voor historische events)
- `option` - Optie reservering
- `request` - Aanvraag

**Payment Status waarden:**
- `paid` - Betaald (meest gebruikt)
- `pending` - Betaling uitstaand
- `overdue` - Betaling te laat
- `refunded` - Terugbetaald
- `not_applicable` - Niet van toepassing (bijv. gratis event)

#### Stap 4: Upload het Bestand

1. Klik op **"Kies Excel Bestand"** of sleep het bestand
2. Het systeem leest en valideert automatisch alle rijen
3. Je ziet een preview met:
   - ✅ Groene vinkjes voor geldige rijen
   - ❌ Rode kruisjes voor ongeldige rijen
   - ⚠️ Gele waarschuwingen voor ontbrekende optionele velden

#### Stap 5: Controleer de Preview

Het systeem toont:

**Statistieken:**
- Aantal geldige rijen (kunnen geïmporteerd worden)
- Aantal ongeldige rijen (fouten die gecorrigeerd moeten worden)
- Aantal waarschuwingen (optionele velden die ontbreken)

**Data Tabel:**
- Alle rijen met status indicator
- Belangrijkste velden voor snelle controle
- Klik op rijen voor details

**Fouten (indien aanwezig):**
- Lijst van alle fouten per rij
- Duidelijke uitleg wat er mis is
- Je kunt terug naar stap 1 om het bestand te corrigeren

#### Stap 6: Start de Import

1. Als er geen fouten zijn, klik op **"Start Import"**
2. Het systeem importeert alle geldige rijen
3. Je ziet een voortgangsbalk (0-100%)
4. Wacht tot de import klaar is (kan enkele minuten duren bij veel data)

#### Stap 7: Resultaten

Na de import zie je:

**Succes:**
- ✅ Aantal succesvol geïmporteerde reserveringen
- Lijst van aangemaakte reservation ID's

**Mislukt (indien van toepassing):**
- ❌ Aantal mislukte imports
- Gedetailleerde foutmeldingen per rij
- Je kunt deze rijen corrigeren en opnieuw importeren

## Veelvoorkomende Problemen & Oplossingen

### Probleem: "Event niet gevonden"

**Oorzaak:** De `eventId` in je CSV bestaat niet in het nieuwe systeem.

**Oplossing:**
1. Controleer of je alle events hebt aangemaakt in Admin → Evenementen
2. Kopieer de exacte Event ID's uit de URL's
3. Gebruik precies dezelfde ID's in je CSV

### Probleem: "Email is niet geldig"

**Oorzaak:** Email adres formaat is incorrect of ontbreekt.

**Oplossing:**
- Zorg dat elk email adres een `@` en een `.` bevat
- Geen spaties in email adressen
- Voorbeeld correct: `jan@voorbeeld.nl`
- Voorbeeld fout: `jan @voorbeeld`, `jan.nl`

### Probleem: "Status moet ... zijn"

**Oorzaak:** Status waarde is niet een van de toegestane waarden.

**Oplossing:**
Gebruik EXACT een van deze waarden (let op hoofdletters):
- `confirmed`
- `pending`
- `cancelled`
- `rejected`
- `checked-in`
- `request`
- `option`

### Probleem: "Arrangement moet BWF of BWFM zijn"

**Oorzaak:** Arrangement kolom bevat een andere waarde.

**Oplossing:**
- Alleen `BWF` of `BWFM` zijn toegestaan
- Let op hoofdletters (moet VOLLEDIG HOOFDLETTERS)
- Geen spaties of extra tekens

### Probleem: Import duurt lang

**Dit is normaal:**
- 100 reserveringen ≈ 1-2 minuten
- 500 reserveringen ≈ 5-10 minuten
- 1000+ reserveringen ≈ 10-20 minuten

Het systeem moet voor elke reservering:
- Data valideren
- Event capaciteit updaten
- Betaalstatus controleren
- Database schrijven
- Notificaties triggeren (indien van toepassing)

**Tip:** Importeer in batches van 200-300 reserveringen voor betere controle.

## Best Practices

### 1. Test Eerst Met Klein Bestand

- Maak een test CSV met 5-10 reserveringen
- Test de import flow volledig
- Controleer of de data correct in het systeem staat
- Pas eventueel je mapping aan
- Dan pas de volledige import doen

### 2. Backup Je Oude Systeem

- Export alle data uit je oude systeem
- Bewaar meerdere kopieën
- Zorg dat je terug kunt als er iets misgaat

### 3. Splits Grote Imports

In plaats van 1 bestand met 1000 reserveringen:
- Maak 5 bestanden van 200 reserveringen
- Importeer per maand of per event type
- Makkelijker te controleren
- Fouten zijn geïsoleerd

### 4. Controleer Na Import

Na succesvolle import:
- Ga naar Admin → Reserveringen
- Filter op geïmporteerde datum
- Controleer random samples
- Check totaal aantal reserveringen
- Verifieer betaalstatussen

### 5. Communiceer Met Klanten

Voor bestaande klanten met reserveringen:
- Stuur een email over systeem upgrade
- Vermeld dat hun reservering behouden blijft
- Geef nieuwe portal link indien van toepassing
- Bied support aan bij vragen

## Data Mapping Voorbeelden

### Voorbeeld 1: Eenvoudig Systeem

**Oud systeem heeft:**
- Naam
- Email
- Telefoonnummer
- Aantal personen
- Datum
- Betaald ja/nee

**Mapping naar nieuw systeem:**
```
contactPerson = Naam
email = Email
phone = Telefoonnummer
numberOfPersons = Aantal personen
eventId = [handmatig opzoeken per datum]
arrangement = BWF [altijd, als je maar 1 type hebt]
totalPrice = [bereken: aantal * prijs_per_persoon]
status = confirmed [als alles bevestigd is]
paymentStatus = paid als "Betaald"=ja, anders pending
createdAt = [gebruik originele boekingsdatum]
```

### Voorbeeld 2: Geavanceerd Systeem

**Oud systeem heeft:**
- Volledige klantgegevens
- Bedrijfsinfo
- Adressen
- Factuurgegevens
- Betaalhistorie
- Interne notities

**Mapping:**
Gebruik alle beschikbare velden in het template. Dit behoudt de volledige klantgeschiedenis.

## Excel Formules (Nuttig!)

### Event ID Lookup

Als je een mapping tabel hebt van oude event ID's naar nieuwe:

```excel
=VLOOKUP(A2, MappingSheet!A:B, 2, FALSE)
```

### Datum Conversie

Van Excel datum naar ISO format:

```excel
=TEXT(A2,"yyyy-mm-dd")&"T12:00:00.000Z"
```

### Status Mapping

Van Nederlandse tekst naar systeem status:

```excel
=IF(A2="Bevestigd","confirmed",IF(A2="In afwachting","pending",IF(A2="Geannuleerd","cancelled","pending")))
```

### Prijs Berekening

Als je prijs moet berekenen:

```excel
=B2*IF(C2="BWFM",75,65)
// B2 = aantal personen
// C2 = arrangement type
// 75 = prijs BWFM, 65 = prijs BWF
```

## Technische Details

### Import Mechanisme

De import gebruikt de standaard `apiService.submitReservation` functie, wat betekent:

1. ✅ Alle business logic wordt toegepast
2. ✅ Capaciteit wordt correct bijgewerkt
3. ✅ Validaties worden uitgevoerd
4. ✅ Data integriteit is gegarandeerd

Na de eerste save wordt de reservering bijgewerkt met:
- Originele status (i.p.v. altijd "pending")
- Originele payment status
- Originele createdAt timestamp
- Extra import metadata in notes veld

### Performance

- Import verloopt **sequentieel** (niet parallel) voor data integriteit
- Ongeveer **200-400ms per reservering**
- Inclusief alle validaties en database writes
- Voortgangsbalk update na elke 10 reserveringen

### Data Integriteit

Het systeem garandeert:
- ✅ Geen dubbele imports (email + event combinatie check)
- ✅ Correcte capaciteit tracking
- ✅ Referentiële integriteit (event moet bestaan)
- ✅ Transactionele saves (alles of niets per reservering)

## Veelgestelde Vragen

### Q: Kan ik meerdere keren importeren?

**A:** Ja, maar let op duplicaten. Het systeem checkt op email + event combinatie. Als je dezelfde data opnieuw importeert, worden duplicaten geweigerd.

### Q: Wat gebeurt er met capaciteit?

**A:** Elke geïmporteerde reservering telt mee voor de capaciteit van het event. Als je 50 reserveringen importeert voor een event met capaciteit 100, blijven er 50 plekken over.

### Q: Kan ik de import ongedaan maken?

**A:** Er is geen automatische "undo" functie. Je kunt geïmporteerde reserveringen handmatig verwijderen via Admin → Reserveringen. Filter op "Notes" bevat "[IMPORT]" om ze te vinden.

### Q: Worden er notificaties verstuurd?

**A:** Nee, bij import worden GEEN email notificaties naar klanten gestuurd. Dit voorkomt spam bij het importeren van historische data.

### Q: Wat als mijn oude systeem andere arrangement types heeft?

**A:** Je moet mappen naar `BWF` of `BWFM`. Als je oude systeem bijv. "Basis", "Premium", "VIP" heeft, kies dan:
- Basis/Standard → `BWF`
- Premium/VIP/Deluxe → `BWFM`

### Q: Kan ik merchandise items importeren?

**A:** Momenteel niet via het template. Merchandise moet handmatig worden toegevoegd per reservering na import.

## Support

Bij problemen of vragen:

1. **Check eerst deze handleiding** - De meeste problemen worden hier behandeld
2. **Controleer de error messages** - Ze zijn specifiek en helpen bij debuggen
3. **Test met klein bestand** - Isoleer het probleem
4. **Bewaar je originele data** - Zodat je opnieuw kunt proberen

## Checklist Voor Succesvolle Migratie

- [ ] Backup gemaakt van oud systeem
- [ ] Alle events aangemaakt in nieuw systeem
- [ ] Event ID's verzameld en gedocumenteerd
- [ ] Template gedownload
- [ ] Data gemapped naar correcte kolommen
- [ ] Status en payment status waarden gecontroleerd
- [ ] Datum formaat correct (ISO 8601)
- [ ] Test import gedaan met 5-10 reserveringen
- [ ] Test data gecontroleerd in systeem
- [ ] Volledige import uitgevoerd
- [ ] Resultaten gecontroleerd
- [ ] Random samples geverifieerd
- [ ] Klanten geïnformeerd over nieuwe systeem

---

**Datum:** 31 oktober 2025
**Versie:** 1.0
**Status:** ✅ Production Ready
