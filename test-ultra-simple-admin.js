// Test ULTRA SIMPLE admin email format
async function testUltraSimpleAdminEmail() {
  console.log('🧪 Testing ULTRA SIMPLE admin email format...');
  
  try {
    const simpleHtml = `
<h3>Nieuwe reservatie ontvangen</h3>
<p><strong>Datum:</strong> 15-12-2025</p>
<p><strong>Naam:</strong> Jan de Vries</p>
<p><strong>Email:</strong> test@example.com</p>
<p><strong>Aantal personen:</strong> 4</p>
<p><strong>Arrangement:</strong> Deluxe - €65.00 per persoon</p>
    `;
    
    const simpleText = `Nieuwe reservatie ontvangen
Datum: 15-12-2025
Naam: Jan de Vries
Email: test@example.com
Aantal personen: 4
Arrangement: Deluxe - €65.00 per persoon`;
    
    console.log('📧 Sending ULTRA SIMPLE admin email...');
    console.log('HTML version:');
    console.log(simpleHtml);
    
    const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to: 'info@inspiration-point.nl',
        subject: 'TEST SIMPLE: Nieuwe reservatie ontvangen',
        html: simpleHtml,
        text: simpleText
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firebase Cloud Function failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ ULTRA SIMPLE admin email sent!');
    console.log('\n🔍 Check your inbox for:');
    console.log('📧 Subject: "TEST SIMPLE: Nieuwe reservatie ontvangen"');
    
    console.log('\n📊 This test checks:');
    console.log('✅ If SIMPLE HTML renders correctly');
    console.log('✅ If Firebase sends HTML vs TEXT');
    console.log('✅ If the issue is HTML complexity or email client');
    
    console.log('\n❓ If this SIMPLE email is STILL all in one line:');
    console.log('1. Problem is with Firebase Cloud Function (sends text instead of HTML)');
    console.log('2. Problem is with your email client HTML rendering');
    console.log('\n❓ If this SIMPLE email looks GOOD:');
    console.log('1. Problem is with complex HTML table structure');
    console.log('2. Need to simplify the admin email template');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testUltraSimpleAdminEmail();