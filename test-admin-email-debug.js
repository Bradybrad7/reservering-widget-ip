// TEST: Admin email debug - check exact format being sent
const testEmailData = {
  to: 'info@inspiration-point.nl',
  subject: 'TEST: Nieuwe reservatie ontvangen',
  html: `
<h3>Nieuwe reservatie ontvangen</h3>

<table border="1" cellpadding="5" cellspacing="0">
  <tr><td><strong>Datum:</strong></td><td>07-11-2025</td></tr>
  <tr><td><strong>Bedrijfsnaam:</strong></td><td>Test Company</td></tr>
  <tr><td><strong>Aanhef:</strong></td><td>Dhr.</td></tr>
  <tr><td><strong>Naam:</strong></td><td>Jan de Tester</td></tr>
  <tr><td><strong>Adres:</strong></td><td>Teststraat 123</td></tr>
  <tr><td><strong>Huisnummer:</strong></td><td>123</td></tr>
  <tr><td><strong>Postcode:</strong></td><td>1234AB</td></tr>
  <tr><td><strong>Plaats:</strong></td><td>Amsterdam</td></tr>
  <tr><td><strong>Telefoon:</strong></td><td>+31612345678</td></tr>
  <tr><td><strong>Email:</strong></td><td>test@example.com</td></tr>
  <tr><td><strong>Aantal personen:</strong></td><td>4</td></tr>
  <tr><td><strong>Arrangement:</strong></td><td>Premium - €65.00 per persoon</td></tr>
  <tr><td><strong>Preparty:</strong></td><td>Ja</td></tr>
  <tr><td><strong>Afterparty:</strong></td><td>Nee</td></tr>
  <tr><td><strong>Opmerkingen:</strong></td><td>Verjaardag viering</td></tr>
  <tr><td><strong>Nieuwsbrief:</strong></td><td>Ja</td></tr>
  <tr><td><strong>Algemene voorwaarden:</strong></td><td>Ja</td></tr>
</table>
  `,
  text: 'Dit is de text versie - als je dit ziet dan wordt HTML niet gebruikt!'
};

// Debug info
console.log('🔍 Testing admin email format...');
console.log('HTML content preview:');
console.log(testEmailData.html.substring(0, 200) + '...');

// Send test email
fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify(testEmailData)
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(result => {
  console.log('✅ Test email result:', result);
})
.catch(error => {
  console.error('❌ Test email error:', error);
});