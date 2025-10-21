# Inspiration Point Reservation Widget

Een moderne, toegankelijke reserveringswidget voor Inspiration Point Comedy Theater, gebouwd met React, TypeScript, en Tailwind CSS.

## ✨ Functies

### Klantkant (ReservationWidget)
- 📅 **Interactieve kalender** met statuskleurenș en beschikbaarheid
- 📋 **Uitgebreid reserveringsformulier** met validatie
- 💰 **Live prijsberekening** voor arrangementen en extra's
- 📱 **Mobile-first design** met responsive layout
- ♿ **Toegankelijkheid** met ARIA labels en toetsenbord navigatie
- 🇳🇱 **Nederlandse lokalisatie** (dd-mm-jjjj, 24h formaat)
- ✅ **Success pagina** met agenda download

### Admin Interface (BookingAdmin)
- 📊 **Dashboard** met statistieken en overzichten
- 🎭 **Evenementenbeheer** met CRUD operaties
- 💲 **Prijsinstellingen** per dagtype en arrangement
- 📈 **Capaciteitsbeheer** en reserveringsstatus
- 📤 **CSV export** voor rapportages
- 🎨 **Configureerbare kleuren** en instellingen

### Technische Features
- 🔒 **Type-veilig** met TypeScript interfaces
- 🎯 **Zustand state management** met clean selectors
- 🔍 **Zod validatie** met Nederlandse foutmeldingen
- 🎨 **Tailwind CSS** styling met design system
- 🧪 **Mock API** layer voor development
- 📦 **Embedbaar** als single component

## 🚀 Installatie

### NPM/Yarn
```bash
npm install inspiration-point-reservation-widget
# of
yarn add inspiration-point-reservation-widget
```

### CDN (UMD Build)
```html
<script src="https://unpkg.com/inspiration-point-reservation-widget/dist/reservation-widget.umd.js"></script>
<link rel="stylesheet" href="https://unpkg.com/inspiration-point-reservation-widget/dist/style.css">
```

## 📖 Gebruik

### Basic Setup (React)
```tsx
import { ReservationWidget, BookingAdmin } from 'inspiration-point-reservation-widget';
import 'inspiration-point-reservation-widget/dist/style.css';

function App() {
  const handleReservationComplete = (reservation) => {
    console.log('Nieuwe reservering:', reservation);
    // Stuur naar je backend API
  };

  return (
    <div>
      {/* Klant reserveringswidget */}
      <ReservationWidget 
        onReservationComplete={handleReservationComplete}
      />
      
      {/* Admin interface (apart te hosten) */}
      <BookingAdmin />
    </div>
  );
}
```

### Configuratie
```tsx
import { ReservationWidget } from 'inspiration-point-reservation-widget';

const customConfig = {
  maxCapacity: 200,
  colors: {
    REGULAR: '#2563eb',
    MATINEE: '#06b6d4',
    CARE_HEROES: '#10b981'
  },
  termsUrl: 'https://jouw-site.nl/voorwaarden',
  companyInfo: {
    name: 'Jouw Theater',
    address: 'Jouw Adres 123',
    phone: '+31 20 1234567',
    email: 'info@jouwtheater.nl'
  }
};

<ReservationWidget 
  config={customConfig}
  onReservationComplete={handleReservation}
/>
```

### Vanilla JavaScript (UMD)
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/inspiration-point-reservation-widget/dist/style.css">
</head>
<body>
  <div id="reservation-widget"></div>
  
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/inspiration-point-reservation-widget/dist/reservation-widget.umd.js"></script>
  
  <script>
    const { ReservationWidget } = ReservationWidget;
    
    ReactDOM.render(
      React.createElement(ReservationWidget, {
        onReservationComplete: (reservation) => {
          console.log('Reservering voltooid:', reservation);
        }
      }),
      document.getElementById('reservation-widget')
    );
  </script>
</body>
</html>
```

## 🔧 API Integratie

### Event Data Structure
```typescript
interface Event {
  id: string;
  date: Date;
  doorsOpen: string;    // "19:00"
  startsAt: string;     // "20:00" 
  endsAt: string;       // "22:30"
  type: 'REGULAR' | 'MATINEE' | 'CARE_HEROES' | 'REQUEST' | 'UNAVAILABLE';
  capacity: number;
  remainingCapacity?: number;
  allowedArrangements: ('BWF' | 'BWFM')[];
  isActive: boolean;
}
```

### Reservation Data Structure
```typescript
interface Reservation {
  id: string;
  eventId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  numberOfPersons: number;
  arrangement: 'BWF' | 'BWFM';
  preDrink: { enabled: boolean; quantity: number };
  afterParty: { enabled: boolean; quantity: number };
  totalPrice: number;
  // ... meer velden
}
```

## 🎨 Configuratie & Theming

### Prijsinstellingen
```typescript
const pricing = {
  byDayType: {
    weekday: { BWF: 70, BWFM: 85 },    // zo-do
    weekend: { BWF: 80, BWFM: 95 },    // vr-za  
    matinee: { BWF: 70, BWFM: 85 },
    careHeroes: { BWF: 65, BWFM: 80 }
  }
};
```

### Add-ons
```typescript
const addOns = {
  preDrink: { pricePerPerson: 15, minPersons: 25 },
  afterParty: { pricePerPerson: 15, minPersons: 25 }
};
```

## 🛠 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

## 📋 Acceptatiecriteria

- ✅ Vrijdag toont €80 (BWF) en €95 (BWFM)
- ✅ Zondag toont €70 (BWF) en €85 (BWFM)  
- ✅ Zorgzame Helden toont €65 (BWF) en €80 (BWFM)
- ✅ Capaciteitscontrole bij 240 personen (max 230)
- ✅ Voorborrel minimaal 25 personen validatie
- ✅ Cut-off 72 uur controle
- ✅ Success pagina met bevestiging
- ✅ Mobile-first responsive design
- ✅ Toegankelijkheid (ARIA, keyboard nav)
- ✅ Admin interface met CSV export

## 📱 Browser Support

- Modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Mobile: iOS Safari 14+, Chrome Mobile 90+

---

**Made with ❤️ for Inspiration Point Comedy Theater**