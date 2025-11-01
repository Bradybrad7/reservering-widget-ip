# ===================================================================
# EmailJS Setup Instructies
# Voor: Inspiration Point Reserveringssysteem
# ===================================================================

## 📧 EmailJS Configuratie Nodig

Je hebt aangegeven dat je EmailJS wilt gebruiken met:
- Service ID: service_nh0qgkw

## 🔑 Wat je nodig hebt uit EmailJS Dashboard:

Ga naar: https://dashboard.emailjs.com/

### 1. PUBLIC KEY (User ID)
- Klik op "Account" (links menu)
- Kopieer je "Public Key" (begint vaak met iets als "user_...")

### 2. TEMPLATE ID voor Reserveringsbevestiging
- Klik op "Email Templates" (links menu)
- Maak een nieuwe template of selecteer bestaande
- Kopieer de "Template ID" (bijv: "template_abc123")

### 3. SERVICE ID (heb je al!)
- service_nh0qgkw ✅

## 📝 Template Variabelen

In je EmailJS template moet je deze variabelen gebruiken:

**Voor Reserveringsbevestiging:**
```
{{to_email}}          - Email ontvanger
{{to_name}}           - Naam klant
{{reservation_id}}    - Reserveringsnummer
{{event_date}}        - Event datum
{{event_time}}        - Event tijd
{{num_persons}}       - Aantal personen
{{arrangement}}       - BWF of BWFM
{{total_price}}       - Totaalprijs
{{company_name}}      - Bedrijfsnaam (optioneel)
{{special_notes}}     - Speciale wensen
```

**Voor Wachtlijst:**
```
{{to_email}}
{{to_name}}
{{waitlist_position}} - Positie in wachtlijst
{{event_date}}
{{event_time}}
```

## 🎨 Template HTML Voorbeeld

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { background: #667eea; color: white; padding: 20px; }
        .content { padding: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎭 Reservering Bevestigd!</h1>
    </div>
    <div class="content">
        <p>Beste {{to_name}},</p>
        <p>Uw reservering is bevestigd!</p>
        
        <h3>Reserveringsgegevens:</h3>
        <ul>
            <li><strong>Reserveringsnummer:</strong> {{reservation_id}}</li>
            <li><strong>Datum:</strong> {{event_date}}</li>
            <li><strong>Tijd:</strong> {{event_time}}</li>
            <li><strong>Aantal personen:</strong> {{num_persons}}</li>
            <li><strong>Arrangement:</strong> {{arrangement}}</li>
            <li><strong>Totaalprijs:</strong> €{{total_price}}</li>
        </ul>
        
        <p>We kijken ernaar uit u te verwelkomen!</p>
        
        <p>Met vriendelijke groet,<br>
        Inspiration Point</p>
    </div>
</body>
</html>
```

## 🔧 Nadat je de info hebt:

Vul in:
- PUBLIC_KEY (User ID): ___________________
- TEMPLATE_ID (Reservering): ___________________
- TEMPLATE_ID (Wachtlijst): ___________________

Dan kan ik de EmailJS service integreren in je app!
