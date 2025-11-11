import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import type { Reservation, AdminEvent, MerchandiseItem, MerchandiseSelection } from '../types';
import { formatCurrency, formatDate, formatTime } from '../utils';

/**
 * 🎯 Operational PDF Service
 * 
 * Genereert OPERATIONELE rapporten voor dagelijks gebruik:
 * - Dagelijks Draaiboek (combineert gasten, dieetwensen, merchandise, QR codes)
 * - Verbeterde visuele presentatie met gouden branding
 * - Check-in QR codes per reservering
 * - Kleurgecodeerde waarschuwingen voor dieetwensen en merchandise
 * 
 * Dit is het nieuwe systeem dat de oude losse rapporten vervangt!
 */

interface DailyRundownOptions {
  reservations: Reservation[];
  events: AdminEvent[];
  merchandiseItems: MerchandiseItem[];
  dateRange: { start: Date; end: Date };
}

export class OperationalPDFService {
  // Removed color constants - using black/white print-friendly design

  /**
   * 📋 Dagelijks Draaiboek - Het Nieuwe Systeem
   * 
   * Combineert alles wat het personeel nodig heeft in één overzichtelijk document:
   * - Gastenlijst met complete info
   * - Dieetwensen en allergieën
   * - Merchandise bestellingen
   * - Opmerkingen en speciale verzoeken
   * - QR codes voor check-in
   * - Zwart/wit print-vriendelijk design
   */
  static async generateDailyRundown(options: DailyRundownOptions): Promise<void> {
    const { reservations, events, merchandiseItems, dateRange } = options;
    const doc = new jsPDF();
    let yPos = 20;

    // Header - zwart/wit
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(14, 15, 196, 15);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('DAGELIJKS DRAAIBOEK', 14, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Inspiration Point - Complete Operationele Overzicht', 14, 32);
    doc.text(`${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`, 14, 38);

    // Snelle statistieken in gray box
    const totalGuests = reservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    const withDietary = reservations.filter(r => this.hasDietaryRequirements(r)).length;
    const withMerchandise = reservations.filter(r => r.merchandise && r.merchandise.length > 0).length;
    const vipReservations = reservations.filter(r => this.hasVIPTag(r)).length;

    yPos = 45;
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(14, yPos, 182, 12, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const genTime = new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Gegenereerd: ${formatDate(new Date())} om ${genTime}`, 18, yPos + 5);
    const statsText = `${reservations.length} reserveringen | ${totalGuests} gasten | ${withDietary} dieetwensen | ${withMerchandise} merchandise | ${vipReservations} VIP`;
    doc.text(statsText, 18, yPos + 10);

    yPos += 18;

    // 📋 Reserveringen per dag gegroepeerd
    const reservationsByDate = this.groupByDate(reservations);
    
    for (const [dateStr, dayReservations] of reservationsByDate.entries()) {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Datum header - zwart/wit
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(14, yPos, 196, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const event = events.find(e => e.id === dayReservations[0].eventId);
      const dateHeader = `${formatDate(new Date(dateStr))}${event ? ` - ${formatTime(event.startsAt)}` : ''}`;
      doc.text(dateHeader, 14, yPos + 6);
      yPos += 12;

      // Reserveringen voor deze dag
      for (const reservation of dayReservations.sort((a, b) => a.contactPerson.localeCompare(b.contactPerson))) {
        const blockHeight = await this.addReservationBlock(doc, reservation, merchandiseItems, yPos);
        yPos += blockHeight + 3;

        // Check for page break
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
      }

      yPos += 5;
    }

    // Footer op elke pagina
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      const footerText = `Inspiration Point B.V. - www.inspirationpoint.nl - Pagina ${i}/${pageCount}`;
      doc.text(footerText, 105, 285, { align: 'center' });
    }

    // Opslaan
    const filename = `Dagelijks_Draaiboek_${dateRange.start.toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  }

  /**
   * 📦 Voeg een reserveringsblok toe (de kern van het draaiboek)
   * 
   * Elk blok bevat:
   * - Naam, bedrijf, contactinfo
   * - Aantal personen en arrangement
   * - QR code voor check-in
   * - Dieetwensen (met label)
   * - Merchandise (met label)
   * - Opmerkingen (met label)
   * - Tags (VIP, PERS, etc. met zwarte border)
   */
  private static async addReservationBlock(
    doc: jsPDF,
    reservation: Reservation,
    merchandiseItems: MerchandiseItem[],
    startY: number
  ): Promise<number> {
    const startYPos = startY;
    let yPos = startY;
    const leftMargin = 17;
    const blockWidth = 180;
    const qrSize = 25;

    // Teken eerst de border box VOOR de content (WIT met zwarte rand)
    // We berekenen de hoogte later en tekenen hem aan het einde

    yPos += 4;

    // 🎯 TAFELNUMMER - Prominent links bovenaan
    if (reservation.tableNumber) {
      doc.setFillColor(59, 130, 246); // Blauw
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.rect(leftMargin, yPos - 4, 15, 7, 'FD');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // Wit
      doc.text(`T${reservation.tableNumber}`, leftMargin + 2, yPos + 1);
    }

    // Naam en bedrijf (vet gedrukt) - verschuif iets naar rechts als er een tafelnummer is
    const nameX = reservation.tableNumber ? leftMargin + 18 : leftMargin;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(String(reservation.contactPerson || 'Onbekend'), nameX, yPos);
    
    // Tags rechts van naam - zwart/wit boxes
    if (reservation.tags && Array.isArray(reservation.tags) && reservation.tags.length > 0) {
      let tagX = 120;
      reservation.tags.forEach(tag => {
        const tagStr = String(tag);
        const tagWidth = doc.getTextWidth(tagStr) + 4;
        doc.setFillColor(255, 255, 255); // Wit
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(tagX, yPos - 4, tagWidth, 6, 'FD');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(tagStr, tagX + 2, yPos);
        tagX += tagWidth + 2;
      });
    }

    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0); // ZWART
    doc.text(String(reservation.companyName || 'Particulier'), leftMargin, yPos);
    yPos += 5;

    // Contact informatie
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0); // ZWART
    const emailStr = String(reservation.email || 'Geen email');
    const phoneStr = String(reservation.phone || 'Geen telefoon');
    doc.text(`${emailStr} | ${phoneStr}`, leftMargin, yPos);
    yPos += 5;

    // Reservering details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // ZWART
    const personsText = `${reservation.numberOfPersons} personen - ${reservation.arrangement}`;
    doc.text(personsText, leftMargin, yPos);
    
    if (reservation.partyPerson) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // ZWART
      const partyText = `Feestvierder: ${String(reservation.partyPerson)}`;
      doc.text(partyText, leftMargin + 55, yPos);
    }

    // QR Code (rechterkant)
    try {
      const qrDataUrl = await this.generateQRCode(reservation);
      doc.addImage(qrDataUrl, 'PNG', blockWidth - qrSize + 8, startYPos + 3, qrSize, qrSize);
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.text('Scan check-in', blockWidth - qrSize + 8, startYPos + qrSize + 5);
    } catch (error) {
      console.warn('QR code generation failed:', error);
    }

    yPos += 6;

    // Dieetwensen (met label en gray box)
    if (this.hasDietaryRequirements(reservation)) {
      const dietaryText = this.formatDietaryRequirements(reservation);
      if (dietaryText) {
        doc.setFillColor(245, 245, 245);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        const textHeight = 7;
        doc.rect(leftMargin - 2, yPos - 3, 140, textHeight, 'FD');
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('DIEETWENSEN:', leftMargin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(String(dietaryText), leftMargin + 30, yPos);
        yPos += 7;
      }
    }

    // Merchandise (met label en gray box)
    if (reservation.merchandise && reservation.merchandise.length > 0) {
      const merchText = this.formatMerchandise(reservation.merchandise, merchandiseItems);
      if (merchText) {
        doc.setFillColor(245, 245, 245);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        const textHeight = 7;
        doc.rect(leftMargin - 2, yPos - 3, 140, textHeight, 'FD');
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('MERCHANDISE:', leftMargin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(String(merchText), leftMargin + 30, yPos);
        yPos += 7;
      }
    }

    // Opmerkingen (met label en gray box)
    if (reservation.comments && String(reservation.comments).trim()) {
      const maxWidth = 140;
      const commentsStr = String(reservation.comments);
      const lines = doc.splitTextToSize(commentsStr, maxWidth - 30);
      const textHeight = Math.max(7, lines.length * 4 + 3);
      
      doc.setFillColor(245, 245, 245);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(leftMargin - 2, yPos - 3, maxWidth, textHeight, 'FD');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('OPMERKINGEN:', leftMargin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(lines, leftMargin + 30, yPos);
      yPos += textHeight - 1;
    }

    // 🔒 Interne Notities (Admin Only - met label en GELE highlight box voor visibility)
    if (reservation.notes && String(reservation.notes).trim()) {
      const maxWidth = 140;
      const notesStr = String(reservation.notes);
      const lines = doc.splitTextToSize(notesStr, maxWidth - 35);
      const textHeight = Math.max(7, lines.length * 4 + 3);
      
      // GELE achtergrond voor opvallendheid (dit zijn belangrijke operationele notities!)
      doc.setFillColor(255, 255, 200); // Licht geel
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(leftMargin - 2, yPos - 3, maxWidth, textHeight, 'FD');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('🔒 ADMIN NOTITIES:', leftMargin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(lines, leftMargin + 35, yPos);
      yPos += textHeight - 1;
    }

    yPos += 3;

    // Border box tekenen - alleen zwarte rand, GEEN fill
    const totalHeight = yPos - startYPos;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.rect(14, startYPos, 182, totalHeight, 'S'); // 'S' = Stroke only (geen fill)

    return totalHeight;
  }



  /**
   * 🔧 Helper functies
   */

  private static groupByDate(reservations: Reservation[]): Map<string, Reservation[]> {
    const grouped = new Map<string, Reservation[]>();
    
    reservations.forEach(res => {
      const eventDate = res.eventDate instanceof Date ? res.eventDate : new Date(res.eventDate);
      const dateStr = eventDate.toISOString().split('T')[0];
      
      if (!grouped.has(dateStr)) {
        grouped.set(dateStr, []);
      }
      grouped.get(dateStr)!.push(res);
    });

    // Sort by date
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }

  private static hasDietaryRequirements(reservation: Reservation): boolean {
    const dr = reservation.dietaryRequirements;
    return !!(dr && (dr.vegetarian || dr.vegan || dr.glutenFree || dr.lactoseFree || dr.other));
  }

  private static hasVIPTag(reservation: Reservation): boolean {
    return !!(reservation.tags && (
      reservation.tags.includes('VIP') || 
      reservation.tags.includes('PERS') ||
      reservation.tags.includes('GENODIGDE')
    ));
  }

  private static formatDietaryRequirements(reservation: Reservation): string {
    const dr = reservation.dietaryRequirements;
    if (!dr) return '';

    const items: string[] = [];
    if (dr.vegetarian) items.push(`${dr.vegetarianCount || 0}x Vegetarisch`);
    if (dr.vegan) items.push(`${dr.veganCount || 0}x Veganistisch`);
    if (dr.glutenFree) items.push(`${dr.glutenFreeCount || 0}x Glutenvrij`);
    if (dr.lactoseFree) items.push(`${dr.lactoseFreeCount || 0}x Lactosevrij`);
    if (dr.other) items.push(`${dr.otherCount || 0}x ${dr.other}`);

    return items.join(', ');
  }

  private static formatMerchandise(
    merchandise: MerchandiseSelection[],
    items: MerchandiseItem[]
  ): string {
    return merchandise.map(m => {
      const item = items.find(i => i.id === m.itemId);
      return item ? `${m.quantity}x ${item.name}` : '';
    }).filter(Boolean).join(', ');
  }

  private static async generateQRCode(reservation: Reservation): Promise<string> {
    const qrData = JSON.stringify({
      type: 'reservation',
      id: reservation.id,
      eventId: reservation.eventId,
      companyName: reservation.companyName,
      timestamp: new Date().toISOString()
    });

    try {
      return await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('QR code generation error:', error);
      throw error;
    }
  }
}
