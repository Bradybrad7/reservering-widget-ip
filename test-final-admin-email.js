// TEST: Final admin email test with borders and padding
const finalTestEmailData = {
  to: 'info@inspiration-point.nl',
  subject: 'FINAL TEST: Admin email met borders',
  html: `
<h3>Nieuwe reservatie ontvangen</h3>

<table border="1" cellpadding="5" cellspacing="0">
  <tr><td><strong>Datum:</strong></td><td>07-11-2025</td></tr>
  <tr><td><strong>Bedrijfsnaam:</strong></td><td>Final Test BV</td></tr>
  <tr><td><strong>Aanhef:</strong></td><td>Dhr.</td></tr>
  <tr><td><strong>Naam:</strong></td><td>Jan de Final Tester</td></tr>
  <tr><td><strong>Adres:</strong></td><td>Finalstraat 999</td></tr>
  <tr><td><strong>Huisnummer:</strong></td><td>999</td></tr>
  <tr><td><strong>Postcode:</strong></td><td>9999ZZ</td></tr>
  <tr><td><strong>Plaats:</strong></td><td>Finalstad</td></tr>
  <tr><td><strong>Telefoon:</strong></td><td>+31699999999</td></tr>
  <tr><td><strong>Email:</strong></td><td>final@test.com</td></tr>
  <tr><td><strong>Aantal personen:</strong></td><td>6</td></tr>
  <tr><td><strong>Arrangement:</strong></td><td>Deluxe - €85.00 per persoon</td></tr>
  <tr><td><strong>Preparty:</strong></td><td>Ja</td></tr>
  <tr><td><strong>Afterparty:</strong></td><td>Ja</td></tr>
  <tr><td><strong>Opmerkingen:</strong></td><td>Dit is nu een mooie tabel!</td></tr>
  <tr><td><strong>Nieuwsbrief:</strong></td><td>Ja</td></tr>
  <tr><td><strong>Algemene voorwaarden:</strong></td><td>Ja</td></tr>
</table>
  `,
  text: 'Als je dit ziet wordt HTML nog steeds niet gebruikt!'
};

console.log('📧 Final test - sending beautiful admin email...');

fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify(finalTestEmailData)
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(result => {
  console.log('✅ Final test result:', result);
  console.log('🎉 Admin email should now be a beautiful table in Outlook!');
})
.catch(error => {
  console.error('❌ Final test error:', error);
});