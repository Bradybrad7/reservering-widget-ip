
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer } from 'lucide-react';
import type { Reservation } from '../../types';
import { formatDate, formatTime } from '../../utils';

interface QRCodeGeneratorProps {
  reservation: Reservation;
  size?: number;
  includeDetails?: boolean;
}

/**
 * QR Code Generator voor Check-in
 * 
 * Genereert unieke QR code per reservering die:
 * - Reservering ID bevat voor snelle check-in
 * - Downloadbaar is als PNG
 * - Printbaar is
 * - In emails kan worden opgenomen
 */
export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  reservation,
  size = 200,
  includeDetails = true
}) => {
  // QR Code data format: JSON string met reservering info
  const qrData = JSON.stringify({
    type: 'reservation',
    id: reservation.id,
    eventId: reservation.eventId,
    companyName: reservation.companyName,
    timestamp: new Date().toISOString()
  });

  const handleDownload = () => {
    const canvas = document.getElementById(`qr-${reservation.id}`) as HTMLCanvasElement;
    if (!canvas) return;

    const svg = canvas.querySelector('svg');
    if (!svg) return;

    // Convert SVG to PNG
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR-${reservation.companyName}-${reservation.id}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
      
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svg = document.querySelector(`#qr-${reservation.id} svg`);
    if (!svg) return;

    const svgString = new XMLSerializer().serializeToString(svg);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${reservation.companyName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 40px;
            }
            .qr-container {
              text-align: center;
              border: 2px solid #000;
              padding: 20px;
              margin: 20px;
            }
            h1 { font-size: 24px; margin-bottom: 10px; }
            .details { font-size: 14px; margin-top: 20px; }
            .details p { margin: 5px 0; }
            @media print {
              body { margin: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>🎭 Inspiration Point</h1>
            ${svgString}
            <div class="details">
              <p><strong>${reservation.companyName}</strong></p>
              <p>${reservation.numberOfPersons} personen</p>
              <p>${formatDate(new Date(reservation.eventDate))} om ${typeof reservation.eventDate === 'string' ? formatTime(reservation.eventDate) : formatTime(reservation.eventDate.toISOString())}</p>
              <p>Reservering: ${reservation.id}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-neutral-200">
      {includeDetails && (
        <div className="mb-3 text-center">
          <h3 className="font-semibold text-neutral-900">Check-in QR Code</h3>
          <p className="text-xs text-neutral-600 mt-1">
            Scan deze code bij aankomst voor snelle check-in
          </p>
        </div>
      )}
      
      <div id={`qr-${reservation.id}`} className="flex justify-center mb-3">
        <QRCodeSVG
          value={qrData}
          size={size}
          level="H"
          includeMargin
          imageSettings={{
            src: "/logo.svg", // Optional: Add your logo
            height: size * 0.15,
            width: size * 0.15,
            excavate: true,
          }}
        />
      </div>

      <div className="flex gap-2 justify-center">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gold-500 text-neutral-900 rounded hover:bg-gold-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-neutral-700 text-white rounded hover:bg-neutral-800 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {includeDetails && (
        <div className="mt-3 pt-3 border-t border-neutral-200 text-xs text-neutral-600 text-center">
          <p>Reservering ID: <span className="font-mono">{reservation.id}</span></p>
        </div>
      )}
    </div>
  );
};

/**
 * Compact QR Code voor in lijsten
 */
export const QRCodeCompact: React.FC<{ reservation: Reservation }> = ({ reservation }) => {
  const [showFull, setShowFull] = React.useState(false);

  const qrData = JSON.stringify({
    type: 'reservation',
    id: reservation.id,
    eventId: reservation.eventId,
    companyName: reservation.companyName,
  });

  if (showFull) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <QRCodeGenerator reservation={reservation} size={300} />
          <button
            onClick={() => setShowFull(false)}
            className="mt-4 w-full px-4 py-2 bg-neutral-200 text-neutral-900 rounded hover:bg-neutral-300 transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowFull(true)}
      className="relative group cursor-pointer"
      title="Bekijk QR Code"
    >
      <QRCodeSVG value={qrData} size={40} level="M" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded" />
    </button>
  );
};
