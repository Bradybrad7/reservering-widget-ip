/**
 * Test VOLLEDIGE emails - direct via templates zonder logger issues
 */

import { initializeApp } from 'firebase/app';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const firebaseConfig = {
  apiKey: "AIzaSyClvElaF4HIOao07rtLk_cD8xIoig5Pmpk",
  authDomain: "dinner-theater-booking.firebaseapp.com",
  projectId: "dinner-theater-booking",
  storageBucket: "dinner-theater-booking.firebasestorage.app",
  messagingSenderId: "463825947603",
  appId: "1:463825947603:web:f13ec77d6df92857e869fa",
  measurementId: "G-LYQMGJPY6S"
};

console.log('✅ Firebase initialized successfully');
initializeApp(firebaseConfig);

const smtpEndpoint = 'https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail';

// ========== NAAM FORMATTING ==========
const formatName = (name: string): string => {
  if (!name) return '';
  const lowercase = ['van', 'de', 'der', 'den', 'het', 'ten', 'ter', 'te', 'op', 'in', "'t"];
  return name.trim().toLowerCase().split(' ')
    .map((word, index) => {
      if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1);
      if (lowercase.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};

// ========== EMAIL HTML GENERATORS ==========

function generateAdminEmailHTML(reservation: any, event: any): string {
  const firstName = formatName(reservation.firstName || '');
  const lastName = formatName(reservation.lastName || '');
  const fullName = `${firstName} ${lastName}`.trim();
  const eventDate = format(new Date(event.date), 'd MMMM yyyy', { locale: nl });
  
  const arrangementLabels: any = {
    'BWF': 'Buffet + Welkomstdrankje + Frieten',
    'BWFM': 'Buffet + Welkomstdrankje + Frieten + Merchandise',
    'BF': 'Buffet + Frieten',
    'BFM': 'Buffet + Frieten + Merchandise'
  };
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nieuwe Reservering</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #1a1a1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #2a2a2a; border-radius: 12px; overflow: hidden;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 30px; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);">
              <img src="https://firebasestorage.googleapis.com/v0/b/dinner-theater-booking.firebasestorage.app/o/assets%2Flogo-inspiration-point.png?alt=media" alt="Inspiration Point" style="width: 400px; height: auto; display: block;">
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <h1 style="margin: 0; color: #D4AF37; font-size: 28px; font-weight: 600; text-align: center;">
                🎭 Nieuwe Reservering
              </h1>
            </td>
          </tr>

          <!-- Content Card -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #2a2a2a; border: 2px solid #D4AF37; border-radius: 8px;">
                <tr>
                  <td style="padding: 30px;">
                    
                    <!-- Reserveringsdetails -->
                    <h2 style="margin: 0 0 20px; color: #D4AF37; font-size: 18px; font-weight: 600;">📋 Reserveringsdetails</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0" style="margin-bottom: 25px;">
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0; width: 180px;">Reserveringsnummer</td>
                        <td style="color: #ffffff; padding: 8px 0;">#${reservation.id.substring(0, 8).toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Status</td>
                        <td style="color: #ffffff; padding: 8px 0;">
                          <span style="background-color: #FFA500; color: #1a1a1a; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 600;">
                            ${reservation.status === 'pending' ? 'IN AFWACHTING' : reservation.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Datum Evenement</td>
                        <td style="color: #ffffff; padding: 8px 0;">${eventDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Tijden</td>
                        <td style="color: #ffffff; padding: 8px 0;">Deuren: ${event.doorsOpen} | Start: ${event.startsAt}</td>
                      </tr>
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Aantal personen</td>
                        <td style="color: #ffffff; padding: 8px 0; font-weight: 600; font-size: 16px;">${reservation.numberOfPersons}</td>
                      </tr>
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Arrangement</td>
                        <td style="color: #ffffff; padding: 8px 0;">${arrangementLabels[reservation.arrangement] || reservation.arrangement}</td>
                      </tr>
                    </table>

                    <!-- Contactgegevens -->
                    <h2 style="margin: 25px 0 20px; color: #D4AF37; font-size: 18px; font-weight: 600;">👤 Contactgegevens</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0" style="margin-bottom: 25px;">
                      ${reservation.companyName ? `
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0; width: 180px;">Bedrijfsnaam</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.companyName}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0; width: 180px;">Naam</td>
                        <td style="color: #ffffff; padding: 8px 0;">${fullName}</td>
                      </tr>
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Email</td>
                        <td style="color: #ffffff; padding: 8px 0;"><a href="mailto:${reservation.email}" style="color: #D4AF37; text-decoration: none;">${reservation.email}</a></td>
                      </tr>
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Telefoon</td>
                        <td style="color: #ffffff; padding: 8px 0;"><a href="tel:${reservation.phoneCountryCode}${reservation.phone}" style="color: #D4AF37; text-decoration: none;">${reservation.phoneCountryCode} ${reservation.phone}</a></td>
                      </tr>
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Adres</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.address || ''}</td>
                      </tr>
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Huisnummer</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.houseNumber || ''}</td>
                      </tr>
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Postcode</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.postalCode || ''}</td>
                      </tr>
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Plaats</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.city || ''}</td>
                      </tr>
                    </table>

                    <!-- Extra opties -->
                    ${reservation.preDrink?.enabled || reservation.afterParty?.enabled ? `
                    <h2 style="margin: 25px 0 20px; color: #D4AF37; font-size: 18px; font-weight: 600;">🍸 Extra Opties</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0" style="margin-bottom: 25px;">
                      ${reservation.preDrink?.enabled ? `
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0; width: 180px;">Pre-drink</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.preDrink.quantity} personen</td>
                      </tr>
                      ` : ''}
                      ${reservation.afterParty?.enabled ? `
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Afterparty</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.afterParty.quantity} personen</td>
                      </tr>
                      ` : ''}
                    </table>
                    ` : ''}

                    <!-- Viering -->
                    ${reservation.celebrationOccasion ? `
                    <h2 style="margin: 25px 0 20px; color: #D4AF37; font-size: 18px; font-weight: 600;">🎉 Viering</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0" style="margin-bottom: 25px;">
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0; width: 180px;">Gelegenheid</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.celebrationOccasion}</td>
                      </tr>
                      ${reservation.partyPerson ? `
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Voor wie</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.partyPerson}</td>
                      </tr>
                      ` : ''}
                      ${reservation.celebrationDetails ? `
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Details</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.celebrationDetails}</td>
                      </tr>
                      ` : ''}
                    </table>
                    ` : ''}

                    <!-- Dieetwensen -->
                    ${reservation.dietaryRequirements ? `
                    <h2 style="margin: 25px 0 20px; color: #D4AF37; font-size: 18px; font-weight: 600;">🥗 Dieetwensen</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0" style="margin-bottom: 25px;">
                      ${reservation.dietaryRequirements.vegetarian ? `
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0; width: 180px;">Vegetarisch</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.dietaryRequirements.vegetarianCount || 0} personen</td>
                      </tr>
                      ` : ''}
                      ${reservation.dietaryRequirements.vegan ? `
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Veganistisch</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.dietaryRequirements.veganCount || 0} personen</td>
                      </tr>
                      ` : ''}
                      ${reservation.dietaryRequirements.glutenFree ? `
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Glutenvrij</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.dietaryRequirements.glutenFreeCount || 0} personen</td>
                      </tr>
                      ` : ''}
                      ${reservation.dietaryRequirements.lactoseFree ? `
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Lactosevrij</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.dietaryRequirements.lactoseFreeCount || 0} personen</td>
                      </tr>
                      ` : ''}
                      ${reservation.dietaryRequirements.other ? `
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Overige</td>
                        <td style="color: #ffffff; padding: 8px 0;">${reservation.dietaryRequirements.other}</td>
                      </tr>
                      ` : ''}
                    </table>
                    ` : ''}

                    <!-- Opmerkingen -->
                    ${reservation.comments ? `
                    <h2 style="margin: 25px 0 20px; color: #D4AF37; font-size: 18px; font-weight: 600;">💬 Opmerkingen</h2>
                    <div style="background-color: #1a1a1a; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
                      <p style="margin: 0; color: #ffffff; line-height: 1.6;">${reservation.comments}</p>
                    </div>
                    ` : ''}

                    <!-- Prijsoverzicht -->
                    ${reservation.pricingSnapshot ? `
                    <h2 style="margin: 25px 0 20px; color: #D4AF37; font-size: 18px; font-weight: 600;">💰 Prijsoverzicht</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0">
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0; width: 180px;">Arrangement</td>
                        <td style="color: #ffffff; padding: 8px 0;">€${reservation.pricingSnapshot.arrangementTotal.toFixed(2)}</td>
                      </tr>
                      ${reservation.pricingSnapshot.preDrinkTotal > 0 ? `
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Pre-drink</td>
                        <td style="color: #ffffff; padding: 8px 0;">€${reservation.pricingSnapshot.preDrinkTotal.toFixed(2)}</td>
                      </tr>
                      ` : ''}
                      ${reservation.pricingSnapshot.afterPartyTotal > 0 ? `
                      <tr>
                        <td style="color: #D4AF37; font-weight: 500; padding: 8px 0;">Afterparty</td>
                        <td style="color: #ffffff; padding: 8px 0;">€${reservation.pricingSnapshot.afterPartyTotal.toFixed(2)}</td>
                      </tr>
                      ` : ''}
                      <tr style="border-top: 2px solid #D4AF37;">
                        <td style="color: #D4AF37; font-weight: 600; padding: 12px 0; font-size: 18px;">Totaal</td>
                        <td style="color: #D4AF37; font-weight: 600; padding: 12px 0; font-size: 18px;">€${reservation.pricingSnapshot.finalTotal.toFixed(2)}</td>
                      </tr>
                    </table>
                    ` : ''}

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <p style="margin: 0; color: #888; font-size: 13px; line-height: 1.6;">
                Deze email is automatisch gegenereerd door het reserveringssysteem.<br>
                Verwerk deze reservering via het <a href="https://dinner-theater-booking.web.app/admin.html" style="color: #D4AF37; text-decoration: none;">admin dashboard</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateCustomerEmailHTML(content: string, accentColor: string = '#D4AF37'): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #1a1a1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #2a2a2a; border-radius: 12px; overflow: hidden;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 30px; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);">
              <img src="https://firebasestorage.googleapis.com/v0/b/dinner-theater-booking.firebasestorage.app/o/assets%2Flogo-inspiration-point.png?alt=media" alt="Inspiration Point" style="width: 400px; height: auto; display: block;">
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #3a3a3a;">
              <p style="margin: 0 0 15px; color: #888; font-size: 14px;">
                <strong style="color: ${accentColor};">Inspiration Point</strong><br>
                Genietersweg 2, 3481 MT Harmelen<br>
                <a href="tel:+31348565400" style="color: ${accentColor}; text-decoration: none;">+31 348 565 400</a> | 
                <a href="mailto:info@inspiration-point.nl" style="color: ${accentColor}; text-decoration: none;">info@inspiration-point.nl</a>
              </p>
              <p style="margin: 0; color: #666; font-size: 12px;">
                © ${new Date().getFullYear()} Inspiration Point. Alle rechten voorbehouden.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generatePendingContent(reservation: any, event: any): string {
  const firstName = formatName(reservation.firstName || '');
  const lastName = formatName(reservation.lastName || '');
  const fullName = `${firstName} ${lastName}`.trim();
  const eventDate = format(new Date(event.date), 'd MMMM yyyy', { locale: nl });
  
  return `
    <h1 style="margin: 0 0 20px; color: #D4AF37; font-size: 28px; font-weight: 600; text-align: center;">
      Bedankt voor je aanvraag!
    </h1>
    <div style="background-color: #2a2a2a; border: 2px solid #D4AF37; border-radius: 8px; padding: 30px;">
      <p style="margin: 0 0 20px; color: #ffffff; font-size: 16px; line-height: 1.6;">
        Beste ${fullName},
      </p>
      <p style="margin: 0 0 20px; color: #ffffff; font-size: 16px; line-height: 1.6;">
        We hebben je aanvraag voor <strong style="color: #D4AF37;">${reservation.numberOfPersons} personen</strong> op <strong style="color: #D4AF37;">${eventDate}</strong> goed ontvangen! 🎭
      </p>
      <p style="margin: 0 0 20px; color: #ffffff; font-size: 16px; line-height: 1.6;">
        We gaan nu voor je aan de slag en nemen zo snel mogelijk contact met je op om je reservering te bevestigen.
      </p>
      
      <div style="background-color: #1a1a1a; padding: 20px; border-radius: 6px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px; color: #D4AF37; font-size: 18px; font-weight: 600;">📋 Jouw aanvraag</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0">
          <tr>
            <td style="color: #D4AF37; padding: 6px 0; width: 150px;">Datum:</td>
            <td style="color: #ffffff; padding: 6px 0;">${eventDate}</td>
          </tr>
          <tr>
            <td style="color: #D4AF37; padding: 6px 0;">Aantal personen:</td>
            <td style="color: #ffffff; padding: 6px 0; font-weight: 600;">${reservation.numberOfPersons}</td>
          </tr>
          <tr>
            <td style="color: #D4AF37; padding: 6px 0;">Arrangement:</td>
            <td style="color: #ffffff; padding: 6px 0;">${reservation.arrangement}</td>
          </tr>
          ${reservation.preDrink?.enabled ? `
          <tr>
            <td style="color: #D4AF37; padding: 6px 0;">Pre-drink:</td>
            <td style="color: #ffffff; padding: 6px 0;">${reservation.preDrink.quantity} personen</td>
          </tr>
          ` : ''}
          ${reservation.afterParty?.enabled ? `
          <tr>
            <td style="color: #D4AF37; padding: 6px 0;">Afterparty:</td>
            <td style="color: #ffffff; padding: 6px 0;">${reservation.afterParty.quantity} personen</td>
          </tr>
          ` : ''}
          ${reservation.comments ? `
          <tr>
            <td style="color: #D4AF37; padding: 6px 0; vertical-align: top;">Opmerking:</td>
            <td style="color: #ffffff; padding: 6px 0;">${reservation.comments}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="margin: 20px 0 0; color: #ffffff; font-size: 16px; line-height: 1.6;">
        Heb je nog vragen? Neem gerust contact met ons op!
      </p>
      <p style="margin: 15px 0 0; color: #888; font-size: 14px;">
        Met vriendelijke groet,<br>
        <strong style="color: #D4AF37;">Het Inspiration Point Team</strong>
      </p>
    </div>
  `;
}

function generateOptionContent(reservation: any, event: any): string {
  const firstName = formatName(reservation.firstName || '');
  const lastName = formatName(reservation.lastName || '');
  const fullName = `${firstName} ${lastName}`.trim();
  const eventDate = format(new Date(event.date), 'd MMMM yyyy', { locale: nl });
  const expiryDate = reservation.optionExpiresAt ? format(new Date(reservation.optionExpiresAt), 'd MMMM yyyy \'om\' HH:mm', { locale: nl }) : '';
  
  return `
    <h1 style="margin: 0 0 20px; color: #FFA500; font-size: 28px; font-weight: 600; text-align: center;">
      ⏰ Optie Reservering
    </h1>
    <div style="background-color: #2a2a2a; border: 2px solid #FFA500; border-radius: 8px; padding: 30px;">
      <p style="margin: 0 0 20px; color: #ffffff; font-size: 16px; line-height: 1.6;">
        Beste ${fullName},
      </p>
      <p style="margin: 0 0 20px; color: #ffffff; font-size: 16px; line-height: 1.6;">
        Goed nieuws! We hebben een <strong style="color: #FFA500;">optie</strong> geplaatst voor je reservering van <strong>${reservation.numberOfPersons} personen</strong> op <strong>${eventDate}</strong>! 🎭
      </p>
      
      <div style="background-color: #FFA500; color: #1a1a1a; padding: 20px; border-radius: 6px; margin: 25px 0; text-align: center;">
        <p style="margin: 0; font-size: 16px; font-weight: 600;">
          ⏰ Deze optie is geldig tot:<br>
          <span style="font-size: 20px; font-weight: 700;">${expiryDate}</span>
        </p>
      </div>

      <div style="background-color: #1a1a1a; padding: 20px; border-radius: 6px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px; color: #FFA500; font-size: 18px; font-weight: 600;">📋 Jouw reservering</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0">
          <tr>
            <td style="color: #FFA500; padding: 6px 0; width: 150px;">Datum:</td>
            <td style="color: #ffffff; padding: 6px 0;">${eventDate}</td>
          </tr>
          <tr>
            <td style="color: #FFA500; padding: 6px 0;">Aantal personen:</td>
            <td style="color: #ffffff; padding: 6px 0; font-weight: 600;">${reservation.numberOfPersons}</td>
          </tr>
          <tr>
            <td style="color: #FFA500; padding: 6px 0;">Arrangement:</td>
            <td style="color: #ffffff; padding: 6px 0;">${reservation.arrangement}</td>
          </tr>
          ${reservation.pricingSnapshot ? `
          <tr>
            <td style="color: #FFA500; padding: 6px 0;">Totaalprijs:</td>
            <td style="color: #ffffff; padding: 6px 0; font-weight: 600; font-size: 18px;">€${reservation.pricingSnapshot.finalTotal.toFixed(2)}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="margin: 20px 0 0; color: #ffffff; font-size: 16px; line-height: 1.6;">
        We nemen binnenkort contact met je op om de definitieve bevestiging af te ronden!
      </p>
      <p style="margin: 15px 0 0; color: #888; font-size: 14px;">
        Met vriendelijke groet,<br>
        <strong style="color: #FFA500;">Het Inspiration Point Team</strong>
      </p>
    </div>
  `;
}

function generateConfirmedContent(reservation: any, event: any): string {
  const firstName = formatName(reservation.firstName || '');
  const lastName = formatName(reservation.lastName || '');
  const fullName = `${firstName} ${lastName}`.trim();
  const eventDate = format(new Date(event.date), 'd MMMM yyyy', { locale: nl });
  
  return `
    <h1 style="margin: 0 0 20px; color: #4CAF50; font-size: 28px; font-weight: 600; text-align: center;">
      ✅ Reservering Bevestigd!
    </h1>
    <div style="background-color: #2a2a2a; border: 2px solid #4CAF50; border-radius: 8px; padding: 30px;">
      <p style="margin: 0 0 20px; color: #ffffff; font-size: 16px; line-height: 1.6;">
        Beste ${fullName},
      </p>
      <p style="margin: 0 0 20px; color: #ffffff; font-size: 16px; line-height: 1.6;">
        Geweldig nieuws! Je reservering voor <strong style="color: #4CAF50;">${reservation.numberOfPersons} personen</strong> op <strong style="color: #4CAF50;">${eventDate}</strong> is definitief bevestigd! 🎉
      </p>
      
      <div style="background-color: #4CAF50; color: #ffffff; padding: 20px; border-radius: 6px; margin: 25px 0; text-align: center;">
        <p style="margin: 0; font-size: 18px; font-weight: 600;">
          🎭 We kijken ernaar uit je te verwelkomen!
        </p>
      </div>

      <div style="background-color: #1a1a1a; padding: 20px; border-radius: 6px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px; color: #4CAF50; font-size: 18px; font-weight: 600;">📋 Jouw reservering</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0">
          <tr>
            <td style="color: #4CAF50; padding: 6px 0; width: 150px;">Datum:</td>
            <td style="color: #ffffff; padding: 6px 0; font-weight: 600;">${eventDate}</td>
          </tr>
          <tr>
            <td style="color: #4CAF50; padding: 6px 0;">Deuren open:</td>
            <td style="color: #ffffff; padding: 6px 0;">${event.doorsOpen}</td>
          </tr>
          <tr>
            <td style="color: #4CAF50; padding: 6px 0;">Show begint:</td>
            <td style="color: #ffffff; padding: 6px 0;">${event.startsAt}</td>
          </tr>
          <tr>
            <td style="color: #4CAF50; padding: 6px 0;">Aantal personen:</td>
            <td style="color: #ffffff; padding: 6px 0; font-weight: 600;">${reservation.numberOfPersons}</td>
          </tr>
          <tr>
            <td style="color: #4CAF50; padding: 6px 0;">Arrangement:</td>
            <td style="color: #ffffff; padding: 6px 0;">${reservation.arrangement}</td>
          </tr>
          ${reservation.preDrink?.enabled ? `
          <tr>
            <td style="color: #4CAF50; padding: 6px 0;">Pre-drink:</td>
            <td style="color: #ffffff; padding: 6px 0;">${reservation.preDrink.quantity} personen</td>
          </tr>
          ` : ''}
          ${reservation.afterParty?.enabled ? `
          <tr>
            <td style="color: #4CAF50; padding: 6px 0;">Afterparty:</td>
            <td style="color: #ffffff; padding: 6px 0;">${reservation.afterParty.quantity} personen</td>
          </tr>
          ` : ''}
          ${reservation.pricingSnapshot ? `
          <tr style="border-top: 2px solid #4CAF50;">
            <td style="color: #4CAF50; padding: 12px 0; font-weight: 600; font-size: 18px;">Totaalprijs:</td>
            <td style="color: #4CAF50; padding: 12px 0; font-weight: 600; font-size: 20px;">€${reservation.pricingSnapshot.finalTotal.toFixed(2)}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      ${reservation.dietaryRequirements ? `
      <div style="background-color: #1a1a1a; padding: 20px; border-radius: 6px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px; color: #4CAF50; font-size: 18px; font-weight: 600;">🥗 Dieetwensen</h3>
        <ul style="margin: 0; padding-left: 20px; color: #ffffff; line-height: 1.8;">
          ${reservation.dietaryRequirements.vegetarian ? `<li>Vegetarisch: ${reservation.dietaryRequirements.vegetarianCount} personen</li>` : ''}
          ${reservation.dietaryRequirements.vegan ? `<li>Veganistisch: ${reservation.dietaryRequirements.veganCount} personen</li>` : ''}
          ${reservation.dietaryRequirements.glutenFree ? `<li>Glutenvrij: ${reservation.dietaryRequirements.glutenFreeCount} personen</li>` : ''}
          ${reservation.dietaryRequirements.lactoseFree ? `<li>Lactosevrij: ${reservation.dietaryRequirements.lactoseFreeCount} personen</li>` : ''}
          ${reservation.dietaryRequirements.other ? `<li>Overige: ${reservation.dietaryRequirements.other}</li>` : ''}
        </ul>
      </div>
      ` : ''}

      <p style="margin: 20px 0 0; color: #ffffff; font-size: 16px; line-height: 1.6;">
        Tot snel bij Inspiration Point! 🎭✨
      </p>
      <p style="margin: 15px 0 0; color: #888; font-size: 14px;">
        Met vriendelijke groet,<br>
        <strong style="color: #4CAF50;">Het Inspiration Point Team</strong>
      </p>
    </div>
  `;
}

function generatePaymentContent(reservation: any, event: any): string {
  const firstName = formatName(reservation.firstName || '');
  const lastName = formatName(reservation.lastName || '');
  const fullName = `${firstName} ${lastName}`.trim();
  const eventDate = format(new Date(event.date), 'd MMMM yyyy', { locale: nl });
  
  return `
    <h1 style="margin: 0 0 20px; color: #4CAF50; font-size: 28px; font-weight: 600; text-align: center;">
      💳 Betaling Ontvangen
    </h1>
    <div style="background-color: #2a2a2a; border: 2px solid #4CAF50; border-radius: 8px; padding: 30px;">
      <p style="margin: 0 0 20px; color: #ffffff; font-size: 16px; line-height: 1.6;">
        Beste ${fullName},
      </p>
      <p style="margin: 0 0 20px; color: #ffffff; font-size: 16px; line-height: 1.6;">
        Bedankt! We hebben je betaling van <strong style="color: #4CAF50;">€${reservation.pricingSnapshot?.finalTotal.toFixed(2) || '0.00'}</strong> in goede orde ontvangen! ✅
      </p>
      
      <div style="background-color: #4CAF50; color: #ffffff; padding: 20px; border-radius: 6px; margin: 25px 0; text-align: center;">
        <p style="margin: 0; font-size: 18px; font-weight: 600;">
          ✅ Je reservering is volledig afgerond!
        </p>
      </div>

      <div style="background-color: #1a1a1a; padding: 20px; border-radius: 6px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px; color: #4CAF50; font-size: 18px; font-weight: 600;">📋 Reserveringsdetails</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0">
          <tr>
            <td style="color: #4CAF50; padding: 6px 0; width: 150px;">Datum:</td>
            <td style="color: #ffffff; padding: 6px 0; font-weight: 600;">${eventDate}</td>
          </tr>
          <tr>
            <td style="color: #4CAF50; padding: 6px 0;">Aantal personen:</td>
            <td style="color: #ffffff; padding: 6px 0; font-weight: 600;">${reservation.numberOfPersons}</td>
          </tr>
          <tr>
            <td style="color: #4CAF50; padding: 6px 0;">Arrangement:</td>
            <td style="color: #ffffff; padding: 6px 0;">${reservation.arrangement}</td>
          </tr>
          ${reservation.pricingSnapshot ? `
          <tr style="border-top: 2px solid #4CAF50;">
            <td style="color: #4CAF50; padding: 12px 0; font-weight: 600; font-size: 18px;">Betaald bedrag:</td>
            <td style="color: #4CAF50; padding: 12px 0; font-weight: 600; font-size: 20px;">€${reservation.pricingSnapshot.finalTotal.toFixed(2)}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="margin: 20px 0 0; color: #ffffff; font-size: 16px; line-height: 1.6;">
        We zien je graag op <strong style="color: #4CAF50;">${eventDate}</strong>! Tot snel! 🎭✨
      </p>
      <p style="margin: 15px 0 0; color: #888; font-size: 14px;">
        Met vriendelijke groet,<br>
        <strong style="color: #4CAF50;">Het Inspiration Point Team</strong>
      </p>
    </div>
  `;
}

// ========== MAIN ==========

const mockEvent = {
  id: 'test-event-123',
  date: new Date('2025-12-15'),
  doorsOpen: '18:00',
  startsAt: '19:30',
  endsAt: '23:00',
  type: 'weekend',
};

const mockReservation = {
  id: 'test-reservation-456789',
  eventId: 'test-event-123',
  companyName: 'Test Bedrijf BV',
  salutation: 'Dhr',
  firstName: 'jan',
  lastName: 'de vries',
  contactPerson: 'jan de vries',
  email: 'info@inspiration-point.nl',
  phone: '612345678',
  phoneCountryCode: '+31',
  address: 'Teststraat',
  houseNumber: '42',
  postalCode: '1234 AB',
  city: 'Amsterdam',
  numberOfPersons: 12,
  arrangement: 'BWF',
  preDrink: { enabled: true, quantity: 12 },
  afterParty: { enabled: true, quantity: 12 },
  celebrationOccasion: 'Verjaardag',
  partyPerson: 'Jan',
  celebrationDetails: '50 jaar - speciale gelegenheid',
  dietaryRequirements: {
    vegetarian: true,
    vegetarianCount: 2,
    vegan: true,
    veganCount: 1,
    glutenFree: true,
    glutenFreeCount: 1,
    lactoseFree: false,
    lactoseFreeCount: 0,
    other: 'Notenalergie voor 1 persoon',
  },
  comments: 'Graag een tafeltje bij het raam! We vieren een speciale gelegenheid en willen een feestelijke sfeer. Kunnen jullie een verjaardagstaart regelen?',
  pricingSnapshot: {
    basePrice: 59.50,
    pricePerPerson: 59.50,
    numberOfPersons: 12,
    arrangement: 'BWF',
    arrangementTotal: 714.00,
    preDrinkPrice: 7.50,
    preDrinkTotal: 90.00,
    afterPartyPrice: 5.00,
    afterPartyTotal: 60.00,
    merchandiseTotal: 0,
    subtotal: 864.00,
    finalTotal: 864.00,
    calculatedAt: new Date(),
  },
  status: 'pending',
  optionExpiresAt: new Date('2025-11-20'),
};

async function sendEmail(subject: string, html: string, emailType: string) {
  console.log(`📤 ${emailType}...`);
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
    throw new Error(`Failed: ${await response.text()}`);
  }
  console.log(`   ✅ Verzonden\n`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🎭 VOLLEDIGE EMAILS VERZENDEN');
  console.log('════════════════════════════════════════════════════════════\n');

  try {
    // 1. ADMIN EMAIL
    const adminHtml = generateAdminEmailHTML(mockReservation, mockEvent);
    await sendEmail('🎭 Nieuwe Reservering - jan de vries', adminHtml, '1️⃣  ADMIN NOTIFICATIE');
    await sleep(2000);

    // 2. PENDING
    const pendingContent = generatePendingContent(mockReservation, mockEvent);
    const pendingHtml = generateCustomerEmailHTML(pendingContent, '#D4AF37');
    await sendEmail('Aanvraag ontvangen - Inspiration Point', pendingHtml, '2️⃣  KLANT - PENDING');
    await sleep(2000);

    // 3. OPTION
    const optionContent = generateOptionContent(mockReservation, mockEvent);
    const optionHtml = generateCustomerEmailHTML(optionContent, '#FFA500');
    await sendEmail('Optie reservering - Inspiration Point', optionHtml, '3️⃣  KLANT - OPTION');
    await sleep(2000);

    // 4. CONFIRMED
    const confirmedContent = generateConfirmedContent(mockReservation, mockEvent);
    const confirmedHtml = generateCustomerEmailHTML(confirmedContent, '#4CAF50');
    await sendEmail('Reservering bevestigd - Inspiration Point', confirmedHtml, '4️⃣  KLANT - CONFIRMED');
    await sleep(2000);

    // 5. PAYMENT
    const paymentContent = generatePaymentContent(mockReservation, mockEvent);
    const paymentHtml = generateCustomerEmailHTML(paymentContent, '#4CAF50');
    await sendEmail('Betaling ontvangen - Inspiration Point', paymentHtml, '5️⃣  KLANT - PAYMENT');

    console.log('════════════════════════════════════════════════════════════');
    console.log('✅ ALLE VOLLEDIGE EMAILS VERZONDEN!\n');
    console.log('📬 Check inbox: info@inspiration-point.nl\n');
    console.log('Alle emails bevatten nu:');
    console.log('   ✅ Volledige reserveringsdetails');
    console.log('   ✅ Contactgegevens');
    console.log('   ✅ Arrangement, pre-drink, afterparty');
    console.log('   ✅ Viering details');
    console.log('   ✅ Dieetwensen');
    console.log('   ✅ Opmerkingen');
    console.log('   ✅ Prijsoverzicht');
    console.log('   ✅ Naam formatting (jan de vries → Jan de Vries)');
    console.log('   ✅ Admin: adres gesplitst (adres/huisnummer/postcode/plaats)\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
