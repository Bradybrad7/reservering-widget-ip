// TEST: Stuur alle nieuwe email templates naar info@inspiration-point.nl
const sendAllTestEmails = async () => {
  console.log('📧 VERSTUREN ALLE NIEUWE EMAIL TEMPLATES');
  console.log('=========================================\n');

  const cloudFunctionUrl = 'https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail';

  // 1. ADMIN EMAIL - Met merchandise en grotere font
  console.log('1️⃣ Versturen: Admin Email (Nieuwe Opmaak)...');
  await fetch(cloudFunctionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'info@inspiration-point.nl',
      subject: 'Nieuwe voorlopige boeking - 15-12-2025 - 4 personen - Jan de Vries',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nieuwe Voorlopige Boeking</title>
</head>
<body style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9f9f9;">
    
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <p>Geachte medewerker Inspiration Point,</p>
        
        <p><strong>Er is een nieuwe voorlopige boeking ontvangen, hieronder volgen de gegevens:</strong></p>
        
        <div style="background: #f7fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
            
            <p><strong>Datum:</strong> 15-12-2025</p>
            <p><strong>Bedrijfsnaam:</strong> Test Company BV</p>
            <p><strong>Aanhef:</strong> Dhr</p>
            <p><strong>Naam:</strong> Jan de Vries</p>
            <p><strong>Adres:</strong> Teststraat</p>
            <p><strong>Huisnummer:</strong> 123</p>
            <p><strong>Postcode:</strong> 1234AB</p>
            <p><strong>Plaats:</strong> Amsterdam</p>
            <p><strong>Telefoon:</strong> +31612345678</p>
            <p><strong>Email:</strong> test@example.com</p>
            
            <p><strong>Aantal personen:</strong> 4</p>
            
            <p><strong>Gekozen arrangement:</strong> €70,00 BWF p.p.</p>
            
            <p><strong>Preparty:</strong> Ja (€15,00 p.p.)</p>
            
            <p><strong>Merchandise:</strong><br>Inspiration Point T-shirt - 2x (€50,00)<br>Theater Mok - 1x (€12,50)</p>
            
            <p><strong>Totaalprijs:</strong> €382,50</p>
            
            <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 15px; margin: 15px 0;">
                <p style="margin: 0;"><strong>Opmerkingen:</strong></p>
                <div style="white-space: pre-line; margin-top: 8px;">Graag een tafel bij het raam

Te vieren: Verjaardag voor Marie

Dieetwensen: Vegetarisch: 1x, Glutenvrij: 1x</div>
            </div>
            
            <p><strong>Nieuwsbrief:</strong> Ja</p>
            <p><strong>Algemene voorwaarden gelezen:</strong> Ja</p>
            
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 13px;">
            <p style="margin-bottom: 5px;"><strong>Met vriendelijke groet,</strong></p>
            <p style="margin-bottom: 5px;"><strong>Inspiration Point</strong></p>
            <p style="margin-bottom: 5px;">Maastrichterweg 13 - 17</p>
            <p style="margin-bottom: 5px;">5554 GE Valkenswaard</p>
            <p style="margin-bottom: 5px;">040-2110679</p>
            <p style="margin-bottom: 5px;">info@inspiration-point.nl</p>
            <p style="margin-bottom: 5px;">www.inspiration-point.nl</p>
            <br>
            <p style="font-size: 12px; color: #999;">Reservering ID: TEST-ADMIN-001</p>
        </div>
        
    </div>
</body>
</html>
      `
    })
  });
  console.log('   ✅ Admin email verstuurd\n');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 2. BETALINGSBEVESTIGING EMAIL
  console.log('2️⃣ Versturen: Betalingsbevestiging Email (Zwart/Rood/Goud)...');
  await fetch(cloudFunctionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'info@inspiration-point.nl',
      subject: '✓ Betaling ontvangen - vrijdag 20 december 2025 - Inspiration Point',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Betaling Ontvangen</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);">
        
        <!-- Header met Logo -->
        <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #8B0000 100%); padding: 40px 30px; text-align: center; border-bottom: 3px solid #FFD700;">
            <img src="https://irp.cdn-website.com/e8046ea7/dms3rep/multi/logo-ip+%281%29.png" alt="Inspiration Point Logo" style="max-height: 80px; margin-bottom: 15px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #FFD700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Betaling Ontvangen ✓</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            
            <!-- Success Badge -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #006400 0%, #228B22 100%); color: white; padding: 15px 30px; border-radius: 50px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(34, 139, 34, 0.4);">
                    ✓ BETALING GOEDGEKEURD
                </div>
            </div>

            <!-- Greeting -->
            <h2 style="color: #FFD700; font-size: 22px; margin-bottom: 20px; text-align: center;">
                Beste Sarah van de Berg,
            </h2>
            
            <p style="color: #E5E5E5; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                Goed nieuws! Wij hebben uw betaling in goede orde ontvangen. 
                Uw reservering is nu <strong style="color: #FFD700;">volledig bevestigd</strong>!
            </p>

            <!-- Reservation Details -->
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a0a0a 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 8px 20px rgba(255, 215, 0, 0.2);">
                <h3 style="color: #FFD700; margin: 0 0 20px 0; font-size: 18px; text-align: center; border-bottom: 1px solid #FFD700; padding-bottom: 10px;">
                    🎭 Uw Reservering
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Datum:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">vrijdag 20 december 2025</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Aanvang:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">20:00</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Aantal personen:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">6</td>
                    </tr>
                    <tr style="border-top: 1px solid #FFD700;">
                        <td style="padding: 15px 0 0 0; color: #FFD700; font-weight: bold; font-size: 16px;">Betaald bedrag:</td>
                        <td style="padding: 15px 0 0 0; color: #FFD700; text-align: right; font-size: 18px; font-weight: bold;">
                            €420,00
                        </td>
                    </tr>
                </table>
            </div>

            <!-- What's Next -->
            <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); border: 2px solid #8B0000; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #FFD700; margin: 0 0 15px 0; font-size: 18px;">📋 Wat nu?</h3>
                <ul style="color: #E5E5E5; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 10px;">Uw reservering is <strong style="color: #FFD700;">volledig bevestigd</strong></li>
                    <li style="margin-bottom: 10px;">Deuren openen om <strong style="color: #FFD700;">18:30 uur</strong></li>
                    <li style="margin-bottom: 10px;">Show begint om <strong style="color: #FFD700;">20:00</strong></li>
                    <li style="margin-bottom: 10px;">U ontvangt binnenkort meer informatie per email</li>
                    <li>Wij kijken ernaar uit u te verwelkomen! 🎭</li>
                </ul>
            </div>

            <!-- Contact Info -->
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: rgba(139, 0, 0, 0.2); border: 1px solid #8B0000; border-radius: 8px;">
                <p style="color: #FFD700; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Vragen?</p>
                <p style="color: #E5E5E5; font-size: 14px; margin: 0;">
                    Neem gerust contact met ons op<br>
                    <a href="mailto:info@inspiration-point.nl" style="color: #FFD700; text-decoration: none; font-weight: bold;">info@inspiration-point.nl</a><br>
                    <span style="color: #B8B8B8;">040-2110679</span>
                </p>
            </div>

        </div>

        <!-- Footer -->
        <div style="background: #000000; padding: 25px 30px; text-align: center; border-top: 2px solid #FFD700;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #FFD700;">Tot snel!</p>
            <p style="margin: 8px 0; font-size: 14px; color: #B8860B;">Maastrichterweg 13-17, 5554 GE Valkenswaard</p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">www.inspiration-point.nl</p>
        </div>

    </div>
</body>
</html>
      `
    })
  });
  console.log('   ✅ Betalingsbevestiging email verstuurd\n');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 3. WACHTLIJST EMAIL KLANT
  console.log('3️⃣ Versturen: Wachtlijst Email voor Klant (Zwart/Rood/Goud)...');
  await fetch(cloudFunctionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'info@inspiration-point.nl',
      subject: '⏳ Wachtlijst registratie - zaterdag 28 december 2025 - Inspiration Point',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wachtlijst Registratie</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);">
        
        <!-- Header met Logo -->
        <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #8B0000 100%); padding: 40px 30px; text-align: center; border-bottom: 3px solid #FFD700;">
            <img src="https://irp.cdn-website.com/e8046ea7/dms3rep/multi/logo-ip+%281%29.png" alt="Inspiration Point Logo" style="max-height: 80px; margin-bottom: 15px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #FFD700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Wachtlijst Registratie</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            
            <!-- Info Badge -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #FF8C00 0%, #FFD700 100%); color: #000000; padding: 15px 30px; border-radius: 50px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);">
                    ⏳ OP WACHTLIJST GEPLAATST
                </div>
            </div>

            <!-- Greeting -->
            <h2 style="color: #FFD700; font-size: 22px; margin-bottom: 20px; text-align: center;">
                Beste Peter Jansen,
            </h2>
            
            <p style="color: #E5E5E5; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                Bedankt voor uw interesse in onze voorstelling!
            </p>

            <!-- Important Notice -->
            <div style="background: linear-gradient(135deg, #8B0000 0%, #660000 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 8px 20px rgba(255, 215, 0, 0.2);">
                <h3 style="color: #FFD700; margin: 0 0 15px 0; font-size: 18px; text-align: center;">⚠️ Let Op: Dit is GEEN Boeking</h3>
                <p style="color: #FFFFFF; font-size: 15px; line-height: 1.6; margin: 0; text-align: center;">
                    U staat nu op de wachtlijst voor deze voorstelling. Dit betekent dat u <strong style="color: #FFD700;">nog geen gereserveerde plaats</strong> heeft.
                </p>
            </div>

            <!-- Event Details -->
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a0a0a 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #FFD700; margin: 0 0 20px 0; font-size: 18px; text-align: center; border-bottom: 1px solid #FFD700; padding-bottom: 10px;">
                    🎭 Voorstelling
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Datum:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">zaterdag 28 december 2025</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Aanvang:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">20:00</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Gewenste personen:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">8</td>
                    </tr>
                </table>
            </div>

            <!-- How it Works -->
            <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); border: 2px solid #B8860B; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #FFD700; margin: 0 0 15px 0; font-size: 18px;">📋 Hoe werkt de wachtlijst?</h3>
                <ul style="color: #E5E5E5; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 10px;">Bij een <strong style="color: #FFD700;">annulering</strong> nemen wij <strong style="color: #FFD700;">zo snel mogelijk</strong> contact met u op</li>
                    <li style="margin-bottom: 10px;">Wachtlijst plaatsen = <strong style="color: #FFD700;">op volgorde</strong> van aanmelding</li>
                    <li style="margin-bottom: 10px;">U ontvangt een bericht via <strong style="color: #FFD700;">email of telefoon</strong></li>
                    <li style="margin-bottom: 10px;">U heeft <strong style="color: #FFD700;">24 uur</strong> de tijd om te reageren</li>
                    <li>Als u niet reageert, gaan wij naar de volgende persoon op de lijst</li>
                </ul>
            </div>

            <!-- Contact Info -->
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: rgba(139, 0, 0, 0.2); border: 1px solid #8B0000; border-radius: 8px;">
                <p style="color: #FFD700; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Vragen?</p>
                <p style="color: #E5E5E5; font-size: 14px; margin: 0;">
                    Neem gerust contact met ons op<br>
                    <a href="mailto:info@inspiration-point.nl" style="color: #FFD700; text-decoration: none; font-weight: bold;">info@inspiration-point.nl</a><br>
                    <span style="color: #B8B8B8;">040-2110679</span>
                </p>
            </div>

        </div>

        <!-- Footer -->
        <div style="background: #000000; padding: 25px 30px; text-align: center; border-top: 2px solid #FFD700;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #FFD700;">Hopelijk tot snel!</p>
            <p style="margin: 8px 0; font-size: 14px; color: #B8860B;">Maastrichterweg 13-17, 5554 GE Valkenswaard</p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">www.inspiration-point.nl</p>
        </div>

    </div>
</body>
</html>
      `
    })
  });
  console.log('   ✅ Wachtlijst klant email verstuurd\n');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. WACHTLIJST EMAIL ADMIN
  console.log('4️⃣ Versturen: Wachtlijst Email voor Admin...');
  await fetch(cloudFunctionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'info@inspiration-point.nl',
      subject: '⏳ Nieuwe wachtlijst registratie - 28-12-2025',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nieuwe Wachtlijst Registratie</title>
</head>
<body style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9f9f9;">
    
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <p>Geachte medewerker Inspiration Point,</p>
        
        <p><strong>Er is een nieuwe wachtlijst registratie ontvangen:</strong></p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
            
            <h3 style="margin: 0 0 15px 0; color: #856404;">⏳ WACHTLIJST REGISTRATIE</h3>
            
            <p><strong>Voorstelling datum:</strong> 28-12-2025</p>
            <p><strong>Naam:</strong> Peter Jansen</p>
            <p><strong>Email:</strong> peter.jansen@example.com</p>
            <p><strong>Telefoon:</strong> +31687654321</p>
            <p><strong>Aantal personen:</strong> 8</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 15px;">
                <p style="margin: 0;"><strong>Opmerkingen:</strong></p>
                <p style="margin: 8px 0 0 0;">Graag een tafel voor een groep vrienden. We kunnen flexibel zijn met de datum als er andere opties zijn.</p>
            </div>
            
        </div>
        
        <div style="background: #d1ecf1; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;"><strong>💡 Actie vereist:</strong> Bij annuleringen deze persoon contacteren!</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 13px;">
            <p style="margin-bottom: 5px;"><strong>Met vriendelijke groet,</strong></p>
            <p style="margin-bottom: 5px;"><strong>Inspiration Point</strong></p>
            <p style="margin-bottom: 5px;">Maastrichterweg 13 - 17</p>
            <p style="margin-bottom: 5px;">5554 GE Valkenswaard</p>
            <p style="margin-bottom: 5px;">040-2110679</p>
            <p style="margin-bottom: 5px;">info@inspiration-point.nl</p>
            <p style="margin-bottom: 5px;">www.inspiration-point.nl</p>
        </div>
        
    </div>
</body>
</html>
      `
    })
  });
  console.log('   ✅ Wachtlijst admin email verstuurd\n');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 5. RESERVERINGSAANVRAAG EMAIL (GEREDESIGNED)
  console.log('5️⃣ Versturen: Reserveringsaanvraag Email (Nieuwe Design)...');
  await fetch(cloudFunctionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'info@inspiration-point.nl',
      subject: 'Reserveringsaanvraag ontvangen - vrijdag 20 december 2025',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reservering Ontvangen</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);">
        
        <!-- Header met Logo -->
        <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #8B0000 100%); padding: 40px 30px; text-align: center; border-bottom: 3px solid #FFD700;">
            <img src="https://irp.cdn-website.com/e8046ea7/dms3rep/multi/logo-ip+%281%29.png" alt="Inspiration Point Logo" style="max-height: 80px; margin-bottom: 15px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #FFD700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Reserveringsaanvraag Ontvangen</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            
            <!-- Status Badge -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #FF8C00 0%, #FFD700 100%); color: #000000; padding: 15px 30px; border-radius: 50px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);">
                    ⏳ AANVRAAG IN BEHANDELING
                </div>
            </div>

            <!-- Greeting -->
            <h2 style="color: #FFD700; font-size: 22px; margin-bottom: 20px; text-align: center;">
                Beste Maria Schmidt,
            </h2>
            
            <p style="color: #E5E5E5; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                Hartelijk dank voor uw reserveringsaanvraag bij Inspiration Point. 
                Uw aanvraag wordt momenteel door ons team beoordeeld.
            </p>

            <div style="background: linear-gradient(135deg, #0047AB 0%, #003380 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 20px; margin: 25px 0; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);">
                <p style="margin: 0; color: #FFFFFF; font-size: 15px; font-weight: 600; text-align: center;">
                    📧 U ontvangt binnen twee werkdagen bericht over de beschikbaarheid
                </p>
            </div>

            <!-- Reservation Details -->
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a0a0a 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 8px 20px rgba(255, 215, 0, 0.2);">
                <h3 style="color: #FFD700; margin: 0 0 20px 0; font-size: 18px; text-align: center; border-bottom: 1px solid #FFD700; padding-bottom: 10px;">
                    🎭 Aanvraag Overzicht
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Datum:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">vrijdag 20 december 2025</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Aanvang:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">20:00</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Aantal personen:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">4</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Arrangement:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">Deluxe (€65,00 per persoon)</td>
                    </tr>
                    <tr style="border-top: 1px solid #FFD700;">
                        <td style="padding: 15px 0 0 0; color: #FFD700; font-weight: bold; font-size: 14px;">Referentienummer:</td>
                        <td style="padding: 15px 0 0 0; color: #FFD700; text-align: right; font-size: 14px; font-weight: bold;">RES-20251220-001</td>
                    </tr>
                </table>
            </div>

            <!-- Important Notice -->
            <div style="background: linear-gradient(135deg, #8B0000 0%, #660000 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 8px 20px rgba(255, 215, 0, 0.2);">
                <h3 style="color: #FFD700; margin: 0 0 15px 0; font-size: 18px; text-align: center;">⚠️ Let Op: Nog Geen Definitieve Reservering</h3>
                <p style="color: #FFFFFF; font-size: 15px; line-height: 1.6; margin: 0 0 12px 0; text-align: center;">
                    Uw aanvraag wacht op bevestiging van ons team. We controleren eerst de beschikbaarheid voor uw gewenste datum en arrangement.
                </p>
                <p style="color: #FFD700; font-size: 15px; line-height: 1.6; margin: 0; font-weight: 600; text-align: center;">
                    Alleen na onze bevestigingsmail is uw reservering definitief.
                </p>
            </div>

            <!-- Process Steps -->
            <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); border: 2px solid #B8860B; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #FFD700; margin: 0 0 15px 0; font-size: 18px;">📋 Hoe werkt het proces?</h3>
                <ol style="color: #E5E5E5; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 10px;"><strong style="color: #FFD700;">Nu:</strong> Wij controleren beschikbaarheid voor uw gewenste datum</li>
                    <li style="margin-bottom: 10px;"><strong style="color: #FFD700;">Binnen 2 werkdagen:</strong> U ontvangt een bevestigings- of afwijzingsmail</li>
                    <li style="margin-bottom: 10px;"><strong style="color: #FFD700;">Bij beschikbaarheid:</strong> Uw reservering is definitief bevestigd</li>
                    <li style="margin-bottom: 10px;"><strong style="color: #FFD700;">1 week voor de show:</strong> U ontvangt factuur en betalingsverzoek</li>
                    <li><strong style="color: #FFD700;">Dag van de show:</strong> Deuren open 18:30, show start 20:00</li>
                </ol>
            </div>

            <!-- Contact Info -->
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: rgba(139, 0, 0, 0.2); border: 1px solid #8B0000; border-radius: 8px;">
                <p style="color: #FFD700; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Vragen over uw reservering?</p>
                <p style="color: #E5E5E5; font-size: 14px; margin: 0;">
                    Neem gerust contact met ons op<br>
                    <a href="mailto:info@inspiration-point.nl" style="color: #FFD700; text-decoration: none; font-weight: bold;">info@inspiration-point.nl</a><br>
                    <span style="color: #B8B8B8;">040-2110679</span>
                </p>
            </div>

        </div>

        <!-- Footer -->
        <div style="background: #000000; padding: 25px 30px; text-align: center; border-top: 2px solid #FFD700;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #FFD700;">Met vriendelijke groet,</p>
            <p style="margin: 8px 0; font-size: 14px; color: #B8860B;">Maastrichterweg 13-17, 5554 GE Valkenswaard</p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">www.inspiration-point.nl</p>
        </div>

    </div>
</body>
</html>
      `
    })
  });
  console.log('   ✅ Reserveringsaanvraag email verstuurd\n');

  console.log('═══════════════════════════════════════');
  console.log('✅ ALLE 5 EMAIL TEMPLATES VERSTUURD!');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('📬 Check je inbox: info@inspiration-point.nl');
  console.log('');
  console.log('Je hebt ontvangen:');
  console.log('1. Admin email (nieuwe opmaak, 16px font, merchandise namen)');
  console.log('2. Betalingsbevestiging (zwart/rood/goud, groen vinkje)');
  console.log('3. Wachtlijst klant (zwart/rood/goud, oranje badge)');
  console.log('4. Wachtlijst admin (gele waarschuwing)');
  console.log('5. Reserveringsaanvraag (zwart/rood/goud, nieuw design)');
};

sendAllTestEmails().catch(console.error);