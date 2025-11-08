// Test van het complete email flow - Admin + Customer
const testCompleteEmailFlow = async () => {
  console.log('🧪 TESTING COMPLETE EMAIL FLOW');
  console.log('================================');

  // Mock reservation data
  const mockReservation = {
    id: 'test-res-' + Date.now(),
    eventId: 'test-event-123',
    firstName: 'Test',
    lastName: 'Gebruiker',
    contactPerson: 'Test Gebruiker',
    email: 'info@inspiration-point.nl', // Wijzigen naar echt email adres om te testen
    phone: '+31612345678',
    phoneCountryCode: '+31',
    companyName: 'Test Bedrijf BV',
    salutation: 'De heer',
    address: 'Teststraat 123',
    houseNumber: '123',
    postalCode: '1234AB',
    city: 'Amsterdam',
    numberOfPersons: 4,
    arrangement: 'BWF', // Premium
    preDrink: { enabled: true },
    afterParty: { enabled: false },
    comments: 'Dit is een test reservering voor email flow',
    celebrationOccasion: 'Verjaardag',
    partyPerson: 'Test Persoon',
    celebrationDetails: 'Speciale gelegenheid',
    newsletterOptIn: true,
    acceptTerms: true,
    pricingSnapshot: {
      basePrice: 89.50
    }
  };

  // Mock event data
  const mockEvent = {
    id: 'test-event-123',
    date: new Date('2025-12-15'),
    startsAt: '19:30',
    title: 'Test Show December'
  };

  try {
    console.log('📧 Testing email service directly...');
    
    // Test 1: Admin notification
    console.log('\n1️⃣ Testing admin notification...');
    const adminResult = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'info@inspiration-point.nl',
        subject: 'Nieuwe reservatie ontvangen',
        html: `
<p>U heeft een nieuwe reservatie</p>
<br>
<p><strong>Datum:</strong> 15-12-2025</p>
<p><strong>Bedrijfsnaam:</strong> Test Bedrijf BV</p>
<p><strong>Aanhef:</strong> De heer</p>
<p><strong>Naam:</strong> Test Gebruiker</p>
<p><strong>Adres:</strong> Teststraat 123</p>
<p><strong>Huisnummer:</strong> 123</p>
<p><strong>Postcode:</strong> 1234AB</p>
<p><strong>Plaats:</strong> Amsterdam</p>
<p><strong>Telefoon:</strong> +31612345678</p>
<p><strong>Email:</strong> info@inspiration-point.nl</p>
<br>
<p><strong>Aantal personen:</strong> 4</p>
<br>
<p><strong>Gekozen arrangement:</strong> Premium - €89.50 per persoon</p>
<p><strong>Preparty:</strong> Ja</p>
<p><strong>Afterparty:</strong> Nee</p>
<br>
<p><strong>Opmerkingen:</strong> Dit is een test reservering voor email flow. Gelegenheid: Verjaardag voor Test Persoon. Details: Speciale gelegenheid</p>
<br>
<p><strong>Nieuwsbrief:</strong> Ja</p>
<p><strong>Algemene voorwaarden:</strong> Ja</p>
        `,
        text: `
U heeft een nieuwe reservatie

Datum: 15-12-2025
Bedrijfsnaam: Test Bedrijf BV
Aanhef: De heer
Naam: Test Gebruiker
Adres: Teststraat 123
Huisnummer: 123
Postcode: 1234AB
Plaats: Amsterdam
Telefoon: +31612345678
Email: info@inspiration-point.nl

Aantal personen: 4

Gekozen arrangement: Premium - €89.50 per persoon
Preparty: Ja
Afterparty: Nee

Opmerkingen: Dit is een test reservering voor email flow. Gelegenheid: Verjaardag voor Test Persoon. Details: Speciale gelegenheid

Nieuwsbrief: Ja
Algemene voorwaarden: Ja
        `
      })
    });
    
    const adminResponse = await adminResult.json();
    console.log('   Admin email result:', adminResponse);

    // Test 2: Customer pending notification
    console.log('\n2️⃣ Testing customer pending notification...');
    const customerResult = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'info@inspiration-point.nl', // Voor test naar zelfde email
        subject: '⏳ Reservering ontvangen - zondag 15 december 2025',
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #c53030;">Uw reservering is ontvangen</h2>
      <p>Beste De heer Test Gebruiker,</p>
      <p>Bedankt voor uw interesse in Inspiration Point. Uw reservering is ontvangen en wordt momenteel beoordeeld.</p>
      
      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Reservering Details</h3>
        <p><strong>Reservering nummer:</strong> ${mockReservation.id}</p>
        <p><strong>Datum:</strong> zondag 15 december 2025</p>
        <p><strong>Tijd:</strong> 19:30</p>
        <p><strong>Aantal personen:</strong> 4</p>
        <p><strong>Arrangement:</strong> Premium</p>
      </div>
      
      <p><strong>Status: PENDING</strong> - Uw reservering wacht op bevestiging.</p>
      <p>We nemen zo spoedig mogelijk contact met u op voor verdere afhandeling.</p>
      
      <p>Met vriendelijke groet,<br>
      Team Inspiration Point</p>
    </div>
        `,
        text: `
Beste De heer Test Gebruiker,

Uw reservering is ontvangen en wordt momenteel beoordeeld.

RESERVERING DETAILS:
- Nummer: ${mockReservation.id}
- Datum: zondag 15 december 2025
- Tijd: 19:30
- Aantal personen: 4
- Arrangement: Premium

STATUS: PENDING - Uw reservering wacht op bevestiging.
We nemen zo spoedig mogelijk contact met u op.

Met vriendelijke groet,
Team Inspiration Point
        `
      })
    });
    
    const customerResponse = await customerResult.json();
    console.log('   Customer email result:', customerResponse);

    console.log('\n📊 COMPLETE TEST RESULTS:');
    console.log('========================');
    console.log('   Admin email (structured format):', adminResponse.success ? '✅ SENT' : '❌ FAILED');
    console.log('   Customer email (pending notification):', customerResponse.success ? '✅ SENT' : '❌ FAILED');
    console.log('');
    console.log('📧 Check je inbox op info@inspiration-point.nl voor beide emails!');
    console.log('   1. Admin email: Structured format for Outlook add-on');  
    console.log('   2. Customer email: Pending notification');

  } catch (error) {
    console.error('❌ Error during email flow test:', error);
  }
};

// Run the test
testCompleteEmailFlow();