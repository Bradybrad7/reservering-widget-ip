// TEST: Nieuwe simpele admin email template
const testNewSimpleAdminEmail = async () => {
  console.log('📧 TESTING NIEUWE SIMPELE ADMIN EMAIL TEMPLATE');
  console.log('==============================================');

  // Test data matching your example
  const testEmailData = {
    to: 'info@inspiration-point.nl',
    subject: 'Nieuwe voorlopige boeking - 25-09-2025 - 2 personen - Wendy Daamen',
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nieuwe Voorlopige Boeking</title>
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9f9f9;">
    
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <p>Geachte medewerker Inspiration Point,</p>
        
        <p><strong>Er is een nieuwe voorlopige boeking ontvangen, hieronder volgen de gegevens:</strong></p>
        
        <div style="background: #f7fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
            
            <p><strong>Datum:</strong> 25-09-2025</p>
            <p><strong>Bedrijfsnaam:</strong> Wenzorg</p>
            <p><strong>Aanhef:</strong> Mevr</p>
            <p><strong>Naam:</strong> Wendy Daamen</p>
            <p><strong>Adres:</strong> Ericapad</p>
            <p><strong>Huisnummer:</strong> 11</p>
            <p><strong>Postcode:</strong> 5552RP</p>
            <p><strong>Plaats:</strong> Valkenswaard</p>
            <p><strong>Telefoon:</strong> 0616220264</p>
            <p><strong>Email:</strong> Wenzorg@outlook.com</p>
            
            <p><strong>Aantal personen:</strong> 2</p>
            
            <p><strong>Gekozen arrangement:</strong> €70,00 BWF p.p.</p>
            
            <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 15px; margin: 15px 0;">
                <p style="margin: 0;"><strong>Opmerkingen:</strong></p>
                <div style="white-space: pre-line; margin-top: 8px;">Met cadeaubon in ruil van de sleutel ??</div>
            </div>
            
            <p><strong>Nieuwsbrief:</strong> Nee</p>
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
            <p style="font-size: 12px; color: #999;">Reservering ID: TEST123456</p>
        </div>
        
    </div>
</body>
</html>
    `
  };

  console.log('📧 Versturen nieuwe simpele admin email...');
  console.log('✅ Gericht naar Inspiration Point medewerkers');
  console.log('✅ Simpele, overzichtelijke opmaak');
  console.log('✅ Alle relevante booking informatie');

  try {
    const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testEmailData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firebase Cloud Function failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ Nieuwe simpele admin email sent successfully!');
    console.log('Result:', result);
    
    console.log('\n🔍 Check your inbox for:');
    console.log('📧 Subject: "Nieuwe voorlopige boeking - 25-09-2025 - 2 personen - Wendy Daamen"');
    console.log('\n✨ De email moet nu hebben:');
    console.log('- 📝 Simpele, leesbare opmaak');
    console.log('- 🎯 Gericht naar Inspiration Point medewerkers');
    console.log('- 📋 Alle booking gegevens overzichtelijk');
    console.log('- 🏢 Contact informatie onderaan');
    console.log('- 💬 Opmerkingen duidelijk gemarkeerd');
    console.log('- 📍 Factuuradres indien anders');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Run test
testNewSimpleAdminEmail();