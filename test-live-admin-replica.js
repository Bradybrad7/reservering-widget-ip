// Direct test van de live generateAdminNewBookingEmail functie
async function testLiveAdminEmailGeneration() {
  console.log('🧪 Testing LIVE admin email generation...');
  
  // Exactly same as the function generateAdminNewBookingEmail in emailService.ts
  const reservation = {
    id: 'RES-LIVE-' + Date.now(),
    firstName: 'Jan',
    lastName: 'de Vries',
    contactPerson: 'Jan de Vries',
    salutation: 'Dhr.',
    companyName: 'Test Bedrijf BV',
    address: 'Teststraat',
    houseNumber: '123',
    postalCode: '1234 AB',
    city: 'Amsterdam',
    phone: '0612345678',
    phoneCountryCode: '+31',
    email: 'test@example.com',
    numberOfPersons: 4,
    arrangement: 'Deluxe',
    pricingSnapshot: {
      basePrice: 65.00
    },
    acceptTerms: true,
    newsletterOptIn: true,
    comments: 'Test comment voor debugging',
    preDrink: { enabled: false },
    afterParty: { enabled: false },
    celebrationOccasion: '',
    celebrationDetails: ''
  };

  const event = {
    date: new Date('2025-12-15'),
    startsAt: '19:30'
  };

  // EXACT copy of generateAdminNewBookingEmail function
  const eventDate = event.date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Format arrangement info
  const arrangement = reservation.arrangement === 'BWF' ? 'Premium' : 'Deluxe';
  const basePrice = reservation.pricingSnapshot?.basePrice || 0;
  const arrangementInfo = basePrice > 0 ? `${arrangement} - €${basePrice.toFixed(2)} per persoon` : arrangement;
  
  // Format add-ons
  const preparty = reservation.preDrink?.enabled ? 'Ja' : 'Nee';
  const afterparty = reservation.afterParty?.enabled ? 'Ja' : 'Nee';
  
  // Collect comments and additional info
  const comments = [];
  if (reservation.comments) comments.push(reservation.comments);
  if (reservation.celebrationOccasion) {
    const occasion = `Gelegenheid: ${reservation.celebrationOccasion}`;
    const person = reservation.partyPerson ? ` voor ${reservation.partyPerson}` : '';
    comments.push(occasion + person);
  }
  if (reservation.celebrationDetails) comments.push(`Details: ${reservation.celebrationDetails}`);
  const allComments = comments.join('. ') || 'Geen';
  
  // Create simple, structured text format
  const textContent = `
U heeft een nieuwe reservatie

Datum: ${eventDate}
Bedrijfsnaam: ${reservation.companyName || ''}
Aanhef: ${reservation.salutation || ''}
Naam: ${(reservation.firstName + ' ' + reservation.lastName).trim() || reservation.contactPerson || ''}
Adres: ${reservation.address || ''}
Huisnummer: ${reservation.houseNumber || ''}
Postcode: ${reservation.postalCode || ''}
Plaats: ${reservation.city || ''}
Telefoon: ${reservation.phoneCountryCode || ''}${reservation.phone || ''}
Email: ${reservation.email || ''}

Aantal personen: ${reservation.numberOfPersons || 0}

Gekozen arrangement: ${arrangementInfo}
Preparty: ${preparty}
Afterparty: ${afterparty}

Opmerkingen: ${allComments}

Nieuwsbrief: ${reservation.newsletterOptIn ? 'Ja' : 'Nee'}
Algemene voorwaarden: ${reservation.acceptTerms ? 'Ja' : 'Nee'}
  `.trim();

  // Simple, compact HTML version for admin
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.3; max-width: 500px; margin: 0;">
      <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">Nieuwe reservatie ontvangen</h3>
      
      <table style="border-collapse: collapse; width: 100%; font-size: 12px;">
        <tr><td style="padding: 3px 0; width: 120px; color: #666;"><strong>Datum:</strong></td><td style="padding: 3px 0;">${eventDate}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Bedrijfsnaam:</strong></td><td style="padding: 3px 0;">${reservation.companyName || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Aanhef:</strong></td><td style="padding: 3px 0;">${reservation.salutation || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Naam:</strong></td><td style="padding: 3px 0;">${(reservation.firstName + ' ' + reservation.lastName).trim() || reservation.contactPerson || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Adres:</strong></td><td style="padding: 3px 0;">${reservation.address || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Huisnummer:</strong></td><td style="padding: 3px 0;">${reservation.houseNumber || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Postcode:</strong></td><td style="padding: 3px 0;">${reservation.postalCode || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Plaats:</strong></td><td style="padding: 3px 0;">${reservation.city || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Telefoon:</strong></td><td style="padding: 3px 0;">${reservation.phoneCountryCode || ''}${reservation.phone || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Email:</strong></td><td style="padding: 3px 0;">${reservation.email || ''}</td></tr>
        <tr><td colspan="2" style="padding: 8px 0 4px 0;"><hr style="border: none; border-top: 1px solid #ddd; margin: 0;"></td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Aantal personen:</strong></td><td style="padding: 3px 0;">${reservation.numberOfPersons || 0}</td></tr>
        <tr><td colspan="2" style="padding: 8px 0 4px 0;"><hr style="border: none; border-top: 1px solid #ddd; margin: 0;"></td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Arrangement:</strong></td><td style="padding: 3px 0;">${arrangementInfo}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Preparty:</strong></td><td style="padding: 3px 0;">${preparty}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Afterparty:</strong></td><td style="padding: 3px 0;">${afterparty}</td></tr>
        <tr><td colspan="2" style="padding: 8px 0 4px 0;"><hr style="border: none; border-top: 1px solid #ddd; margin: 0;"></td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Opmerkingen:</strong></td><td style="padding: 3px 0;">${allComments || 'Geen'}</td></tr>
        <tr><td colspan="2" style="padding: 8px 0 4px 0;"><hr style="border: none; border-top: 1px solid #ddd; margin: 0;"></td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Nieuwsbrief:</strong></td><td style="padding: 3px 0;">${reservation.newsletterOptIn ? 'Ja' : 'Nee'}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Algemene voorwaarden:</strong></td><td style="padding: 3px 0;">${reservation.acceptTerms ? 'Ja' : 'Nee'}</td></tr>
      </table>
    </div>
  `;

  console.log('\n📧 Generated HTML Content (first 200 chars):');
  console.log(htmlContent.substring(0, 200) + '...');
  
  console.log('\n📧 Generated Text Content (first 200 chars):');
  console.log(textContent.substring(0, 200) + '...');

  try {
    console.log('\n📧 Sending LIVE REPLICA admin email...');
    
    const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to: 'info@inspiration-point.nl',
        subject: 'LIVE REPLICA: Nieuwe reservatie ontvangen',
        html: htmlContent,
        text: textContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firebase Cloud Function failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ LIVE REPLICA admin email sent!');
    console.log('\n🔍 Check your inbox for:');
    console.log('📧 Subject: "LIVE REPLICA: Nieuwe reservatie ontvangen"');
    
    console.log('\n🔍 DEBUGGING:');
    console.log('- If this email is CORRECT (table format), then the issue is elsewhere');
    console.log('- If this email is WRONG (text blob), then there is still a template issue');
    console.log('- Compare this with what you received from the real app');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testLiveAdminEmailGeneration();