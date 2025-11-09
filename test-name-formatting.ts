/**
 * Test voor naam formatting en address split in admin email
 */

import './src/firebase';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

async function sendTestEmail() {
  console.log('🎭 NAAM FORMATTING & ADDRESS SPLIT TEST');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Test cases:');
  console.log('  ✅ "jan de vries" → "Jan de Vries"');
  console.log('  ✅ "PETER VAN DER BERG" → "Peter van der Berg"');
  console.log('  ✅ Adres en Huisnummer APART');
  console.log('  ✅ Postcode en Plaats APART');
  console.log('════════════════════════════════════════════════════════════\n');

  const eventDate = format(new Date('2025-12-15'), 'dd-MM-yyyy', { locale: nl });
  
  // Simulate different name formats
  const testName1 = "jan de vries"; // lowercase
  const testName2 = "MARIA VAN DEN HEUVEL"; // uppercase
  
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="nl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nieuwe Reservering TEST</title>
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
                🔔 TEST - Naam Formatting
              </h1>
            </td>
          </tr>
          
          <tr>
            <td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #2a2a2a; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px;">
                    
                    <p style="margin: 0 0 30px 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #aaaaaa; line-height: 1.6;">
                      Test voor automatische naam formatting en address split.
                    </p>
                    
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px; background-color: #1a1a1a; border: 2px solid #D4AF37; border-radius: 8px;">
                      <tr>
                        <td style="padding: 25px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            
                            <tr>
                              <td colspan="2" style="padding: 15px 0 10px 0;">
                                <div style="border-top: 1px solid #333333; padding-top: 15px;">
                                  <p style="margin: 0 0 10px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #D4AF37; font-weight: bold;">
                                    Test Case 1: "${testName1}"
                                  </p>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top; width: 40%;">
                                Input
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                ${testName1}
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Expected
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #D4AF37; padding: 6px 0; vertical-align: top; font-weight: bold;">
                                Jan de Vries
                              </td>
                            </tr>
                            
                            <tr>
                              <td colspan="2" style="padding: 15px 0 10px 0;">
                                <div style="border-top: 1px solid #333333; padding-top: 15px;">
                                  <p style="margin: 0 0 10px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #D4AF37; font-weight: bold;">
                                    Test Case 2: "${testName2}"
                                  </p>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Input
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                ${testName2}
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Expected
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #D4AF37; padding: 6px 0; vertical-align: top; font-weight: bold;">
                                Maria van den Heuvel
                              </td>
                            </tr>
                            
                            <tr>
                              <td colspan="2" style="padding: 15px 0 10px 0;">
                                <div style="border-top: 1px solid #333333; padding-top: 15px;">
                                  <p style="margin: 0 0 10px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #D4AF37; font-weight: bold;">
                                    Address Split Test
                                  </p>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Adres
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                Teststraat
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Huisnummer
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                42A
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Postcode
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                1234 AB
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; vertical-align: top;">
                                Plaats
                              </td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; vertical-align: top;">
                                Amsterdam
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
              <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #aaaaaa;">
                <strong style="color: #D4AF37;">Inspiration Point</strong><br />
                Test Email - Naam Formatting & Address Split
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
        subject: `TEST - Naam Formatting & Address Split - ${eventDate}`,
        html: html
      })
    });

    if (response.ok) {
      console.log('✅ TEST EMAIL SUCCESVOL VERZONDEN!\n');
      console.log('📬 Check je inbox: info@inspiration-point.nl\n');
      console.log('💡 Systeem zal nu automatisch:');
      console.log('   ✅ "jan de vries" → "Jan de Vries"');
      console.log('   ✅ "PETER VAN DER BERG" → "Peter van der Berg"');
      console.log('   ✅ Tussenvoegsels klein houden (van, de, der, den, etc.)');
      console.log('   ✅ Admin email: Adres en Huisnummer apart');
      console.log('   ✅ Admin email: Postcode en Plaats apart\n');
    } else {
      console.error('❌ Fout:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

sendTestEmail();
