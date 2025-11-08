import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Search, X, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { useReservationsStore } from '../../store/reservationsStore';
import { useEventsStore } from '../../store/eventsStore';
import type { Reservation } from '../../types';
import { formatDate, formatCurrency } from '../../utils';

interface QRScannerProps {
  onReservationFound?: (reservation: Reservation) => void;
  onClose?: () => void;
  autoCheckIn?: boolean;
}

/**
 * QR Scanner Component
 * 
 * Scant QR codes van reserveringen voor snelle check-in.
 * Ondersteunt zowel camera scanning als handmatige invoer van reserveringsnummer.
 */
export const QRScanner: React.FC<QRScannerProps> = ({
  onReservationFound,
  onClose,
  autoCheckIn = false
}) => {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    reservation: Reservation | null;
    status: 'success' | 'error' | 'processing';
    message: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { reservations, updateReservation } = useReservationsStore();
  const { events } = useEventsStore();

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start camera for QR scanning
  const startCamera = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Note: In production, you'd integrate a QR scanning library like jsQR
      // For now, we'll use manual input as primary method
      console.log('📷 Camera started for QR scanning');
    } catch (error) {
      console.error('❌ Camera access denied:', error);
      setScanResult({
        reservation: null,
        status: 'error',
        message: 'Camera toegang geweigerd. Gebruik handmatige invoer.'
      });
      setScanMode('manual');
      setIsScanning(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Search reservation by ID
  const searchReservation = async (reservationId: string): Promise<void> => {
    setScanResult({
      reservation: null,
      status: 'processing',
      message: 'Zoeken...'
    });

    // Find reservation
    const reservation = reservations.find(r => 
      r.id === reservationId || r.id.includes(reservationId)
    );

    if (!reservation) {
      setScanResult({
        reservation: null,
        status: 'error',
        message: `Reservering "${reservationId}" niet gevonden`
      });
      return;
    }

    // Check if already checked in
    if (reservation.status === 'checked-in') {
      setScanResult({
        reservation,
        status: 'error',
        message: 'Deze reservering is al ingecheckt!'
      });
      return;
    }

    // Check if cancelled
    if (reservation.status === 'cancelled' || reservation.status === 'rejected') {
      setScanResult({
        reservation,
        status: 'error',
        message: 'Deze reservering is geannuleerd'
      });
      return;
    }

    // Success - found valid reservation
    setScanResult({
      reservation,
      status: 'success',
      message: 'Reservering gevonden!'
    });

    // Auto check-in if enabled
    if (autoCheckIn) {
      await handleCheckIn(reservation);
    }

    // Notify parent component
    onReservationFound?.(reservation);
  };

  // Handle manual input
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      searchReservation(manualInput.trim());
    }
  };

  // Check in reservation
  const handleCheckIn = async (reservation: Reservation) => {
    const success = await updateReservation(reservation.id, {
      status: 'checked-in',
      checkedInAt: new Date(),
      checkedInBy: 'QR Scan'
    });

    if (success) {
      setScanResult({
        reservation,
        status: 'success',
        message: '✅ Check-in succesvol!'
      });
      
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } else {
      setScanResult({
        reservation,
        status: 'error',
        message: '❌ Check-in mislukt. Probeer opnieuw.'
      });
    }
  };

  // Get event details for reservation
  const getEventForReservation = (eventId: string) => {
    return events.find(e => e.id === eventId);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-xl border border-neutral-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <QrCode className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">QR Code Scanner</h2>
              <p className="text-sm text-neutral-400">Scan QR code of voer reserveringsnummer in</p>
            </div>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          )}
        </div>

        {/* Mode Selector */}
        <div className="p-6 border-b border-neutral-700">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setScanMode('manual');
                stopCamera();
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                scanMode === 'manual'
                  ? 'bg-amber-500 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              <Search className="w-5 h-5 inline mr-2" />
              Handmatig Invoeren
            </button>
            
            <button
              onClick={() => {
                setScanMode('camera');
                startCamera();
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                scanMode === 'camera'
                  ? 'bg-amber-500 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              <Camera className="w-5 h-5 inline mr-2" />
              Camera Scannen
            </button>
          </div>
        </div>

        {/* Scanner Content */}
        <div className="p-6">
          {scanMode === 'manual' ? (
            // Manual Input Mode
            <div className="space-y-4">
              <form onSubmit={handleManualSearch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Reserveringsnummer
                  </label>
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="res-123456 of volledige QR code"
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                    autoFocus
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Zoek Reservering
                </button>
              </form>
            </div>
          ) : (
            // Camera Mode
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-amber-500 rounded-lg" style={{ width: '60%', aspectRatio: '1' }}>
                    <div className="w-full h-full border-4 border-white/20 rounded-lg animate-pulse" />
                  </div>
                </div>

                {isScanning && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-amber-500/90 text-white px-4 py-2 rounded-full text-sm font-medium">
                    📷 Positioneer QR code in het kader
                  </div>
                )}
              </div>

              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                <p className="text-sm text-neutral-400 text-center">
                  💡 <strong>Tip:</strong> Camera scanning vereist een QR library zoals jsQR in productie.
                  Gebruik voorlopig handmatige invoer voor betrouwbare check-ins.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className="p-6 border-t border-neutral-700">
            <div className={`rounded-lg p-4 ${
              scanResult.status === 'success' ? 'bg-green-500/10 border border-green-500/30' :
              scanResult.status === 'error' ? 'bg-red-500/10 border border-red-500/30' :
              'bg-blue-500/10 border border-blue-500/30'
            }`}>
              <div className="flex items-start gap-3">
                {scanResult.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : scanResult.status === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
                )}
                
                <div className="flex-1">
                  <p className={`font-medium ${
                    scanResult.status === 'success' ? 'text-green-400' :
                    scanResult.status === 'error' ? 'text-red-400' :
                    'text-blue-400'
                  }`}>
                    {scanResult.message}
                  </p>
                  
                  {scanResult.reservation && (
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Bedrijf:</span>
                        <span className="text-white font-medium">{scanResult.reservation.companyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Contactpersoon:</span>
                        <span className="text-white">{scanResult.reservation.contactPerson}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Aantal personen:</span>
                        <span className="text-white font-medium">{scanResult.reservation.numberOfPersons}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Totaalbedrag:</span>
                        <span className="text-white font-medium">{formatCurrency(scanResult.reservation.totalPrice)}</span>
                      </div>
                      
                      {(() => {
                        const event = getEventForReservation(scanResult.reservation.eventId);
                        return event ? (
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Event:</span>
                            <span className="text-white">
                              {event.type} - {formatDate(event.date)} {event.startsAt}
                            </span>
                          </div>
                        ) : null;
                      })()}
                      
                      {scanResult.status === 'success' && !autoCheckIn && scanResult.reservation.status !== 'checked-in' && (
                        <button
                          onClick={() => handleCheckIn(scanResult.reservation!)}
                          className="w-full mt-3 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
