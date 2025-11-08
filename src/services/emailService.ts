import type { Reservation, Event, MerchandiseItem } from '../types';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { storageService } from './storageService';

interface EmailTemplate {
  subject: string;
  html: string;
}

/**
 * Generate admin notification email for new booking
 * Simple black/white layout for internal use
 */
const generateAdminNewBookingEmail = async (
  reservation: Reservation,
  event: Event
): Promise<EmailTemplate> => {
  const eventDate = format(event.date, 'dd-MM-yyyy', { locale: nl });
  
  // Load merchandise items to get real names
  let merchandiseItems: MerchandiseItem[] = [];
  try {
    merchandiseItems = await storageService.getMerchandise();
  } catch (error) {
    console.error('Failed to load merchandise items:', error);
  }
  
  // Format customer name
  const fullName = `${reservation.firstName || ''} ${reservation.lastName || ''}`.trim() || reservation.contactPerson || 'Niet opgegeven';
  
  // Format arrangement info
  const arrangement = reservation.arrangement === 'BWF' ? 'BWF' : 'Deluxe';
  const basePrice = reservation.pricingSnapshot?.basePrice || 0;
  const arrangementInfo = basePrice > 0 ? `€${basePrice.toFixed(2)} ${arrangement} p.p.` : arrangement;
  
  // Collect ALL info for comments section in one block with clear headers
  const commentLines = [];
  
  // Add customer comments first
  if (reservation.comments) {
    commentLines.push(`OPMERKING: ${reservation.comments}`);
  }
  
  // Add merchandise
  if (reservation.merchandise && reservation.merchandise.length > 0) {
    const merchandiseText = reservation.merchandise.map(item => {
      const merchandiseItem = merchandiseItems.find(m => m.id === item.itemId);
      const productName = merchandiseItem?.name || `Product ID: ${item.itemId}`;
      const price = merchandiseItem?.price || 0;
      const totalPrice = price * item.quantity;
      return `${productName} ${item.quantity}x (€${totalPrice.toFixed(2)})`;
    }).join(', ');
    
    commentLines.push(`MERCHANDISE: ${merchandiseText}`);
  }
  
  // Add celebration info
  if (reservation.celebrationOccasion) {
    let celebration = reservation.celebrationOccasion;
    if (reservation.partyPerson) {
      celebration += ` voor ${reservation.partyPerson}`;
    }
    if (reservation.celebrationDetails) {
      celebration += ` (${reservation.celebrationDetails})`;
    }
    commentLines.push(`VIERING: ${celebration}`);
  }
  
  // Add dietary requirements
  if (reservation.dietaryRequirements) {
    const dietary = [];
    if (reservation.dietaryRequirements.vegetarian) {
      dietary.push(`Vegetarisch ${reservation.dietaryRequirements.vegetarianCount || 0}x`);
    }
    if (reservation.dietaryRequirements.vegan) {
      dietary.push(`Veganistisch ${reservation.dietaryRequirements.veganCount || 0}x`);
    }
    if (reservation.dietaryRequirements.glutenFree) {
      dietary.push(`Glutenvrij ${reservation.dietaryRequirements.glutenFreeCount || 0}x`);
    }
    if (reservation.dietaryRequirements.lactoseFree) {
      dietary.push(`Lactosevrij ${reservation.dietaryRequirements.lactoseFreeCount || 0}x`);
    }
    if (reservation.dietaryRequirements.other) {
      dietary.push(reservation.dietaryRequirements.other);
    }
    if (dietary.length > 0) {
      commentLines.push(`ALLERGIE/DIEET: ${dietary.join(', ')}`);
    }
  }
  
  // Add invoice address if different
  const hasInvoiceAddress = reservation.invoiceAddress && 
    reservation.invoiceAddress !== reservation.address;
  
  if (hasInvoiceAddress) {
    commentLines.push(`FACTUURADRES: ${reservation.invoiceAddress || ''} ${reservation.invoiceHouseNumber || ''}, ${reservation.invoicePostalCode || ''} ${reservation.invoiceCity || ''}`);
  }
  
  // Build HTML for comments section with each item on separate line
  const commentsHtml = commentLines.length > 0 ? 
    commentLines.map(line => `<div style="display: block; margin-bottom: 10px; line-height: 1.6;">${line}</div>`).join('') : '';

  // Simple black/white email for internal admin use
  const htmlContent = `
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
                        <td style="padding: 6px 0;">${eventDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Deuren open:</td>
                        <td style="padding: 6px 0;">${event.doorsOpen}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Show start:</td>
                        <td style="padding: 6px 0;">${event.startsAt}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Ongeveer gedaan:</td>
                        <td style="padding: 6px 0;">${event.endsAt}</td>
                    </tr>
                    ${reservation.companyName ? `
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Bedrijfsnaam:</td>
                        <td style="padding: 6px 0;">${reservation.companyName}</td>
                    </tr>
                    ` : ''}
                    ${reservation.salutation ? `
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Aanhef:</td>
                        <td style="padding: 6px 0;">${reservation.salutation}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Naam:</td>
                        <td style="padding: 6px 0;">${fullName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Adres:</td>
                        <td style="padding: 6px 0;">${reservation.address || ''} ${reservation.houseNumber || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Postcode & Plaats:</td>
                        <td style="padding: 6px 0;">${reservation.postalCode || ''} ${reservation.city || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Telefoon:</td>
                        <td style="padding: 6px 0;">${reservation.phoneCountryCode || ''}${reservation.phone || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Email:</td>
                        <td style="padding: 6px 0;">${reservation.email || ''}</td>
                    </tr>
                    <tr style="border-top: 2px solid #ddd;">
                        <td style="padding: 12px 0 6px 0; font-weight: bold; font-size: 16px;">Aantal personen:</td>
                        <td style="padding: 12px 0 6px 0; font-size: 16px; font-weight: bold;">${reservation.numberOfPersons || 0}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Arrangement:</td>
                        <td style="padding: 6px 0;">${arrangementInfo}</td>
                    </tr>
                    ${reservation.preDrink?.enabled ? `
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Preparty:</td>
                        <td style="padding: 6px 0;">Ja (€${(reservation.pricingSnapshot?.preDrinkPrice || 0).toFixed(2)} p.p.)</td>
                    </tr>
                    ` : ''}
                    ${reservation.afterParty?.enabled ? `
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Afterparty:</td>
                        <td style="padding: 6px 0;">Ja (€${(reservation.pricingSnapshot?.afterPartyPrice || 0).toFixed(2)} p.p.)</td>
                    </tr>
                    ` : ''}
                    <tr style="border-top: 2px solid #ddd;">
                        <td style="padding: 12px 0 0 0; font-weight: bold; font-size: 17px;">Totaalprijs:</td>
                        <td style="padding: 12px 0 0 0; font-size: 17px; font-weight: bold;">€${(reservation.pricingSnapshot?.finalTotal || 0).toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            ${commentsHtml ? `
            <!-- Opmerkingen -->
            <div style="background-color: #fff9e6; border: 1px solid #e8d7a6; border-radius: 4px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #333;">📝 Opmerkingen & Extra Informatie</h3>
                <div style="font-size: 14px; color: #444;">${commentsHtml}</div>
            </div>
            ` : ''}

            <!-- Extra Info -->
            <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 4px 0; color: #666;">Nieuwsbrief:</td>
                        <td style="padding: 4px 0; text-align: right;">${reservation.newsletterOptIn ? 'Ja' : 'Nee'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0; color: #666;">Voorwaarden gelezen:</td>
                        <td style="padding: 4px 0; text-align: right;">${reservation.acceptTerms ? 'Ja' : 'Nee'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0; color: #666;">Reservering ID:</td>
                        <td style="padding: 4px 0; text-align: right; font-family: monospace; color: #333;">${reservation.id || 'Niet beschikbaar'}</td>
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
  `;

  return {
    subject: `Nieuwe voorlopige boeking - ${eventDate} - ${reservation.numberOfPersons} personen - ${fullName}`,
    html: htmlContent
  };
};

/**
 * Generate pending reservation email for customer (BEAUTIFUL VERSION)
 */
const generateCustomerPendingEmail = (
  reservation: Reservation,
  event: Event
): EmailTemplate => {
  const eventDate = format(event.date, 'EEEE d MMMM yyyy', { locale: nl });
  const eventTime = event.startsAt;
  const eventEndTime = event.endsAt;
  const arrangement = reservation.arrangement === 'BWF' ? 'Premium' : 'Deluxe';
  const basePrice = reservation.pricingSnapshot?.basePrice || 0;
  const priceInfo = basePrice > 0 ? ` (€${basePrice.toFixed(2)} per persoon)` : '';
  const fullName = `${reservation.firstName || ''} ${reservation.lastName || ''}`.trim() || reservation.contactPerson || '';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reservering Ontvangen</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);">
            
            <!-- Header met Logo -->
            <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #8B0000 100%); padding: 40px 30px; text-align: center; border-bottom: 3px solid #FFD700;">
                <img src="https://irp.cdn-website.com/e8046ea7/dms3rep/multi/logo-ip+%281%29.png" alt="Inspiration Point Logo" style="max-height: 80px; margin-bottom: 15px;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #FFD700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Reserveringsaanvraag Ontvangen</h1>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
                
                <!-- Status Badge -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #FF8C00 0%, #FFD700 100%); color: #000000; padding: 15px 30px; border-radius: 50px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);">
                        ⏳ AANVRAAG IN BEHANDELING
                    </div>
                </div>

                <!-- Greeting -->
                <h2 style="color: #FFD700; font-size: 22px; margin-bottom: 20px; text-align: center;">
                    Beste ${fullName},
                </h2>
                
                <p style="color: #E5E5E5; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                    Hartelijk dank voor uw reserveringsaanvraag bij Inspiration Point. 
                    Uw aanvraag wordt momenteel door ons team beoordeeld.
                </p>

                <div style="background: linear-gradient(135deg, #0047AB 0%, #003380 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 20px; margin: 25px 0; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);">
                    <p style="margin: 0; color: #FFFFFF; font-size: 15px; font-weight: 600; text-align: center;">
                        📧 U ontvangt binnen twee werkdagen bericht over de beschikbaarheid
                    </p>
                </div>

            <!-- Reservation Details -->
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a0a0a 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 8px 20px rgba(255, 215, 0, 0.2);">
                <h3 style="color: #FFD700; margin: 0 0 20px 0; font-size: 18px; text-align: center; border-bottom: 1px solid #FFD700; padding-bottom: 10px;">
                    🎭 Aanvraag Overzicht
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Datum:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${eventDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Deuren open:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${event.doorsOpen}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Show start:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${eventTime}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Ongeveer gedaan:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${eventEndTime}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Aantal personen:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${reservation.numberOfPersons}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Arrangement:</td>
                        <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${arrangement}${priceInfo}</td>
                    </tr>
                    <tr style="border-top: 1px solid #FFD700;">
                        <td style="padding: 15px 0 0 0; color: #FFD700; font-weight: bold; font-size: 14px;">Referentienummer:</td>
                        <td style="padding: 15px 0 0 0; color: #FFD700; text-align: right; font-size: 14px; font-weight: bold;">${reservation.id}</td>
                    </tr>
                </table>
            </div>

            <!-- Important Notice -->
            <div style="background: linear-gradient(135deg, #8B0000 0%, #660000 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 8px 20px rgba(255, 215, 0, 0.2);">
                <h3 style="color: #FFD700; margin: 0 0 15px 0; font-size: 18px; text-align: center;">⚠️ Let Op: Nog Geen Definitieve Reservering</h3>
                <p style="color: #FFFFFF; font-size: 15px; line-height: 1.6; margin: 0 0 12px 0; text-align: center;">
                    Uw aanvraag wacht op bevestiging van ons team. We controleren eerst de beschikbaarheid voor uw gewenste datum en arrangement.
                </p>
                <p style="color: #FFD700; font-size: 15px; line-height: 1.6; margin: 0; font-weight: 600; text-align: center;">
                    Alleen na onze bevestigingsmail is uw reservering definitief.
                </p>
            </div>

            <!-- Process Steps -->
            <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); border: 2px solid #B8860B; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #FFD700; margin: 0 0 15px 0; font-size: 18px;">📋 Hoe werkt het proces?</h3>
                <ol style="color: #E5E5E5; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 10px;"><strong style="color: #FFD700;">Nu:</strong> Wij controleren beschikbaarheid voor uw gewenste datum</li>
                    <li style="margin-bottom: 10px;"><strong style="color: #FFD700;">Binnen 2 werkdagen:</strong> U ontvangt een bevestigings- of afwijzingsmail</li>
                    <li style="margin-bottom: 10px;"><strong style="color: #FFD700;">Bij beschikbaarheid:</strong> Uw reservering is definitief bevestigd</li>
                    <li style="margin-bottom: 10px;"><strong style="color: #FFD700;">3 weken voor de voorstelling:</strong> U ontvangt de factuur</li>
                    <li><strong style="color: #FFD700;">2 weken voor de voorstelling:</strong> Betaling dient ontvangen te zijn via bankoverschrijving</li>
                </ol>
            </div>

            <!-- Contact Info -->
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: rgba(139, 0, 0, 0.2); border: 1px solid #8B0000; border-radius: 8px;">
                <p style="color: #FFD700; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Vragen over uw reservering?</p>
                <p style="color: #E5E5E5; font-size: 14px; margin: 0;">
                    Neem gerust contact met ons op<br>
                    <a href="mailto:info@inspiration-point.nl" style="color: #FFD700; text-decoration: none; font-weight: bold;">info@inspiration-point.nl</a><br>
                    <span style="color: #B8B8B8;">040-2110679</span>
                </p>
            </div>

            </div>

            <!-- Footer -->
            <div style="background: #000000; padding: 25px 30px; text-align: center; border-top: 2px solid #FFD700;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #FFD700;">Met vriendelijke groet,</p>
                <p style="margin: 8px 0; font-size: 14px; color: #B8860B;">Maastrichterweg 13-17, 5554 GE Valkenswaard</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">www.inspiration-point.nl</p>
            </div>

        </div>
    </body>
    </html>
  `;
  
  return {
    subject: `Reserveringsaanvraag ontvangen - ${eventDate}`,
    html
  };
};

/**
 * Generate payment confirmation email for customer (NEW)
 */
const generatePaymentConfirmationEmail = (
  reservation: Reservation,
  event: Event
): EmailTemplate => {
  const eventDate = format(event.date, 'EEEE d MMMM yyyy', { locale: nl });
  const eventTime = event.startsAt;
  const eventEndTime = event.endsAt;
  const fullName = `${reservation.firstName || ''} ${reservation.lastName || ''}`.trim() || reservation.contactPerson || '';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Betaling Ontvangen</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);">
            
            <!-- Header met Logo -->
            <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #8B0000 100%); padding: 40px 30px; text-align: center; border-bottom: 3px solid #FFD700;">
                <img src="https://irp.cdn-website.com/e8046ea7/dms3rep/multi/logo-ip+%281%29.png" alt="Inspiration Point Logo" style="max-height: 80px; margin-bottom: 15px;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #FFD700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Betaling Ontvangen ✓</h1>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
                
                <!-- Success Badge -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #006400 0%, #228B22 100%); color: white; padding: 15px 30px; border-radius: 50px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(34, 139, 34, 0.4);">
                        ✓ BETALING GOEDGEKEURD
                    </div>
                </div>

                <!-- Greeting -->
                <h2 style="color: #FFD700; font-size: 22px; margin-bottom: 20px; text-align: center;">
                    Beste ${fullName},
                </h2>
                
                <p style="color: #E5E5E5; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                    Goed nieuws! Wij hebben uw betaling in goede orde ontvangen. 
                    Uw reservering is nu <strong style="color: #FFD700;">volledig bevestigd</strong>!
                </p>

                <!-- Reservation Details -->
                <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a0a0a 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 8px 20px rgba(255, 215, 0, 0.2);">
                    <h3 style="color: #FFD700; margin: 0 0 20px 0; font-size: 18px; text-align: center; border-bottom: 1px solid #FFD700; padding-bottom: 10px;">
                        🎭 Uw Reservering
                    </h3>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Datum:</td>
                            <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${eventDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Deuren open:</td>
                            <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${event.doorsOpen}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Show start:</td>
                            <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${eventTime}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Ongeveer gedaan:</td>
                            <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${eventEndTime}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Aantal personen:</td>
                            <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${reservation.numberOfPersons}</td>
                        </tr>
                        <tr style="border-top: 1px solid #FFD700;">
                            <td style="padding: 15px 0 0 0; color: #FFD700; font-weight: bold; font-size: 16px;">Betaald bedrag:</td>
                            <td style="padding: 15px 0 0 0; color: #FFD700; text-align: right; font-size: 18px; font-weight: bold;">
                                €${(reservation.pricingSnapshot?.finalTotal || 0).toFixed(2)}
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- What's Next -->
                <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); border: 2px solid #8B0000; border-radius: 12px; padding: 25px; margin: 25px 0;">
                    <h3 style="color: #FFD700; margin: 0 0 15px 0; font-size: 18px;">📋 Wat nu?</h3>
                    <ul style="color: #E5E5E5; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                        <li style="margin-bottom: 10px;">Uw reservering is <strong style="color: #FFD700;">volledig bevestigd</strong></li>
                        <li style="margin-bottom: 10px;">Zie hierboven voor de exacte tijden van de voorstelling</li>
                        <li style="margin-bottom: 10px;">U ontvangt binnenkort meer informatie per email</li>
                        <li>Wij kijken ernaar uit u te verwelkomen! 🎭</li>
                    </ul>
                </div>

                <!-- Contact Info -->
                <div style="text-align: center; margin: 30px 0; padding: 20px; background: rgba(139, 0, 0, 0.2); border: 1px solid #8B0000; border-radius: 8px;">
                    <p style="color: #FFD700; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Vragen?</p>
                    <p style="color: #E5E5E5; font-size: 14px; margin: 0;">
                        Neem gerust contact met ons op<br>
                        <a href="mailto:info@inspiration-point.nl" style="color: #FFD700; text-decoration: none; font-weight: bold;">info@inspiration-point.nl</a><br>
                        <span style="color: #B8B8B8;">040-2110679</span>
                    </p>
                </div>

            </div>

            <!-- Footer -->
            <div style="background: #000000; padding: 25px 30px; text-align: center; border-top: 2px solid #FFD700;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #FFD700;">Tot snel!</p>
                <p style="margin: 8px 0; font-size: 14px; color: #B8860B;">Maastrichterweg 13-17, 5554 GE Valkenswaard</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">www.inspiration-point.nl</p>
            </div>

        </div>
    </body>
    </html>
  `;

  return {
    subject: `✓ Betaling ontvangen - ${eventDate} - Inspiration Point`,
    html
  };
};

/**
 * Generate waitlist confirmation email for customer (NEW)
 */
const generateWaitlistCustomerEmail = (
  waitlistEntry: any,
  event: Event
): EmailTemplate => {
  const eventDate = format(event.date, 'EEEE d MMMM yyyy', { locale: nl });
  const eventTime = event.startsAt;
  const eventEndTime = event.endsAt;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wachtlijst Registratie</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);">
            
            <!-- Header met Logo -->
            <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #8B0000 100%); padding: 40px 30px; text-align: center; border-bottom: 3px solid #FFD700;">
                <img src="https://irp.cdn-website.com/e8046ea7/dms3rep/multi/logo-ip+%281%29.png" alt="Inspiration Point Logo" style="max-height: 80px; margin-bottom: 15px;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #FFD700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Wachtlijst Registratie</h1>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
                
                <!-- Info Badge -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #FF8C00 0%, #FFD700 100%); color: #000000; padding: 15px 30px; border-radius: 50px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);">
                        ⏳ OP WACHTLIJST GEPLAATST
                    </div>
                </div>

                <!-- Greeting -->
                <h2 style="color: #FFD700; font-size: 22px; margin-bottom: 20px; text-align: center;">
                    Beste ${waitlistEntry.name},
                </h2>
                
                <p style="color: #E5E5E5; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                    Bedankt voor uw interesse in onze voorstelling!
                </p>

                <!-- Important Notice -->
                <div style="background: linear-gradient(135deg, #8B0000 0%, #660000 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 8px 20px rgba(255, 215, 0, 0.2);">
                    <h3 style="color: #FFD700; margin: 0 0 15px 0; font-size: 18px; text-align: center;">⚠️ Let Op: Dit is GEEN Boeking</h3>
                    <p style="color: #FFFFFF; font-size: 15px; line-height: 1.6; margin: 0; text-align: center;">
                        U staat nu op de wachtlijst voor deze voorstelling. Dit betekent dat u <strong style="color: #FFD700;">nog geen gereserveerde plaats</strong> heeft.
                    </p>
                </div>

                <!-- Event Details -->
                <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a0a0a 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 25px; margin: 30px 0;">
                    <h3 style="color: #FFD700; margin: 0 0 20px 0; font-size: 18px; text-align: center; border-bottom: 1px solid #FFD700; padding-bottom: 10px;">
                        🎭 Voorstelling
                    </h3>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Datum:</td>
                            <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${eventDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Deuren open:</td>
                            <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">18:30</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Show start:</td>
                            <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${eventTime}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Ongeveer gedaan:</td>
                            <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${eventEndTime}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #B8860B; font-weight: bold; font-size: 14px;">Gewenste personen:</td>
                            <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-size: 14px;">${waitlistEntry.numberOfPersons}</td>
                        </tr>
                    </table>
                </div>

                <!-- How it Works -->
                <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); border: 2px solid #B8860B; border-radius: 12px; padding: 25px; margin: 25px 0;">
                    <h3 style="color: #FFD700; margin: 0 0 15px 0; font-size: 18px;">📋 Hoe werkt de wachtlijst?</h3>
                    <ul style="color: #E5E5E5; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                        <li style="margin-bottom: 10px;">Bij een <strong style="color: #FFD700;">annulering</strong> nemen wij <strong style="color: #FFD700;">zo snel mogelijk</strong> contact met u op</li>
                        <li style="margin-bottom: 10px;">Wachtlijst plaatsen = <strong style="color: #FFD700;">op volgorde</strong> van aanmelding</li>
                        <li style="margin-bottom: 10px;">U ontvangt een bericht via <strong style="color: #FFD700;">email of telefoon</strong></li>
                        <li style="margin-bottom: 10px;">U heeft <strong style="color: #FFD700;">24 uur</strong> de tijd om te reageren</li>
                        <li>Als u niet reageert, gaan wij naar de volgende persoon op de lijst</li>
                    </ul>
                </div>

                <!-- Contact Info -->
                <div style="text-align: center; margin: 30px 0; padding: 20px; background: rgba(139, 0, 0, 0.2); border: 1px solid #8B0000; border-radius: 8px;">
                    <p style="color: #FFD700; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Vragen?</p>
                    <p style="color: #E5E5E5; font-size: 14px; margin: 0;">
                        Neem gerust contact met ons op<br>
                        <a href="mailto:info@inspiration-point.nl" style="color: #FFD700; text-decoration: none; font-weight: bold;">info@inspiration-point.nl</a><br>
                        <span style="color: #B8B8B8;">040-2110679</span>
                    </p>
                </div>

            </div>

            <!-- Footer -->
            <div style="background: #000000; padding: 25px 30px; text-align: center; border-top: 2px solid #FFD700;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #FFD700;">Hopelijk tot snel!</p>
                <p style="margin: 8px 0; font-size: 14px; color: #B8860B;">Maastrichterweg 13-17, 5554 GE Valkenswaard</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">www.inspiration-point.nl</p>
            </div>

        </div>
    </body>
    </html>
  `;

  return {
    subject: `⏳ Wachtlijst registratie - ${eventDate} - Inspiration Point`,
    html
  };
};

/**
 * Generate admin notification for new waitlist entry (NEW)
 */
const generateWaitlistAdminEmail = (
  waitlistEntry: any,
  event: Event
): EmailTemplate => {
  const eventDate = format(event.date, 'dd-MM-yyyy', { locale: nl });
  
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nieuwe Wachtlijst Registratie</title>
</head>
<body style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9f9f9;">
    
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <p>Geachte medewerker Inspiration Point,</p>
        
        <p><strong>Er is een nieuwe wachtlijst registratie ontvangen:</strong></p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
            
            <h3 style="margin: 0 0 15px 0; color: #856404;">⏳ WACHTLIJST REGISTRATIE</h3>
            
            <p><strong>Voorstelling datum:</strong> ${eventDate}</p>
            <p><strong>Naam:</strong> ${waitlistEntry.name}</p>
            <p><strong>Email:</strong> ${waitlistEntry.email}</p>
            <p><strong>Telefoon:</strong> ${waitlistEntry.phone || 'Niet opgegeven'}</p>
            <p><strong>Aantal personen:</strong> ${waitlistEntry.numberOfPersons}</p>
            
            ${waitlistEntry.comments ? `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 15px;">
                <p style="margin: 0;"><strong>Opmerkingen:</strong></p>
                <p style="margin: 8px 0 0 0;">${waitlistEntry.comments}</p>
            </div>` : ''}
            
        </div>
        
        <div style="background: #d1ecf1; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;"><strong>💡 Actie vereist:</strong> Bij annuleringen deze persoon contacteren!</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 13px;">
            <p style="margin-bottom: 5px;"><strong>Met vriendelijke groet,</strong></p>
            <p style="margin-bottom: 5px;"><strong>Inspiration Point</strong></p>
            <p style="margin-bottom: 5px;">Maastrichterweg 13 - 17</p>
            <p style="margin-bottom: 5px;">5554 GE Valkenswaard</p>
            <p style="margin-bottom: 5px;">040-2110679</p>
            <p style="margin-bottom: 5px;">info@inspiration-point.nl</p>
            <p style="margin-bottom: 5px;">www.inspiration-point.nl</p>
        </div>
        
    </div>
</body>
</html>
  `;

  return {
    subject: `⏳ Nieuwe wachtlijst registratie - ${eventDate}`,
    html
  };
};

/**
 * Send email via Firebase Cloud Function
 */
const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    console.log('📧 [EMAIL] Sending HTML-only email via Firebase Cloud Function...');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    
    const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to,
        subject,
        html
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [EMAIL] Firebase Cloud Function failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ [EMAIL] Email sent successfully via Firebase:', result);
    return true;

  } catch (error) {
    console.error('❌ [EMAIL] Error sending email via Firebase Cloud Function:', error);
    return false;
  }
};

export const emailService = {
  /**
   * Send admin notification for new booking
   */
  async sendAdminNewBookingNotification(
    reservation: Reservation,
    event: Event
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const template = await generateAdminNewBookingEmail(reservation, event);
      
      console.log('📧 [ADMIN] Sending new booking notification...');
      console.log('   Reservation ID:', reservation.id);
      console.log('   Customer:', reservation.contactPerson);
      
      const success = await sendEmail(
        'info@inspiration-point.nl',
        template.subject,
        template.html
      );
      
      return { success };
    } catch (error) {
      console.error('❌ [ADMIN] Error sending admin notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Send reservation confirmation email (sends both admin and customer emails)
   */
  async sendReservationConfirmation(
    reservation: Reservation,
    event: Event
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 [EMAIL] Starting reservation confirmation process...');
      console.log('   Reservation ID:', reservation.id);
      console.log('   Customer email:', reservation.email);

      // 1. Send admin notification first
      console.log('\n1️⃣ Sending admin notification...');
      const adminResult = await this.sendAdminNewBookingNotification(reservation, event);
      
      if (!adminResult.success) {
        console.error('❌ Admin email failed, but continuing with customer email...');
      }

      // 2. Send pending notification to customer
      console.log('\n2️⃣ Sending customer pending notification...');
      const customerTemplate = generateCustomerPendingEmail(reservation, event);
      
      const customerSuccess = await sendEmail(
        reservation.email,
        customerTemplate.subject,
        customerTemplate.html
      );
      
      if (customerSuccess) {
        console.log('✅ [CUSTOMER] Pending notification sent to customer');
      } else {
        console.log('❌ [CUSTOMER] Failed to send pending notification to customer');
      }

      // Consider it successful if at least admin email worked
      const overallSuccess = adminResult.success || customerSuccess;
      
      console.log('\n📊 Email sending summary:');
      console.log('   Admin email:', adminResult.success ? '✅ SUCCESS' : '❌ FAILED');
      console.log('   Customer email:', customerSuccess ? '✅ SUCCESS' : '❌ FAILED');
      console.log('   Overall result:', overallSuccess ? '✅ SUCCESS' : '❌ FAILED');

      return { 
        success: overallSuccess,
        error: !overallSuccess ? 'Both admin and customer emails failed' : undefined
      };
    } catch (error) {
      console.error('❌ [EMAIL] Error in reservation confirmation process:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Send payment confirmation email to customer
   */
  async sendPaymentConfirmation(
    reservation: Reservation,
    event: Event
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 [PAYMENT] Sending payment confirmation...');
      console.log('   Reservation ID:', reservation.id);
      console.log('   Customer email:', reservation.email);

      const template = generatePaymentConfirmationEmail(reservation, event);
      
      const success = await sendEmail(
        reservation.email,
        template.subject,
        template.html
      );
      
      if (success) {
        console.log('✅ [PAYMENT] Payment confirmation sent to customer');
      } else {
        console.log('❌ [PAYMENT] Failed to send payment confirmation');
      }

      return { success };
    } catch (error) {
      console.error('❌ [PAYMENT] Error sending payment confirmation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Send waitlist confirmation to customer and admin notification
   */
  async sendWaitlistConfirmation(
    waitlistEntry: any,
    event: Event
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 [WAITLIST] Sending waitlist confirmation...');
      console.log('   Entry ID:', waitlistEntry.id);
      console.log('   Customer email:', waitlistEntry.email);

      // 1. Send customer waitlist confirmation
      const customerTemplate = generateWaitlistCustomerEmail(waitlistEntry, event);
      const customerSuccess = await sendEmail(
        waitlistEntry.email,
        customerTemplate.subject,
        customerTemplate.html
      );

      // 2. Send admin notification
      const adminTemplate = generateWaitlistAdminEmail(waitlistEntry, event);
      const adminSuccess = await sendEmail(
        'info@inspiration-point.nl',
        adminTemplate.subject,
        adminTemplate.html
      );

      console.log('📊 Waitlist email summary:');
      console.log('   Customer email:', customerSuccess ? '✅ SUCCESS' : '❌ FAILED');
      console.log('   Admin email:', adminSuccess ? '✅ SUCCESS' : '❌ FAILED');

      return { success: customerSuccess || adminSuccess };
    } catch (error) {
      console.error('❌ [WAITLIST] Error sending waitlist confirmation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};