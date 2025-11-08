// Debug script om console logs te monitoren tijdens echte boekingen
console.log('🔍 Email Debug Monitor Actief!');

// Override console.log om alle logs te vangen
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

const emailLogs = [];

console.log = function(...args) {
  const message = args.join(' ');
  if (message.includes('EMAIL') || message.includes('📧') || message.includes('✅') || message.includes('❌')) {
    emailLogs.push({ type: 'log', time: new Date().toLocaleTimeString(), message });
    console.table(emailLogs);
  }
  originalLog.apply(console, args);
};

console.error = function(...args) {
  const message = args.join(' ');
  if (message.includes('EMAIL') || message.includes('email') || message.includes('📧')) {
    emailLogs.push({ type: 'ERROR', time: new Date().toLocaleTimeString(), message });
    console.table(emailLogs);
  }
  originalError.apply(console, args);
};

console.warn = function(...args) {
  const message = args.join(' ');
  if (message.includes('EMAIL') || message.includes('email') || message.includes('📧')) {
    emailLogs.push({ type: 'WARN', time: new Date().toLocaleTimeString(), message });
    console.table(emailLogs);
  }
  originalWarn.apply(console, args);
};

// Monitor fetch calls naar Firebase Functions
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('sendSmtpEmail')) {
    console.log('🚀 [INTERCEPTED] Firebase email function call:', url);
    console.log('📧 [INTERCEPTED] Request body:', args[1]?.body);
  }
  return originalFetch.apply(window, args);
};

// Monitor reservation submissions
let reservationCount = 0;

// Check if submitReservation is available
setInterval(() => {
  if (window.useReservationStore) {
    console.log('🎯 ReservationStore detected - hooking into submitReservation');
    
    // We kunnen niet direct de store function overschrijven, maar wel monitoren
    const checkForReservations = () => {
      // Check localStorage voor nieuwe reserveringen
      const keys = Object.keys(localStorage);
      const reservationKeys = keys.filter(k => k.includes('reservation') || k.includes('booking'));
      
      if (reservationKeys.length > reservationCount) {
        reservationCount = reservationKeys.length;
        console.log('📋 [DETECTED] Nieuwe reservering activiteit!');
        console.log('🔍 [DEBUG] Monitoring email flow...');
      }
    };
    
    setInterval(checkForReservations, 1000);
  }
}, 2000);

console.log('✅ Email monitoring actief! Maak nu een boeking in de app.');
console.log('📊 Alle email-gerelateerde logs worden hier getoond.');