# 🚀 QUICK START: Geavanceerde Features

## 1️⃣ Kortingscodes & Vouchers (5 minuten)

### Kortingscode Aanmaken
```
Admin → Kortingen & Vouchers → Nieuwe Kortingscode
```
- Code: `ZOMER2025`
- Type: Percentage → `10`%
- Geldig van/tot: Kies datums
- Opslaan

### Klant Gebruikt Code
```
Boekingswidget → OrderSummary → "Kortingscode of Voucher"
```
- Typ: `ZOMER2025`
- Klik "Toepassen"
- Korting wordt automatisch toegepast

---

## 2️⃣ CRM - Klanten Beheren (10 minuten)

### Klantprofiel Bekijken
```
Admin → Klanten → Zoek klant → Klik voor details
```
Zie:
- Totaal besteed: €1,234
- Aantal boekingen: 5
- Laatste boeking: 15 jan 2025
- Alle reserveringen

### VIP Tag Toevoegen
```
Klantprofiel → "+ Tag" → Typ "VIP" → Enter
```
Tag verschijnt nu op alle reserveringen van deze klant

### Top Klanten Vinden
```
Admin → Klanten → Sorteer op "Totaal besteed"
```
Eerste 10 = uw beste klanten!

---

## 3️⃣ Analytics Dashboard (15 minuten)

### Maandoverzicht
```
Admin → Analytics → Selecteer "Deze maand"
```
Zie:
- 💰 Omzet: €15,234
- 📊 Boekingen: 45
- 📈 Bezetting: 75%
- 🎭 Populairste arrangement: BWF (62%)

### Beste Events
```
Analytics → "Best Performing Events"
```
Top 10 events op omzet met bezettingsgraad

### Exporteer Data
```
Analytics → "Export CSV"
```
Download voor Excel/Sheets analyse

---

## 4️⃣ Email Reminders (Automatisch!)

### Setup (Eenmalig)
Bij nieuwe reservering:
- Pre-event reminder: Auto scheduled 3 dagen voor show
- Post-event follow-up: Auto scheduled 1 dag na show

### Monitoring
```typescript
// Check hoeveel reminders pending zijn
reminderService.getReminderStats()
```

### Handmatig Forceren
```typescript
// Force immediate send van pending reminders
reminderService.processPendingReminders()
```

---

## 🎯 Meest Gebruikte Features

### Marketing Campagne Starten
1. Maak code: `Admin → Kortingen → Nieuwe code`
2. Deel via email/social media
3. Monitor gebruik: `Admin → Kortingen → Klik op code → Zie "Gebruikt: X keer"`

### VIP Klanten Belonen
1. Zoek top klanten: `Admin → Klanten → Sort by spent`
2. Tag ze: Klik klant → `+ Tag → VIP`
3. Maak exclusieve code:
   ```
   Code: VIP20
   Waarde: 20%
   Min bedrag: €500
   ```

### Dormant Klanten Reactiveren
1. Filter: `Admin → Klanten → Laatste boeking > 6 maanden geleden`
2. Export lijst
3. Email campagne: "We missen je! 15% korting met code TERUG15"

### Maandelijks Rapport
1. `Admin → Analytics`
2. Selecteer vorige maand
3. Screenshot of Export CSV
4. Deel met team/eigenaar

---

## 📊 KPIs om Bij te Houden

| Metric | Waar | Doel |
|--------|------|------|
| **Omzet/maand** | Analytics → Revenue | Groei 10% MoM |
| **Bezettingsgraad** | Analytics → Occupancy | >70% |
| **Repeat rate** | Klanten → Repeat customers / Total | >30% |
| **Avg booking value** | Analytics → Revenue → Average | €350+ |
| **Code usage** | Kortingen → Stats | 20% van boekingen |

---

## 🔥 Power Tips

### 1. Seasonal Codes
```
ZOMER2025 (Jun-Aug): 10% off
HERFST2025 (Sep-Nov): 15% off  
KERST2025 (Dec): 20% off
```

### 2. Referral Program
```
Code: BRENGVRIEND
Waarde: €25 korting voor beide
Min bedrag: €200
```

### 3. Corporate Deals
```
Tag bedrijven als "Corporate"
Filter: Klanten → Tag: Corporate
Maak bulk code met 15% korting
```

### 4. Last-Minute Deals
```
Code: LAATSTE48
Waarde: 20% off
Alleen geldig 48u voor show
```

### 5. Customer Winback
```
Filter dormant klanten (>6 maanden)
Code: TERUG20
Waarde: 20% off
Email: "We hebben je gemist!"
```

---

## 🚨 Troubleshooting

### Code werkt niet?
✅ Check geldigheid (start/eind datum)
✅ Check max gebruik bereikt?
✅ Check min bedrag voldaan?
✅ Check arrangement geldig?

### Klant niet in CRM?
✅ Heeft klant geboekt met dit email adres?
✅ Check spelling email
✅ Refresh data: `Admin → Klanten → Refresh`

### Reminder niet verzonden?
✅ Check scheduled date (in verleden?)
✅ Force process: `reminderService.processPendingReminders()`
✅ Check console for errors

### Analytics klopt niet?
✅ Check date range filter
✅ Exclude cancelled reservations?
✅ Refresh browser

---

## 📞 Support

Technische vragen? Check:
- `ADVANCED_FEATURES_GUIDE.md` - Volledige documentatie
- `src/services/` - Service implementaties
- Console logs voor debug info

---

**Last Updated:** {{DATE}}
**Quick Reference Version:** 1.0.0
