/**
 * Test alle email types - DIRECT SMTP verzending
 */

import './src/firebase';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const eventDate = format(new Date('2025-12-15'), 'dd-MM-yyyy', { locale: nl });
const smtpEndpoint = 'https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail';

async function sendEmail(subject: string, html: string) {
  const response = await fetch(smtpEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'info@inspiration-point.nl',
      subject,
      html
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to send email: ${await response.text()}`);
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendAllEmails() {
  console.log('🎭 ALLE EMAIL VOORBEELDEN VERZENDEN');
  console.log('════════════════════════════════════════════════════════════\n');

  const logoUrl = 'https://www.inspiration-point.nl/wp-content/uploads/2023/02/cropped-IP-Logo-2023-transparant-small.png';
  
  // Shared email styles (Dark Theatre template)
  const emailHeader = (title: string) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="nl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1a1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%;">
          <tr>
            <td align="center" style="padding: 30px 0;">
              <img src="${logoUrl}" alt="Inspiration Point" width="400" style="display: block; width: 400px; max-width: 100%; height: auto; border: 0;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 20px 0 30px 0;">
              <h1 style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 28px; font-weight: bold; color: #D4AF37; line-height: 1.3;">
                ${title}
              </h1>
            </td>
          </tr>`;

  const emailFooter = `
          <tr>
            <td align="center" style="padding: 30px 20px;">
              <p style="margin: 0 0 10px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #aaaaaa; line-height: 1.6;">
                <strong style="color: #D4AF37;">Inspiration Point</strong><br />
                Maastrichterweg 13-17, 5554 GE Valkenswaard<br />
                <a href="tel:0402110679" style="color: #D4AF37; text-decoration: none;">040-2110679</a> | 
                <a href="mailto:info@inspiration-point.nl" style="color: #D4AF37; text-decoration: none;">info@inspiration-point.nl</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    // 1. ADMIN EMAIL
    console.log('1️⃣  Admin Notificatie Email...');
    await sendEmail(
      `TEST - Admin Notificatie - ${eventDate} - 12 personen`,
      emailHeader('🔔 Nieuwe Reservering') + `
          <tr>
            <td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #2a2a2a; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 30px 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #aaaaaa; line-height: 1.6;">
                      Er is een nieuwe voorlopige reservering ontvangen voor ${eventDate}.
                    </p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; background-color: #1a1a1a; border: 2px solid #D4AF37; border-radius: 8px;">
                      <tr>
                        <td style="padding: 25px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; width: 40%;">Datum</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; font-weight: bold;">${eventDate}</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0;">Aantal personen</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #D4AF37; padding: 6px 0; font-weight: bold;">12</td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding: 15px 0 10px 0;"><div style="border-top: 1px solid #333333; padding-top: 15px;"><p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #D4AF37; font-weight: bold;">Contactgegevens</p></div></td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0;">Naam</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0; font-weight: bold;">Jan de Vries</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0;">Adres</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0;">Teststraat</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0;">Huisnummer</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0;">42</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0;">Postcode</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0;">1234 AB</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0;">Plaats</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #f1f1f1; padding: 6px 0;">Amsterdam</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` + emailFooter
    );
    console.log('   ✅ Verzonden\n');
    await sleep(2000);

    // 2. PENDING EMAIL
    console.log('2️⃣  Klant - Pending (Aanvraag ontvangen)...');
    await sendEmail(
      `TEST - Aanvraag ontvangen - ${eventDate}`,
      emailHeader('⏳ Aanvraag Ontvangen') + `
          <tr>
            <td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #2a2a2a; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #f1f1f1; line-height: 1.6;">
                      Beste Jan de Vries,
                    </p>
                    <p style="margin: 0 0 30px 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #aaaaaa; line-height: 1.6;">
                      Bedankt voor uw aanvraag! We hebben uw boeking voor ${eventDate} ontvangen en zullen deze zo snel mogelijk voor u bevestigen.
                    </p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; background-color: #1a1a1a; border: 2px solid #D4AF37; border-radius: 8px;">
                      <tr>
                        <td style="padding: 25px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; width: 40%;">Datum</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #D4AF37; padding: 6px 0; font-weight: bold;">${eventDate}</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0;">Aantal personen</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #D4AF37; padding: 6px 0; font-weight: bold;">12</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` + emailFooter
    );
    console.log('   ✅ Verzonden\n');
    await sleep(2000);

    // 3. OPTION EMAIL
    console.log('3️⃣  Klant - Option (Optie reservering)...');
    await sendEmail(
      `TEST - Optie Reservering - ${eventDate}`,
      emailHeader('⏰ Optie Reservering') + `
          <tr>
            <td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #2a2a2a; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #f1f1f1; line-height: 1.6;">
                      Beste Jan de Vries,
                    </p>
                    <p style="margin: 0 0 30px 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #aaaaaa; line-height: 1.6;">
                      U heeft een optie voor ${eventDate}. Deze optie is geldig tot <strong style="color: #fb923c;">20-11-2025</strong>.
                    </p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; background-color: #1a1a1a; border: 2px solid #fb923c; border-radius: 8px;">
                      <tr>
                        <td style="padding: 25px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; width: 40%;">Optie geldig tot</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #fb923c; padding: 6px 0; font-weight: bold;">20-11-2025</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0;">Datum</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #D4AF37; padding: 6px 0; font-weight: bold;">${eventDate}</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0;">Aantal personen</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #D4AF37; padding: 6px 0; font-weight: bold;">12</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` + emailFooter
    );
    console.log('   ✅ Verzonden\n');
    await sleep(2000);

    // 4. CONFIRMED EMAIL
    console.log('4️⃣  Klant - Confirmed (Bevestiging)...');
    await sendEmail(
      `TEST - Bevestiging - ${eventDate}`,
      emailHeader('✅ Reservering Bevestigd') + `
          <tr>
            <td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #2a2a2a; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #f1f1f1; line-height: 1.6;">
                      Beste Jan de Vries,
                    </p>
                    <p style="margin: 0 0 30px 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #aaaaaa; line-height: 1.6;">
                      Geweldig nieuws! Uw reservering voor ${eventDate} is <strong style="color: #4ade80;">definitief bevestigd</strong>. We kijken ernaar uit u te verwelkomen!
                    </p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; background-color: #1a1a1a; border: 2px solid #4ade80; border-radius: 8px;">
                      <tr>
                        <td style="padding: 25px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; width: 40%;">Status</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #4ade80; padding: 6px 0; font-weight: bold;">✅ Bevestigd</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0;">Datum</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #D4AF37; padding: 6px 0; font-weight: bold;">${eventDate}</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0;">Aantal personen</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #D4AF37; padding: 6px 0; font-weight: bold;">12</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` + emailFooter
    );
    console.log('   ✅ Verzonden\n');
    await sleep(2000);

    // 5. PAYMENT CONFIRMATION
    console.log('5️⃣  Klant - Payment (Betaling bevestiging)...');
    await sendEmail(
      `TEST - Betaling Bevestiging - ${eventDate}`,
      emailHeader('💳 Betaling Ontvangen') + `
          <tr>
            <td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #2a2a2a; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #f1f1f1; line-height: 1.6;">
                      Beste Jan de Vries,
                    </p>
                    <p style="margin: 0 0 30px 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #aaaaaa; line-height: 1.6;">
                      Bedankt! We hebben uw betaling ontvangen. Uw reservering voor ${eventDate} is nu volledig betaald.
                    </p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; background-color: #1a1a1a; border: 2px solid #4ade80; border-radius: 8px;">
                      <tr>
                        <td style="padding: 25px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0; width: 40%;">Betaalstatus</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #4ade80; padding: 6px 0; font-weight: bold;">✅ Betaald</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888888; padding: 6px 0;">Bedrag</td>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #D4AF37; padding: 6px 0; font-weight: bold;">€864,00</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` + emailFooter
    );
    console.log('   ✅ Verzonden\n');

    console.log('════════════════════════════════════════════════════════════');
    console.log('✅ ALLE 5 EMAILS SUCCESVOL VERZONDEN!\n');
    console.log('📬 Check inbox: info@inspiration-point.nl\n');
    console.log('Je ontvangt:');
    console.log('   1. Admin notificatie (met adres/huisnummer/postcode/plaats apart)');
    console.log('   2. Klant - Aanvraag ontvangen (Pending)');
    console.log('   3. Klant - Optie reservering (Option) - oranje accent');
    console.log('   4. Klant - Definitieve bevestiging (Confirmed) - groen accent');
    console.log('   5. Klant - Betaling ontvangen (Payment)\n');
    console.log('💡 Alle emails gebruiken Dark Theatre styling');
    console.log('💡 Naam "jan de vries" wordt "Jan de Vries"\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

sendAllEmails();
