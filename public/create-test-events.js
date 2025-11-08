// Script om test events aan te maken voor booking test
const createTestEvents = async () => {
  console.log('🎭 Creating test events for booking...');
  
  try {
    // Import Firebase modules
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
    const { getFirestore, collection, addDoc, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    
    // Firebase config
    const firebaseConfig = {
      apiKey: "AIzaSyCaH8VZJZhuJtMKSjC44VX6QWmPfAdlJ80",
      authDomain: "dinner-theater-booking.firebaseapp.com",
      projectId: "dinner-theater-booking",
      storageBucket: "dinner-theater-booking.firebasestorage.app",
      messagingSenderId: "802367293541",
      appId: "1:802367293541:web:5d2928c0cb6fa2c8bbde8c",
      measurementId: "G-83WTWDTX7V"
    };
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Check if events exist
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    console.log('📅 Current events in database:', eventsSnapshot.size);
    
    if (eventsSnapshot.size === 0) {
      console.log('➕ No events found, creating test events...');
      
      // Create test events for the next few days
      const testEvents = [
        {
          id: 'test-event-1',
          date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
          startsAt: '19:30',
          endsAt: '22:30',
          doorsOpen: '19:00',
          type: 'REGULAR',
          showId: 'show-1',
          capacity: 50,
          isActive: true,
          bookingOpensAt: new Date(),
          bookingClosesAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          allowedArrangements: ['BWF', 'BWFM'],
          title: 'Test Event 1'
        },
        {
          id: 'test-event-2', 
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
          startsAt: '19:30',
          endsAt: '22:30',
          doorsOpen: '19:00',
          type: 'REGULAR',
          showId: 'show-1',
          capacity: 50,
          isActive: true,
          bookingOpensAt: new Date(),
          bookingClosesAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          allowedArrangements: ['BWF', 'BWFM'],
          title: 'Test Event 2'
        }
      ];
      
      for (const event of testEvents) {
        await addDoc(collection(db, 'events'), event);
        console.log('✅ Created event:', event.id);
      }
      
      console.log('🎉 Test events created successfully!');
    } else {
      console.log('✅ Events already exist in database');
      eventsSnapshot.forEach(doc => {
        const event = doc.data();
        console.log('📅 Event:', event.id || doc.id, 'Date:', new Date(event.date.seconds * 1000).toLocaleDateString());
      });
    }
    
  } catch (error) {
    console.error('🔥 Error creating test events:', error);
  }
};

// Create events button function
window.createTestEvents = createTestEvents;

console.log('🎭 Test events creator loaded!');
console.log('💡 Run: createTestEvents() to ensure events exist for testing');