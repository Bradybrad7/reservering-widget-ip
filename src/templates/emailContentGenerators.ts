/**
 * 🎭 Email Content Generators
 * 
 * Deze functies genereren de content voor elk email type.
 * Ze gebruiken het Master Template voor consistente styling.
 * 
 * Email Types:
 * 1. ✅ Bevestiging (confirmed)
 * 2. ⏰ Optie (option)
 * 3. 📋 Wachtlijst (waitlist)
 * 4. ⏳ Aanvraag (pending)
 */

import type { Reservation, Event, Show } from '../types';
import type { EmailContentBlock } from './emailMasterTemplate';
import { formatCurrency, formatDate, formatTime } from './emailMasterTemplate';

/**
 * Formatteer naam correct met hoofdletters
 * Voorbeelden:
 * - "jan de vries" → "Jan de Vries"
 * - "PETER VAN DER BERG" → "Peter van der Berg"
 * - "maria van den heuvel" → "Maria van den Heuvel"
 */
const formatName = (name: string): string => {
  if (!name) return '';
  
  // Woorden die klein blijven (tussenvoegsels)
  const lowercase = ['van', 'de', 'der', 'den', 'het', 'ten', 'ter', 'te', 'op', 'in', "'t"];
  
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Eerste woord altijd met hoofdletter
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      // Tussenvoegsels klein houden
      if (lowercase.includes(word)) {
        return word;
      }
      // Andere woorden met hoofdletter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Helper functie voor tijd formattering met labels
 */
const formatEventTimes = (doorsOpen: string, startsAt: string, endsAt: string): string => {
  return `Deuren open ${formatTime(doorsOpen)} • Show start ${formatTime(startsAt)} • Eindigt ${formatTime(endsAt)}`;
};

/**
 * 1️⃣ BEVESTIGING EMAIL (Status: confirmed)
 * 
 * Doel: Bevestig de boeking en toon alle details
 * CTA: "Bekijk uw reserveringsdetails"
 */
export const generateConfirmationEmailContent = async (
  reservation: Reservation,
  event: Event,
  show?: Show
): Promise<EmailContentBlock> => {
  // Format name with proper capitalization
  const firstName = formatName(reservation.firstName || '');
  const lastName = formatName(reservation.lastName || '');
  const fullName = `${firstName} ${lastName}`.trim() || formatName(reservation.contactPerson || '') || '';
  
  const arrangement = reservation.arrangement === 'standaard' ? 'Standaard Arrangement' : 'Premium Arrangement';
  const basePrice = reservation.pricingSnapshot?.basePrice || 0;
  const priceInfo = basePrice > 0 ? ` (€${basePrice.toFixed(2)} per persoon)` : '';
  
  const details: EmailContentBlock['reservationDetails'] = [];

  // Company name (if applicable)
  if (reservation.companyName) {
    details.push({
      label: 'Bedrijfsnaam:',
      value: reservation.companyName,
    });
  }

  // Salutation (if provided)
  if (reservation.salutation) {
    details.push({
      label: 'Aanhef:',
      value: reservation.salutation,
    });
  }

  details.push(
    {
      label: 'Naam:',
      value: fullName,
    },
    {
      label: 'Evenement:',
      value: 'Dinner theater Show',
    },
    {
      label: 'Datum:',
      value: formatDate(event.date),
    },
    {
      label: 'Tijd:',
      value: formatEventTimes(event.doorsOpen, event.startsAt, event.endsAt),
    },
    {
      label: 'Aantal personen:',
      value: `${reservation.numberOfPersons} ${reservation.numberOfPersons === 1 ? 'persoon' : 'personen'}`,
    },
    {
      label: 'Arrangement:',
      value: `${arrangement}${priceInfo}`,
    }
  );

  // Add-ons
  if (reservation.preDrink?.enabled) {
    const preDrinkPrice = reservation.pricingSnapshot?.preDrinkPrice || 0;
    details.push({
      label: 'Preparty:',
      value: `✅ Ja (€${preDrinkPrice.toFixed(2)} p.p.)`,
    });
  }
  
  if (reservation.afterParty?.enabled) {
    const afterPartyPrice = reservation.pricingSnapshot?.afterPartyPrice || 0;
    details.push({
      label: 'Afterparty:',
      value: `✅ Ja (€${afterPartyPrice.toFixed(2)} p.p.)`,
    });
  }

  // Merchandise (with actual names)
  if (reservation.merchandise && reservation.merchandise.length > 0) {
    try {
      const { storageService } = await import('../services/storageService');
      const merchandiseItems = await storageService.getMerchandise();
      
      const merchandiseText = reservation.merchandise.map(item => {
        const merchandiseItem = merchandiseItems.find(m => m.id === item.itemId);
        const productName = merchandiseItem?.name || `Product`;
        const price = merchandiseItem?.price || 0;
        const totalPrice = price * item.quantity;
        return `${productName} ${item.quantity}x (€${totalPrice.toFixed(2)})`;
      }).join(', ');
      
      details.push({
        label: 'Merchandise:',
        value: merchandiseText,
      });
    } catch (error) {
      console.warn('Could not load merchandise names:', error);
      // Fallback zonder namen
      if (reservation.merchandise.length > 0) {
        details.push({
          label: 'Merchandise:',
          value: `${reservation.merchandise.length} item(s)`,
        });
      }
    }
  }

  // Total price (highlighted in gold)
  details.push({
    label: 'Totaalprijs:',
    value: formatCurrency(reservation.pricingSnapshot?.finalTotal || reservation.totalPrice),
    highlight: true,
  });

  // Payment status - Calculate from actual payments
  const totalAmount = reservation.pricingSnapshot?.finalTotal || reservation.totalPrice;
  const payments = reservation.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalAmount - totalPaid;
  
  const paymentText = balance <= 0
    ? '✅ Volledig betaald'
    : totalPaid > 0
    ? `⏳ Deels betaald (€${totalPaid.toFixed(2)} van €${totalAmount.toFixed(2)})`
    : `⏳ Te betalen${reservation.paymentDueDate ? ` vóór ${formatDate(reservation.paymentDueDate)}` : ''}`;
  
  details.push({
    label: 'Betaalstatus:',
    value: paymentText,
  });

  // Build additional info section
  const additionalInfoParts = [];

  // Celebration occasion
  if (reservation.celebrationOccasion) {
    let celebration = `🎉 ${reservation.celebrationOccasion}`;
    if (reservation.partyPerson) {
      celebration += ` voor ${reservation.partyPerson}`;
    }
    if (reservation.celebrationDetails) {
      celebration += ` - ${reservation.celebrationDetails}`;
    }
    additionalInfoParts.push(celebration);
  }

  // Dietary requirements
  if (reservation.dietaryRequirements) {
    const dietary = [];
    if (reservation.dietaryRequirements.vegetarian) {
      dietary.push(`🥗 Vegetarisch: ${reservation.dietaryRequirements.vegetarianCount || 0}x`);
    }
    if (reservation.dietaryRequirements.vegan) {
      dietary.push(`🌱 Veganistisch: ${reservation.dietaryRequirements.veganCount || 0}x`);
    }
    if (reservation.dietaryRequirements.glutenFree) {
      dietary.push(`🌾 Glutenvrij: ${reservation.dietaryRequirements.glutenFreeCount || 0}x`);
    }
    if (reservation.dietaryRequirements.lactoseFree) {
      dietary.push(`🥛 Lactosevrij: ${reservation.dietaryRequirements.lactoseFreeCount || 0}x`);
    }
    if (reservation.dietaryRequirements.other) {
      dietary.push(`📝 Overig: ${reservation.dietaryRequirements.other}`);
    }
    if (dietary.length > 0) {
      additionalInfoParts.push(`<strong>Dieetwensen:</strong><br />${dietary.join('<br />')}`);
    }
  }

  // Customer comments
  if (reservation.comments) {
    additionalInfoParts.push(`<strong>Uw opmerking:</strong><br />${reservation.comments}`);
  }

  // Invoice address (if different)
  const hasInvoiceAddress = reservation.invoiceAddress && 
    reservation.invoiceAddress !== reservation.address;
  
  if (hasInvoiceAddress) {
    additionalInfoParts.push(
      `<strong>Factuuradres:</strong><br />${reservation.invoiceAddress || ''} ${reservation.invoiceHouseNumber || ''}<br />${reservation.invoicePostalCode || ''} ${reservation.invoiceCity || ''}`
    );
  }

  return {
    spotlightTitle: 'Uw reservering is bevestigd! 🎉',
    // ✨ NEW: Show Identity (Logo + Description)
    showInfo: show ? {
      logoUrl: show.logoUrl || show.imageUrl,
      description: show.description,
    } : undefined,
    greeting: `Beste ${fullName},`,
    introText: 'Hartelijk dank voor uw reservering bij Inspiration Point. We kijken er naar uit om u te mogen ontvangen voor een onvergetelijke avond!',
    reservationDetails: details,
    additionalInfo: additionalInfoParts.length > 0 ? additionalInfoParts.join('<br /><br />') : undefined,
    ctaButton: {
      text: 'Terug naar website',
      url: 'https://inspiration-point.nl',
    },
    footerNote: 'Bij vragen kunt u ons altijd bereiken via info@inspiration-point.nl of 040-2110679',
  };
};

/**
 * 2️⃣ OPTIE EMAIL (Status: option)
 * 
 * Doel: Bevestig de optie met urgentie (vervaldatum)
 * CTA: "Bevestig nu uw reservering" (urgent)
 */
export const generateOptionEmailContent = async (
  reservation: Reservation,
  event: Event,
  show?: Show
): Promise<EmailContentBlock> => {
  // Format name with proper capitalization
  const firstName = formatName(reservation.firstName || '');
  const lastName = formatName(reservation.lastName || '');
  const fullName = `${firstName} ${lastName}`.trim() || formatName(reservation.contactPerson || '') || '';
  
  const arrangement = reservation.arrangement === 'standaard' ? 'Standaard Arrangement' : 'Premium Arrangement';
  const basePrice = reservation.pricingSnapshot?.basePrice || 0;
  const priceInfo = basePrice > 0 ? ` (€${basePrice.toFixed(2)} per persoon)` : '';
  
  const details: EmailContentBlock['reservationDetails'] = [];

  if (reservation.companyName) {
    details.push({
      label: 'Bedrijfsnaam:',
      value: reservation.companyName,
    });
  }

  details.push(
    {
      label: 'Naam:',
      value: fullName,
    },
    {
      label: 'Evenement:',
      value: 'Dinner theater Show',
    },
    {
      label: 'Datum:',
      value: formatDate(event.date),
    },
    {
      label: 'Tijd:',
      value: formatEventTimes(event.doorsOpen, event.startsAt, event.endsAt),
    },
    {
      label: 'Aantal personen:',
      value: `${reservation.numberOfPersons} ${reservation.numberOfPersons === 1 ? 'persoon' : 'personen'}`,
    },
    {
      label: 'Arrangement:',
      value: `${arrangement}${priceInfo}`,
    }
  );

  // Add-ons
  if (reservation.preDrink?.enabled) {
    const preDrinkPrice = reservation.pricingSnapshot?.preDrinkPrice || 0;
    details.push({
      label: 'Preparty:',
      value: `✅ Ja (€${preDrinkPrice.toFixed(2)} p.p.)`,
    });
  }
  
  if (reservation.afterParty?.enabled) {
    const afterPartyPrice = reservation.pricingSnapshot?.afterPartyPrice || 0;
    details.push({
      label: 'Afterparty:',
      value: `✅ Ja (€${afterPartyPrice.toFixed(2)} p.p.)`,
    });
  }

  // Total price (highlighted)
  details.push({
    label: 'Totaalprijs:',
    value: formatCurrency(reservation.pricingSnapshot?.finalTotal || reservation.totalPrice),
    highlight: true,
  });

  const expiryDate = reservation.optionExpiresAt 
    ? formatDate(reservation.optionExpiresAt)
    : 'Binnenkort';

  return {
    spotlightTitle: 'Uw optie is vastgelegd ⏰',
    spotlightSubtitle: `⚠️ Deze optie verloopt op: ${expiryDate}`,
    // ✨ NEW: Show Identity (Logo + Description)
    showInfo: show ? {
      logoUrl: show.logoUrl || show.imageUrl,
      description: show.description,
    } : undefined,
    greeting: `Beste ${fullName},`,
    introText: 'We hebben uw plaatsen tijdelijk gereserveerd. Bevestig uw reservering voor de vervaldatum om deze definitief te maken.',
    reservationDetails: details,
    additionalInfo: `
      <strong>⚠️ Let op:</strong><br />
      Uw optie is geldig tot <strong>${expiryDate}</strong>. 
      Na deze datum kunnen wij de plaatsen niet meer garanderen.<br /><br />
      <strong>Bevestig uw reservering vóór de vervaldatum om teleurstelling te voorkomen.</strong><br /><br />
      Neem contact met ons op via 040-2110679 of info@inspiration-point.nl om uw reservering definitief te maken.
    `,
    ctaButton: {
      text: 'Bel ons: 040-2110679',
      url: 'tel:+31402110679',
      urgent: true,
    },
    footerNote: 'Bij vragen over uw optie kunt u ons bereiken via info@inspiration-point.nl of 040-2110679',
  };
};

/**
 * 💰 BETALING BEVESTIGING (Payment confirmed)
 * 
 * Doel: Bevestig ontvangst betaling
 * CTA: "Terug naar website"
 */


/**
 * 3️⃣ WACHTLIJST EMAIL (Status: waitlist)
 * 
 * Doel: Bevestig wachtlijst registratie (minimalistisch)
 * CTA: "Bekijk de status"
 */
export const generateWaitlistEmailContent = (
  waitlistEntry: { 
    name: string; 
    numberOfPersons: number; 
    eventId: string;
    id: string;
  },
  event: Event
): EmailContentBlock => {
  const details: EmailContentBlock['reservationDetails'] = [
    {
      label: 'Evenement:',
      value: 'Dinner theater Show',
    },
    {
      label: 'Datum:',
      value: formatDate(event.date),
    },
    {
      label: 'Aantal personen:',
      value: `${waitlistEntry.numberOfPersons} ${waitlistEntry.numberOfPersons === 1 ? 'persoon' : 'personen'}`,
    },
  ];

  return {
    spotlightTitle: 'U staat op de wachtlijst 📋',
    greeting: `Beste ${waitlistEntry.name},`,
    introText: 'Bedankt voor uw interesse in dit evenement. Helaas is het momenteel volgeboekt.',
    reservationDetails: details,
    additionalInfo: `
      <strong>Wat gebeurt er nu?</strong><br />
      Zodra er plaatsen vrijkomen voor uw gezelschap van ${waitlistEntry.numberOfPersons} ${waitlistEntry.numberOfPersons === 1 ? 'persoon' : 'personen'}, 
      nemen wij zo snel mogelijk contact met u op.<br /><br />
      U ontvangt dan een persoonlijke link om uw reservering af te ronden.
    `,
    ctaButton: {
      text: 'Terug naar website',
      url: 'https://inspirationpoint.nl',
    },
    footerNote: 'We doen ons best om iedereen te kunnen ontvangen. Bedankt voor uw geduld!',
  };
};

/**
 * 4️⃣ AANVRAAG EMAIL (Status: pending)
 * 
 * Doel: Bevestig ontvangst aanvraag (nog geen definitieve bevestiging)
 * CTA: "Terug naar website"
 */
export const generatePendingEmailContent = async (
  reservation: Reservation,
  event: Event,
  show?: Show
): Promise<EmailContentBlock> => {
  // Format name with proper capitalization
  const firstName = formatName(reservation.firstName || '');
  const lastName = formatName(reservation.lastName || '');
  const fullName = `${firstName} ${lastName}`.trim() || formatName(reservation.contactPerson || '') || '';
  
  const arrangement = reservation.arrangement === 'standaard' ? 'Standaard Arrangement' : 'Premium Arrangement';
  const basePrice = reservation.pricingSnapshot?.basePrice || 0;
  const priceInfo = basePrice > 0 ? ` (€${basePrice.toFixed(2)} per persoon)` : '';
  
  const details: EmailContentBlock['reservationDetails'] = [];

  if (reservation.companyName) {
    details.push({
      label: 'Bedrijfsnaam:',
      value: reservation.companyName,
    });
  }

  details.push(
    {
      label: 'Naam:',
      value: fullName,
    },
    {
      label: 'Evenement:',
      value: 'Dinner theater Show',
    },
    {
      label: 'Datum:',
      value: formatDate(event.date),
    },
    {
      label: 'Aantal personen:',
      value: `${reservation.numberOfPersons} ${reservation.numberOfPersons === 1 ? 'persoon' : 'personen'}`,
    },
    {
      label: 'Arrangement:',
      value: `${arrangement}`,
    }
  );

  // Add-ons
  if (reservation.preDrink?.enabled) {
    details.push({
      label: 'Preparty:',
      value: `✅ Ja`,
    });
  }
  
  if (reservation.afterParty?.enabled) {
    details.push({
      label: 'Afterparty:',
      value: `✅ Ja`,
    });
  }

  // Build additional info with celebration, dietary, etc.
  const additionalInfoParts = [];

  // Process steps
  additionalInfoParts.push(`
    <strong>📋 Hoe werkt het proces?</strong><br />
    <ol style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
      <li><strong>Nu:</strong> Wij controleren beschikbaarheid voor uw gewenste datum</li>
      <li><strong>Binnen 2 werkdagen:</strong> U ontvangt een bevestigings- of afwijzingsmail</li>
      <li><strong>Bij beschikbaarheid:</strong> Uw reservering is definitief bevestigd</li>
      <li><strong>3 weken voor de voorstelling:</strong> Geeft u het definitieve aantal gasten door en ontvangt u de factuur</li>
      <li><strong>2 weken voor de voorstelling:</strong> Is uw betaling voldaan per bankoverschrijving</li>
    </ol>
  `);

  return {
    spotlightTitle: 'Uw aanvraag is ontvangen ⏳',
    spotlightSubtitle: '📧 U ontvangt binnen twee werkdagen bericht over de beschikbaarheid',
    // ✨ NEW: Show Identity (Logo + Description)
    showInfo: show ? {
      logoUrl: show.logoUrl || show.imageUrl,
      description: show.description,
    } : undefined,
    greeting: `Beste ${fullName},`,
    introText: 'Hartelijk dank voor uw reserveringsaanvraag bij Inspiration Point. Uw aanvraag wordt momenteel door ons team beoordeeld.',
    reservationDetails: details,
    additionalInfo: `
      <div style="background: rgba(139, 0, 0, 0.3); border: 2px solid #8B0000; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <strong style="color: #FFD700; font-size: 16px;">⚠️ Let Op: Nog Geen Definitieve Reservering</strong><br /><br />
        <span style="color: #E5E5E5;">
          Uw aanvraag wacht op bevestiging van ons team. We controleren eerst de beschikbaarheid voor uw gewenste datum en arrangement.<br /><br />
          <strong style="color: #FFD700;">Alleen na onze bevestigingsmail is uw reservering definitief.</strong>
        </span>
      </div>
      ${additionalInfoParts.join('<br /><br />')}
    `,
    ctaButton: {
      text: 'Terug naar website',
      url: 'https://inspiration-point.nl',
    },
    footerNote: 'Bij spoedeisende vragen kunt u ons direct bereiken via info@inspiration-point.nl of 040-2110679',
  };
};

/**
 * 4️⃣ AFWIJZING EMAIL (Status: rejected)
 * 
 * Doel: Informeer klant dat reservering niet doorgaat met reden
 * CTA: "Bekijk andere datums"
 */
export const generateRejectionEmailContent = async (
  reservation: Reservation,
  event: Event,
  show?: Show,
  rejectionReason?: string
): Promise<EmailContentBlock> => {
  // Format name with proper capitalization
  const firstName = formatName(reservation.firstName || '');
  const lastName = formatName(reservation.lastName || '');
  const fullName = `${firstName} ${lastName}`.trim() || formatName(reservation.contactPerson || '') || '';
  
  const arrangement = reservation.arrangement === 'standaard' ? 'Standaard Arrangement' : 'Premium Arrangement';
  
  const details: EmailContentBlock['reservationDetails'] = [];

  if (reservation.companyName) {
    details.push({
      label: 'Bedrijfsnaam:',
      value: reservation.companyName,
    });
  }

  details.push(
    {
      label: 'Naam:',
      value: fullName,
    },
    {
      label: 'Evenement:',
      value: 'Dinner theater Show',
    },
    {
      label: 'Datum:',
      value: formatDate(event.date),
    },
    {
      label: 'Aantal personen:',
      value: `${reservation.numberOfPersons} ${reservation.numberOfPersons === 1 ? 'persoon' : 'personen'}`,
    },
    {
      label: 'Arrangement:',
      value: `${arrangement}`,
    }
  );

  // Build rejection reason section
  const rejectionReasonText = rejectionReason || 'De gevraagde datum is helaas niet beschikbaar.';

  return {
    spotlightTitle: 'Reservering kan helaas niet doorgaan ❌',
    // ✨ NEW: Show Identity (Logo + Description)
    showInfo: show ? {
      logoUrl: show.logoUrl || show.imageUrl,
      description: show.description,
    } : undefined,
    greeting: `Beste ${fullName},`,
    introText: 'Bedankt voor uw interesse in Inspiration Point. Helaas kunnen wij uw reserveringsaanvraag niet honoreren.',
    reservationDetails: details,
    additionalInfo: `
      <div style="background: rgba(139, 0, 0, 0.3); border: 2px solid #8B0000; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <strong style="color: #FFD700; font-size: 16px;">📋 Reden van afwijzing:</strong><br /><br />
        <span style="color: #E5E5E5; font-size: 15px;">
          ${rejectionReasonText}
        </span>
      </div>
      <strong>🎭 Alternatieve mogelijkheden</strong><br />
      Mogelijk zijn andere datums of arrangementen wel beschikbaar. Neem gerust contact met ons op om de mogelijkheden te bespreken:<br /><br />
      📧 <a href="mailto:info@inspiration-point.nl" style="color: #FFD700;">info@inspiration-point.nl</a><br />
      📞 <a href="tel:0402110679" style="color: #FFD700;">040-2110679</a>
    `,
    ctaButton: {
      text: 'Bekijk andere datums',
      url: 'https://inspiration-point.nl',
    },
    footerNote: 'We hopen u in de toekomst alsnog te mogen ontvangen voor een onvergetelijke avond!',
  };
};

/**
 * 💰 BETALING BEVESTIGING EMAIL
 * 
 * Doel: Bevestig ontvangst van betaling met details
 */
export const generatePaymentConfirmationEmailContent = async (
  reservation: Reservation,
  event: Event,
  show?: Show
): Promise<EmailContentBlock> => {
  const firstName = formatName(reservation.firstName || '');
  const lastName = formatName(reservation.lastName || '');
  const fullName = `${firstName} ${lastName}`.trim() || formatName(reservation.contactPerson || '') || '';
  
  const details: EmailContentBlock['reservationDetails'] = [];

  if (reservation.companyName) {
    details.push({
      label: 'Bedrijfsnaam:',
      value: reservation.companyName,
    });
  }

  details.push(
    {
      label: 'Naam:',
      value: fullName,
    },
    {
      label: 'Evenement:',
      value: 'Dinner theater Show',
    },
    {
      label: 'Datum:',
      value: formatDate(event.date),
    },
    {
      label: 'Aantal personen:',
      value: `${reservation.numberOfPersons} ${reservation.numberOfPersons === 1 ? 'persoon' : 'personen'}`,
    }
  );

  // Calculate payment details
  const totalAmount = reservation.pricingSnapshot?.finalTotal || reservation.totalPrice || 0;
  const payments = reservation.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;

  if (latestPayment) {
    details.push({
      label: 'Ontvangen betaling:',
      value: formatCurrency(latestPayment.amount),
      highlight: true,
    });

    if (latestPayment.method) {
      details.push({
        label: 'Betaalmethode:',
        value: latestPayment.method === 'cash' ? 'Contant' :
               latestPayment.method === 'pin' ? 'PIN' :
               latestPayment.method === 'bank' ? 'Bankoverschrijving' :
               latestPayment.method === 'ideal' ? 'iDEAL' : latestPayment.method,
      });
    }

    if (latestPayment.reference) {
      details.push({
        label: 'Referentie:',
        value: latestPayment.reference,
      });
    }

    if (latestPayment.notes) {
      details.push({
        label: 'Notitie:',
        value: latestPayment.notes,
      });
    }
  }

  details.push({
    label: 'Totaalbedrag reservering:',
    value: formatCurrency(totalAmount),
  });

  details.push({
    label: 'Totaal betaald:',
    value: formatCurrency(totalPaid),
  });

  const balance = totalAmount - totalPaid;
  if (balance > 0) {
    details.push({
      label: 'Nog te betalen:',
      value: formatCurrency(balance),
    });
  } else if (balance === 0) {
    details.push({
      label: 'Status:',
      value: '✅ Volledig betaald',
    });
  } else {
    details.push({
      label: 'Teveel betaald:',
      value: formatCurrency(Math.abs(balance)),
    });
  }

  return {
    spotlightTitle: 'Betaling ontvangen! 💰',
    showInfo: show ? {
      logoUrl: show.logoUrl || show.imageUrl,
      description: show.description,
    } : undefined,
    greeting: `Beste ${fullName},`,
    introText: balance === 0 
      ? 'Hartelijk dank voor uw betaling! We hebben uw volledige betaling in goede orde ontvangen. U bent helemaal klaar voor uw bezoek.'
      : balance > 0
      ? `Hartelijk dank voor uw betaling van ${formatCurrency(latestPayment?.amount || 0)}. We hebben dit bedrag in goede orde ontvangen.`
      : 'Hartelijk dank voor uw betaling! We hebben uw betaling in goede orde ontvangen.',
    reservationDetails: details,
    ctaButton: {
      text: 'Terug naar website',
      url: 'https://inspiration-point.nl',
    },
    footerNote: 'Bij vragen over uw betaling kunt u ons bereiken via info@inspiration-point.nl of 040-2110679',
  };
};

/**
 * ✅ BOEKING BEVESTIGING EMAIL (van pending → confirmed)
 * 
 * Doel: Bevestig dat de aanvraag is goedgekeurd en definitief is
 * Anders dan de gewone confirmation - dit is na goedkeuring
 */
export const generateBookingConfirmedEmailContent = async (
  reservation: Reservation,
  event: Event,
  show?: Show
): Promise<EmailContentBlock> => {
  const firstName = formatName(reservation.firstName || '');
  const lastName = formatName(reservation.lastName || '');
  const fullName = `${firstName} ${lastName}`.trim() || formatName(reservation.contactPerson || '') || '';
  
  const arrangement = reservation.arrangement === 'standaard' ? 'Standaard Arrangement' : 'Premium Arrangement';
  const basePrice = reservation.pricingSnapshot?.basePrice || 0;
  const priceInfo = basePrice > 0 ? ` (€${basePrice.toFixed(2)} per persoon)` : '';
  
  const details: EmailContentBlock['reservationDetails'] = [];

  if (reservation.companyName) {
    details.push({
      label: 'Bedrijfsnaam:',
      value: reservation.companyName,
    });
  }

  if (reservation.salutation) {
    details.push({
      label: 'Aanhef:',
      value: reservation.salutation,
    });
  }

  details.push(
    {
      label: 'Naam:',
      value: fullName,
    },
    {
      label: 'Evenement:',
      value: 'Dinner theater Show',
    },
    {
      label: 'Datum:',
      value: formatDate(event.date),
    },
    {
      label: 'Tijd:',
      value: formatEventTimes(event.doorsOpen, event.startsAt, event.endsAt),
    },
    {
      label: 'Aantal personen:',
      value: `${reservation.numberOfPersons} ${reservation.numberOfPersons === 1 ? 'persoon' : 'personen'}`,
    },
    {
      label: 'Arrangement:',
      value: `${arrangement}${priceInfo}`,
    }
  );

  // Add-ons
  if (reservation.preDrink?.enabled) {
    const preDrinkPrice = reservation.pricingSnapshot?.preDrinkPrice || 0;
    details.push({
      label: 'Preparty:',
      value: `✅ Ja (€${preDrinkPrice.toFixed(2)} p.p.)`,
    });
  }
  
  if (reservation.afterParty?.enabled) {
    const afterPartyPrice = reservation.pricingSnapshot?.afterPartyPrice || 0;
    details.push({
      label: 'Afterparty:',
      value: `✅ Ja (€${afterPartyPrice.toFixed(2)} p.p.)`,
    });
  }

  // Merchandise
  if (reservation.merchandise && reservation.merchandise.length > 0) {
    try {
      const { storageService } = await import('../services/storageService');
      const merchandiseItems = await storageService.getMerchandise();
      
      const merchandiseText = reservation.merchandise.map(item => {
        const merchandiseItem = merchandiseItems.find(m => m.id === item.itemId);
        const productName = merchandiseItem?.name || `Product`;
        const price = merchandiseItem?.price || 0;
        const totalPrice = price * item.quantity;
        return `${productName} ${item.quantity}x (€${totalPrice.toFixed(2)})`;
      }).join(', ');
      
      details.push({
        label: 'Merchandise:',
        value: merchandiseText,
      });
    } catch (error) {
      console.warn('Could not load merchandise names:', error);
      if (reservation.merchandise.length > 0) {
        details.push({
          label: 'Merchandise:',
          value: `${reservation.merchandise.length} item(s)`,
        });
      }
    }
  }

  // Total price
  const totalAmount = reservation.pricingSnapshot?.finalTotal || reservation.totalPrice;
  details.push({
    label: 'Totaalprijs:',
    value: formatCurrency(totalAmount),
    highlight: true,
  });

  // Payment info - Calculate from actual payments
  const payments = reservation.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalAmount - totalPaid;
  
  const paymentText = balance <= 0
    ? '✅ Volledig betaald'
    : totalPaid > 0
    ? `⏳ Deels betaald (€${totalPaid.toFixed(2)} van €${totalAmount.toFixed(2)})`
    : `⏳ Te betalen${reservation.paymentDueDate ? ` vóór ${formatDate(reservation.paymentDueDate)}` : ''}`;
  
  details.push({
    label: 'Betaalstatus:',
    value: paymentText,
  });

  // Additional info
  const additionalInfoParts = [];

  if (reservation.celebrationOccasion) {
    let celebration = `🎉 ${reservation.celebrationOccasion}`;
    if (reservation.partyPerson) {
      celebration += ` voor ${reservation.partyPerson}`;
    }
    if (reservation.celebrationDetails) {
      celebration += ` - ${reservation.celebrationDetails}`;
    }
    additionalInfoParts.push(celebration);
  }

  if (reservation.dietaryRequirements) {
    const dietary = [];
    if (reservation.dietaryRequirements.vegetarian) {
      dietary.push(`🥗 Vegetarisch: ${reservation.dietaryRequirements.vegetarianCount || 0}x`);
    }
    if (reservation.dietaryRequirements.vegan) {
      dietary.push(`🌱 Veganistisch: ${reservation.dietaryRequirements.veganCount || 0}x`);
    }
    if (reservation.dietaryRequirements.glutenFree) {
      dietary.push(`🌾 Glutenvrij: ${reservation.dietaryRequirements.glutenFreeCount || 0}x`);
    }
    if (reservation.dietaryRequirements.lactoseFree) {
      dietary.push(`🥛 Lactosevrij: ${reservation.dietaryRequirements.lactoseFreeCount || 0}x`);
    }
    if (reservation.dietaryRequirements.other) {
      dietary.push(`📝 Overig: ${reservation.dietaryRequirements.other}`);
    }
    if (dietary.length > 0) {
      additionalInfoParts.push(`<strong>Dieetwensen:</strong><br />${dietary.join('<br />')}`);
    }
  }

  if (reservation.comments) {
    additionalInfoParts.push(`<strong>Uw opmerking:</strong><br />${reservation.comments}`);
  }

  return {
    spotlightTitle: 'Uw boeking is goedgekeurd! ✅',
    showInfo: show ? {
      logoUrl: show.logoUrl || show.imageUrl,
      description: show.description,
    } : undefined,
    greeting: `Beste ${fullName},`,
    introText: 'Goed nieuws! Uw reserveringsaanvraag is door ons goedgekeurd en definitief bevestigd. We kijken er naar uit om u te ontvangen voor een onvergetelijke avond bij Inspiration Point!',
    reservationDetails: details,
    additionalInfo: additionalInfoParts.length > 0 ? additionalInfoParts.join('<br /><br />') : undefined,
    ctaButton: {
      text: 'Terug naar website',
      url: 'https://inspiration-point.nl',
    },
    footerNote: 'Bij vragen kunt u ons altijd bereiken via info@inspiration-point.nl of 040-2110679',
  };
};

/**
 * 🎭 MASTER FUNCTION: Generate Email by Status
 * 
 * Deze functie selecteert automatisch het juiste email type
 */
export const generateEmailContentByStatus = async (
  reservation: Reservation,
  event: Event,
  show?: Show,
  rejectionReason?: string
): Promise<EmailContentBlock> => {
  switch (reservation.status) {
    case 'confirmed':
      return generateConfirmationEmailContent(reservation, event, show);
    
    case 'option':
      return generateOptionEmailContent(reservation, event, show);
    
    case 'pending':
      return generatePendingEmailContent(reservation, event, show);
    
    case 'rejected':
      return generateRejectionEmailContent(reservation, event, show, rejectionReason);
    
    // Note: waitlist heeft een aparte flow met WaitlistEntry ipv Reservation
    default:
      return generateConfirmationEmailContent(reservation, event);
  }
};


