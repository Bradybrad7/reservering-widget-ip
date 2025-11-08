# 🚀 Firebase Hosting Deployment Guide

## ✅ Wat is Geconfigureerd

### Firebase Services Actief:
1. **Firestore Database** - Alle app data (events, reservations, configuration)
2. **Firebase Hosting** - Webhosting voor je reserveringsapp
3. **Firebase Security Rules** - Beveiliging voor data toegang

---

## 📋 Deployment Stappen

### 1. **Build de Productie Versie**
```bash
npm run build
```
Dit genereert een `dist/` folder met geoptimaliseerde bestanden.

### 2. **Deploy naar Firebase Hosting**
```bash
firebase deploy --only hosting
```

### 3. **Deploy Firestore Rules (indien aangepast)**
```bash
firebase deploy --only firestore:rules
```

### 4. **Deploy Alles Tegelijk**
```bash
firebase deploy
```

---

## 🌐 Hosting URLs

Na deployment is je app beschikbaar op:
- **Primary**: `https://inspiration-point-reservering.web.app`
- **Alternative**: `https://inspiration-point-reservering.firebaseapp.com`

---

## 📁 Hosting Configuratie

### `firebase.json` Configuratie:
```json
{
  "hosting": {
    "public": "dist",                    // Build output folder
    "rewrites": [                        // SPA routing
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [                         // Cache headers
      {
        "source": "**/*.@(js|css|...)", 
        "headers": [
          { "key": "Cache-Control", "value": "max-age=31536000" }
        ]
      }
    ]
  }
}
```

### Wat doet dit?
- ✅ **SPA Routing**: Alle routes → `index.html` (React Router)
- ✅ **Caching**: Static assets 1 jaar cache, HTML no-cache
- ✅ **Optimalisatie**: Automatische CDN distributie via Firebase

---

## 🔐 Custom Domain (Optioneel)

### Voeg je eigen domein toe:

1. **Firebase Console**: 
   ```
   https://console.firebase.google.com/project/inspiration-point-reservering/hosting
   ```

2. **Add Custom Domain**:
   - Klik "Add custom domain"
   - Voer je domein in (bijv. `reserveren.inspirationpoint.nl`)
   - Volg DNS setup instructies

3. **DNS Records** (bij je domain provider):
   ```
   Type: A
   Name: @
   Value: [Firebase IP addresses]
   
   Type: TXT
   Name: @
   Value: [Verification code]
   ```

4. **SSL Certificate**: Automatisch via Firebase (Let's Encrypt)

---

## 📊 Deployment Workflow

### Development Workflow:
```bash
# 1. Lokaal testen
npm run dev

# 2. Build productie versie
npm run build

# 3. Test build lokaal (optioneel)
firebase serve --only hosting

# 4. Deploy naar productie
firebase deploy --only hosting
```

### Preview Channel (Staging):
```bash
# Deploy naar preview URL (voor testen)
firebase hosting:channel:deploy preview

# Preview URL: https://inspiration-point-reservering--preview-xxxxx.web.app
```

---

## 🔄 Continuous Deployment (GitHub Actions - Optioneel)

### `.github/workflows/firebase-hosting.yml`:
```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: inspiration-point-reservering
```

---

## 📈 Monitoring & Analytics

### Firebase Hosting Dashboard:
```
https://console.firebase.google.com/project/inspiration-point-reservering/hosting
```

**Metrics beschikbaar:**
- 📊 Aantal bezoekers
- 🌍 Geografische verdeling
- ⚡ Load times
- 📦 Bandwidth gebruik
- 🔥 Errors & status codes

---

## 🛠️ Troubleshooting

### Error: "Permission denied"
```bash
firebase login
firebase use inspiration-point-reservering
```

### Error: "Build folder not found"
```bash
# Zorg dat dist/ folder bestaat
npm run build
ls dist/
```

### Cache problemen na update
```bash
# Firebase cache clearen (client-side)
# Gebruikers moeten hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

# Of: Versiebeheer toevoegen aan index.html
# <meta name="version" content="1.0.1">
```

### Firestore rules testen
```bash
firebase emulators:start --only firestore,hosting
```

---

## 🔒 Security Checklist

### Voor Production Deployment:

- [ ] **Firestore Rules** actief en getest
  ```bash
  firebase deploy --only firestore:rules
  ```

- [ ] **Environment Variables** correct ingesteld
  ```typescript
  // src/config/firebase.ts
  const firebaseConfig = {
    apiKey: "...",  // Deze MAG public zijn
    projectId: "inspiration-point-reservering",
    // ...
  };
  ```

- [ ] **Admin Panel** beveiligd met auth (toekomstig)
  ```typescript
  // src/components/admin/*
  // TODO: Add Firebase Authentication
  ```

- [ ] **CORS Headers** geconfigureerd (indien nodig)
  ```json
  // firebase.json
  {
    "hosting": {
      "headers": [
        {
          "source": "/api/**",
          "headers": [
            { "key": "Access-Control-Allow-Origin", "value": "*" }
          ]
        }
      ]
    }
  }
  ```

---

## 💰 Kosten Indicatie

### Firebase Spark Plan (GRATIS):
- ✅ Hosting: 10 GB storage
- ✅ Hosting: 360 MB/day transfer
- ✅ Firestore: 1 GB storage
- ✅ Firestore: 50K reads/day
- ✅ Firestore: 20K writes/day

### Upgrade naar Blaze Plan (Pay-as-you-go):
**Alleen nodig bij:**
- > 10K bezoekers/maand
- > 1000 reservaties/maand
- Custom domain met extra features

**Geschatte kosten bij 50K bezoekers/maand:** €5-15/maand

---

## 📞 Support & Resources

- **Firebase Console**: https://console.firebase.google.com
- **Firebase Docs**: https://firebase.google.com/docs/hosting
- **Status Page**: https://status.firebase.google.com
- **Community**: https://firebase.google.com/community

---

## 🎯 Quick Commands Reference

```bash
# Login
firebase login

# Initialize project (already done)
firebase init hosting

# Build & Deploy
npm run build && firebase deploy

# Deploy alleen hosting
firebase deploy --only hosting

# Deploy alleen Firestore rules
firebase deploy --only firestore:rules

# Preview deployment
firebase hosting:channel:deploy staging

# View deployment history
firebase hosting:channel:list

# Rollback naar vorige versie
firebase hosting:rollback

# Open Firebase Console
firebase open hosting
```

---

## ✅ Deployment Checklist

### Voor eerste deployment:

1. [ ] `npm run build` succesvol
2. [ ] `dist/` folder bestaat en bevat files
3. [ ] Firebase project ID correct in `.firebaserc`
4. [ ] Firestore rules deployed
5. [ ] Test lokaal: `firebase serve --only hosting`
6. [ ] Deploy: `firebase deploy`
7. [ ] Test productie URL
8. [ ] Verifieer Firestore data toegankelijk
9. [ ] Test reservering maken
10. [ ] Test admin panel

### Na elke update:

1. [ ] Code changes committed
2. [ ] `npm run build`
3. [ ] Test lokaal
4. [ ] `firebase deploy --only hosting`
5. [ ] Verifieer productie
6. [ ] Test critical paths

---

## 🎉 Success!

Je app is nu live op Firebase Hosting met volledige Firestore integratie! 🚀

**Live URL**: https://inspiration-point-reservering.web.app

Alle wijzigingen die je maakt in de admin interface worden automatisch opgeslagen in Firestore en zijn meteen beschikbaar voor alle gebruikers.
