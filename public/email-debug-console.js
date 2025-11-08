// Email Debug Test - voeg dit toe aan de console in de browser
(function() {
    console.log('🧪 EMAIL DEBUG TEST GELADEN');
    
    // Test functie die je kunt aanroepen in de console
    window.testEmailSystem = async function() {
        console.log('🔍 Testing email system...');
        
        try {
            // Controleer environment variables
            console.log('📋 Environment check:');
            console.log('   VITE_FORCE_EMAIL_IN_DEV:', import.meta?.env?.VITE_FORCE_EMAIL_IN_DEV);
            console.log('   VITE_EMAIL_FROM:', import.meta?.env?.VITE_EMAIL_FROM);
            console.log('   DEV mode:', import.meta?.env?.DEV);
            
            // Probeer Firebase Functions direct aan te roepen
            console.log('🚀 Testing Firebase Functions...');
            
            const testEmailData = {
                to: ['info@inspiration-point.nl'],
                subject: '🧪 DIRECTE TEST - Email systeem verificatie',
                html: `
                    <div style="padding: 20px; font-family: Arial, sans-serif;">
                        <h2>🧪 Direct Email Test</h2>
                        <p>Deze email is direct verstuurd via de browser console om te testen of het email systeem werkt.</p>
                        <p><strong>Tijd:</strong> ${new Date().toLocaleString('nl-NL')}</p>
                        <p><strong>Test type:</strong> Direct Firebase Function call</p>
                        <div style="background: #f0f8ff; padding: 15px; margin: 15px 0; border-radius: 5px;">
                            <p><strong>Als je deze email ontvangt, werkt het systeem correct!</strong></p>
                        </div>
                    </div>
                `,
                text: `Direct Email Test\n\nTijd: ${new Date().toLocaleString('nl-NL')}\nTest type: Direct Firebase Function call\n\nAls je deze email ontvangt, werkt het systeem correct!`,
                from: 'info@inspiration-point.nl',
                fromName: 'Inspiration Point Test'
            };
            
            const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testEmailData)
            });
            
            const result = await response.json();
            console.log('📧 Direct email result:', result);
            
            if (result.success) {
                console.log('✅ SUCCESS! Direct email test geslaagd');
                console.log('📬 Check info@inspiration-point.nl inbox');
                return true;
            } else {
                console.log('❌ FAILED! Direct email test gefaald:', result.error);
                return false;
            }
            
        } catch (error) {
            console.error('🔥 Error tijdens email test:', error);
            return false;
        }
    };
    
    // Test booking flow
    window.testBookingFlow = async function() {
        console.log('📋 Testing booking flow...');
        
        try {
            // Simuleer een boeking zoals de app zou doen
            const mockFormData = {
                salutation: 'Dhr.',
                firstName: 'Console',
                lastName: 'Test',
                contactPerson: 'Console Test',
                email: 'info@inspiration-point.nl',
                phone: '0612345678',
                phoneCountryCode: '+31',
                companyName: 'Console Test BV',
                numberOfPersons: 2,
                arrangement: 'BWF',
                comments: 'Dit is een console test boeking'
            };
            
            console.log('📝 Mock form data:', mockFormData);
            
            // Controleer of er events beschikbaar zijn
            console.log('🔍 Checking for available events...');
            
            // Probeer events op te halen (als ze in localStorage staan)
            const events = localStorage.getItem('events');
            if (events) {
                const parsedEvents = JSON.parse(events);
                console.log('📅 Found events in localStorage:', parsedEvents.length);
                
                if (parsedEvents.length > 0) {
                    const testEvent = parsedEvents[0];
                    console.log('🎯 Using test event:', testEvent.id);
                    
                    // Simuleer email sending zoals in apiService
                    console.log('📧 Simulating email sending...');
                    
                    const emailData = {
                        // Customer email
                        customer: {
                            to: [mockFormData.email],
                            subject: `⏳ Reservering ontvangen - ${mockFormData.companyName}`,
                            html: `<p>Test klant email naar ${mockFormData.email}</p>`,
                            text: `Test klant email naar ${mockFormData.email}`
                        },
                        // Admin email
                        admin: {
                            to: ['info@inspiration-point.nl'],
                            subject: `🚨 NIEUWE RESERVERING - ${mockFormData.companyName}`,
                            html: `<p>Nieuwe test boeking van ${mockFormData.contactPerson}</p>`,
                            text: `Nieuwe test boeking van ${mockFormData.contactPerson}`
                        }
                    };
                    
                    // Send both emails
                    console.log('📧 Sending customer email...');
                    const customerResult = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(emailData.customer)
                    });
                    const customerResponse = await customerResult.json();
                    
                    console.log('📧 Sending admin email...');
                    const adminResult = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(emailData.admin)
                    });
                    const adminResponse = await adminResult.json();
                    
                    console.log('📊 Results:');
                    console.log('   Customer email:', customerResponse.success ? '✅' : '❌', customerResponse);
                    console.log('   Admin email:', adminResponse.success ? '✅' : '❌', adminResponse);
                    
                    return {
                        customer: customerResponse.success,
                        admin: adminResponse.success
                    };
                } else {
                    console.log('❌ No events found in localStorage');
                    return false;
                }
            } else {
                console.log('❌ No events data in localStorage');
                return false;
            }
            
        } catch (error) {
            console.error('🔥 Error tijdens booking flow test:', error);
            return false;
        }
    };
    
    console.log('✅ Email debug functions loaded!');
    console.log('💡 Run: testEmailSystem() - Test direct email');
    console.log('💡 Run: testBookingFlow() - Test complete booking flow');
    
})();