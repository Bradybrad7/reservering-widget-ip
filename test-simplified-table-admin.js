// Test SIMPLIFIED TABLE admin email format
async function testSimplifiedTableAdminEmail() {
  console.log('🧪 Testing SIMPLIFIED TABLE admin email format...');
  
  try {
    const simplifiedTableHtml = `
<h3>Nieuwe reservatie ontvangen</h3>

<table>
  <tr><td>Datum:</td><td>15-12-2025</td></tr>
  <tr><td>Naam:</td><td>Jan de Vries</td></tr>
  <tr><td>Email:</td><td>test@example.com</td></tr>
  <tr><td>Telefoon:</td><td>+31612345678</td></tr>
  <tr><td>Adres:</td><td>Teststraat 123</td></tr>
  <tr><td>Postcode:</td><td>1234 AB Amsterdam</td></tr>
  <tr><td>Aantal personen:</td><td>4</td></tr>
  <tr><td>Arrangement:</td><td>Deluxe - €65.00 per persoon</td></tr>
  <tr><td>Opmerkingen:</td><td>Test opmerking</td></tr>
</table>
    `;
    
    const simpleText = `Nieuwe reservatie ontvangen

Datum: 15-12-2025
Naam: Jan de Vries
Email: test@example.com
Telefoon: +31612345678
Adres: Teststraat 123
Postcode: 1234 AB Amsterdam
Aantal personen: 4
Arrangement: Deluxe - €65.00 per persoon
Opmerkingen: Test opmerking`;
    
    console.log('📧 Sending SIMPLIFIED TABLE admin email...');
    console.log('HTML version:');
    console.log(simplifiedTableHtml);
    
    const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to: 'info@inspiration-point.nl',
        subject: 'TEST SIMPLIFIED TABLE: Nieuwe reservatie ontvangen',
        html: simplifiedTableHtml,
        text: simpleText
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firebase Cloud Function failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ SIMPLIFIED TABLE admin email sent!');
    console.log('\n🔍 Check your inbox for:');
    console.log('📧 Subject: "TEST SIMPLIFIED TABLE: Nieuwe reservatie ontvangen"');
    
    console.log('\n📊 This simplified table:');
    console.log('✅ NO complex CSS styling');
    console.log('✅ Basic <table><tr><td> structure');
    console.log('✅ Should work better with Outlook add-on');
    console.log('✅ Easy to parse automatically');
    
    console.log('\n❓ Compare with previous emails:');
    console.log('1. Simple paragraphs (TEST SIMPLE)');
    console.log('2. Simplified table (TEST SIMPLIFIED TABLE) ← This one');
    console.log('3. Complex styled table (current app)');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testSimplifiedTableAdminEmail();