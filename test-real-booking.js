// Echte boeking test met info@inspiration-point.nl als klant email
const testRealBooking = async () => {
  console.log('🎯 Echte boeking test - info@inspiration-point.nl als klant');

  const realBookingTest = {
    // Klant email (jullie eigen email)
    customerEmail: {
      to: 'info@inspiration-point.nl',
      subject: '⏳ TESTT - Reservering ontvangen en in behandeling - Test Bedrijf (zaterdag 15 december 2025)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%); color: white; padding: 30px; text-align: center;">
            <h1>📋 Reservering Ontvangen</h1>
            <p>Inspiration Point</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0;">
            <p>Beste Test Klant,</p>
            
            <p>Bedankt voor uw reservering! Wij hebben uw aanvraag ontvangen en nemen deze in behandeling.</p>
            
            <div style="background: #fff8e7; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #FFA500;">
              <h3>📅 Reserveringsgegevens</h3>
              <p><strong>Reserveringsnummer:</strong> TEST-${Date.now()}</p>
              <p><strong>Bedrijf:</strong> Test Bedrijf BV</p>
              <p><strong>Datum:</strong> Zaterdag 15 december 2025</p>
              <p><strong>Tijd:</strong> 19:30 - 22:30</p>
              <p><strong>Aantal personen:</strong> 4</p>
              <p><strong>Arrangement:</strong> Brood, Water & Frisdrank</p>
            </div>
            
            <div style="background: #f0f8ff; border: 1px solid #4a9eff; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3>📋 Volgende Stappen</h3>
              <p><strong>Status:</strong> <span style="background: #FFA500; color: white; padding: 5px 10px; border-radius: 3px;">IN BEHANDELING</span></p>
              
              <ol>
                <li>Controle - Wij controleren de beschikbaarheid</li>
                <li>Bevestiging - U ontvangt binnen 1-2 werkdagen een definitieve bevestiging</li>
                <li>Betalingsinformatie - Bij bevestiging ontvangt u de betalingsgegevens</li>
              </ol>
            </div>
            
            <p>Deze email wordt automatisch verstuurd bij ELKE nieuwe boeking!</p>
          </div>
        </div>
      `,
      text: `Reservering Ontvangen - Inspiration Point
      
Beste Test Klant,

Bedankt voor uw reservering! 

Reserveringsnummer: TEST-${Date.now()}
Datum: Zaterdag 15 december 2025
Tijd: 19:30 - 22:30
Personen: 4

Status: IN BEHANDELING

U ontvangt binnen 1-2 werkdagen een bevestiging.`
    },
    
    // Admin notification
    adminEmail: {
      to: 'info@inspiration-point.nl',
      subject: `🚨 NIEUWE RESERVERING TEST-${Date.now()} - Test Bedrijf BV (zaterdag 15 december 2025)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center;">
            <h1>🚨 NIEUWE RESERVERING</h1>
            <p style="margin: 0; font-size: 18px;">Actie Vereist</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0;">
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #856404;">⚡ NIEUWE BOEKING BINNEN!</h3>
              <p style="margin-bottom: 0;">Er is zojuist een nieuwe reservering binnengekomen die uw aandacht vereist.</p>
            </div>
            
            <h3>📋 RESERVERINGSGEGEVENS</h3>
            <div style="background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px;">
              <p><strong>Nummer:</strong> TEST-${Date.now()}</p>
              <p><strong>Status:</strong> PENDING (wacht op goedkeuring)</p>
              <p><strong>Evenement:</strong> zaterdag 15 december 2025 om 19:30</p>
              <p><strong>Arrangement:</strong> BWF</p>
              <p><strong>Aantal personen:</strong> 4</p>
            </div>
            
            <h3>👤 CONTACTGEGEVENS</h3>
            <div style="background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px;">
              <p><strong>Bedrijf:</strong> Test Bedrijf BV</p>
              <p><strong>Contactpersoon:</strong> Test Klant</p>
              <p><strong>Email:</strong> info@inspiration-point.nl</p>
              <p><strong>Telefoon:</strong> +31 612345678</p>
            </div>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #155724;">✅ ACTIES TE ONDERNEMEN</h3>
              <ol>
                <li>Voeg reservering toe aan het reserveringssysteem</li>
                <li>Controleer beschikbaarheid voor zaterdag 15 december 2025</li>
                <li>Verstuur betalingsinformatie naar klant</li>
                <li>Bevestig reservering wanneer betaling ontvangen is</li>
                <li>Noteer eventuele bijzonderheden in het systeem</li>
              </ol>
            </div>
            
            <p style="font-weight: bold; color: #dc3545;">⚠️ Deze email wordt bij ELKE nieuwe online boeking verzonden!</p>
          </div>
        </div>
      `,
      text: `🚨 NIEUWE RESERVERING - zaterdag 15 december 2025

RESERVERINGSGEGEVENS:
- Nummer: TEST-${Date.now()}
- Status: PENDING
- Evenement: zaterdag 15 december 2025 om 19:30
- Arrangement: BWF
- Aantal personen: 4

CONTACTGEGEVENS:
- Bedrijf: Test Bedrijf BV
- Contactpersoon: Test Klant
- Email: info@inspiration-point.nl
- Telefoon: +31 612345678

ACTIES TE ONDERNEMEN:
1. Voeg reservering toe aan het reserveringssysteem
2. Controleer beschikbaarheid
3. Verstuur betalingsinformatie naar klant
4. Bevestig reservering bij betaling`
    }
  };

  console.log('\n1️⃣ Versturen KLANT bevestiging...');
  const customerResult = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(realBookingTest.customerEmail)
  });
  const customerResponse = await customerResult.json();
  console.log('   Klant email resultaat:', customerResponse);

  console.log('\n2️⃣ Versturen ADMIN notificatie...');
  const adminResult = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(realBookingTest.adminEmail)
  });
  const adminResponse = await adminResult.json();
  console.log('   Admin email resultaat:', adminResponse);

  console.log('\n📊 RESULTATEN:');
  console.log('   ✉️ Klant bevestiging:', customerResponse.success ? '✅ VERZONDEN' : '❌ GEFAALD');
  console.log('   🚨 Admin notificatie:', adminResponse.success ? '✅ VERZONDEN' : '❌ GEFAALD');
  
  console.log('\n📬 CONTROLEER NU JULLIE EMAIL INBOX:');
  console.log('   1. Klant bevestiging: "⏳ TESTT - Reservering ontvangen"');
  console.log('   2. Admin notificatie: "🚨 NIEUWE RESERVERING TEST-..."');
  console.log('\n   💡 TIP: Kijk ook in de spam/junk folder!');
};

// Test uitvoeren
testRealBooking();