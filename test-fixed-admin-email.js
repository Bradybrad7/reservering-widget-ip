// Test fixed admin email format
async function testFixedAdminEmail() {
  console.log('🧪 Testing FIXED admin email format...');
  
  const mockReservation = {
    id: 'RES-ADMIN-' + Date.now(),
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
    comments: 'Speciale verzoeken voor tafelplek'
  };

  const mockEvent = {
    date: new Date('2025-12-15'),
    startsAt: '19:30'
  };

  // Format date like the email service does
  const eventDate = mockEvent.date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });

  const arrangement = mockReservation.arrangement === 'BWF' ? 'Premium' : 'Deluxe';
  const basePrice = mockReservation.pricingSnapshot?.basePrice || 0;
  const arrangementInfo = basePrice > 0 ? `${arrangement} - €${basePrice.toFixed(2)} per persoon` : arrangement;

  try {
    console.log('📧 Sending FIXED admin email (table format)...');
    
    const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to: 'info@inspiration-point.nl',
        subject: 'TEST FIXED: Nieuwe reservatie ontvangen',
        html: `
    <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.3; max-width: 500px; margin: 0;">
      <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">Nieuwe reservatie ontvangen</h3>
      
      <table style="border-collapse: collapse; width: 100%; font-size: 12px;">
        <tr><td style="padding: 3px 0; width: 120px; color: #666;"><strong>Datum:</strong></td><td style="padding: 3px 0;">${eventDate}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Bedrijfsnaam:</strong></td><td style="padding: 3px 0;">${mockReservation.companyName || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Aanhef:</strong></td><td style="padding: 3px 0;">${mockReservation.salutation || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Naam:</strong></td><td style="padding: 3px 0;">${(mockReservation.firstName + ' ' + mockReservation.lastName).trim() || mockReservation.contactPerson || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Adres:</strong></td><td style="padding: 3px 0;">${mockReservation.address || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Huisnummer:</strong></td><td style="padding: 3px 0;">${mockReservation.houseNumber || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Postcode:</strong></td><td style="padding: 3px 0;">${mockReservation.postalCode || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Plaats:</strong></td><td style="padding: 3px 0;">${mockReservation.city || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Telefoon:</strong></td><td style="padding: 3px 0;">${mockReservation.phoneCountryCode || ''}${mockReservation.phone || ''}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Email:</strong></td><td style="padding: 3px 0;">${mockReservation.email || ''}</td></tr>
        <tr><td colspan="2" style="padding: 8px 0 4px 0;"><hr style="border: none; border-top: 1px solid #ddd; margin: 0;"></td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Aantal personen:</strong></td><td style="padding: 3px 0;">${mockReservation.numberOfPersons || 0}</td></tr>
        <tr><td colspan="2" style="padding: 8px 0 4px 0;"><hr style="border: none; border-top: 1px solid #ddd; margin: 0;"></td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Arrangement:</strong></td><td style="padding: 3px 0;">${arrangementInfo}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Preparty:</strong></td><td style="padding: 3px 0;">Nee</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Afterparty:</strong></td><td style="padding: 3px 0;">Nee</td></tr>
        <tr><td colspan="2" style="padding: 8px 0 4px 0;"><hr style="border: none; border-top: 1px solid #ddd; margin: 0;"></td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Opmerkingen:</strong></td><td style="padding: 3px 0;">${mockReservation.comments || 'Geen'}</td></tr>
        <tr><td colspan="2" style="padding: 8px 0 4px 0;"><hr style="border: none; border-top: 1px solid #ddd; margin: 0;"></td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Nieuwsbrief:</strong></td><td style="padding: 3px 0;">${mockReservation.newsletterOptIn ? 'Ja' : 'Nee'}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;"><strong>Algemene voorwaarden:</strong></td><td style="padding: 3px 0;">${mockReservation.acceptTerms ? 'Ja' : 'Nee'}</td></tr>
      </table>
    </div>
        `,
        text: `TEST ADMIN EMAIL - SIMPLE TEXT FORMAT

U heeft een nieuwe reservatie

Datum: ${eventDate}
Bedrijfsnaam: ${mockReservation.companyName || ''}
Aanhef: ${mockReservation.salutation || ''}
Naam: ${(mockReservation.firstName + ' ' + mockReservation.lastName).trim() || mockReservation.contactPerson || ''}
Adres: ${mockReservation.address || ''}
Huisnummer: ${mockReservation.houseNumber || ''}
Postcode: ${mockReservation.postalCode || ''}
Plaats: ${mockReservation.city || ''}
Telefoon: ${mockReservation.phoneCountryCode || ''}${mockReservation.phone || ''}
Email: ${mockReservation.email || ''}

Aantal personen: ${mockReservation.numberOfPersons || 0}

Gekozen arrangement: ${arrangementInfo}
Preparty: Nee
Afterparty: Nee

Opmerkingen: ${mockReservation.comments || 'Geen'}

Nieuwsbrief: ${mockReservation.newsletterOptIn ? 'Ja' : 'Nee'}
Algemene voorwaarden: ${mockReservation.acceptTerms ? 'Ja' : 'Nee'}`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firebase Cloud Function failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ FIXED admin email sent!');
    console.log('\n🔍 Check your inbox for:');
    console.log('📧 Subject: "TEST FIXED: Nieuwe reservatie ontvangen"');
    console.log('\n✨ This admin email should have:');
    console.log('- 📋 Clean table format (not long text)');
    console.log('- 📏 Compact 12px font');
    console.log('- 📊 Structured rows with labels');
    console.log('- 🔧 Perfect for Outlook add-on parsing');
    
    console.log('\n🛠️ Fixed the issue:');
    console.log('❌ WAS: html: textContent (long text blob)');
    console.log('✅ NOW: html: htmlContent (structured table)');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testFixedAdminEmail();