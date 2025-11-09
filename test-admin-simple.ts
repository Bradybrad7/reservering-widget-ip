/**
 * Simpele test voor admin email - Direct API call
 */

import './src/firebase';
import type { Reservation, Event } from './src/types';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

// Mock event
const mockEvent = {
  date: new Date('2025-12-15'),
  doorsOpen: '18:00',
  startsAt: '19:30',
  endsAt: '23:00',
} as any as Event;

// Mock reservation
const mockReservation = {
  id: 'test-123',
  companyName: 'Test Bedrijf BV',
  salutation: 'Dhr',
  firstName: 'Jan',
  lastName: 'de Vries',
  contactPerson: 'Jan de Vries',
  email: 'info@inspiration-point.nl',
  phone: '612345678',
  phoneCountryCode: '+31',
  address: 'Teststraat',
  houseNumber: '42',
  postalCode: '1234 AB',
  city: 'Amsterdam',
  invoiceAddress: 'Factuurweg',
  invoiceHouseNumber: '99',
  invoicePostalCode: '5678 CD',
  invoiceCity: 'Rotterdam',
  numberOfPersons: 12,
  arrangement: 'BWF',
  preDrink: { enabled: true, quantity: 12 },
  afterParty: { enabled: true, quantity: 12 },
  merchandise: [{ itemId: 'test-1', quantity: 2 }],
  celebrationOccasion: 'Verjaardag',
  partyPerson: 'Jan',
  celebrationDetails: '50 jaar',
  dietaryRequirements: {
    vegetarian: true,
    vegetarianCount: 2,
    vegan: true,
    veganCount: 1,
    glutenFree: true,
    glutenFreeCount: 1,
    other: 'Notenalergie',
  },
  comments: 'Graag een tafeltje bij het raam!',
  pricingSnapshot: {
    basePrice: 59.50,
    preDrinkPrice: 7.50,
    afterPartyPrice: 5.00,
  },
  newsletterOptIn: true,
  acceptTerms: true,
} as any as Reservation;

async function sendTestEmail() {
  console.log('🎭 ADMIN EMAIL TEST - AANGEPASTE VERSIE');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Wijzigingen:');
  console.log('  ❌ Geen tijden (deuren open, show start, gedaan)');
  console.log('  ❌ Geen totaalprijs');
  console.log('  ✅ Adres apart + Huisnummer apart');
  console.log('  ✅ Postcode apart + Plaats apart');
  console.log('════════════════════════════════════════════════════════════\n');

  const eventDate = format(mockEvent.date, 'dd-MM-yyyy', { locale: nl });
  
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nieuwe Voorlopige Reservering</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #1a1a1a;">
    
    <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #8B0000 0%, #5a0000 100%); padding: 30px 20px; text-align: center;">
            <img src="https://www.inspiration-point.nl/wp-content/uploads/2023/02/cropped-IP-Logo-2023-transparant-small.png" alt="Inspiration Point" style="max-width: 200px; height: auto; margin-bottom: 15px;" />
            <h1 style="margin: 0; font-size: 24px; color: #FFD700; font-weight: 600; letter-spacing: 1px;">Nieuwe Reservering</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            
            <p style="margin: 0 0 25px 0; font-size: 16px; color: #333;">Er is een nieuwe voorlopige reservering ontvangen:</p>
            
            <!-- Event Info -->
            <div style="background-color: #f8f8f8; border-left: 4px solid #8B0000; padding: 20px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #8B0000; width: 40%;">Datum:</td>
                        <td style="padding: 8px 0; color: #333; font-size: 15px;">${eventDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #8B0000;">Aantal personen:</td>
                        <td style="padding: 8px 0; color: #333; font-size: 18px; font-weight: bold;">${mockReservation.numberOfPersons}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #8B0000;">Arrangement:</td>
                        <td style="padding: 8px 0; color: #333;">${mockReservation.arrangement}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #8B0000;">Preparty:</td>
                        <td style="padding: 8px 0; color: #333;">Ja (€7.50 p.p.)</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #8B0000;">Afterparty:</td>
                        <td style="padding: 8px 0; color: #333;">Ja (€5.00 p.p.)</td>
                    </tr>
                </table>
            </div>

            <!-- Contact Details -->
            <div style="background-color: #f8f8f8; border-left: 4px solid #D4AF37; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #D4AF37; font-weight: 600;">Contactgegevens</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px 0; color: #666; width: 40%;">Bedrijfsnaam:</td>
                        <td style="padding: 5px 0; color: #333;">${mockReservation.companyName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Aanhef:</td>
                        <td style="padding: 5px 0; color: #333;">${mockReservation.salutation}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Naam:</td>
                        <td style="padding: 5px 0; color: #333; font-weight: 600;">${mockReservation.firstName} ${mockReservation.lastName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Email:</td>
                        <td style="padding: 5px 0; color: #333;">${mockReservation.email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Telefoon:</td>
                        <td style="padding: 5px 0; color: #333;">${mockReservation.phoneCountryCode}${mockReservation.phone}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Adres:</td>
                        <td style="padding: 5px 0; color: #333;">${mockReservation.address} ${mockReservation.houseNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Postcode & Plaats:</td>
                        <td style="padding: 5px 0; color: #333;">${mockReservation.postalCode} ${mockReservation.city}</td>
                    </tr>
                </table>
            </div>

            <!-- Extra Informatie -->
            <div style="background-color: #fffef5; border: 1px solid #e8d7a6; border-radius: 4px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #8B0000; font-weight: 600;">📝 Opmerkingen & Extra Informatie</h3>
                <div style="font-size: 14px; color: #444; line-height: 1.6;">
                    <div style="margin-bottom: 8px; line-height: 1.4;">OPMERKING: ${mockReservation.comments}</div>
                    <div style="margin-bottom: 8px; line-height: 1.4;">VIERING: ${mockReservation.celebrationOccasion} voor ${mockReservation.partyPerson} (${mockReservation.celebrationDetails})</div>
                    <div style="margin-bottom: 8px; line-height: 1.4;">ALLERGIE/DIEET: Vegetarisch 2x, Veganistisch 1x, Glutenvrij 1x, ${mockReservation.dietaryRequirements?.other || ''}</div>
                </div>
            </div>

            <!-- System Info -->
            <div style="padding: 15px; background-color: #f8f8f8; border-radius: 4px; text-align: center; font-size: 12px; color: #666;">
                <div style="margin-bottom: 5px;">Nieuwsbrief: ✅ Ja | Voorwaarden: ✅ Ja</div>
                <div style="font-family: monospace; color: #999;">Reservering ID: ${mockReservation.id}</div>
            </div>

        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #8B0000 0%, #5a0000 100%); padding: 20px; text-align: center; color: #ffffff;">
            <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px; color: #FFD700;">Inspiration Point</p>
            <p style="margin: 0 0 5px 0; font-size: 13px;">Maastrichterweg 13-17, 5554 GE Valkenswaard</p>
            <p style="margin: 0; font-size: 13px; color: #D4AF37;">☎ 040-2110679 | ✉ info@inspiration-point.nl</p>
        </div>

    </div>
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
        subject: `TEST - Nieuwe admin email layout - ${eventDate} - 12 personen`,
        html: html
      })
    });

    if (response.ok) {
      console.log('✅ TEST EMAIL SUCCESVOL VERZONDEN!\n');
      console.log('📬 Check je inbox: info@inspiration-point.nl\n');
      console.log('💡 Controleer:');
      console.log('   ✅ GEEN tijden (deuren open, show start, gedaan)');
      console.log('   ✅ GEEN totaalprijs');
      console.log('   ✅ Adres en Huisnummer zijn aparte regels');
      console.log('   ✅ Postcode en Plaats zijn aparte regels\n');
    } else {
      console.error('❌ Fout:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

sendTestEmail();
