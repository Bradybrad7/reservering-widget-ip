// TEST: Completely new professional admin email
const newProfessionalEmailTest = {
  to: 'info@inspiration-point.nl',
  subject: '🎭 Nieuwe Reservatie - zaterdag 23 november 2025 - 4 personen',
  html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nieuwe Reservatie</title>
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
    
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%); color: white; padding: 25px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🎭 Nieuwe Reservatie Ontvangen</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Inspiration Point Dinner Theater</p>
        </div>

        <!-- Event Info -->
        <div style="padding: 20px; border-bottom: 2px solid #e2e8f0;">
            <h2 style="margin: 0 0 15px 0; color: #1a365d; font-size: 18px;">📅 Evenement Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #4a5568; width: 120px;">Datum:</td>
                    <td style="padding: 8px 0; color: #2d3748;">zaterdag 23 november 2025</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #4a5568;">Tijd:</td>
                    <td style="padding: 8px 0; color: #2d3748;">19:30</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #4a5568;">Personen:</td>
                    <td style="padding: 8px 0; color: #2d3748; font-weight: bold; font-size: 16px;">4</td>
                </tr>
            </table>
        </div>

        <!-- Customer Info -->
        <div style="padding: 20px; border-bottom: 2px solid #e2e8f0;">
            <h2 style="margin: 0 0 15px 0; color: #1a365d; font-size: 18px;">👤 Klant Informatie</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568; width: 120px;">Naam:</td>
                    <td style="padding: 6px 0; color: #2d3748; font-weight: bold;">Bradleu Wielockx</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Aanhef:</td>
                    <td style="padding: 6px 0; color: #2d3748;">Dhr.</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Bedrijf:</td>
                    <td style="padding: 6px 0; color: #2d3748;">Test Company</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Email:</td>
                    <td style="padding: 6px 0; color: #2d3748;"><a href="mailto:bradleu@test.com" style="color: #3182ce; text-decoration: none;">bradleu@test.com</a></td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Telefoon:</td>
                    <td style="padding: 6px 0; color: #2d3748;"><a href="tel:+31612345678" style="color: #3182ce; text-decoration: none;">+31612345678</a></td>
                </tr>
            </table>
        </div>

        <!-- Address Info -->
        <div style="padding: 20px; border-bottom: 2px solid #e2e8f0;">
            <h2 style="margin: 0 0 15px 0; color: #1a365d; font-size: 18px;">🏠 Adres Gegevens</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568; width: 120px;">Adres:</td>
                    <td style="padding: 6px 0; color: #2d3748;">Teststraat 123</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Postcode:</td>
                    <td style="padding: 6px 0; color: #2d3748;">1234AB</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Plaats:</td>
                    <td style="padding: 6px 0; color: #2d3748;">Amsterdam</td>
                </tr>
            </table>
        </div>

        <!-- Package Info -->
        <div style="padding: 20px; border-bottom: 2px solid #e2e8f0;">
            <h2 style="margin: 0 0 15px 0; color: #1a365d; font-size: 18px;">🍽️ Arrangement & Extra's</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #4a5568; width: 120px;">Arrangement:</td>
                    <td style="padding: 8px 0; color: #2d3748; font-weight: bold;">Premium (€65.00 pp)</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #4a5568;">Preparty:</td>
                    <td style="padding: 8px 0; color: #2d3748;">Ja (€15.00 pp)</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #4a5568;">Afterparty:</td>
                    <td style="padding: 8px 0; color: #2d3748;">Nee</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #4a5568; border-top: 1px solid #e2e8f0;">Totaal:</td>
                    <td style="padding: 8px 0; color: #2d3748; font-weight: bold; font-size: 18px; color: #22543d; border-top: 1px solid #e2e8f0;">€320.00</td>
                </tr>
            </table>
        </div>

        <!-- Additional Info -->
        <div style="padding: 20px; border-bottom: 2px solid #e2e8f0;">
            <h2 style="margin: 0 0 15px 0; color: #1a365d; font-size: 18px;">📝 Aanvullende Informatie</h2>
            <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #4299e1;">
                Verjaardag viering voor mijn partner. Graag een mooie tafel.
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568; width: 120px;">Nieuwsbrief:</td>
                    <td style="padding: 6px 0; color: #2d3748;">✅ Ja</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Voorwaarden:</td>
                    <td style="padding: 6px 0; color: #2d3748;">✅ Geaccepteerd</td>
                </tr>
            </table>
        </div>

        <!-- Footer -->
        <div style="padding: 20px; text-align: center; background-color: #f7fafc; border-radius: 0 0 8px 8px;">
            <p style="margin: 0; color: #4a5568; font-size: 13px;">
                🎭 Inspiration Point Dinner Theater<br>
                📧 info@inspiration-point.nl | 📞 Contact via website
            </p>
            <p style="margin: 10px 0 0 0; color: #718096; font-size: 12px;">
                Reservering ID: RES-20251107-001
            </p>
        </div>

    </div>
</body>
</html>
  `,
  text: 'NIEUWE RESERVATIE - Als je dit ziet wordt HTML niet gebruikt!'
};

console.log('🎭 Testing COMPLETELY NEW professional admin email...');

fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify(newProfessionalEmailTest)
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(result => {
  console.log('✅ Professional admin email test result:', result);
  console.log('🎉 Check your inbox for the BEAUTIFUL new professional email!');
})
.catch(error => {
  console.error('❌ Test error:', error);
});