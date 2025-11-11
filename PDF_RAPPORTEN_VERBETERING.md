# 📋 PDF Rapporten Verbetering - November 2025

## 🎯 Overzicht

De PDF-rapporten zijn volledig vernieuwd met:
- **Nieuw Dagelijks Draaiboek**: Combineert alle operationele info in één document
- **Gouden branding**: Professionele uitstraling consistent met facturen
- **Visuele waarschuwingen**: Kleurgecodeerde secties voor snelle herkenning
- **QR codes**: Check-in functionaliteit direct in het rapport
- **Verbeterde leesbaarheid**: Duidelijke layout geoptimaliseerd voor print

---

## 🆕 Het Nieuwe: Dagelijks Draaiboek

### Wat is het?

Het **Dagelijks Draaiboek** is een alles-in-één operationeel rapport dat de drie oude losse rapporten (Gastenlijst, Allergie, Merchandise) vervangt. Het is speciaal ontworpen voor dagelijks gebruik door receptie, keuken en management.

### Wat staat erin?

Voor elke reservering wordt een overzichtelijk "blok" getoond met:

#### 📋 Basisinformatie
- **Naam en bedrijf** (vetgedrukt voor zichtbaarheid)
- **Contactgegevens**: Email en telefoon
- **Aantal personen** en arrangement
- **Feestvierder** (als van toepassing)
- **Tags** (VIP, PERS, GENODIGDE, etc.) met gouden badges

#### 🍽️ Dieetwensen (rode achtergrond)
- Volledig overzicht van vegetarisch, veganistisch, glutenvrij, lactosevrij
- Aantal personen per dieetwens
- Extra opmerkingen

#### 🛍️ Merchandise (blauwe achtergrond)
- Bestelde items met aantallen
- Direct zichtbaar wat voorbereid moet worden

#### 💬 Opmerkingen (oranje achtergrond)
- Alle speciale verzoeken en notities
- Belangrijke informatie voor het personeel

#### 📱 QR Code
- Unieke QR code per reservering
- Scanbaar voor snelle check-in
- Bevat reserverings-ID en event info

### Visuele Kleurcodering

```
🍽️ Licht Rood (RGB: 255, 235, 235) → Dieetwensen
🛍️ Licht Blauw (RGB: 235, 245, 255) → Merchandise
💬 Licht Oranje (RGB: 255, 243, 224) → Opmerkingen
⭐ Licht Goud (RGB: 255, 250, 235) → VIP/Speciale gasten
```

### Voordelen

✅ **Één document in plaats van drie** - Minder printen, minder zoeken  
✅ **In één oogopslag zien** - Kleurcodering maakt het overzichtelijk  
✅ **QR codes voor check-in** - Moderne workflow  
✅ **Gegroepeerd per datum** - Logische indeling voor dagelijks gebruik  
✅ **Professionele uitstraling** - Gouden branding  

---

## 🎨 Gouden Branding

Alle rapporten gebruiken nu de **gouden merkkleur** (RGB: 212, 175, 55) voor:
- Headers en titels
- Tabel headers
- Visuele accenten

Dit zorgt voor een professionele en herkenbare uitstraling, consistent met de facturen.

### Voor en Na

**Oud systeem:**
- Gastenlijst: Blauwe header
- Allergie lijst: Rode header
- Merchandise lijst: Paarse header
- Weekoverzicht: Groene header

**Nieuw systeem:**
- Alle rapporten: **Gouden header** 🎨
- Consistent merkbeeld
- Professionele uitstraling

---

## 📊 Legacy Rapporten (Verbeterd)

De oude losse rapporten zijn nog steeds beschikbaar, maar nu met verbeterde styling:

### 1. Gastenlijst
- Gouden header
- Overzichtelijke tabel
- Basis contactinformatie

**Gebruik:** Simpele check zonder details

### 2. Keukenlijst (Dieetwensen)
- Gouden header
- Rode waarschuwingsbox met totalen
- Gedetailleerde tabel per reservering

**Gebruik:** Specifiek voor keuken

### 3. Merchandise Lijst
- Gouden header
- Totaaloverzicht per item
- Details per reservering

**Gebruik:** Picklijst voor merchandise voorbereidingen

### 4. Weekoverzicht
- Gouden header
- Management statistieken
- Omzetoverzicht
- Gouden totalen box

**Gebruik:** Planning en management

---

## 🔧 Technische Implementatie

### Bestanden

```
src/
├── services/
│   ├── operationalPdfService.ts   # 🆕 Nieuwe service voor Dagelijks Draaiboek
│   └── pdfService.ts               # Bestaande service voor facturen/bevestigingen
├── components/
│   └── admin/
│       ├── PDFExportManager.tsx    # ✨ Updated met nieuwe features
│       └── QRCodeGenerator.tsx      # Gebruikt voor QR codes
```

### Dependencies

```json
{
  "jspdf": "^2.5.2",
  "jspdf-autotable": "^3.8.4",
  "qrcode": "^1.5.4",
  "qrcode.react": "^4.2.0"
}
```

### QR Code Formaat

```typescript
{
  type: 'reservation',
  id: reservation.id,
  eventId: reservation.eventId,
  companyName: reservation.companyName,
  timestamp: new Date().toISOString()
}
```

---

## 📖 Gebruikersgids

### Hoe gebruik je het nieuwe systeem?

#### Stap 1: Selecteer Datum Bereik
In het admin panel, ga naar "PDF Rapporten" en selecteer de gewenste periode.

#### Stap 2: Kies het Dagelijks Draaiboek
Klik op de grote **gouden knop** met "🎯 Dagelijks Draaiboek".

#### Stap 3: Print of Bewaar
De PDF download automatisch. Print deze voor dagelijks gebruik.

### Wanneer welk rapport?

| Situatie | Rapport |
|----------|---------|
| **Dagelijkse operaties** | 🎯 Dagelijks Draaiboek |
| **Check-in bij de deur** | 🎯 Dagelijks Draaiboek (met QR codes) |
| **Keuken voorbereidingen** | 🍽️ Keukenlijst OF Dagelijks Draaiboek |
| **Merchandise picken** | 🛍️ Merchandise Lijst OF Dagelijks Draaiboek |
| **Management overzicht** | 📅 Weekoverzicht |
| **Simpele namenlijst** | 👥 Gastenlijst |

### Tips voor Gebruik

1. **Print het Dagelijks Draaiboek aan het begin van de dag**
   - Geeft complete overzicht voor hele team
   - QR codes werken direct bij de deur

2. **Gebruik de kleurcodering**
   - Rood = Keuken moet weten
   - Blauw = Merchandise moet klaar
   - Oranje = Speciale aandacht nodig

3. **Scan QR codes bij check-in**
   - Sneller dan handmatig zoeken
   - Foutloos registreren

---

## 🚀 Toekomstige Verbeteringen

Mogelijke uitbreidingen:

- [ ] Email verzending van rapporten op vaste tijden
- [ ] Automatische notificaties bij dieetwensen
- [ ] Integratie met kassasysteem via QR codes
- [ ] Multi-dag rapporten voor festivals/events
- [ ] Export naar Excel naast PDF

---

## 🎨 Design Kleuren Referentie

### Merkkleur (Goud)
```
RGB: 212, 175, 55
Hex: #D4AF37
Gebruik: Headers, titels, branding
```

### Waarschuwingskleuren
```
Dieetwensen (Rood):
RGB: 255, 235, 235
Hex: #FFEBEB

Merchandise (Blauw):
RGB: 235, 245, 255
Hex: #EBF5FF

Opmerkingen (Oranje):
RGB: 255, 243, 224
Hex: #FFF3E0

VIP/Speciaal (Goud):
RGB: 255, 250, 235
Hex: #FFFAEB
```

---

## ✅ Checklist voor Gebruik

- [ ] Test het nieuwe Dagelijks Draaiboek met echte data
- [ ] Train personeel in het lezen van kleurcodering
- [ ] Zorg voor QR code scanner bij de deur
- [ ] Print testpagina om kleuren te verifiëren
- [ ] Evalueer na 1 week of losse rapporten nog nodig zijn

---

## 📝 Wijzigingslog

### November 11, 2025
- ✨ Nieuw: Dagelijks Draaiboek met alles-in-één functionaliteit
- 🎨 Gouden branding toegevoegd aan alle rapporten
- 📱 QR codes geïntegreerd voor check-in
- 🎯 Kleurgecodeerde secties voor snelle herkenning
- ✅ Legacy rapporten verbeterd met nieuwe styling

---

**Gemaakt met ❤️ voor Inspiration Point Comedy Theater**
