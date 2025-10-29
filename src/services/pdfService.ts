import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Reservation, AdminEvent } from '../types';
import { formatCurrency, formatDate, formatTime } from '../utils';

/**
 * PDF Generation Service
 * 
 * Generates branded PDFs for:
 * - Invoices
 * - Contracts
 * - Reservation confirmations
 * - Event reports
 */

interface InvoiceData {
  reservation: Reservation;
  event?: AdminEvent;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  subtotal: number;
  vat: number;
  total: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export class PDFService {
  private static readonly BRAND_COLOR: [number, number, number] = [212, 175, 55]; // Gold
  private static readonly DARK_COLOR: [number, number, number] = [23, 23, 23]; // Dark neutral
  private static readonly LIGHT_COLOR: [number, number, number] = [245, 245, 245]; // Light background

  /**
   * Generate Invoice PDF
   */
  static generateInvoice(data: InvoiceData): void {
    const doc = new jsPDF();
    let yPos = 20;

    // Header with logo/branding
    doc.setFillColor(...this.BRAND_COLOR);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('🎭 INSPIRATION POINT', 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Comedy Theater Amsterdam', 15, 28);
    doc.text('www.inspirationpoint.nl', 15, 33);

    // Invoice title
    yPos = 50;
    doc.setTextColor(...this.DARK_COLOR);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTUUR', 15, yPos);

    // Invoice details (right aligned)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Factuurnummer: ${data.invoiceNumber}`, 140, 50);
    doc.text(`Factuurdatum: ${formatDate(data.invoiceDate)}`, 140, 56);
    doc.text(`Vervaldatum: ${formatDate(data.dueDate)}`, 140, 62);

    // Customer info
    yPos = 75;
    doc.setFont('helvetica', 'bold');
    doc.text('Factuur aan:', 15, yPos);
    
    doc.setFont('helvetica', 'normal');
    yPos += 6;
    doc.text(data.reservation.companyName || 'Onbekend bedrijf', 15, yPos);
    if (data.reservation.contactPerson) {
      yPos += 5;
      doc.text(`T.a.v. ${data.reservation.contactPerson}`, 15, yPos);
    }
    if (data.reservation.address) {
      yPos += 5;
      doc.text(data.reservation.address, 15, yPos);
    }
    if (data.reservation.city && data.reservation.postalCode) {
      yPos += 5;
      doc.text(`${data.reservation.postalCode} ${data.reservation.city}`, 15, yPos);
    }

    // Items table
    yPos += 15;
    autoTable(doc, {
      startY: yPos,
      head: [['Omschrijving', 'Aantal', 'Prijs per stuk', 'Totaal']],
      body: data.items.map(item => [
        item.description,
        item.quantity.toString(),
        formatCurrency(item.unitPrice),
        formatCurrency(item.total)
      ]),
      foot: [
        ['', '', 'Subtotaal', formatCurrency(data.subtotal)],
        ['', '', `BTW (21%)`, formatCurrency(data.vat)],
        ['', '', 'Totaal', formatCurrency(data.total)]
      ],
      theme: 'striped',
      headStyles: {
        fillColor: this.BRAND_COLOR,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      footStyles: {
        fillColor: this.LIGHT_COLOR,
        textColor: this.DARK_COLOR,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      }
    });

    // Payment instructions
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
    yPos = finalY + 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Betaalinstructies:', 15, yPos);
    
    doc.setFont('helvetica', 'normal');
    yPos += 6;
    doc.text('Gelieve het volledige bedrag over te maken naar:', 15, yPos);
    yPos += 5;
    doc.text('IBAN: NL12 ABNA 0123 4567 89', 15, yPos);
    yPos += 5;
    doc.text('T.n.v.: Inspiration Point B.V.', 15, yPos);
    yPos += 5;
    doc.text(`Onder vermelding van: ${data.invoiceNumber}`, 15, yPos);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Inspiration Point B.V. | KvK: 12345678 | BTW: NL123456789B01', 105, 285, { align: 'center' });

    // Save
    doc.save(`Factuur-${data.invoiceNumber}-${data.reservation.companyName}.pdf`);
  }

  /**
   * Generate Reservation Confirmation PDF
   */
  static generateConfirmation(reservation: Reservation, event?: AdminEvent): void {
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFillColor(...this.BRAND_COLOR);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('🎭 INSPIRATION POINT', 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Comedy Theater Amsterdam', 15, 28);

    // Title
    yPos = 55;
    doc.setTextColor(...this.DARK_COLOR);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RESERVERINGSBEVESTIGING', 15, yPos);

    // Reservation details
    yPos = 75;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const eventDateStr = typeof reservation.eventDate === 'string' 
      ? reservation.eventDate 
      : reservation.eventDate.toISOString();
    
    const details = [
      ['Reserveringsnummer:', reservation.id],
      ['Bedrijf:', reservation.companyName],
      ['Contactpersoon:', reservation.contactPerson || '-'],
      ['Email:', reservation.email],
      ['Telefoon:', reservation.phone || '-'],
      ['', ''],
      ['Datum evenement:', formatDate(new Date(eventDateStr))],
      ['Aanvang:', event ? formatTime(event.startsAt) : '-'],
      ['Aantal personen:', reservation.numberOfPersons.toString()],
      ['Arrangement:', reservation.arrangement],
    ];

    details.forEach(([label, value]) => {
      if (label) {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 15, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value || '-', 80, yPos);
      }
      yPos += 7;
    });

    // Add-ons
    if (reservation.preDrink?.enabled || reservation.afterParty?.enabled) {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Extra opties:', 15, yPos);
      yPos += 7;
      
      doc.setFont('helvetica', 'normal');
      if (reservation.preDrink?.enabled) {
        doc.text(`• Borrel vooraf (${reservation.preDrink.quantity} personen)`, 15, yPos);
        yPos += 6;
      }
      if (reservation.afterParty?.enabled) {
        doc.text(`• Afterparty (${reservation.afterParty.quantity} personen)`, 15, yPos);
        yPos += 6;
      }
    }

    // Special requests
    if (reservation.comments) {
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Opmerkingen:', 15, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      const splitText = doc.splitTextToSize(reservation.comments, 180);
      doc.text(splitText, 15, yPos);
      yPos += splitText.length * 6;
    }

    // Important info box
    yPos += 15;
    doc.setFillColor(...this.LIGHT_COLOR);
    doc.rect(15, yPos, 180, 40, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BELANGRIJKE INFORMATIE', 20, yPos + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.text('• Deuren open 30 minuten voor aanvang', 20, yPos + 15);
    doc.text('• Neem deze bevestiging mee (print of mobiel)', 20, yPos + 21);
    doc.text('• Bij vragen: info@inspirationpoint.nl', 20, yPos + 27);
    doc.text('• Annuleringen tot 48 uur van tevoren kosteloos', 20, yPos + 33);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('We kijken ernaar uit u te verwelkomen!', 105, 280, { align: 'center' });
    doc.text('Inspiration Point B.V. | www.inspirationpoint.nl | info@inspirationpoint.nl', 105, 285, { align: 'center' });

    // Save
    doc.save(`Bevestiging-${reservation.companyName}-${reservation.id}.pdf`);
  }

  /**
   * Generate Event Report PDF
   */
  static generateEventReport(
    events: AdminEvent[],
    dateRange: { start: Date; end: Date },
    totalRevenue: number
  ): void {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(...this.BRAND_COLOR);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('EVENEMENTEN RAPPORT', 15, 20);

    // Date range
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`,
      15,
      40
    );

    // Summary stats
    const yPos = 50;
    doc.setTextColor(...this.DARK_COLOR);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Samenvatting:', 15, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Totaal evenementen: ${events.length}`, 15, yPos + 8);
    doc.text(`Totale omzet: ${formatCurrency(totalRevenue)}`, 15, yPos + 15);

    // Events table
    autoTable(doc, {
      startY: yPos + 25,
      head: [['Datum', 'Type', 'Capaciteit', 'Reserveringen', 'Omzet']],
      body: events.map(event => [
        formatDate(event.date),
        event.type,
        event.capacity.toString(),
        event.reservations?.length.toString() || '0',
        formatCurrency(event.revenue || 0)
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: this.BRAND_COLOR,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 4
      }
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Gegenereerd op ${formatDate(new Date())}`, 105, 285, { align: 'center' });

    // Save
    doc.save(`Evenementen-Rapport-${formatDate(dateRange.start)}-${formatDate(dateRange.end)}.pdf`);
  }
}

export default PDFService;
