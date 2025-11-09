/**
 * Test voor Dark Theatre admin email - EXACT zoals klant emails
 */

import './src/firebase';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

async function sendTestEmail() {
  console.log('🎭 DARK THEATRE ADMIN EMAIL TEST');
  console.log('════════════════════════════════════════════════════════════\n');

  const eventDate = format(new Date('2025-12-15'), 'dd-MM-yyyy', { locale: nl });
  
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="nl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no" />
  <title>Nieuwe Reservering</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: Arial, Helvetica, sans-serif;">
  
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1a1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%;">
          
          <tr>
            <td align="center" style="padding: 30px 0;">
              <img src="https://www.inspiration-point.nl/wp-content/uploads/2023/02/cropped-IP-Logo-2023-transparant-small.png" alt="Inspiration Point" width="400" style="display: block; width: 400px; max-width: 100%; height: auto; border: 0;" />
            </td>
          </tr>
          
          <tr>
            <td align="center" style="padding: 20px 0 30px 0;">
              <h1 style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 28px; font-weight: bold; color: #D4AF37; line-height: 1.3;">
                🔔 Nieuwe Reservering
              </h1>
            </td>
          </tr>
          
          <tr>
            <td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #2a2a2a; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px;">
                    
                    <p style="margin: 0 0 30px 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #aaaaaa; line-height: 1.6;">
                      Er is een nieuwe voorlopige reservering ontvangen voor ${eventDate}.
                    </p>
                    
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px; background-color: #1a1a1a; border: 2px solid #D4AF37; border-radius: 8px;">
                      <tr>
                        <td style="padding: 25px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top; width: 40%;">
                                Datum
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top; font-weight: bold;">
                                ${eventDate}
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Aantal personen
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #D4AF37; padding: 6px 0; vertical-align: top; font-weight: bold;">
                                12
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Arrangement
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                €59.50 BWF p.p.
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Preparty
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                Ja (€7.50 p.p.)
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Afterparty
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                Ja (€5.00 p.p.)
                              </td>
                            </tr>
                            
                            <tr>
                              <td colspan="2" style="padding: 15px 0 10px 0;">
                                <div style="border-top: 1px solid #333333; padding-top: 15px;">
                                  <p style="margin: 0 0 10px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #D4AF37; font-weight: bold;">
                                    Contactgegevens
                                  </p>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Bedrijfsnaam
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                Test Bedrijf BV
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Aanhef
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                Dhr
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Naam
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top; font-weight: bold;">
                                Jan de Vries
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Email
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                test@example.com
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Telefoon
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                +31612345678
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Adres
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                Teststraat 42
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Postcode & Plaats
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                1234 AB Amsterdam
                              </td>
                            </tr>
                            
                            <tr>
                              <td colspan="2" style="padding: 15px 0 10px 0;">
                                <div style="border-top: 1px solid #333333; padding-top: 15px;">
                                  <p style="margin: 0 0 10px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #D4AF37; font-weight: bold;">
                                    📝 Opmerkingen & Extra Informatie
                                  </p>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td colspan="2" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; line-height: 1.6;">
                                OPMERKING: Graag een tafeltje bij het raam!
                              </td>
                            </tr>
                            <tr>
                              <td colspan="2" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; line-height: 1.6;">
                                VIERING: Verjaardag voor Jan (50 jaar)
                              </td>
                            </tr>
                            <tr>
                              <td colspan="2" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; line-height: 1.6;">
                                ALLERGIE/DIEET: Vegetarisch 2x, Veganistisch 1x, Glutenvrij 1x, Notenalergie
                              </td>
                            </tr>
                            
                            <tr>
                              <td colspan="2" style="padding: 20px 0 0 0;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #333333; border-radius: 4px;">
                                  <tr>
                                    <td style="padding: 12px; text-align: center;">
                                      <p style="margin: 0 0 5px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #888888;">
                                        Nieuwsbrief: ✅ Ja | Voorwaarden: ✅ Ja
                                      </p>
                                      <p style="margin: 0; font-family: monospace; font-size: 11px; color: #666666;">
                                        ID: test-123
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td align="center" style="padding: 30px 20px;">
              <p style="margin: 0 0 10px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #aaaaaa; line-height: 1.6;">
                <strong style="color: #D4AF37;">Inspiration Point</strong><br />
                Maastrichterweg 13-17, 5554 GE Valkenswaard<br />
                <a href="tel:0402110679" style="color: #D4AF37; text-decoration: none;">040-2110679</a> | 
                <a href="mailto:info@inspiration-point.nl" style="color: #D4AF37; text-decoration: none;">info@inspiration-point.nl</a>
              </p>
              <p style="margin: 10px 0 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #888888;">
                <a href="https://www.inspiration-point.nl" style="color: #888888; text-decoration: underline;">www.inspiration-point.nl</a>
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `;

  try {
    console.log('📤 Verzenden naar: info@inspiration-point.nl\n');
    
    const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'info@inspiration-point.nl',
        subject: `TEST - Dark Theatre Admin Email - ${eventDate} - 12 personen`,
        html: html
      })
    });

    if (response.ok) {
      console.log('✅ TEST EMAIL SUCCESVOL VERZONDEN!\n');
      console.log('📬 Check je inbox: info@inspiration-point.nl\n');
      console.log('💡 Dit is nu EXACT dezelfde styling als klant emails:');
      console.log('   ✅ Dark Theatre theme (#1a1a1a background)');
      console.log('   ✅ Gouden accenten (#D4AF37)');
      console.log('   ✅ Logo bovenaan (400px)');
      console.log('   ✅ Table-based layout (Outlook compatible)');
      console.log('   ✅ Donkere card met gouden border\n');
    } else {
      console.error('❌ Fout:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

sendTestEmail();
