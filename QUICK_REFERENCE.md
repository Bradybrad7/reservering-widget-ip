# ⚡ Quick Reference - Widget Integratie

## 🚀 5-Minuten Setup

### Stap 1: Kopieer HTML

```html
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reserveren</title>
    <link rel="stylesheet" href="https://unpkg.com/inspiration-point-reservation-widget@1.0.0/dist/style.css">
</head>
<body>
    <div id="widget-container"></div>
    
    <script src="https://unpkg.com/react@19/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/inspiration-point-reservation-widget@1.0.0/dist/reservation-widget.umd.js"></script>
    
    <script>
        ReactDOM.createRoot(document.getElementById('widget-container')).render(
            React.createElement(window.ReservationWidget.default, {
                onReservationComplete: (res) => console.log('Klaar!', res)
            })
        );
    </script>
</body>
</html>
```

### Stap 2: Customize (optioneel)

```javascript
config: {
    apiEndpoint: 'https://api.jouwdomein.nl',
    theme: { primaryColor: '#d4af37' },
    locale: 'nl-NL'
}
```

### Stap 3: Test

Open in browser → Selecteer datum → Vul formulier → Klaar! ✅

---

## 📦 CDN Links

```html
<!-- CSS -->
https://unpkg.com/inspiration-point-reservation-widget@1.0.0/dist/style.css

<!-- JS -->
https://unpkg.com/inspiration-point-reservation-widget@1.0.0/dist/reservation-widget.umd.js

<!-- React Dependencies -->
https://unpkg.com/react@19/umd/react.production.min.js
https://unpkg.com/react-dom@19/umd/react-dom.production.min.js
```

**Alternatief:** jsDelivr
```html
https://cdn.jsdelivr.net/npm/inspiration-point-reservation-widget@1.0.0/dist/style.css
https://cdn.jsdelivr.net/npm/inspiration-point-reservation-widget@1.0.0/dist/reservation-widget.umd.js
```

---

## ⚙️ Config Snelstart

```javascript
{
    // Basis
    apiEndpoint: 'https://api.jouwsite.nl',
    locale: 'nl-NL',
    currency: 'EUR',
    
    // Thema
    theme: {
        primaryColor: '#d4af37',  // Goud
        darkMode: true
    },
    
    // Prijzen override
    pricing: {
        arrangements: {
            basic: 27.50,
            standard: 35.00,
            premium: 45.00,
            vip: 60.00
        },
        addOns: {
            preDrink: 12.50,
            afterParty: 15.00
        }
    },
    
    // Features aan/uit
    features: {
        enableMerchandise: true,
        enableWaitlist: true,
        enableDraftSaving: true
    }
}
```

---

## 🎯 Event Tracking

### Google Analytics 4

```javascript
onReservationComplete: (res) => {
    gtag('event', 'purchase', {
        transaction_id: res.id,
        value: res.totalPrice,
        currency: 'EUR'
    });
}
```

### Facebook Pixel

```javascript
onReservationComplete: (res) => {
    fbq('track', 'Purchase', {
        value: res.totalPrice,
        currency: 'EUR'
    });
}
```

---

## 🎨 Styling

### Kleuren Aanpassen

```css
/* Custom gold color */
:root {
    --gold: #your-color;
}

.text-primary-500 {
    color: var(--gold) !important;
}

.bg-gold-gradient {
    background: linear-gradient(135deg, var(--gold) 0%, #f0c84a 100%) !important;
}
```

### Container Styling

```css
#widget-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    background: #0a0a0a;
}
```

---

## 🔧 Troubleshooting

### Widget laadt niet?

```javascript
// Debug script
console.log('React:', typeof React);
console.log('ReactDOM:', typeof ReactDOM);
console.log('Widget:', typeof window.ReservationWidget);
```

**Oplossing**: Zorg dat alle scripts geladen zijn vóór init.

### CORS Error?

```javascript
// Server-side (Express)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST');
  next();
});
```

### Dark mode werkt niet?

Zorg dat `style.css` correct geladen is en geen conflicterende CSS aanwezig is.

---

## 📱 Responsive Test

```bash
# Desktop: 1280px+  ✅ Sidebar layout
# Tablet:  768-1023 ✅ 2-column grid
# Mobiel:  <768px   ✅ Single column
```

Test op: Chrome DevTools → Device Toolbar → Verschillende apparaten

---

## 🔗 Handige Links

- **📖 Volledige Docs**: `EMBED_GUIDE.md`
- **📊 Samenvatting**: `OPTIMIZATION_SUMMARY.md`
- **💻 Volledig Voorbeeld**: `embed-example.html`
- **⚡ Minimaal**: `embed-minimal.html`

---

## 💡 Pro Tips

1. **Preload CSS** voor snellere load:
   ```html
   <link rel="preload" href="...style.css" as="style">
   ```

2. **Lazy load** widget als het below-the-fold is:
   ```html
   <script defer src="..."></script>
   ```

3. **Error boundary** toevoegen voor productie:
   ```javascript
   try {
       // Render widget
   } catch (err) {
       console.error('Widget error:', err);
       container.innerHTML = '<p>Widget laden mislukt.</p>';
   }
   ```

4. **Loading state** tonen tijdens laden:
   ```html
   <div id="widget-container">
       <div class="loading">Laden...</div>
   </div>
   ```

---

## 🆘 Support

- 📧 support@inspirationpoint.nl
- 🐛 GitHub Issues
- 💬 Live Chat (website)

**Response tijd**: < 24 uur werkdagen

---

**Versie**: 1.0.0 | **Update**: Okt 2025
