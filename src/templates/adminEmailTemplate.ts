import type { Reservation, Event } from '../types';

export const generateAdminNotificationHTML = (
  reservation: Reservation,
  event: Event,
  config: any
): string => {
  // Get merchandise items from config for proper names
  const merchandiseItems = config?.merchandise || [];
  
  // Format date like "09-11-2025"
  const formattedDate = new Date(event.date).toLocaleDateString('nl-NL', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  
  // Format full name
  const fullName = `${reservation.firstName || ''} ${reservation.lastName || ''}`.trim();
  
  // Format price based on arrangement type
  const arrangementLabel = reservation.arrangement === 'standaard' 
    ? 'Standaard' 
    : reservation.arrangement === 'premium' 
    ? 'Premium' 
    : reservation.arrangement === 'deluxe'
    ? 'Deluxe'
    : reservation.arrangement;
  
  // Get base price per person
  const pricePerPerson = reservation.pricingSnapshot?.basePrice || reservation.totalPrice / reservation.numberOfPersons || 0;
  const priceDisplay = `€${pricePerPerson.toFixed(2)} ${arrangementLabel} p.p.`;
  
  // Helper function to get merchandise name
  const getMerchandiseName = (itemId: string): string => {
    const item = merchandiseItems.find((m: any) => m.id === itemId);
    return item?.name || itemId;
  };

  // Format dietary requirements
  let dietaryHTML = '';
  const dietary = reservation.dietaryRequirements;
  if (dietary) {
    const dietaryText = typeof dietary === 'string' ? dietary : (dietary.other || '');
    if (dietaryText) {
      dietaryHTML = `
        <div class="notes-box">
          <h3>🍽️ Dieetwensen & Allergieën</h3>
          <p style="white-space: pre-wrap;">${dietaryText}</p>
        </div>
      `;
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #E5E5E5; 
      margin: 0; 
      padding: 0;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    }
    .container { 
      max-width: 600px; 
      margin: 20px auto; 
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      border: 1px solid rgba(212, 175, 55, 0.2);
    }
    .header { 
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      padding: 30px 20px;
      text-align: center;
      border-bottom: 2px solid #D4AF37;
    }
    .logo-container {
      margin: 0 auto 20px;
      max-width: 200px;
    }
    .logo-container img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      color: #D4AF37;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .spotlight { 
      background: linear-gradient(135deg, #8B0000 0%, #B22222 100%);
      color: white; 
      padding: 25px 30px; 
      text-align: center;
      border-bottom: 3px solid #D4AF37;
    }
    .spotlight h2 {
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: 700;
    }
    .spotlight p {
      margin: 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content { 
      padding: 30px;
      background: rgba(0,0,0,0.2);
    }
    .intro-text {
      color: #E5E5E5;
      margin: 0 0 25px 0;
      line-height: 1.8;
    }
    .details-box {
      background: rgba(212, 175, 55, 0.1);
      border: 2px solid rgba(212, 175, 55, 0.3);
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
    }
    .details-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    }
    .details-row:last-child {
      border-bottom: none;
    }
    .details-label {
      font-weight: 600;
      color: #D4AF37;
      min-width: 160px;
      flex-shrink: 0;
    }
    .details-value {
      color: #E5E5E5;
      flex-grow: 1;
      word-break: break-word;
    }
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #D4AF37;
      margin: 35px 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 3px solid #D4AF37;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .notes-box {
      background: rgba(139, 0, 0, 0.2);
      border: 2px solid rgba(139, 0, 0, 0.4);
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .notes-box h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 700;
      color: #FFD700;
    }
    .notes-box p {
      margin: 8px 0;
      color: #E5E5E5;
      line-height: 1.6;
    }
    .price-row {
      background: rgba(212, 175, 55, 0.15);
      border: 2px solid #D4AF37;
      border-radius: 8px;
      padding: 15px 20px;
      margin: 10px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .price-row strong {
      color: #FFD700;
      font-size: 18px;
    }
    .footer {
      background: rgba(0,0,0,0.3);
      padding: 25px 30px;
      text-align: center;
      border-top: 2px solid #D4AF37;
    }
    .footer p {
      margin: 8px 0;
      font-size: 14px;
      color: #B8B8B8;
    }
    .footer a {
      color: #D4AF37;
      text-decoration: none;
      font-weight: 600;
    }
    .footer a:hover {
      color: #FFD700;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
      .content {
        padding: 20px;
      }
      .details-row {
        flex-direction: column;
      }
      .details-label {
        min-width: 0;
        margin-bottom: 5px;
      }
      .spotlight h2 {
        font-size: 20px;
      }
      .header h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎭 Inspiration Point</h1>
    </div>
    
    <div class="spotlight">
      <h2>🔔 Nieuwe Voorlopige Boeking</h2>
      <p>Ontvangen voor ${formattedDate}</p>
    </div>
    
    <div class="content">
      <div class="intro-text">
        Er is een nieuwe reserveringsaanvraag binnengekomen die uw aandacht vereist.
      </div>

      <div class="section-title">📅 Reserveringsdetails</div>
      <div class="details-box">
        <div class="details-row">
          <span class="details-label">Datum:</span>
          <span class="details-value">${formattedDate}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Aantal personen:</span>
          <span class="details-value">${reservation.numberOfPersons}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Arrangement:</span>
          <span class="details-value">${priceDisplay}</span>
        </div>
      </div>

      <div class="section-title">👤 Contactgegevens</div>
      <div class="details-box">
        ${reservation.salutation ? `
        <div class="details-row">
          <span class="details-label">Aanhef:</span>
          <span class="details-value">${reservation.salutation}</span>
        </div>
        ` : ''}
        <div class="details-row">
          <span class="details-label">Naam:</span>
          <span class="details-value">${fullName}</span>
        </div>
        ${reservation.companyName ? `
        <div class="details-row">
          <span class="details-label">Bedrijfsnaam:</span>
          <span class="details-value">${reservation.companyName}</span>
        </div>
        ` : ''}
        ${reservation.vatNumber ? `
        <div class="details-row">
          <span class="details-label">BTW-nummer:</span>
          <span class="details-value">${reservation.vatNumber}</span>
        </div>
        ` : ''}
        <div class="details-row">
          <span class="details-label">Email:</span>
          <span class="details-value"><a href="mailto:${reservation.email}" style="color: #D4AF37;">${reservation.email}</a></span>
        </div>
        <div class="details-row">
          <span class="details-label">Telefoon:</span>
          <span class="details-value">${reservation.phoneCountryCode || '+31'}${reservation.phone}</span>
        </div>
        ${reservation.address ? `
        <div class="details-row">
          <span class="details-label">Adres:</span>
          <span class="details-value">${reservation.address} ${reservation.houseNumber || ''}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Postcode & Plaats:</span>
          <span class="details-value">${reservation.postalCode || ''} ${reservation.city || ''}</span>
        </div>
        ${reservation.country && reservation.country !== 'NL' ? `
        <div class="details-row">
          <span class="details-label">Land:</span>
          <span class="details-value">${reservation.country === 'other' ? (reservation.customCountry || 'Overig') : reservation.country}</span>
        </div>
        ` : ''}
        ` : ''}
      </div>

      ${reservation.invoiceAddress ? `
      <div class="section-title">📄 Factuuradres (Afwijkend)</div>
      <div class="details-box">
        <div class="details-row">
          <span class="details-label">Adres:</span>
          <span class="details-value">${reservation.invoiceAddress} ${reservation.invoiceHouseNumber || ''}</span>
        </div>
        ${reservation.invoicePostalCode || reservation.invoiceCity ? `
        <div class="details-row">
          <span class="details-label">Postcode & Plaats:</span>
          <span class="details-value">${reservation.invoicePostalCode || ''} ${reservation.invoiceCity || ''}</span>
        </div>
        ` : ''}
        ${reservation.invoiceCountry && reservation.invoiceCountry !== 'NL' ? `
        <div class="details-row">
          <span class="details-label">Land:</span>
          <span class="details-value">${reservation.invoiceCountry}</span>
        </div>
        ` : ''}
        ${reservation.invoiceInstructions ? `
        <div class="details-row">
          <span class="details-label">Instructies:</span>
          <span class="details-value">${reservation.invoiceInstructions}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${(reservation.preDrink?.enabled || reservation.afterParty?.enabled) ? `
      <div class="section-title">🍷 Extra Opties</div>
      <div class="details-box">
        ${reservation.preDrink?.enabled ? `
        <div class="details-row">
          <span class="details-label">Voorborrel:</span>
          <span class="details-value">✅ ${reservation.preDrink.quantity} ${reservation.preDrink.quantity === 1 ? 'persoon' : 'personen'}</span>
        </div>
        ` : ''}
        ${reservation.afterParty?.enabled ? `
        <div class="details-row">
          <span class="details-label">AfterParty:</span>
          <span class="details-value">✅ ${reservation.afterParty.quantity} ${reservation.afterParty.quantity === 1 ? 'persoon' : 'personen'}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${reservation.merchandise && reservation.merchandise.length > 0 ? `
      <div class="section-title">🛍️ Merchandise</div>
      <div class="details-box">
        ${reservation.merchandise.map(item => {
          const itemName = getMerchandiseName(item.itemId);
          const itemPrice = merchandiseItems.find((m: any) => m.id === item.itemId)?.price || 0;
          const totalPrice = itemPrice * item.quantity;
          return `
          <div class="details-row">
            <span class="details-label">${itemName}:</span>
            <span class="details-value">${item.quantity}x - €${totalPrice.toFixed(2)}</span>
          </div>`;
        }).join('')}
        ${reservation.pricingSnapshot?.merchandiseTotal ? `
        <div class="price-row">
          <strong>Totaal Merchandise</strong>
          <strong>€${reservation.pricingSnapshot.merchandiseTotal.toFixed(2)}</strong>
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${dietaryHTML}

      ${reservation.partyPerson || reservation.celebrationOccasion || reservation.celebrationDetails ? `
      <div class="notes-box">
        <h3>🎉 Viering Details</h3>
        ${reservation.partyPerson ? `<p><strong>Jarige/Feestvierder:</strong> ${reservation.partyPerson}</p>` : ''}
        ${reservation.celebrationOccasion ? `<p><strong>Gelegenheid:</strong> ${reservation.celebrationOccasion}</p>` : ''}
        ${reservation.celebrationDetails ? `<p><strong>Details:</strong> ${reservation.celebrationDetails}</p>` : ''}
      </div>
      ` : ''}

      ${reservation.comments ? `
      <div class="notes-box">
        <h3>💬 Opmerkingen</h3>
        <p style="white-space: pre-wrap;">${reservation.comments}</p>
      </div>
      ` : ''}

      <div class="section-title">💰 Prijsopbouw</div>
      <div class="details-box">
        <div class="details-row">
          <span class="details-label">Arrangement:</span>
          <span class="details-value">€${(reservation.pricingSnapshot?.arrangementTotal || 0).toFixed(2)}</span>
        </div>
        ${reservation.pricingSnapshot?.preDrinkTotal ? `
        <div class="details-row">
          <span class="details-label">Voorborrel:</span>
          <span class="details-value">€${reservation.pricingSnapshot.preDrinkTotal.toFixed(2)}</span>
        </div>
        ` : ''}
        ${reservation.pricingSnapshot?.afterPartyTotal ? `
        <div class="details-row">
          <span class="details-label">AfterParty:</span>
          <span class="details-value">€${reservation.pricingSnapshot.afterPartyTotal.toFixed(2)}</span>
        </div>
        ` : ''}
        ${reservation.pricingSnapshot?.merchandiseTotal ? `
        <div class="details-row">
          <span class="details-label">Merchandise:</span>
          <span class="details-value">€${reservation.pricingSnapshot.merchandiseTotal.toFixed(2)}</span>
        </div>
        ` : ''}
        ${reservation.pricingSnapshot?.discountAmount ? `
        <div class="details-row">
          <span class="details-label">Korting:</span>
          <span class="details-value">-€${reservation.pricingSnapshot.discountAmount.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="price-row">
          <strong>Totaalbedrag</strong>
          <strong>€${reservation.totalPrice.toFixed(2)}</strong>
        </div>
      </div>

    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Inspiration Point</p>
      <p>
        <a href="https://inspiration-point.nl">inspiration-point.nl</a> | 
        <a href="mailto:info@inspiration-point.nl">info@inspiration-point.nl</a> | 
        <a href="tel:+31402110679">040-2110679</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
};
