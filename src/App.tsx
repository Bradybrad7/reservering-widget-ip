// React import not needed with new JSX transform
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ReservationWidget from './components/ReservationWidget';
import { VoucherPurchasePage, VoucherSuccessPage } from './components/voucher';
import { VoucherOrderSuccessPage } from './components/voucher/VoucherOrderSuccessPage';
import { HostCheckInSimple } from './components/checkin/HostCheckInSimple';
import BookingAdmin from './components/BookingAdmin';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { Reservation } from './types';

function App() {
  const handleReservationComplete = (reservation: Reservation) => {
    console.log('Reservation completed:', reservation);
    // Here you could send the reservation to your backend
  };

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <div className="min-h-screen bg-black">
            {/* Theatrical curtain effect at top */}
            <div className="h-2 bg-gradient-to-r from-secondary-700 via-secondary-600 to-secondary-700"></div>
            
            <Routes>
              {/* Admin Panel - Full screen, no decorations */}
              <Route path="/admin/*" element={<BookingAdmin />} />
              
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
              <Route path="/voucher" element={<VoucherPurchasePage />} />
              <Route path="/vouchers" element={<VoucherPurchasePage />} />
              <Route path="/voucher/success/:voucherId" element={<VoucherSuccessPage />} />
              <Route path="/voucher-order-success" element={<VoucherOrderSuccessPage />} />
              
              {/* Check-in page */}
              <Route path="/checkin" element={<HostCheckInSimple />} />
              
              {/* Default redirect to reservation page */}
              <Route path="/" element={<Navigate to="/reserveren" replace />} />
              
              {/* 404 - redirect to home */}
              <Route path="*" element={<Navigate to="/reserveren" replace />} />
            </Routes>
          
            {/* Gold accent line at bottom */}
            <div className="h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
          </div>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
