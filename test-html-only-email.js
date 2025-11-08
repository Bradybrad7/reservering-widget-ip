// TEST: HTML-only email (geen text versie meer)
const testHtmlOnlyEmail = async () => {
  console.log('📧 TESTING HTML-ONLY EMAIL (NO TEXT VERSION)');
  console.log('==============================================');

  const htmlOnlyEmail = {
    to: 'info@inspiration-point.nl',
    subject: 'TEST: HTML-Only Email (Geen Text Versie)',
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>HTML Only Test</title>
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
    
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🎭 HTML-Only Test</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Inspiration Point Theater</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            
            <h2 style="color: #2d3748; font-size: 20px; margin-bottom: 16px;">✅ Nieuwe Email Configuratie</h2>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Deze email wordt <strong style="color: #c53030;">alleen als HTML</strong> verstuurd. 
                Er is geen text versie meer die voor verwarring kan zorgen.
            </p>

            <div style="background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #276749; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">🚀 Verbeteringen:</h3>
                <ul style="margin: 0; padding-left: 18px; color: #276749; font-size: 14px; line-height: 1.6;">
                    <li><strong>Geen dubbele content meer</strong> - alleen HTML</li>
                    <li><strong>Consistent opmaak</strong> - altijd mooie layout</li>
                    <li><strong>Minder verwarring</strong> - één duidelijke email</li>
                    <li><strong>Betere leesbaarheid</strong> - professionele opmaak</li>
                </ul>
            </div>

            <!-- Test Table -->
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #e2e8f0;">
                <tr style="background: #f7fafc;">
                    <td style="padding: 12px; font-weight: bold; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Test Item</td>
                    <td style="padding: 12px; color: #2d3748; border-bottom: 1px solid #e2e8f0;">Waarde</td>
                </tr>
                <tr>
                    <td style="padding: 12px; font-weight: bold; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Email Type:</td>
                    <td style="padding: 12px; color: #2d3748; border-bottom: 1px solid #e2e8f0;">HTML Only</td>
                </tr>
                <tr>
                    <td style="padding: 12px; font-weight: bold; color: #4a5568; border-bottom: 1px solid #e2e8f0;">Text Versie:</td>
                    <td style="padding: 12px; color: #c53030; font-weight: bold; border-bottom: 1px solid #e2e8f0;">❌ Geen</td>
                </tr>
                <tr>
                    <td style="padding: 12px; font-weight: bold; color: #4a5568;">Resultaat:</td>
                    <td style="padding: 12px; color: #22543d; font-weight: bold;">✅ Mooie opmaak</td>
                </tr>
            </table>

            <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #c53030; font-size: 14px; font-weight: 600; text-align: center;">
                    ⚠️ Als je dit mooi geformatteerd ziet, dan werkt de HTML-only configuratie! ⚠️
                </p>
            </div>

        </div>

        <!-- Footer -->
        <div style="background: #2d3748; padding: 20px; text-align: center; color: #a0aec0; border-radius: 0 0 8px 8px;">
            <p style="margin: 0; font-size: 14px; color: #e2e8f0;">Test succesvol uitgevoerd</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #a0aec0;">Timestamp: ${new Date().toLocaleString('nl-NL')}</p>
        </div>

    </div>
</body>
</html>
    `
    // GEEN TEXT FIELD MEER!
  };

  console.log('📧 Versturen HTML-only test email...');
  console.log('✅ Zonder text field in request');
  console.log('✅ Firebase Cloud Function verwacht alleen HTML');
  console.log('✅ Geen fallback text versie');

  try {
    const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(htmlOnlyEmail)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firebase Cloud Function failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ HTML-only email sent successfully!');
    console.log('Result:', result);
    
    console.log('\n🔍 Check your inbox for:');
    console.log('📧 Subject: "TEST: HTML-Only Email (Geen Text Versie)"');
    console.log('\n✨ De email moet nu:');
    console.log('- 🎨 Mooi geformatteerd zijn (HTML opmaak)');
    console.log('- 📋 Geen dubbele content bevatten');
    console.log('- 🚀 Professioneel uitzien');
    console.log('- ✅ Geen text versie meer hebben');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Run test
testHtmlOnlyEmail();