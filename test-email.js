// Test email script om direct een email te versturen naar info@inspiration-point.nl
const testEmail = async () => {
  const emailData = {
    to: 'info@inspiration-point.nl',
    subject: 'Test Email - Reserveringssysteem Werkt!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5530;">🎭 Email Test Geslaagd!</h2>
        <p>Beste team,</p>
        <p>Dit is een test email om te bevestigen dat het reserveringssysteem correct emails kan versturen.</p>
        
        <div style="background-color: #f0f8f0; padding: 15px; border-left: 4px solid #2c5530; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c5530;">✅ Systeem Status</h3>
          <ul>
            <li>Firebase Functions: <strong>Actief</strong></li>
            <li>SMTP Configuratie: <strong>Werkend</strong></li>
            <li>Email Service: <strong>Online</strong></li>
            <li>Development Mode: <strong>Geforceerd</strong></li>
          </ul>
        </div>

        <p>Alle nieuwe reserveringen zullen nu automatisch bevestigingsemails versturen!</p>
        
        <p>Met vriendelijke groet,<br>
        <strong>Inspiration Point Reserveringssysteem</strong></p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Test uitgevoerd op: ${new Date().toLocaleString('nl-NL')}<br>
          Systeem: dinner-theater-booking Firebase Project
        </p>
      </div>
    `,
    text: `Email Test Geslaagd!
    
Dit is een test email om te bevestigen dat het reserveringssysteem correct emails kan versturen.

Systeem Status:
- Firebase Functions: Actief
- SMTP Configuratie: Werkend  
- Email Service: Online
- Development Mode: Geforceerd

Alle nieuwe reserveringen zullen nu automatisch bevestigingsemails versturen!

Test uitgevoerd op: ${new Date().toLocaleString('nl-NL')}
Systeem: dinner-theater-booking Firebase Project`
  };

  console.log('🚀 Test email versturen naar info@inspiration-point.nl...');
  console.log('📧 Email data:', emailData);

  try {
    const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS! Email verzonden:', result);
      console.log('📬 Controleer de inbox van info@inspiration-point.nl');
    } else {
      console.error('❌ ERROR! Email niet verzonden:', result);
    }
    
    return result;
  } catch (error) {
    console.error('🔥 NETWORK ERROR:', error);
    return { success: false, error: error.message };
  }
};

// Test uitvoeren
testEmail();