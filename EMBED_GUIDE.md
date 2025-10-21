# 🎭 Inspiration Point Reserveringswidget - Embed Handleiding

## 📦 Overzicht

De Inspiration Point Reserveringswidget is een volledig ingebouwde React-gebaseerde reserveringsoplossing die eenvoudig op elke website kan worden geïntegreerd. Deze handleiding legt uit hoe je de widget kunt embedden en configureren.

## 🚀 Snelstart: Widget Embedden

### Methode 1: Via CDN (Aanbevolen voor snelle integratie)

Voeg de volgende code toe aan je HTML-bestand waar je de widget wilt weergeven:

```html
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inspiration Point - Reserveren</title>
    
    <!-- Widget CSS -->
    <link rel="stylesheet" href="https://unpkg.com/inspiration-point-reservation-widget@1.0.0/dist/style.css">
    
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
        }
        #inspiration-point-widget-container {
            min-height: 100vh;
            padding: 20px;
        }
    </style>
</head>
<body>
    <!-- Widget Container -->
    <div id="inspiration-point-widget-container"></div>

    <!-- React & ReactDOM via CDN -->
    <script crossorigin src="https://unpkg.com/react@19/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"></script>
    
    <!-- Widget Script -->
    <script src="https://unpkg.com/inspiration-point-reservation-widget@1.0.0/dist/reservation-widget.umd.js"></script>
    
    <!-- Initialisatie Script -->
    <script>
        (function() {
            // Wacht tot DOM en scripts geladen zijn
            if (typeof window.ReservationWidget === 'undefined') {
                console.error('ReservationWidget niet geladen. Controleer de script-tags.');
                return;
            }

            // Container element
            const container = document.getElementById('inspiration-point-widget-container');
            
            if (!container) {
                console.error('Container element niet gevonden.');
                return;
            }

            // Widget configuratie (optioneel)
            const config = {
                apiEndpoint: 'https://api.inspirationpoint.nl/v1',
                theme: {
                    primaryColor: '#d4af37',
                    darkMode: true
                },
                locale: 'nl-NL',
                currency: 'EUR'
            };

            // Callback functie wanneer reservering compleet is
            const handleReservationComplete = function(reservation) {
                console.log('Reservering voltooid:', reservation);
                
                // Optioneel: Verstuur naar analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'reservation_complete', {
                        'event_category': 'Reservations',
                        'event_label': reservation.id,
                        'value': reservation.totalPrice
                    });
                }
                
                // Optioneel: Redirect naar bedankpagina
                // window.location.href = '/bedankt?id=' + reservation.id;
            };

            // Render de widget
            const root = ReactDOM.createRoot(container);
            root.render(
                React.createElement(window.ReservationWidget.default, {
                    config: config,
                    onReservationComplete: handleReservationComplete
                })
            );
        })();
    </script>
</body>
</html>
```

### Methode 2: Via NPM (Voor bestaande React projecten)

Als je de widget in een bestaand React-project wilt gebruiken:

#### Installatie

```bash
npm install inspiration-point-reservation-widget
```

#### Gebruik in React

```tsx
import React from 'react';
import ReservationWidget from 'inspiration-point-reservation-widget';
import 'inspiration-point-reservation-widget/dist/style.css';

function App() {
  const handleReservationComplete = (reservation) => {
    console.log('Reservering voltooid:', reservation);
    // Jouw custom logica hier
  };

  const config = {
    apiEndpoint: 'https://api.inspirationpoint.nl/v1',
    theme: {
      primaryColor: '#d4af37',
      darkMode: true
    },
    locale: 'nl-NL',
    currency: 'EUR'
  };

  return (
    <div className="app-container">
      <ReservationWidget
        config={config}
        onReservationComplete={handleReservationComplete}
      />
    </div>
  );
}

export default App;
```

## ⚙️ Configuratie Opties

### Config Object

```typescript
interface WidgetConfig {
  // API Instellingen
  apiEndpoint?: string;           // Default: lokale mock API
  apiKey?: string;                // Optioneel: API authenticatie key
  
  // Thema Instellingen
  theme?: {
    primaryColor?: string;        // Default: '#d4af37' (goud)
    darkMode?: boolean;           // Default: true
    fontFamily?: string;          // Custom font family
  };
  
  // Lokalisatie
  locale?: 'nl-NL' | 'en-US';    // Default: 'nl-NL'
  currency?: 'EUR' | 'USD';       // Default: 'EUR'
  
  // Prijzen (override defaults)
  pricing?: {
    arrangements?: {
      basic?: number;
      standard?: number;
      premium?: number;
      vip?: number;
    };
    addOns?: {
      preDrink?: number;
      afterParty?: number;
      lateNight?: number;
    };
  };
  
  // Booking Regels
  bookingRules?: {
    minPersons?: number;          // Default: 1
    maxPersons?: number;          // Default: 150
    advanceBookingDays?: number;  // Default: 2
    maxAdvanceBookingDays?: number; // Default: 365
  };
  
  // Feature Flags
  features?: {
    enableMerchandise?: boolean;  // Default: true
    enableAddOns?: boolean;       // Default: true
    enableWaitlist?: boolean;     // Default: true
    enableDraftSaving?: boolean;  // Default: true
  };
  
  // Tracking & Analytics
  analytics?: {
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customTrackingFunction?: (event: string, data: any) => void;
  };
}
```

### Callback Functies

#### onReservationComplete

Wordt aangeroepen wanneer een reservering succesvol is afgerond:

```javascript
const handleReservationComplete = (reservation) => {
  console.log('Reservering ID:', reservation.id);
  console.log('Totaal bedrag:', reservation.totalPrice);
  console.log('Aantal personen:', reservation.numberOfPersons);
  console.log('Arrangement:', reservation.arrangement);
  
  // Voorbeelden van wat je kunt doen:
  
  // 1. Toon een custom bedankpagina
  // showThankYouModal(reservation);
  
  // 2. Verstuur naar je eigen backend
  // fetch('/api/reservations', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(reservation)
  // });
  
  // 3. Track in analytics
  // gtag('event', 'purchase', {
  //   transaction_id: reservation.id,
  //   value: reservation.totalPrice,
  //   currency: 'EUR',
  //   items: [...]
  // });
};
```

## 🎨 Styling & Aanpassingen

### Custom CSS

Je kunt de widget verder stylen door custom CSS toe te voegen:

```html
<style>
    /* Container aanpassingen */
    #inspiration-point-widget-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
    }
    
    /* Dark mode override (indien nodig) */
    .card-theatre {
        background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%) !important;
        border-color: #d4af37 !important;
    }
    
    /* Goud accent aanpassen */
    .text-primary-500 {
        color: #your-custom-gold !important;
    }
    
    /* Button hover effects */
    .btn-gold:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(212, 175, 55, 0.4);
    }
    
    /* Responsive aanpassingen */
    @media (max-width: 768px) {
        #inspiration-point-widget-container {
            padding: 10px;
        }
    }
</style>
```

### Tailwind CSS Integratie

Als je site al Tailwind CSS gebruikt, zijn er minimale conflicten omdat de widget zijn eigen scope heeft. Je kunt wel extra utility classes toevoegen:

```html
<div id="inspiration-point-widget-container" class="container mx-auto px-4 lg:px-8">
    <!-- Widget wordt hier gerenderd -->
</div>
```

## 📱 Responsiviteit

De widget is volledig responsive en geoptimaliseerd voor:

- 📱 **Mobiel** (320px - 767px): Single column layout, geoptimaliseerde touch targets
- 📟 **Tablet** (768px - 1023px): 2-column grid waar passend
- 🖥️ **Desktop** (1024px+): 3-column grid met sidebar

### Breakpoints

```css
/* Mobiel: < 768px */
/* Tablet: 768px - 1023px (md:) */
/* Desktop: 1024px+ (lg:) */
/* Widescreen: 1280px+ (xl:) */
/* Ultra-wide: 1536px+ (2xl:) */
```

## 🔒 Beveiliging & Privacy

### CORS Configuratie

Zorg ervoor dat je API-server de juiste CORS headers terugstuurt:

```javascript
// Express.js voorbeeld
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://jouw-website.nl');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
```

### Content Security Policy (CSP)

Als je een strikte CSP gebruikt, voeg dan toe:

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://unpkg.com;
    style-src 'self' 'unsafe-inline' https://unpkg.com;
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://api.inspirationpoint.nl;
">
```

### GDPR Compliance

De widget respecteert privacy:

- ✅ Lokale opslag alleen voor draft reserveringen (met opt-in)
- ✅ Geen tracking cookies zonder consent
- ✅ Data wordt alleen naar jouw API gestuurd
- ✅ Geen third-party tracking by default

## 🔧 Troubleshooting

### Widget laadt niet

```javascript
// Debug script om te controleren of alles geladen is
console.log('React:', typeof React);
console.log('ReactDOM:', typeof ReactDOM);
console.log('ReservationWidget:', typeof window.ReservationWidget);
```

**Oplossingen:**
- Controleer of alle `<script>` tags correct zijn geladen
- Controleer de browser console voor errors
- Zorg dat React 19+ gebruikt wordt
- Controleer of de container element bestaat

### Styling issues

**Problemen:**
- Widget ziet er niet goed uit
- Dark mode werkt niet

**Oplossingen:**
1. Zorg dat `style.css` correct is geladen
2. Controleer of er conflicterende CSS is
3. Gebruik browser DevTools om te inspecteren
4. Voeg `!important` toe voor overrides indien nodig

### API Connectie errors

**Problemen:**
- 'Failed to fetch'
- CORS errors

**Oplossingen:**
1. Controleer CORS configuratie op API-server
2. Verifieer API endpoint URL in config
3. Check network tab in DevTools
4. Gebruik de mock API voor testen

### Performance issues

**Optimalisaties:**
```html
<!-- Preload critical resources -->
<link rel="preload" href="https://unpkg.com/react@19/umd/react.production.min.js" as="script">
<link rel="preload" href="https://unpkg.com/inspiration-point-reservation-widget@1.0.0/dist/style.css" as="style">

<!-- Lazy load widget below the fold -->
<script defer src="..."></script>
```

## 📊 Analytics Integratie

### Google Analytics 4

```javascript
const handleReservationComplete = (reservation) => {
  gtag('event', 'purchase', {
    transaction_id: reservation.id,
    value: reservation.totalPrice,
    currency: 'EUR',
    items: [{
      item_id: reservation.arrangement,
      item_name: reservation.arrangementName,
      price: reservation.totalPrice,
      quantity: reservation.numberOfPersons
    }]
  });
};
```

### Facebook Pixel

```javascript
const handleReservationComplete = (reservation) => {
  fbq('track', 'Purchase', {
    value: reservation.totalPrice,
    currency: 'EUR',
    content_type: 'product',
    content_ids: [reservation.id],
    num_items: reservation.numberOfPersons
  });
};
```

### Custom Analytics

```javascript
const config = {
  analytics: {
    customTrackingFunction: (event, data) => {
      // Verstuur naar je eigen analytics platform
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data, timestamp: Date.now() })
      });
    }
  }
};
```

## 🧪 Testing

### Lokaal Testen

```bash
# Clone de repository
git clone https://github.com/inspirationpoint/reservation-widget.git
cd reservation-widget

# Installeer dependencies
npm install

# Start development server
npm run dev

# Open browser naar http://localhost:5173
```

### Production Build Testen

```bash
# Build de library
npm run build:lib

# Gebruik een lokale HTTP server
npx serve dist

# Test in browser
```

## 📞 Support & Contact

- 📧 **Email:** support@inspirationpoint.nl
- 🌐 **Website:** https://inspirationpoint.nl
- 📚 **Documentatie:** https://docs.inspirationpoint.nl
- 🐛 **Bug Reports:** https://github.com/inspirationpoint/reservation-widget/issues

## 📄 Licentie

MIT License - Zie LICENSE file voor details.

---

**Versie:** 1.0.0  
**Laatste Update:** Oktober 2025  
**Auteur:** Inspiration Point Development Team

