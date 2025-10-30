# Microsoft Graph API Setup voor Email

## Stap 1: Azure App Registratie

### 1.1 Maak een App Registration in Azure Portal:
1. Ga naar: https://portal.azure.com
2. Zoek naar "App registrations"
3. Klik "New registration"
4. Vul in:
   - **Name**: Inspiration Point Booking System
   - **Supported account types**: Single tenant
   - **Redirect URI**: Web - http://localhost:5173/auth/callback
5. Klik "Register"

### 1.2 Noteer de volgende waarden:
- **Application (client) ID**: [HIER INVULLEN]
- **Directory (tenant) ID**: [HIER INVULLEN]

### 1.3 Maak een Client Secret:
1. Ga naar "Certificates & secrets"
2. Klik "New client secret"
3. Description: "Booking System Secret"
4. Expires: 24 months
5. Klik "Add"
6. **KOPIEER DE VALUE DIRECT** (je kunt hem later niet meer zien!)
7. **Client Secret**: [HIER INVULLEN]

### 1.4 Configureer API Permissions:
1. Ga naar "API permissions"
2. Klik "Add a permission"
3. Kies "Microsoft Graph"
4. Kies "Application permissions" (voor server-to-server)
5. Zoek en selecteer:
   - ✅ Mail.Send (Send mail as any user)
6. Klik "Add permissions"
7. **BELANGRIJK**: Klik "Grant admin consent for [Your Tenant]"
8. Wacht tot status "Granted" is

### 1.5 Configureer het email account:
Het systeem zal emails versturen vanaf een specifiek account.
**Welk email adres wil je gebruiken?** (bijv. noreply@inspirationpoint.nl)

---

## Stap 2: Environment Variables

Maak een `.env` file in je project root met:

```env
# Microsoft Graph API (Outlook/Office 365)
VITE_AZURE_CLIENT_ID=your-client-id-here
VITE_AZURE_TENANT_ID=your-tenant-id-here
VITE_AZURE_CLIENT_SECRET=your-client-secret-here
VITE_EMAIL_FROM=noreply@inspirationpoint.nl
VITE_EMAIL_FROM_NAME=Inspiration Point

# Optional: BCC for all emails
VITE_EMAIL_BCC=admin@inspirationpoint.nl
```

⚠️ **BELANGRIJK**: 
- Client Secret moet GEHEIM blijven!
- Voor productie gebruik Azure Key Vault
- Voeg `.env` toe aan `.gitignore`

---

## Stap 3: Installeer Dependencies

```powershell
npm install @azure/msal-node @microsoft/microsoft-graph-client
```

---

## Volgende Stappen:

Na het invullen van de credentials hierboven:
1. Ik maak de Microsoft Graph email service
2. We integreren het met je bestaande emailService
3. We testen het versturen van emails

**Heb je de App Registration al gemaakt in Azure Portal?**
