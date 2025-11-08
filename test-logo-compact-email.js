// Direct test for improved email with logo
async function testImprovedEmailDirect() {
  console.log('🧪 Testing improved customer email with logo and compact details...');
  
  const mockReservation = {
    id: 'RES-' + Date.now(),
    firstName: 'Jan',
    lastName: 'de Vries',
    contactPerson: 'Jan de Vries',
    salutation: 'Dhr.',
    email: 'info@inspiration-point.nl',
    numberOfPersons: 4,
    arrangement: 'Deluxe',
    pricingSnapshot: {
      basePrice: 65.00
    },
    acceptTerms: true,
    newsletterOptIn: false
  };

  const mockEvent = {
    id: 'event123',
    date: new Date('2025-12-15'),
    startsAt: '19:30'
  };

  try {
    console.log('📧 [EMAIL] Sending improved email via Firebase Cloud Function...');
    console.log('   To: info@inspiration-point.nl');
    console.log('   Subject: Reserveringsaanvraag ontvangen - zondag 15 december 2025');
    
    const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to: 'info@inspiration-point.nl',
        subject: 'Reserveringsaanvraag ontvangen - zondag 15 december 2025',
        html: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reservering Ontvangen</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
            
            <!-- Header -->
            <div style="background: #2c5282; padding: 25px 30px; text-align: center; color: white;">
                <img src="https://irp.cdn-website.com/e8046ea7/dms3rep/multi/logo-ip+%281%29.png" alt="Inspiration Point Logo" style="max-height: 60px; margin-bottom: 10px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: normal;">INSPIRATION POINT</h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Dinner Theater Experience</p>
            </div>

            <!-- Content -->
            <div style="padding: 30px;">
                
                <!-- Status -->
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="display: inline-block; background: #fff5f5; color: #c53030; padding: 8px 16px; border-radius: 4px; font-size: 13px; font-weight: 600; text-transform: uppercase; border: 1px solid #feb2b2;">
                        Aanvraag in Behandeling
                    </div>
                </div>

                <!-- Greeting -->
                <h2 style="color: #2d3748; font-size: 20px; margin-bottom: 16px; font-weight: normal;">
                    Beste ${mockReservation.salutation} ${mockReservation.contactPerson},
                </h2>
                
                <p style="color: #4a5568; font-size: 15px; line-height: 1.5; margin-bottom: 25px;">
                    Hartelijk dank voor uw <strong>reserveringsaanvraag</strong> bij Inspiration Point. Uw aanvraag is ontvangen en wordt momenteel door ons team beoordeeld. 
                    <strong style="color: #c53030;">Dit is nog geen definitieve reservering.</strong>
                </p>

                <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #0369a1; font-size: 14px; font-weight: 600; text-align: center;">
                        📧 U ontvangt binnen twee werkdagen bericht over de beschikbaarheid
                    </p>
                </div>

                <!-- Compact Details -->
                <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Aanvraag Overzicht</h3>                    
                    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px; flex: 1; min-width: 150px;">
                            <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Datum & Tijd</div>
                            <div style="color: #2d3748; font-weight: 600; font-size: 14px;">zondag 15 december 2025</div>
                            <div style="color: #4a5568; font-size: 13px;">19:30</div>
                        </div>
                        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px; flex: 1; min-width: 100px;">
                            <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Gasten</div>
                            <div style="color: #2d3748; font-weight: 600; font-size: 14px;">4 personen</div>
                        </div>
                        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px; flex: 2; min-width: 200px;">
                            <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Arrangement</div>
                            <div style="color: #2c5282; font-weight: 600; font-size: 14px;">Deluxe (€65.00 per persoon)</div>
                        </div>
                    </div>
                    <div style="margin-top: 12px; padding: 10px; background: white; border: 1px solid #e2e8f0; border-radius: 4px;">
                        <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Referentienummer</div>
                        <div style="color: #2d3748; font-weight: 600; font-size: 14px;">${mockReservation.id}</div>
                    </div>
                </div>

                <!-- Process Steps -->
                <div style="background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="margin: 0 0 12px 0; color: #276749; font-size: 16px; font-weight: 600;">Hoe werkt het proces?</h3>
                    <ol style="margin: 0; padding-left: 18px; color: #276749; font-size: 14px; line-height: 1.5;">
                        <li style="margin-bottom: 8px;"><strong>Nu:</strong> Wij controleren beschikbaarheid voor uw gewenste datum</li>
                        <li style="margin-bottom: 8px;"><strong>Binnen 2 werkdagen:</strong> U ontvangt een bevestigings- of afwijzingsmail</li>
                        <li style="margin-bottom: 8px;"><strong>Bij beschikbaarheid:</strong> Uw reservering is definitief bevestigd</li>
                        <li style="margin-bottom: 8px;"><strong>1 week voor de show:</strong> U ontvangt factuur en betalingsverzoek</li>
                        <li><strong>Dag van de show:</strong> Deuren open 18:30, show start 19:30</li>
                    </ol>
                </div>

                <!-- Contact -->
                <div style="text-align: center; margin: 25px 0; padding: 20px; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <h3 style="color: #2d3748; margin: 0 0 10px 0; font-size: 15px; font-weight: 600;">Vragen over uw reservering?</h3>
                    <p style="margin: 0; color: #4a5568; font-size: 14px;">Neem gerust contact met ons op:</p>
                    <p style="margin: 8px 0 0 0; color: #2c5282; font-weight: 600; font-size: 14px;">info@inspiration-point.nl</p>
                </div>

            </div>

            <!-- Footer -->
            <div style="background: #2d3748; padding: 20px; text-align: center; color: #a0aec0;">
                <p style="margin: 0; font-size: 15px; font-weight: 600; color: #e2e8f0;">Met vriendelijke groet,</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #a0aec0;">Team Inspiration Point</p>
            </div>

        </div>
    </body>
    </html>
        `,
        text: `TEST EMAIL - IMPROVED DESIGN

Beste ${mockReservation.salutation} ${mockReservation.contactPerson},

INSPIRATION POINT - AANVRAAG ONTVANGEN

✅ NIEUWE FEATURES:
- Logo toegevoegd in header
- Binnen 2 werkdagen antwoord (was 24 uur)
- Compacte card-based details layout
- Modern responsive design

Referentienummer: ${mockReservation.id}
Datum: zondag 15 december 2025
Gasten: 4 personen
Arrangement: Deluxe (€65.00 per persoon)

Met vriendelijke groet,
Team Inspiration Point`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [EMAIL] Firebase Cloud Function failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ [EMAIL] SENT successfully! Features tested:');
    console.log('✅ Inspiration Point logo integrated in header');
    console.log('✅ "Binnen twee werkdagen antwoord" blue info box');
    console.log('✅ Compact card-based details layout');
    console.log('✅ Modern responsive design with flex cards');
    console.log('✅ Updated timeline (2 werkdagen instead of 24 uur)');
    console.log('\nCheck your inbox at info@inspiration-point.nl!');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testImprovedEmailDirect();