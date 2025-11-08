// Direct test van beide emails - Admin (simple) + Customer (beautiful)

const testBothEmails = async () => {
  console.log('📧 VERSTUREN BEIDE TEST EMAILS');
  console.log('==============================');

  // 1. ADMIN EMAIL - Simple format voor Outlook add-on
  console.log('\n1️⃣ Versturen ADMIN email (simple format)...');
  
  const adminEmail = {
    to: 'info@inspiration-point.nl',
    subject: 'Nieuwe reservatie ontvangen',
    html: `
<p>U heeft een nieuwe reservatie</p>
<br>
<p><strong>Datum:</strong> 20-12-2025</p>
<p><strong>Bedrijfsnaam:</strong> Test Company BV</p>
<p><strong>Aanhef:</strong> Mevrouw</p>
<p><strong>Naam:</strong> Sarah van de Berg</p>
<p><strong>Adres:</strong> Teststraat 123</p>
<p><strong>Huisnummer:</strong> 123</p>
<p><strong>Postcode:</strong> 1234AB</p>
<p><strong>Plaats:</strong> Amsterdam</p>
<p><strong>Telefoon:</strong> +31612345678</p>
<p><strong>Email:</strong> sarah@test.com</p>
<br>
<p><strong>Aantal personen:</strong> 6</p>
<br>
<p><strong>Gekozen arrangement:</strong> Premium - €89.50 per persoon</p>
<p><strong>Preparty:</strong> Ja</p>
<p><strong>Afterparty:</strong> Nee</p>
<br>
<p><strong>Opmerkingen:</strong> Test reservering. Gelegenheid: Verjaardag voor Sarah. Details: Speciale verjaardag</p>
<br>
<p><strong>Nieuwsbrief:</strong> Ja</p>
<p><strong>Algemene voorwaarden:</strong> Ja</p>
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

Opmerkingen: Test reservering. Gelegenheid: Verjaardag voor Sarah. Details: Speciale verjaardag

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

  // 2. CUSTOMER EMAIL - Beautiful format
  console.log('\n2️⃣ Versturen CUSTOMER email (beautiful format)...');
  
  const customerEmail = {
    to: 'info@inspiration-point.nl',
    subject: '✨ Reservering ontvangen - vrijdag 20 december 2025',
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reservering Ontvangen</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">✨ INSPIRATION POINT ✨</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Dinner Theater Experience</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            
            <!-- Status Badge -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #ffeaa7, #fdcb6e); color: #2d3436; padding: 12px 24px; border-radius: 25px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 3px 10px rgba(253, 203, 110, 0.3);">
                    ⏳ Reservering Ontvangen
                </div>
            </div>

            <!-- Greeting -->
            <h2 style="color: #2d3436; font-size: 24px; margin-bottom: 20px; text-align: center;">
                Beste Mevrouw Sarah van de Berg,
            </h2>
            
            <p style="color: #636e72; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                Hartelijk dank voor uw reservering bij <strong style="color: #667eea;">Inspiration Point</strong>! 
                Uw aanvraag is succesvol ontvangen en wordt momenteel door ons team beoordeeld.
            </p>

            <!-- Details Card -->
            <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 15px; padding: 30px; margin: 30px 0; border-left: 5px solid #667eea; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);">
                <h3 style="color: #2d3436; margin: 0 0 20px 0; font-size: 20px;">🎭 Reservering Details</h3>
                
                <div style="margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                    <strong style="color: #636e72;">📋 Reservering nummer:</strong>
                    <span style="color: #2d3436; font-weight: 600; float: right;">test-beautiful-123</span>
                    <div style="clear: both;"></div>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                    <strong style="color: #636e72;">📅 Datum:</strong>
                    <span style="color: #2d3436; font-weight: 600; float: right;">vrijdag 20 december 2025</span>
                    <div style="clear: both;"></div>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                    <strong style="color: #636e72;">🕐 Tijd:</strong>
                    <span style="color: #2d3436; font-weight: 600; float: right;">19:30</span>
                    <div style="clear: both;"></div>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                    <strong style="color: #636e72;">👥 Aantal personen:</strong>
                    <span style="color: #2d3436; font-weight: 600; float: right;">6</span>
                    <div style="clear: both;"></div>
                </div>
                
                <div style="padding: 10px 0;">
                    <strong style="color: #636e72;">🍽️ Arrangement:</strong>
                    <span style="color: #667eea; font-weight: 700; float: right;">Premium (€89.50 per persoon)</span>
                    <div style="clear: both;"></div>
                </div>
            </div>

            <!-- Status Info -->
            <div style="background: linear-gradient(135deg, #fff5f5, #fed7d7); border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #feb2b2;">
                <h3 style="margin: 0 0 15px 0; color: #c53030; font-size: 18px;">⏱️ In Behandeling</h3>
                <p style="margin: 0; color: #c53030; font-size: 15px; line-height: 1.5;">
                    Uw reservering heeft de status <strong>PENDING</strong> en wacht op bevestiging van ons team. 
                    We controleren de beschikbaarheid en nemen zo spoedig mogelijk contact met u op.
                </p>
            </div>

            <!-- Next Steps -->
            <div style="background: linear-gradient(135deg, #f0fff4, #c6f6d5); border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #9ae6b4;">
                <h3 style="margin: 0 0 15px 0; color: #276749; font-size: 18px;">📞 Volgende Stappen</h3>
                <ul style="margin: 0; padding-left: 20px; color: #276749; font-size: 15px; line-height: 1.6;">
                    <li style="margin-bottom: 8px;">We controleren de beschikbaarheid voor uw gewenste datum</li>
                    <li style="margin-bottom: 8px;">Een teamlid neemt binnen 24 uur contact met u op</li>
                    <li style="margin-bottom: 8px;">Bij beschikbaarheid ontvangt u betalingsinformatie</li>
                    <li>Na betaling is uw reservering definitief bevestigd</li>
                </ul>
            </div>

            <!-- Contact -->
            <div style="text-align: center; margin: 40px 0; padding: 25px; background: #f8f9fa; border-radius: 10px;">
                <h3 style="color: #2d3436; margin: 0 0 15px 0;">📧 Vragen?</h3>
                <p style="margin: 0; color: #636e72; font-size: 15px;">Heeft u vragen over uw reservering?</p>
                <p style="margin: 10px 0 0 0; color: #667eea; font-weight: 600;">info@inspiration-point.nl</p>
            </div>

        </div>

        <!-- Footer -->
        <div style="background: #2d3436; padding: 30px; text-align: center; color: #b2bec3;">
            <h3 style="margin: 0 0 15px 0; color: #ddd; font-size: 18px;">Met vriendelijke groet,</h3>
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #74b9ff;">Team Inspiration Point</p>
            <p style="margin: 15px 0 0 0; font-size: 13px; opacity: 0.7;">De ultieme dinner theater experience</p>
        </div>

    </div>
</body>
</html>
    `,
    text: `
Beste Mevrouw Sarah van de Berg,

✨ RESERVERING ONTVANGEN ✨

Hartelijk dank voor uw reservering bij Inspiration Point!

RESERVERING DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━
📋 Nummer: test-beautiful-123
📅 Datum: vrijdag 20 december 2025
🕐 Tijd: 19:30
👥 Personen: 6
🍽️ Arrangement: Premium (€89.50 per persoon)

⏱️ STATUS: IN BEHANDELING
━━━━━━━━━━━━━━━━━━━━━━━
Uw reservering wacht op bevestiging en wordt momenteel door ons team beoordeeld.

📞 VOLGENDE STAPPEN:
• We controleren de beschikbaarheid
• Een teamlid neemt binnen 24 uur contact op
• Bij beschikbaarheid ontvangt u betalingsinformatie
• Na betaling is uw reservering definitief bevestigd

📧 VRAGEN?
info@inspiration-point.nl

Met vriendelijke groet,
Team Inspiration Point
De ultieme dinner theater experience
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

  console.log('\n📊 SAMENVATTING:');
  console.log('================');
  console.log('✅ Admin email: Simple format (perfect voor Outlook add-on)');
  console.log('✅ Customer email: Beautiful design met gradients en styling');
  console.log('');
  console.log('📧 Check nu je inbox op info@inspiration-point.nl voor beide emails!');
};

// Start the test
testBothEmails();