# Inspiration Point Theater - Reserveringssysteem# Inspiration Point Theater - Reserveringssysteem



Een volledig geïntegreerd theater reserveringssysteem gebouwd met React, TypeScript, Vite en Firebase.Een volledig geïntegreerd theater reserveringssysteem gebouwd met React, TypeScript, Vite en Firebase.



## 🚀 Features## 🚀 Features



- 🎭 **Evenementenbeheer**: Volledig beheer van theatervoorstellingen en capaciteit- 🎭 **Evenementenbeheer**: Volledig beheer van theatervoorstellingen en capaciteit

- 📅 **Online Reserveringen**: Real-time beschikbaarheid en instant bevestiging- 📅 **Online Reserveringen**: Real-time beschikbaarheid en instant bevestiging

- 💳 **Betaalintegratie**: Mollie/Stripe integratie voor veilige betalingen- 💳 **Betaalintegratie**: Mollie/Stripe integratie voor veilige betalingen

- 🎟️ **Vouchersysteem**: Verkoop en beheer van theaterbonnen- 🎟️ **Vouchersysteem**: Verkoop en beheer van theaterbonnen

- 📧 **Email Notificaties**: Automatische bevestigingsmails via Firebase Cloud Functions- 📧 **Email Notificaties**: Automatische bevestigingsmails via Firebase Cloud Functions

- 👨‍💼 **Admin Dashboard**: Uitgebreid dashboard voor reserveringsbeheer- 👨‍💼 **Admin Dashboard**: Uitgebreid dashboard voor reserveringsbeheer

- ✅ **Check-in Systeem**: QR-code based check-in voor evenementen- ✅ **Check-in Systeem**: QR-code based check-in voor evenementen

- 🔥 **Firebase Backend**: Firestore voor data, Hosting voor deployment- 🔥 **Firebase Backend**: Firestore voor data, Hosting voor deployment



## 🛠️ Tech Stack## 🛠️ Tech Stack



- **Frontend**: React 18 + TypeScript + Vite- **Frontend**: React 18 + TypeScript + Vite

- **Styling**: Tailwind CSS + Lucide Icons- **Styling**: Tailwind CSS + Lucide Icons

- **State Management**: Zustand- **State Management**: Zustand

- **Database**: Firebase Firestore- **Database**: Firebase Firestore

- **Hosting**: Firebase Hosting- **Hosting**: Firebase Hosting

- **Functions**: Firebase Cloud Functions (Email service)- **Functions**: Firebase Cloud Functions (Email service)

- **Authentication**: (Planned) Firebase Auth- **Authentication**: (Planned) Firebase Auth



## 📦 Setup & Installation## 📦 Setup & Installation



### 1. Clone & InstallCurrently, two official plugins are available:



```bash- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

git clone <repository-url>- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

cd reservering-widget-ip

npm install## React Compiler

```

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

### 2. Environment Configuration

## Expanding the ESLint configuration

Voor **lokale development**:

```bashIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

# Kopieer het example bestand

cp .env.local.example .env.local```js

export default defineConfig([

# Bewerk .env.local en vul in:  globalIgnores(['dist']),

# - VITE_APP_BASE_URL=http://localhost:5173  {

# - VITE_FORCE_EMAIL_IN_DEV=false (of true voor email testen)    files: ['**/*.{ts,tsx}'],

```    extends: [

      // Other configs...

Voor **productie deployment**:

```bash      // Remove tseslint.configs.recommended and replace with this

# Het .env bestand is al geconfigureerd voor productie      tseslint.configs.recommendedTypeChecked,

# VITE_APP_BASE_URL=https://dinner-theater-booking.web.app      // Alternatively, use this for stricter rules

```      tseslint.configs.strictTypeChecked,

      // Optionally, add this for stylistic rules

### 3. Firebase Configuration      tseslint.configs.stylisticTypeChecked,



Het Firebase project is al geconfigureerd in `src/firebase.ts`. Voor nieuwe projecten:      // Other configs...

    ],

```bash    languageOptions: {

# Login bij Firebase      parserOptions: {

firebase login        project: ['./tsconfig.node.json', './tsconfig.app.json'],

        tsconfigRootDir: import.meta.dirname,

# Initialiseer project (al gedaan)      },

firebase init      // other options...

    },

# Deploy naar Firebase  },

firebase deploy])

``````



### 4. DevelopmentYou can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:



```bash```js

# Start development server// eslint.config.js

npm run devimport reactX from 'eslint-plugin-react-x'

import reactDom from 'eslint-plugin-react-dom'

# App is bereikbaar op:

# http://localhost:5173 - Klant boeking paginaexport default defineConfig([

# http://localhost:5173/admin - Admin dashboard  globalIgnores(['dist']),

# http://localhost:5173/voucher - Theaterbon kopen  {

# http://localhost:5173/checkin - Check-in systeem    files: ['**/*.{ts,tsx}'],

```    extends: [

      // Other configs...

### 5. Build & Deploy      // Enable lint rules for React

      reactX.configs['recommended-typescript'],

```bash      // Enable lint rules for React DOM

# Build voor productie      reactDom.configs.recommended,

npm run build    ],

    languageOptions: {

# Preview productie build lokaal      parserOptions: {

npm run preview        project: ['./tsconfig.node.json', './tsconfig.app.json'],

        tsconfigRootDir: import.meta.dirname,

# Deploy naar Firebase Hosting      },

firebase deploy --only hosting      // other options...

    },

# Deploy alles (hosting + functions)  },

firebase deploy])

``````


## 🌐 URLs

### Productie (Firebase Hosting)
- **Klant Portal**: https://dinner-theater-booking.web.app
- **Admin Dashboard**: https://dinner-theater-booking.web.app/admin
- **Voucher Kopen**: https://dinner-theater-booking.web.app/voucher
- **Check-in**: https://dinner-theater-booking.web.app/checkin

### Development (Localhost)
- **Klant Portal**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5173/admin
- **Voucher Kopen**: http://localhost:5173/voucher
- **Check-in**: http://localhost:5173/checkin

## 📧 Email Configuration

De applicatie gebruikt Firebase Cloud Functions voor het versturen van emails via SMTP.

**Configuratie** (`.env`):
```properties
VITE_EMAIL_FROM=info@inspiration-point.nl
VITE_EMAIL_FROM_NAME=Inspiration Point
VITE_SMTP_FUNCTION_URL=https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail
```

**Email Functies**:
- ✅ Bevestigingsmails voor klanten
- ✅ Admin notificaties voor nieuwe reserveringen
- ✅ Status update mails
- ✅ Herinneringsmails voor evenementen
- ✅ Voucher bevestigingen

## 🗄️ Database (Firestore)

De applicatie gebruikt **Firebase Firestore** voor alle data:

### Collections:
- `events` - Theatervoorstellingen
- `reservations` - Klant reserveringen
- `config` - Globale configuratie
- `pricing` - Prijzen per event type
- `addons` - Add-ons (drankjes, feestje, etc.)
- `bookingRules` - Reserveringsregels
- `merchandise` - Merchandise items
- `shows` - Show informatie
- `issuedVouchers` - Uitgegeven vouchers
- `voucherSettings` - Voucher configuratie
- `capacityOverrides` - Capaciteit overrides
- `waitlistEntries` - Wachtlijst entries

## 🔐 Security

### Huidige Status:
- ⚠️ Admin dashboard is **niet** beveiligd (publiek toegankelijk)
- ⚠️ Firestore rules zijn basis (lees/schrijf toegang)
- ✅ Email action links leiden naar dashboard (geen directe acties)

### Toekomstige Verbeteringen:
- 🔲 Firebase Authentication implementeren
- 🔲 Role-based access control (admin/viewer)
- 🔲 Striktere Firestore security rules
- 🔲 Rate limiting op API calls
- 🔲 Audit logging voor admin acties

## 📝 Environment Variables Overzicht

| Variable | Development | Production | Beschrijving |
|----------|-------------|------------|--------------|
| `VITE_APP_BASE_URL` | `http://localhost:5173` | `https://dinner-theater-booking.web.app` | Base URL voor de app |
| `VITE_SMTP_FUNCTION_URL` | Cloud function URL | Cloud function URL | SMTP email service |
| `VITE_EMAIL_FROM` | `info@inspiration-point.nl` | `info@inspiration-point.nl` | Afzender email |
| `VITE_FORCE_EMAIL_IN_DEV` | `false` | N/A | Force emails in dev mode |

## 🚀 Deployment Workflow

### Stap 1: Lokaal Testen
```bash
npm run dev
# Test alle functionaliteit lokaal
```

### Stap 2: Build
```bash
npm run build
# Check de dist/ folder voor build output
```

### Stap 3: Preview
```bash
npm run preview
# Test de productie build lokaal
```

### Stap 4: Deploy
```bash
# Deploy alleen de hosting
firebase deploy --only hosting

# Of deploy alles (hosting + functions + firestore rules)
firebase deploy
```

### Stap 5: Verify
Bezoek https://dinner-theater-booking.web.app en test:
- ✅ Nieuwe reservering maken
- ✅ Admin dashboard toegankelijk
- ✅ Emails worden verstuurd
- ✅ Voucher systeem werkt

## 🤝 Contributing

1. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit je changes (`git commit -m 'Add some AmazingFeature'`)
3. Push naar de branch (`git push origin feature/AmazingFeature`)
4. Open een Pull Request

## 📄 License

Dit project is eigendom van Inspiration Point Theater.

## 📞 Contact

Voor vragen of support, neem contact op met het development team.
