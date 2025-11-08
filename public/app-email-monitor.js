// Real app booking test - voeg dit toe aan de console
(function() {
    console.log('🔍 REAL APP EMAIL MONITOR GELADEN');
    
    // Override console functions om email logs te vangen
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = function(...args) {
        const message = args.join(' ');
        if (message.includes('📧') || message.includes('[API]') || message.includes('[EMAIL]')) {
            originalLog.apply(console, ['🎯 CAUGHT:', ...args]);
        }
        originalLog.apply(console, args);
    };
    
    console.error = function(...args) {
        const message = args.join(' ');
        if (message.includes('📧') || message.includes('[API]') || message.includes('[EMAIL]')) {
            originalError.apply(console, ['🎯 ERROR CAUGHT:', ...args]);
        }
        originalError.apply(console, args);
    };
    
    // Test functie om reservering store te controleren
    window.checkReservationSystem = function() {
        console.log('🔍 Checking reservation system...');
        
        // Check localStorage
        const events = localStorage.getItem('events');
        const reservations = localStorage.getItem('reservations');
        
        console.log('📅 Events in localStorage:', events ? JSON.parse(events).length : 0);
        console.log('📋 Reservations in localStorage:', reservations ? JSON.parse(reservations).length : 0);
        
        // Check environment
        console.log('🔧 Environment variables:');
        console.log('   DEV:', import.meta?.env?.DEV);
        console.log('   FORCE_EMAIL:', import.meta?.env?.VITE_FORCE_EMAIL_IN_DEV);
        console.log('   EMAIL_FROM:', import.meta?.env?.VITE_EMAIL_FROM);
        
        // Check if stores are available
        if (window.useReservationStore) {
            console.log('✅ useReservationStore available');
        } else {
            console.log('❌ useReservationStore NOT available');
        }
        
        if (window.useEventStore) {
            console.log('✅ useEventStore available'); 
        } else {
            console.log('❌ useEventStore NOT available');
        }
    };
    
    // Functie om email service direct te testen vanuit app context
    window.testEmailFromApp = async function() {
        console.log('🧪 Testing email from app context...');
        
        try {
            // Import email service
            const emailModule = await import('/src/services/emailService.js');
            console.log('📧 Email module loaded:', emailModule);
            
            // Mock data
            const mockReservation = {
                id: 'app-test-' + Date.now(),
                eventId: 'test-event',
                eventDate: new Date('2025-12-15'),
                firstName: 'App',
                lastName: 'Test',
                contactPerson: 'App Test',
                email: 'info@inspiration-point.nl',
                companyName: 'App Test Company',
                numberOfPersons: 2,
                status: 'pending',
                totalPrice: 89.50,
                phone: '+31612345678',
                arrangement: 'BWF',
                createdAt: new Date()
            };
            
            const mockEvent = {
                id: 'test-event',
                date: new Date('2025-12-15'),
                startsAt: '19:30',
                endsAt: '22:30',
                doorsOpen: '19:00',
                type: 'REGULAR'
            };
            
            console.log('📧 Calling emailService.sendPendingReservationNotification from app...');
            const result = await emailModule.emailService.sendPendingReservationNotification(mockReservation, mockEvent);
            console.log('📧 App email result:', result);
            
            return result;
            
        } catch (error) {
            console.error('🔥 Error testing email from app:', error);
            return false;
        }
    };
    
    console.log('✅ Real app monitor functions loaded:');
    console.log('💡 Run: checkReservationSystem()');
    console.log('💡 Run: testEmailFromApp()');
    console.log('📊 All email logs will be highlighted with 🎯');
    
})();