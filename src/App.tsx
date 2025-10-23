// React import not needed with new JSX transform
import ReservationWidget from './components/ReservationWidget';
import type { Reservation } from './types';

function App() {
  const handleReservationComplete = (reservation: Reservation) => {
    console.log('Reservation completed:', reservation);
    // Here you could send the reservation to your backend
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Theatrical curtain effect at top */}
      <div className="h-2 bg-gradient-to-r from-secondary-700 via-secondary-600 to-secondary-700"></div>
      
      <ReservationWidget 
        onReservationComplete={handleReservationComplete}
        className="py-8"
      />
      
      {/* Gold accent line at bottom */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
    </div>
  );
}

export default App;
