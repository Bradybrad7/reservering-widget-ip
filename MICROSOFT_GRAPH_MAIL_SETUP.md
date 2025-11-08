# Microsoft Graph Mail.Send Permissie Setup

## 📧 Stap-voor-Stap Configuratie

### Permissie Details:
- **API**: Microsoft Graph API
- **Endpoint**: https://graph.microsoft.com/Mail.Send  
- **Resource App ID**: `00000003-0000-0000-c000-000000000000`
- **Permission ID**: `b633e1c5-b582-4048-a93e-9f11b44c7e96`
- **Admin Consent**: **JA VEREIST** ⚠️

---

## 🚀 Azure Portal Configuratie

### Stap 1: Ga naar je App Registration
1. **Azure Portal**: https://portal.azure.com
2. Navigeer naar **App registrations**
3. Selecteer je app: "Inspiration Point Booking System" 
4. Ga naar **API permissions**

### Stap 2: Voeg Mail.Send Permissie Toe
1. Klik **"Add a permission"**
2. Selecteer **"Microsoft Graph"**
3. Kies **"Application permissions"** (niet Delegated!)
4. Zoek naar **"Mail"**
5. Vink aan: ✅ **Mail.Send** 
   - *"Send mail as any user"*
   - Resource: `00000003-0000-0000-c000-000000000000`
   - Permission: `b633e1c5-b582-4048-a93e-9f11b44c7e96`

### Stap 3: Grant Admin Consent (KRITIEK!)
1. Klik **"Add permissions"**
2. **BELANGRIJK**: Klik **"Grant admin consent for [Your Organization]"**
3. Bevestig met **"Yes"**
4. Controleer dat status **"Granted for [Organization]"** toont ✅

---

## ⚙️ Environment Configuration

Update je `.env` file met:

```env
# Microsoft Graph API Configuration
VITE_AZURE_CLIENT_ID=your-application-client-id
VITE_AZURE_TENANT_ID=your-directory-tenant-id
VITE_AZURE_CLIENT_SECRET=your-client-secret-value

# Email Configuration  
VITE_EMAIL_FROM=noreply@inspirationpoint.nl
VITE_EMAIL_FROM_NAME=Inspiration Point Theater

# Graph API Endpoints
VITE_GRAPH_BASE_URL=https://graph.microsoft.com/v1.0
VITE_GRAPH_MAIL_ENDPOINT=/me/sendMail
```

---

## 🔧 Code Implementation

### Authentication Service
```typescript
// src/services/graphAuthService.ts
export class GraphAuthService {
  private static async getAccessToken(): Promise<string> {
    const tokenEndpoint = `https://login.microsoftonline.com/${process.env.VITE_AZURE_TENANT_ID}/oauth2/v2.0/token`;
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.VITE_AZURE_CLIENT_ID!,
        client_secret: process.env.VITE_AZURE_CLIENT_SECRET!,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      })
    });
    
    const data = await response.json();
    return data.access_token;
  }
}
```

### Email Service Update
```typescript
// src/services/emailService.ts  
export class EmailService {
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const accessToken = await GraphAuthService.getAccessToken();
      
      const graphEndpoint = 'https://graph.microsoft.com/v1.0/users/noreply@inspirationpoint.nl/sendMail';
      
      const response = await fetch(graphEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            subject: emailData.subject,
            body: {
              contentType: 'HTML',
              content: emailData.htmlBody
            },
            toRecipients: [{
              emailAddress: {
                address: emailData.to,
                name: emailData.toName
              }
            }],
            from: {
              emailAddress: {
                address: process.env.VITE_EMAIL_FROM,
                name: process.env.VITE_EMAIL_FROM_NAME
              }
            }
          }
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Graph API Send Error:', error);
      return false;
    }
  }
}
```

---

## ✅ Verificatie Checklist

- [ ] App Registration aangemaakt in Azure Portal
- [ ] Application permissions toegevoegd (Mail.Send)
- [ ] **Admin consent verleend** ⚠️ (KRITIEK!)
- [ ] Client ID, Tenant ID en Secret genoteerd
- [ ] Environment variables geconfigureerd
- [ ] Email service geüpdatet met Graph API calls
- [ ] Test email versturen vanaf app

---

## 🚨 Belangrijke Opmerkingen

### Beveiliging
- **Client Secret**: Bewaar veilig, deel nooit!
- **Environment**: Gebruik productie tenant voor live app
- **Permissions**: Minimale permissions (alleen Mail.Send)

### Troubleshooting
- **403 Forbidden**: Admin consent niet verleend
- **401 Unauthorized**: Verkeerde credentials
- **404 Not Found**: Verkeerd endpoint of gebruiker bestaat niet
- **429 Too Many Requests**: Rate limiting - implementeer retry logic

### Email Account Setup
Het email account (`noreply@inspirationpoint.nl`) moet:
- Bestaan in je Office 365 tenant
- Toegang hebben tot mailbox
- Licensed zijn (minimaal Exchange Online Plan 1)

---

## 🔗 Nuttige Links

- [Microsoft Graph API Docs](https://docs.microsoft.com/en-us/graph/)
- [Mail.Send Permission](https://docs.microsoft.com/en-us/graph/permissions-reference#mail-permissions)
- [Azure App Registration](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
- [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer) - Voor testing

---

**Volgende stap**: Update je environment variables en test de email functionaliteit!