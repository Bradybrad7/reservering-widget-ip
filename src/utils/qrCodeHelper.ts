import QRCode from 'qrcode';
import type { Reservation } from '../types';

/**
 * QR Code Helper
 * 
 * Utilities voor het genereren van QR codes voor reserveringen.
 * Gebruikt voor emails en printbare documenten.
 */

export interface QRCodeData {
  type: 'reservation';
  id: string;
  eventId: string;
  companyName: string;
  timestamp: string;
}

/**
 * Genereer QR code data string voor reservering
 */
export function generateQRData(reservation: Reservation): string {
  const data: QRCodeData = {
    type: 'reservation',
    id: reservation.id,
    eventId: reservation.eventId,
    companyName: reservation.companyName || 'Onbekend',
    timestamp: new Date().toISOString()
  };
  
  return JSON.stringify(data);
}

/**
 * Parse QR code data terug naar object
 */
export function parseQRData(qrString: string): QRCodeData | null {
  try {
    const data = JSON.parse(qrString);
    if (data.type === 'reservation' && data.id) {
      return data as QRCodeData;
    }
    return null;
  } catch (error) {
    console.error('Failed to parse QR data:', error);
    return null;
  }
}

/**
 * Genereer QR code als Data URL (voor emails)
 * Returns base64 image string
 */
export async function generateQRCodeDataURL(
  reservation: Reservation,
  options: {
    width?: number;
    margin?: number;
    color?: { dark?: string; light?: string };
  } = {}
): Promise<string> {
  const qrData = generateQRData(reservation);
  
  const opts = {
    width: options.width || 300,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF'
    },
    errorCorrectionLevel: 'H' as const
  };
  
  try {
    const dataUrl = await QRCode.toDataURL(qrData, opts);
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw error;
  }
}

/**
 * Genereer QR code als SVG string (voor inline display)
 */
export async function generateQRCodeSVG(
  reservation: Reservation,
  options: {
    width?: number;
    margin?: number;
  } = {}
): Promise<string> {
  const qrData = generateQRData(reservation);
  
  const opts = {
    width: options.width || 300,
    margin: options.margin || 2,
    errorCorrectionLevel: 'H' as const
  };
  
  try {
    const svg = await QRCode.toString(qrData, { ...opts, type: 'svg' });
    return svg;
  } catch (error) {
    console.error('Failed to generate QR SVG:', error);
    throw error;
  }
}

/**
 * Valideer of een string een geldige reservering QR code is
 */
export function isValidReservationQR(qrString: string): boolean {
  const data = parseQRData(qrString);
  return data !== null && data.type === 'reservation' && !!data.id;
}
