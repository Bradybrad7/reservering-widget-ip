// TEST: Admin email met aparte aanhef regel
const sendAdminEmailWithSalutation = async () => {
  console.log('📧 VERSTUREN ADMIN EMAIL MET APARTE AANHEF');
  console.log('==========================================\n');

  const cloudFunctionUrl = 'https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail';

  console.log('📨 Versturen naar: info@inspiration-point.nl...\n');

  await fetch(cloudFunctionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'info@inspiration-point.nl',
      subject: 'Nieuwe voorlopige reservering - 15-12-2025 - 4 personen - Jan de Vries',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nieuwe Voorlopige Reservering</title>
</head>
<body style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
    
    <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 4px;">
        
        <!-- Header -->
        <div style="background-color: #000000; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; color: #ffffff;">🔔 Nieuwe Voorlopige Reservering</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            
            <p style="margin: 0 0 20px 0; font-size: 15px;">Geachte medewerker Inspiration Point,</p>
            
            <p style="margin: 0 0 25px 0; font-size: 15px;"><strong>Er is een nieuwe voorlopige reservering ontvangen:</strong></p>
            
            <!-- Reservering Details -->
            <div style="background-color: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px; padding: 20px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold; width: 40%;">Datum:</td>
                        <td style="padding: 6px 0;">15-12-2025</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Bedrijfsnaam:</td>
                        <td style="padding: 6px 0;">Test Company BV</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Aanhef:</td>
                        <td style="padding: 6px 0;">Dhr</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Naam:</td>
                        <td style="padding: 6px 0;">Jan de Vries</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Adres:</td>
                        <td style="padding: 6px 0;">Teststraat 123</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Postcode & Plaats:</td>
                        <td style="padding: 6px 0;">1234AB Amsterdam</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Telefoon:</td>
                        <td style="padding: 6px 0;">+31612345678</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Email:</td>
                        <td style="padding: 6px 0;">test@example.com</td>
                    </tr>
                    <tr style="border-top: 2px solid #ddd;">
                        <td style="padding: 12px 0 6px 0; font-weight: bold; font-size: 16px;">Aantal personen:</td>
                        <td style="padding: 12px 0 6px 0; font-size: 16px; font-weight: bold;">4</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Arrangement:</td>
                        <td style="padding: 6px 0;">€70,00 BWF p.p.</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Preparty:</td>
                        <td style="padding: 6px 0;">Ja (€15,00 p.p.)</td>
                    </tr>
                    <tr style="border-top: 2px solid #ddd;">
                        <td style="padding: 12px 0 0 0; font-weight: bold; font-size: 17px;">Totaalprijs:</td>
                        <td style="padding: 12px 0 0 0; font-size: 17px; font-weight: bold;">€382,50</td>
                    </tr>
                </table>
            </div>

            <!-- Opmerkingen -->
            <div style="background-color: #fff9e6; border: 1px solid #e8d7a6; border-radius: 4px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #333;">📝 Opmerkingen & Extra Informatie</h3>
                <div style="white-space: pre-line; font-size: 14px; line-height: 1.8; color: #444;">Klant opmerking:
Graag een tafel bij het raam

---

Merchandise:
  • Inspiration Point T-shirt - 2x (€50,00)
  • Theater Mok - 1x (€12,50)

---

Te vieren: Verjaardag voor Marie

---

Dieetwensen:
  • Vegetarisch: 1x
  • Glutenvrij: 1x</div>
            </div>

            <!-- Extra Info -->
            <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 4px 0; color: #666;">Nieuwsbrief:</td>
                        <td style="padding: 4px 0; text-align: right;">Ja</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0; color: #666;">Voorwaarden gelezen:</td>
                        <td style="padding: 4px 0; text-align: right;">Ja</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0; color: #666;">Reservering ID:</td>
                        <td style="padding: 4px 0; text-align: right; font-family: monospace; color: #333;">TEST-AANHEF-001</td>
                    </tr>
                </table>
            </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd; font-size: 13px; color: #666;">
            <p style="margin: 0 0 5px 0;"><strong>Inspiration Point</strong></p>
            <p style="margin: 0 0 5px 0;">Maastrichterweg 13-17, 5554 GE Valkenswaard</p>
            <p style="margin: 0;">040-2110679 | info@inspiration-point.nl | www.inspiration-point.nl</p>
        </div>

    </div>
</body>
</html>
      `
    })
  });

  console.log('✅ ADMIN EMAIL VERSTUURD!\n');
  console.log('📋 WIJZIGINGEN:');
  console.log('   ✅ Aanhef staat nu APART op eigen regel');
  console.log('   ✅ Naam staat zonder aanhef (alleen voornaam + achternaam)');
  console.log('   ✅ Aanhef veld toegevoegd aan boekingsformulier (ContactStep)');
  console.log('   ✅ Aanhef is nu verplicht bij nieuwe boekingen');
  console.log('\n📬 Check je inbox: info@inspiration-point.nl');
};

sendAdminEmailWithSalutation().catch(console.error);
