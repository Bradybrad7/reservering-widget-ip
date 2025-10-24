// React import not needed with new JSX transform
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ReservationWidget from './components/ReservationWidget';
import { VoucherPurchasePageNew, VoucherSuccessPage } from './components/voucher';
import type { Reservation } from './types';

function App() {
  const handleReservationComplete = (reservation: Reservation) => {
    console.log('Reservation completed:', reservation);
    // Here you could send the reservation to your backend
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black">
        {/* Theatrical curtain effect at top */}
        <div className="h-2 bg-gradient-to-r from-secondary-700 via-secondary-600 to-secondary-700"></div>
        
        <Routes>
          {/* Main reservation page */}
          <Route 
            path="/reserveren" 
            element={
              <ReservationWidget 
                onReservationComplete={handleReservationComplete}
                className="py-8"
              />
            } 
          />
          
          {/* Voucher pages */}
          <Route path="/voucher" element={<VoucherPurchasePageNew />} />
          <Route path="/voucher/success/:voucherId" element={<VoucherSuccessPage />} />
          
          {/* Default redirect to reservation page */}
          <Route path="/" element={<Navigate to="/reserveren" replace />} />
          
          {/* 404 - redirect to home */}
          <Route path="*" element={<Navigate to="/reserveren" replace />} />
        </Routes>
        
        {/* Gold accent line at bottom */}
        <div className="h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
      </div>
    </BrowserRouter>
  );
}

export default App;
