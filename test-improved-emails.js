// Test verbeterde emails - Compacter en professioneler
const testImprovedEmails = async () => {
  console.log('📧 TESTING VERBETERDE EMAILS - COMPACTER & PROFESSIONELER');
  console.log('=========================================================');

  // 1. ADMIN EMAIL - Compact en overzichtelijk
  console.log('\n1️⃣ Versturen VERBETERDE ADMIN email (compact)...');
  
  const adminEmail = {
    to: 'info@inspiration-point.nl',
    subject: 'Nieuwe reservatie ontvangen',
    html: `
    <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.3; max-width: 500px; margin: 0;">
      <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">Nieuwe reservatie ontvangen</h3>
      
      <table style="border-collapse: collapse; width: 100%; font-size: 12px;">
        <tr><td style="padding: 3px 0; width: 120px; color: #666;"><strong>Datum:</strong></td><td style="padding: 3px 0;">20-12-2025</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Bedrijfsnaam:</strong></td><td style="padding: 3px 0;">Test Company BV</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Aanhef:</strong></td><td style="padding: 3px 0;">Mevrouw</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Naam:</strong></td><td style="padding: 3px 0;">Sarah van de Berg</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Adres:</strong></td><td style="padding: 3px 0;">Teststraat 123</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Huisnummer:</strong></td><td style="padding: 3px 0;">123</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Postcode:</strong></td><td style="padding: 3px 0;">1234AB</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Plaats:</strong></td><td style="padding: 3px 0;">Amsterdam</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Telefoon:</strong></td><td style="padding: 3px 0;">+31612345678</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Email:</strong></td><td style="padding: 3px 0;">sarah@test.com</td></tr>
        <tr><td colspan="2" style="padding: 8px 0 4px 0;"><hr style="border: none; border-top: 1px solid #ddd; margin: 0;"></td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Aantal personen:</strong></td><td style="padding: 3px 0;">6</td></tr>
        <tr><td colspan="2" style="padding: 8px 0 4px 0;"><hr style="border: none; border-top: 1px solid #ddd; margin: 0;"></td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Arrangement:</strong></td><td style="padding: 3px 0;">Premium - €89.50 per persoon</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Preparty:</strong></td><td style="padding: 3px 0;">Ja</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Afterparty:</strong></td><td style="padding: 3px 0;">Nee</td></tr>
        <tr><td colspan="2" style="padding: 8px 0 4px 0;"><hr style="border: none; border-top: 1px solid #ddd; margin: 0;"></td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Opmerkingen:</strong></td><td style="padding: 3px 0;">Test reservering. Gelegenheid: Verjaardag voor Sarah</td></tr>
        <tr><td colspan="2" style="padding: 8px 0 4px 0;"><hr style="border: none; border-top: 1px solid #ddd; margin: 0;"></td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Nieuwsbrief:</strong></td><td style="padding: 3px 0;">Ja</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Algemene voorwaarden:</strong></td><td style="padding: 3px 0;">Ja</td></tr>
      </table>
    </div>
    `,
    text: `
U heeft een nieuwe reservatie

Datum: 20-12-2025
Bedrijfsnaam: Test Company BV
Aanhef: Mevrouw
Naam: Sarah van de Berg
Adres: Teststraat 123
Huisnummer: 123
Postcode: 1234AB
Plaats: Amsterdam
Telefoon: +31612345678
Email: sarah@test.com

Aantal personen: 6

Gekozen arrangement: Premium - €89.50 per persoon
Preparty: Ja
Afterparty: Nee

Opmerkingen: Test reservering. Gelegenheid: Verjaardag voor Sarah

Nieuwsbrief: Ja
Algemene voorwaarden: Ja
    `
  };

  try {
    const adminResult = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminEmail)
    });
    const adminResponse = await adminResult.json();
    console.log('   Admin email result:', adminResponse.success ? '✅ SENT' : '❌ FAILED');
    
  } catch (error) {
    console.log('   Admin email result: ❌ ERROR:', error.message);
  }

  // 2. CUSTOMER EMAIL - Professioneel zonder teveel emojis
  console.log('\n2️⃣ Versturen VERBETERDE CUSTOMER email (professioneel)...');
  
  const customerEmail = {
    to: 'info@inspiration-point.nl',
    subject: 'Reservering ontvangen - vrijdag 20 december 2025',
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reservering Ontvangen</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
        
        <!-- Header -->
        <div style="background: #2c5282; padding: 25px 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: normal;">INSPIRATION POINT</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Dinner Theater Experience</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            
            <!-- Status -->
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="display: inline-block; background: #f7fafc; color: #2d3748; padding: 8px 16px; border-radius: 4px; font-size: 13px; font-weight: 600; text-transform: uppercase; border: 1px solid #e2e8f0;">
                    Reservering Ontvangen
                </div>
            </div>

            <!-- Greeting -->
            <h2 style="color: #2d3748; font-size: 20px; margin-bottom: 16px; font-weight: normal;">
                Beste Mevrouw Sarah van de Berg,
            </h2>
            
            <p style="color: #4a5568; font-size: 15px; line-height: 1.5; margin-bottom: 25px;">
                Hartelijk dank voor uw reservering bij Inspiration Point. Uw aanvraag is ontvangen en wordt momenteel door ons team beoordeeld.
            </p>

            <!-- Details -->
            <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Reservering Details</h3>
                
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 6px 0; color: #4a5568; width: 40%;">Reservering nummer:</td>
                        <td style="padding: 6px 0; color: #2d3748; font-weight: 600;">test-improved-123</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #4a5568;">Datum:</td>
                        <td style="padding: 6px 0; color: #2d3748; font-weight: 600;">vrijdag 20 december 2025</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #4a5568;">Tijd:</td>
                        <td style="padding: 6px 0; color: #2d3748; font-weight: 600;">19:30</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #4a5568;">Aantal personen:</td>
                        <td style="padding: 6px 0; color: #2d3748; font-weight: 600;">6</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #4a5568;">Arrangement:</td>
                        <td style="padding: 6px 0; color: #2c5282; font-weight: 600;">Premium (€89.50 per persoon)</td>
                    </tr>
                </table>
            </div>

            <!-- Status Info -->
            <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px 0; color: #c53030; font-size: 16px; font-weight: 600;">Status: In Behandeling</h3>
                <p style="margin: 0; color: #c53030; font-size: 14px; line-height: 1.5;">
                    Uw reservering wacht op bevestiging van ons team. We controleren de beschikbaarheid en nemen zo spoedig mogelijk contact met u op.
                </p>
            </div>

            <!-- Next Steps -->
            <div style="background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px 0; color: #276749; font-size: 16px; font-weight: 600;">Volgende Stappen</h3>
                <ul style="margin: 0; padding-left: 18px; color: #276749; font-size: 14px; line-height: 1.5;">
                    <li style="margin-bottom: 6px;">We controleren de beschikbaarheid voor uw gewenste datum</li>
                    <li style="margin-bottom: 6px;">Een teamlid neemt binnen 24 uur contact met u op</li>
                    <li style="margin-bottom: 6px;">Bij beschikbaarheid ontvangt u betalingsinformatie</li>
                    <li>Na betaling is uw reservering definitief bevestigd</li>
                </ul>
            </div>

            <!-- Contact -->
            <div style="text-align: center; margin: 25px 0; padding: 20px; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                <h3 style="color: #2d3748; margin: 0 0 10px 0; font-size: 15px; font-weight: 600;">Vragen over uw reservering?</h3>
                <p style="margin: 0; color: #4a5568; font-size: 14px;">Neem gerust contact met ons op:</p>
                <p style="margin: 8px 0 0 0; color: #2c5282; font-weight: 600; font-size: 14px;">info@inspiration-point.nl</p>
            </div>

        </div>

        <!-- Footer -->
        <div style="background: #2d3748; padding: 20px; text-align: center; color: #a0aec0;">
            <p style="margin: 0; font-size: 15px; font-weight: 600; color: #e2e8f0;">Met vriendelijke groet,</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #a0aec0;">Team Inspiration Point</p>
        </div>

    </div>
</body>
</html>
    `,
    text: `
INSPIRATION POINT - RESERVERING ONTVANGEN

Beste Mevrouw Sarah van de Berg,

Hartelijk dank voor uw reservering bij Inspiration Point.
Uw aanvraag is ontvangen en wordt momenteel door ons team beoordeeld.

RESERVERING DETAILS:
--------------------
Nummer: test-improved-123
Datum: vrijdag 20 december 2025
Tijd: 19:30
Personen: 6
Arrangement: Premium (€89.50 per persoon)

STATUS: IN BEHANDELING
----------------------
Uw reservering wacht op bevestiging van ons team.
We controleren de beschikbaarheid en nemen zo spoedig mogelijk contact op.

VOLGENDE STAPPEN:
- We controleren de beschikbaarheid
- Een teamlid neemt binnen 24 uur contact op
- Bij beschikbaarheid ontvangt u betalingsinformatie
- Na betaling is uw reservering definitief bevestigd

VRAGEN?
Contact: info@inspiration-point.nl

Met vriendelijke groet,
Team Inspiration Point
    `
  };

  try {
    const customerResult = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerEmail)
    });
    const customerResponse = await customerResult.json();
    console.log('   Customer email result:', customerResponse.success ? '✅ SENT' : '❌ FAILED');
    
  } catch (error) {
    console.log('   Customer email result: ❌ ERROR:', error.message);
  }

  console.log('\n📊 VERBETERDE EMAILS:');
  console.log('====================');
  console.log('✅ Admin email: Compact, kleine letters, overzichtelijk (perfect voor Outlook)');
  console.log('✅ Customer email: Professioneel, minder emojis, cleaner design');
  console.log('');
  console.log('📧 Check je inbox - de emails zouden nu veel beter moeten uitzien!');
};

// Start test
testImprovedEmails();