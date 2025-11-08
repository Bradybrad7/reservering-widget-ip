// TEST: Stuur alleen de admin email (nieuwe boeking notificatie)
const sendAdminEmail = async () => {
  console.log('📧 VERSTUREN ADMIN EMAIL (Nieuwe Boeking)');
  console.log('==========================================\n');

  const cloudFunctionUrl = 'https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail';

  console.log('📨 Versturen naar: info@inspiration-point.nl...\n');

  await fetch(cloudFunctionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'info@inspiration-point.nl',
      subject: 'Nieuwe voorlopige boeking - 15-12-2025 - 4 personen - Jan de Vries',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nieuwe Voorlopige Boeking</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);">
        
        <!-- Header met Logo -->
        <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #8B0000 100%); padding: 40px 30px; text-align: center; border-bottom: 3px solid #FFD700;">
            <img src="https://irp.cdn-website.com/e8046ea7/dms3rep/multi/logo-ip+%281%29.png" alt="Inspiration Point Logo" style="max-height: 80px; margin-bottom: 15px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #FFD700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Nieuwe Voorlopige Boeking</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            
            <!-- Status Badge -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #FF8C00 0%, #FFD700 100%); color: #000000; padding: 15px 30px; border-radius: 50px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);">
                    🔔 NIEUWE RESERVERING
                </div>
            </div>

            <!-- Main Info -->
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a0a0a 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 8px 20px rgba(255, 215, 0, 0.2);">
                <h3 style="color: #FFD700; margin: 0 0 20px 0; font-size: 18px; text-align: center; border-bottom: 1px solid #FFD700; padding-bottom: 10px;">
                    📋 Reserveringsgegevens
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Datum:</td>
                        <td style="padding: 8px 0; color: #FFFFFF; text-align: right; font-size: 14px;">15-12-2025</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Bedrijfsnaam:</td>
                        <td style="padding: 8px 0; color: #FFFFFF; text-align: right; font-size: 14px;">Test Company BV</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Naam:</td>
                        <td style="padding: 8px 0; color: #FFFFFF; text-align: right; font-size: 14px;">Dhr Jan de Vries</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Adres:</td>
                        <td style="padding: 8px 0; color: #FFFFFF; text-align: right; font-size: 14px;">Teststraat 123</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Postcode & Plaats:</td>
                        <td style="padding: 8px 0; color: #FFFFFF; text-align: right; font-size: 14px;">1234AB Amsterdam</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Telefoon:</td>
                        <td style="padding: 8px 0; color: #FFFFFF; text-align: right; font-size: 14px;">+31612345678</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Email:</td>
                        <td style="padding: 8px 0; color: #FFFFFF; text-align: right; font-size: 14px;">test@example.com</td>
                    </tr>
                    <tr style="border-top: 1px solid #FFD700;">
                        <td style="padding: 12px 0 8px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Aantal personen:</td>
                        <td style="padding: 12px 0 8px 0; color: #FFD700; text-align: right; font-size: 16px; font-weight: bold;">4</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Arrangement:</td>
                        <td style="padding: 8px 0; color: #FFFFFF; text-align: right; font-size: 14px;">€70,00 BWF p.p.</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Preparty:</td>
                        <td style="padding: 8px 0; color: #FFFFFF; text-align: right; font-size: 14px;">Ja (€15,00 p.p.)</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #B8860B; font-weight: bold; font-size: 14px; vertical-align: top;">Merchandise:</td>
                        <td style="padding: 8px 0; color: #FFFFFF; text-align: right; font-size: 14px;">Inspiration Point T-shirt - 2x (€50,00)<br>Theater Mok - 1x (€12,50)</td>
                    </tr>
                    <tr style="border-top: 1px solid #FFD700;">
                        <td style="padding: 15px 0 0 0; color: #FFD700; font-weight: bold; font-size: 16px;">Totaalprijs:</td>
                        <td style="padding: 15px 0 0 0; color: #FFD700; text-align: right; font-size: 18px; font-weight: bold;">€382,50</td>
                    </tr>
                </table>
            </div>

            <!-- Comments -->
            <div style="background: linear-gradient(135deg, #8B0000 0%, #660000 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #FFD700; margin: 0 0 15px 0; font-size: 16px;">💬 Opmerkingen</h3>
                <p style="color: #FFFFFF; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">Graag een tafel bij het raam

Te vieren: Verjaardag voor Marie

Dieetwensen: Vegetarisch: 1x, Glutenvrij: 1x</p>
            </div>

            <!-- Additional Info -->
            <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); border: 1px solid #B8860B; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px 0; color: #B8860B; font-size: 13px;">Nieuwsbrief:</td>
                        <td style="padding: 5px 0; color: #FFFFFF; text-align: right; font-size: 13px;">Ja</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #B8860B; font-size: 13px;">Voorwaarden gelezen:</td>
                        <td style="padding: 5px 0; color: #FFFFFF; text-align: right; font-size: 13px;">Ja</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #B8860B; font-size: 13px;">Reservering ID:</td>
                        <td style="padding: 5px 0; color: #FFD700; text-align: right; font-size: 13px; font-family: monospace;">TEST-ADMIN-2025-001</td>
                    </tr>
                </table>
            </div>

        </div>

        <!-- Footer -->
        <div style="background: #000000; padding: 25px 30px; text-align: center; border-top: 2px solid #FFD700;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #B8860B;">Maastrichterweg 13-17, 5554 GE Valkenswaard</p>
            <p style="margin: 0; font-size: 13px; color: #666;">040-2110679 | info@inspiration-point.nl | www.inspiration-point.nl</p>
        </div>

    </div>
</body>
</html>
      `
    })
  });

  console.log('✅ ADMIN EMAIL VERSTUURD!\n');
  console.log('Dit is de email die je ontvangt als er een nieuwe boeking binnenkomt.');
  console.log('Check je inbox: info@inspiration-point.nl 📬');
};

sendAdminEmail().catch(console.error);
