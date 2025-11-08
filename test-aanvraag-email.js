// Test aangepaste customer email - Duidelijk AANVRAAG proces
const testUpdatedCustomerEmail = async () => {
  console.log('📧 TESTING AANGEPASTE CUSTOMER EMAIL - AANVRAAG PROCES');
  console.log('======================================================');

  const customerEmail = {
    to: 'info@inspiration-point.nl',
    subject: 'Reserveringsaanvraag ontvangen - vrijdag 20 december 2025',
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reserveringsaanvraag Ontvangen</title>
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
                <div style="display: inline-block; background: #fff5f5; color: #c53030; padding: 8px 16px; border-radius: 4px; font-size: 13px; font-weight: 600; text-transform: uppercase; border: 1px solid #feb2b2;">
                    Aanvraag in Behandeling
                </div>
            </div>

            <!-- Greeting -->
            <h2 style="color: #2d3748; font-size: 20px; margin-bottom: 16px; font-weight: normal;">
                Beste Mevrouw Sarah van de Berg,
            </h2>
            
            <p style="color: #4a5568; font-size: 15px; line-height: 1.5; margin-bottom: 25px;">
                Hartelijk dank voor uw <strong>reserveringsaanvraag</strong> bij Inspiration Point. Uw aanvraag is ontvangen en wordt momenteel door ons team beoordeeld. 
                <strong style="color: #c53030;">Dit is nog geen definitieve reservering.</strong>
            </p>

            <!-- Details -->
            <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Aanvraag Details</h3>
                
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 6px 0; color: #4a5568; width: 40%;">Aanvraag nummer:</td>
                        <td style="padding: 6px 0; color: #2d3748; font-weight: 600;">test-aanvraag-123</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #4a5568;">Gewenste datum:</td>
                        <td style="padding: 6px 0; color: #2d3748; font-weight: 600;">vrijdag 20 december 2025</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #4a5568;">Deuren open:</td>
                        <td style="padding: 6px 0; color: #2d3748; font-weight: 600;">18:30</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #4a5568;">Show begint:</td>
                        <td style="padding: 6px 0; color: #2d3748; font-weight: 600;">19:30</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #4a5568;">Show eindigt:</td>
                        <td style="padding: 6px 0; color: #2d3748; font-weight: 600;">ca. 22:30</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #4a5568;">Aantal personen:</td>
                        <td style="padding: 6px 0; color: #2d3748; font-weight: 600;">6</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #4a5568;">Gewenst arrangement:</td>
                        <td style="padding: 6px 0; color: #2c5282; font-weight: 600;">Premium (€89.50 per persoon)</td>
                    </tr>
                </table>
            </div>

            <!-- Important Warning -->
            <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px 0; color: #c53030; font-size: 16px; font-weight: 600;">⚠️ Let op: Dit is nog geen definitieve reservering</h3>
                <p style="margin: 0 0 12px 0; color: #c53030; font-size: 14px; line-height: 1.5;">
                    Uw aanvraag wacht op bevestiging van ons team. We controleren eerst de beschikbaarheid voor uw gewenste datum en arrangement.
                </p>
                <p style="margin: 0; color: #c53030; font-size: 14px; line-height: 1.5; font-weight: 600;">
                    Alleen na onze bevestigingsmail is uw reservering definitief.
                </p>
            </div>

            <!-- Process Steps -->
            <div style="background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px 0; color: #276749; font-size: 16px; font-weight: 600;">Hoe werkt het proces?</h3>
                <ol style="margin: 0; padding-left: 18px; color: #276749; font-size: 14px; line-height: 1.5;">
                    <li style="margin-bottom: 8px;"><strong>Nu:</strong> Wij controleren beschikbaarheid voor uw gewenste datum</li>
                    <li style="margin-bottom: 8px;"><strong>Binnen 24 uur:</strong> U ontvangt een bevestigings- of afwijzingsmail</li>
                    <li style="margin-bottom: 8px;"><strong>Bij beschikbaarheid:</strong> Uw reservering is definitief bevestigd</li>
                    <li style="margin-bottom: 8px;"><strong>1 week voor de show:</strong> U ontvangt factuur en betalingsverzoek</li>
                    <li><strong>Dag van de show:</strong> Deuren open 18:30, show start 19:30</li>
                </ol>
            </div>

            <!-- Contact -->
            <div style="text-align: center; margin: 25px 0; padding: 20px; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                <h3 style="color: #2d3748; margin: 0 0 10px 0; font-size: 15px; font-weight: 600;">Vragen over uw aanvraag?</h3>
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
INSPIRATION POINT - AANVRAAG ONTVANGEN

Beste Mevrouw Sarah van de Berg,

Hartelijk dank voor uw reserveringsaanvraag bij Inspiration Point.
Uw aanvraag is ontvangen en wordt momenteel door ons team beoordeeld.

⚠️ LET OP: Dit is nog geen definitieve reservering!

AANVRAAG DETAILS:
-----------------
Nummer: test-aanvraag-123
Gewenste datum: vrijdag 20 december 2025
Deuren open: 18:30
Show begint: 19:30
Show eindigt: ca. 22:30
Personen: 6
Gewenst arrangement: Premium (€89.50 per persoon)

HOE WERKT HET PROCES?
---------------------
1. Nu: Wij controleren beschikbaarheid voor uw gewenste datum
2. Binnen 24 uur: U ontvangt een bevestigings- of afwijzingsmail
3. Bij beschikbaarheid: Uw reservering is definitief bevestigd
4. 1 week voor de show: U ontvangt factuur en betalingsverzoek
5. Dag van de show: Deuren open 18:30, show start 19:30

BELANGRIJK:
-----------
Alleen na onze bevestigingsmail is uw reservering definitief.
Betaling volgt pas 1 week voor de voorstelling.

VRAGEN?
Contact: info@inspiration-point.nl

Met vriendelijke groet,
Team Inspiration Point
    `
  };

  try {
    console.log('📧 Versturen aangepaste customer email...');
    
    const result = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerEmail)
    });
    
    const response = await result.json();
    console.log('   Result:', response.success ? '✅ SENT' : '❌ FAILED');
    
    console.log('\n📋 BELANGRIJKSTE WIJZIGINGEN:');
    console.log('=============================');
    console.log('✅ Subject: "Reserveringsaanvraag ontvangen" (niet "reservering")');
    console.log('✅ Duidelijk: "Dit is nog geen definitieve reservering"');
    console.log('✅ Status badge: "Aanvraag in Behandeling" (rood/waarschuwing)');
    console.log('✅ Details: "Aanvraag nummer" en "Gewenste datum"');
    console.log('✅ Tijden: Deuren open 18:30, Show begint 19:30, Show eindigt 22:30');
    console.log('✅ Proces uitgelegd: 5 stappen van aanvraag tot show');
    console.log('✅ Benadrukt: Bevestigingsmail nodig voor definitieve reservering');
    console.log('✅ Duidelijk: Betaling pas 1 week voor voorstelling');
    console.log('');
    console.log('📧 Check je inbox voor de aangepaste email!');
    
  } catch (error) {
    console.log('   Result: ❌ ERROR:', error.message);
  }
};

// Start test
testUpdatedCustomerEmail();