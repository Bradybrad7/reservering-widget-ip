# 📊 Bulk Capaciteit Beheer - Gebruikshandleiding

## 🎯 Wat is het?

De **Bulk Capaciteit Manager** is een tijdelijke tool om event capaciteiten aan te passen terwijl je bestaande reserveringen importeert. Dit voorkomt dat je voor elk event handmatig de capaciteit moet aanpassen.

## 🚀 Waar te vinden?

**Admin Panel → Systeem → Capaciteit Override**

## ✨ Mogelijkheden

### 1. **Bulk Toepassen**
- Pas capaciteit toe op alle toekomstige events in één keer
- Of selecteer een specifieke datum
- Voeg een reden toe (bijv. "Import bestaande boekingen")

### 2. **Individuele Overrides**
- Klik op "Override" bij een specifiek event
- Snel aanpassen zonder bulk actie

### 3. **Aan/Uit Schakelen**
- ✅ **Schakelaar**: Zet override tijdelijk uit zonder te verwijderen
- Originele capaciteit wordt automatisch hersteld
- Kun je later weer aanzetten

### 4. **Actieve Overrides Overzicht**
- Zie alle events met aangepaste capaciteit
- Originele vs Override capaciteit weergegeven
- Reden per override zichtbaar
- Snelle toggle per event

### 5. **Reset Functie**
- "Reset Alles" verwijdert alle overrides
- Originele capaciteiten worden hersteld
- Bevestiging nodig voor veiligheid

## 📝 Gebruik Scenario's

### Scenario 1: Import Bestaande Reserveringen
```
Probleem: Je hebt 50 events en allemaal zijn al deels geboekt
Oplossing:
1. Ga naar Capaciteit Override
2. Vul nieuwe capaciteit in (bijv. 150 ipv 230)
3. Voeg reden toe: "Bestaande boekingen worden nog toegevoegd"
4. Klik "Toepassen op Alle Toekomstige Events"
5. Alle events hebben nu tijdelijk lagere capaciteit
6. Voeg reserveringen toe via Data Beheer
7. Schakel overrides uit of verwijder ze
```

### Scenario 2: Specifieke Datum Aanpassen
```
1. Selecteer datum in de datum picker
2. Vul gewenste capaciteit in
3. Klik "Toepassen op Geselecteerde Datum"
4. Alleen events op die datum worden aangepast
```

### Scenario 3: Tijdelijk Uitschakelen
```
Situatie: Je wilt even testen met originele capaciteiten
Oplossing:
1. Ga naar "Actieve Overrides"
2. Klik op de groene schakelaar bij een event
3. Override wordt tijdelijk uitgeschakeld (grijs)
4. Event gebruikt weer originele capaciteit
5. Schakel later opnieuw in als nodig
```

## 🔧 Technische Details

### Opslag
- **localStorage**: Alle overrides worden lokaal opgeslagen
- **Persistent**: Blijven behouden na pagina refresh
- **Per event**: Individuele tracking

### Data Structuur
```typescript
{
  eventId: string;
  originalCapacity: number;    // Bewaard voor herstel
  overrideCapacity: number;    // Nieuwe capaciteit
  reason: string;              // Waarom override nodig
  enabled: boolean;            // Aan/uit status
  createdAt: Date;             // Wanneer toegevoegd
}
```

### Event Updates
- Capaciteit wordt direct aangepast in het event
- `capacity` en `remainingCapacity` worden beide bijgewerkt
- Originele waarde blijft bewaard in override data

## ⚠️ Belangrijke Opmerkingen

### ✅ Veilig
- Originele capaciteiten worden altijd bewaard
- Geen permanente wijzigingen in database
- Makkelijk terug te draaien
- Lokale opslag voorkomt server conflicten

### ⚙️ Tijdelijk
- Bedoeld voor import fase
- Niet geschikt voor permanent gebruik
- Reset na import compleet

### 🎯 Best Practices
1. **Documenteer reden**: Vul altijd in waarom je override toepast
2. **Test eerst**: Probeer met 1 event voordat je bulk toepast
3. **Check regelmatig**: Kijk of overrides nog nodig zijn
4. **Reset na import**: Verwijder overrides als alle data binnen is
5. **Backup eerst**: Maak backup van huidige capaciteiten

## 🎨 Visuele Indicatoren

### Kleuren
- 🟢 **Groen**: Override actief
- ⚪ **Grijs**: Override uitgeschakeld
- 🔵 **Blauw**: Event met actieve override in lijst

### Badges
- **"Actief"**: Override is ingeschakeld
- **"Uit"**: Override is tijdelijk uitgeschakeld
- **"(was X)"**: Toont originele capaciteit

## 🚨 Troubleshooting

### Override werkt niet?
✓ Check of toggle aan staat (groen)
✓ Refresh de pagina
✓ Check browser console voor errors

### Capaciteit niet aangepast?
✓ Klik op de toggle om uit/aan te zetten
✓ Verwijder en opnieuw toevoegen
✓ Check of event wel in de lijst staat

### Kan niet verwijderen?
✓ Gebruik "Reset Alles" als laatste optie
✓ Clear localStorage: `localStorage.removeItem('capacity-overrides')`

### Data kwijt na refresh?
✓ Dit is een bug - overrides zouden bewaard moeten blijven
✓ Hertoepassen via bulk actie

## 💡 Tips & Tricks

1. **Batch Approach**: Doe alle events van een maand in één keer
2. **Progressive Override**: Start met hoge override, verlaag naarmate je reserveringen toevoegt
3. **Weekend Special**: Selecteer weekend data om specifiek die capaciteiten aan te passen
4. **Export First**: Noteer originele capaciteiten voor het geval dat
5. **Monitor**: Check regelmatig of overrides nog kloppen met werkelijkheid

## 📞 Support

Bij vragen of problemen:
- Check eerst deze handleiding
- Kijk in browser console (F12) voor error messages
- Test met één event voordat je bulk actie doet
- Bij twijfel: gebruik toggle om tijdelijk uit te schakelen ipv te verwijderen

## 🔄 Workflow Voorbeeld

```
Start: 50 events met capaciteit 230

Stap 1: Bulk Override
→ Alle events naar 180 (50 plaatsen gereserveerd)
→ Reden: "Bestaande boekingen Q4 2024"

Stap 2: Import Reserveringen
→ Voeg 25 reserveringen toe per event
→ Check of remainingCapacity klopt

Stap 3: Fine-tune
→ Event X heeft 30 boekingen → override naar 170
→ Event Y heeft 20 boekingen → override naar 190

Stap 4: Monitoring
→ Nieuwe reserveringen komen binnen
→ Capaciteit update automatisch

Stap 5: Cleanup
→ Alle oude boekingen binnen
→ Reset alle overrides
→ Events terug naar originele 230 capaciteit

Klaar! ✅
```

## 🎬 Video Tutorial

*(Placeholder voor screencapture tutorial)*

---

**Versie**: 1.0  
**Laatst bijgewerkt**: {{ current_date }}  
**Auteur**: Inspiration Point Development Team
