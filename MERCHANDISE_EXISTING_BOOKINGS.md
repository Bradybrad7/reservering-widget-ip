# 🛍️ Merchandise Toevoegen aan Bestaande Boekingen

## ✅ Ja, dit werkt al volledig!

De merchandise functionaliteit is **volledig geïmplementeerd** en werkt perfect voor bestaande boekingen.

---

## 📍 Hoe werkt het?

### **Stap 1: Open een bestaande reservering**
1. Ga naar **Reserveringen** in het admin panel
2. Klik op een reservering om de details te zien
3. Klik op de **"Bewerken"** knop (potlood icoon)

### **Stap 2: Voeg merchandise toe**
In de `ReservationEditModal` zie je de sectie **"🛍️ Merchandise Toevoegen"**:

```
╔═══════════════════════════════════════════════════╗
║  🛍️ Merchandise Toevoegen                         ║
║     [2 items]  ← Toont aantal als er items zijn  ║
╠═══════════════════════════════════════════════════╣
║  💡 U kunt merchandise toevoegen aan deze         ║
║     bestaande boeking. De prijs wordt             ║
║     automatisch bijgewerkt.                       ║
╠═══════════════════════════════════════════════════╣
║  📦 T-Shirt Logo                                  ║
║     € 25,00 per stuk    = € 50,00                 ║
║                           [-] [2] [+]             ║
╠═══════════════════════════════════════════════════╣
║  📦 Mok met Logo                                  ║
║     € 15,00 per stuk                              ║
║                           [-] [0] [+]             ║
╠═══════════════════════════════════════════════════╣
║  Totaal Merchandise: € 50,00                      ║
╚═══════════════════════════════════════════════════╝
```

### **Stap 3: Automatische prijsupdate**
- **Oude prijs:** €800 (8 personen × €100)
- **Merchandise:** +€50 (2× T-shirt)
- **Nieuwe prijs:** €850

De nieuwe prijs wordt direct getoond in het **"💰 Nieuwe Prijs"** veld onderaan de modal.

### **Stap 4: Opslaan**
Klik op **"Wijzigingen Opslaan"**

#### **Scenario A: Klant heeft nog NIET betaald**
- Reservering wordt bijgewerkt
- Nieuwe totaalprijs: €850
- "Nog te Betalen" wordt €850

#### **Scenario B: Klant heeft AL volledig betaald (€800)**
- Reservering wordt bijgewerkt naar €850
- **"Nog te Betalen"** wordt €50

**Admin kan dan:**
1. Een nieuwe factuur sturen voor €50
2. Contant incasseren op de avond
3. Later registreren als betaling in het Financieel tabblad

#### **Scenario C: Klant heeft AL betaald EN u verlaagt prijs**
Bijvoorbeeld: verwijder merchandise weer
- Oude prijs: €850 (betaald)
- Nieuwe prijs: €800 (merchandise verwijderd)
- **CreditDecisionModal verschijnt automatisch!** 🔥
- Admin kan kiezen: restitutie €50 of tegoed laten staan

---

## 🎨 Nieuwe Visuele Features

### **1. Badge met aantal items**
Als er merchandise is toegevoegd, zie je een gouden badge:
```
🛍️ Merchandise Toevoegen [2 items]
```

### **2. Highlight geselecteerde items**
Items met quantity > 0 krijgen een gouden rand en achtergrond

### **3. +/- Knoppen**
Naast het inputveld staan handige +/- knoppen voor snel aanpassen

### **4. Totaal per item**
Als quantity > 0, zie je direct het subtotaal:
```
€ 25,00 per stuk = € 50,00
```

### **5. Merchandise Totaal**
Onderaan zie je het totaalbedrag van alle merchandise samen

---

## 🔄 Complete Workflow Voorbeeld

### **Voorbeeld: T-shirts toevoegen na boeking**

**Startситuatie:**
- Boeking: 10 personen, BWF arrangement
- Prijs: €1.000
- Status: Bevestigd
- Betaalstatus: Volledig betaald

**Klant belt:** "Kunnen we ook 10 T-shirts bestellen?"

**Admin:**
1. ✅ Opent reservering
2. ✅ Klikt "Bewerken"
3. ✅ Scrollt naar "Merchandise Toevoegen"
4. ✅ Ziet "T-Shirt Logo - €25,00"
5. ✅ Klikt 10× op [+] knop (of typt "10")
6. ✅ Ziet "Totaal Merchandise: €250,00"
7. ✅ Ziet onderaan "Nieuwe Prijs: €1.250,00"
8. ✅ Klikt "Wijzigingen Opslaan"

**Resultaat:**
- Reservering totaalprijs: €1.250
- Al betaald: €1.000
- Nog te betalen: €250
- Admin stuurt factuur voor €250
- Klant betaalt
- Admin registreert betaling van €250 in Financieel tabblad
- Status wordt "Volledig Betaald" ✓

---

## 💡 Tips

### **Merchandise na booking toevoegen is ideaal voor:**
- 🎁 Last-minute cadeaus
- 👕 T-shirts/merchandise bij groepen
- 📦 Extra producten die klant vergeten was
- 🎉 Upgrades op de dag zelf

### **Prijs wordt ALTIJD automatisch bijgewerkt:**
- ✅ Toevoegen merchandise → Prijs stijgt
- ✅ Verwijderen merchandise → Prijs daalt (+ tegoed detectie!)
- ✅ Aantal personen wijzigen → Prijs past aan
- ✅ Arrangement wijzigen → Prijs past aan

### **Tegoed Detectie:**
Als u merchandise verwijdert NA betaling:
- 🔥 CreditDecisionModal verschijnt automatisch
- 💰 U kiest: restitutie of tegoed laten staan
- 📝 Reden wordt geregistreerd

---

## 🧪 Test Scenario

Wilt u het testen? Volg deze stappen:

1. **Maak een test-reservering:**
   - 5 personen, BWF
   - Prijs: €500
   - Status: Bevestigd

2. **Markeer als betaald:**
   - Ga naar Financieel tabblad
   - Registreer betaling van €500

3. **Voeg merchandise toe:**
   - Open "Bewerken"
   - Voeg 2× T-shirt toe (+€50)
   - Nieuwe prijs: €550

4. **Controleer:**
   - ✅ Totaalprijs is nu €550
   - ✅ "Nog te Betalen" is €50
   - ✅ Merchandise staat in reservering

5. **Verwijder merchandise weer:**
   - Open "Bewerken"
   - Zet T-shirts terug naar 0
   - **CreditDecisionModal verschijnt!** 🎉
   - Kies "Tegoed laten staan" of "Restitutie"

---

## ✅ Alles werkt perfect!

Merchandise toevoegen aan bestaande boekingen is:
- ✅ **Volledig geïmplementeerd**
- ✅ **Automatische prijsupdate**
- ✅ **Visueel duidelijk**
- ✅ **Werkt met tegoed-detectie**
- ✅ **Klaar voor productie**

**Geen extra werk nodig - het werkt al!** 🎊
