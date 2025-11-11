import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Users,
  ShoppingBag,
  AlertCircle,
  Loader,
  ChevronDown,
  ClipboardList
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Reservation, Event, MerchandiseItem, MerchandiseSelection } from '../../types';
import { formatDate, formatCurrency } from '../../utils';
import { OperationalPDFService } from '../../services/operationalPdfService';

interface PDFExportManagerProps {
  reservations: Reservation[];
  events: Event[];
  merchandiseItems?: MerchandiseItem[];
}

type ExportType = 'daily-rundown' | 'guest-list' | 'merchandise-list' | 'allergy-list' | 'week-overview';

export const PDFExportManager: React.FC<PDFExportManagerProps> = ({
  reservations,
  events,
  merchandiseItems = []
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedExport, setSelectedExport] = useState<ExportType | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Filter reservations by date range
  const getFilteredReservations = () => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    return reservations.filter(res => {
      const resDate = new Date(res.eventDate);
      return resDate >= start && resDate <= end && 
             res.status !== 'cancelled' && 
             res.status !== 'rejected' &&
             !res.isArchived;
    });
  };

  // 🎨 Gouden branding constanten
  const BRAND_COLOR: [number, number, number] = [212, 175, 55]; // Gold

  // 🆕 Generate Daily Rundown (NEW!)
  const generateDailyRundownPDF = async () => {
    const filtered = getFilteredReservations();
    
    await OperationalPDFService.generateDailyRundown({
      reservations: filtered,
      events: events as any,
      merchandiseItems,
      dateRange: {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      }
    });
  };

  // Generate Guest List PDF (NIEUW DESIGN - Print Vriendelijk)
  const generateGuestListPDF = () => {
    const doc = new jsPDF();
    const filtered = getFilteredReservations();

    // Simple header - zwart op wit
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(14, 20, 196, 20);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('GASTENLIJST', 14, 16);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${formatDate(new Date(dateRange.start))} - ${formatDate(new Date(dateRange.end))}`, 14, 27);
    doc.text(`Gegenereerd: ${formatDate(new Date())} | Pagina 1`, 14, 32);

    // Stats box
    const totalGuests = filtered.reduce((sum, r) => sum + r.numberOfPersons, 0);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 36, 182, 10, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(14, 36, 182, 10, 'S');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAAL: ${filtered.length} reserveringen | ${totalGuests} gasten`, 18, 42);

    // Table data
    const tableData = filtered.map(res => {
      const event = events.find(e => e.id === res.eventId);
      
      // � Format table number
      const tableDisplay = res.tableNumber ? `T${res.tableNumber}` : '-';
      
      // �🏷️ Format tags for display
      const tagsDisplay = res.tags && res.tags.length > 0 
        ? res.tags.join(', ') 
        : '-';
      
      // 📝 Format notes for display (truncate if too long)
      const notesDisplay = res.notes 
        ? (res.notes.length > 40 ? res.notes.substring(0, 40) + '...' : res.notes)
        : '-';
      
      return [
        formatDate(new Date(res.eventDate)),
        tableDisplay, // 🎯 NEW: Table number first!
        res.contactPerson,
        res.companyName || '-',
        res.numberOfPersons.toString(),
        res.arrangement,
        tagsDisplay, // 🏷️
        notesDisplay, // 📝
        res.phone,
        res.email
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [['Datum', 'Tafel', 'Naam', 'Bedrijf', 'Pers.', 'Arr.', 'Tags', 'Notities', 'Tel.', 'Email']],
      body: tableData,
      styles: { 
        fontSize: 7, // Slightly smaller to fit more columns
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
        fontSize: 8
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { cellWidth: 18 },  // Datum
        1: { cellWidth: 10, halign: 'center', fontStyle: 'bold' }, // 🎯 Tafel
        2: { cellWidth: 23 },  // Naam
        3: { cellWidth: 18 },  // Bedrijf
        4: { cellWidth: 10, halign: 'center' }, // Personen
        5: { cellWidth: 12, halign: 'center' }, // Arrangement
        6: { cellWidth: 23, fontSize: 7 }, // 🏷️ Tags
        7: { cellWidth: 28, fontSize: 6 }, // 📝 Notities
        8: { cellWidth: 18 }, // Telefoon
        9: { cellWidth: 28 }  // Email
      }
    });

    doc.save(`Gastenlijst_${dateRange.start}_${dateRange.end}.pdf`);
  };

  // Generate Merchandise List PDF (NIEUW DESIGN)
  const generateMerchandiseListPDF = () => {
    const doc = new jsPDF();
    const filtered = getFilteredReservations();

    // Collect all merchandise
    const merchandiseByItem = new Map<string, { count: number; reservations: string[] }>();

    filtered.forEach(res => {
      if (res.merchandise && res.merchandise.length > 0) {
        res.merchandise.forEach(merchSelection => {
          const merchItem = merchandiseItems.find(m => m.id === merchSelection.itemId);
          if (merchItem) {
            const key = merchItem.name;
            const existing = merchandiseByItem.get(key) || { count: 0, reservations: [] };
            existing.count += merchSelection.quantity;
            existing.reservations.push(res.contactPerson);
            merchandiseByItem.set(key, existing);
          }
        });
      }
    });

    // Simple header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(14, 20, 196, 20);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('MERCHANDISE OVERZICHT', 14, 16);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${formatDate(new Date(dateRange.start))} - ${formatDate(new Date(dateRange.end))}`, 14, 27);
    doc.text(`Gegenereerd: ${formatDate(new Date())}`, 14, 32);

    // Summary table
    const summaryData = Array.from(merchandiseByItem.entries()).map(([item, data]) => [
      item,
      data.count.toString(),
      data.reservations.slice(0, 3).join(', ') + (data.reservations.length > 3 ? '...' : '')
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['Merchandise Item', 'Totaal Aantal', 'Klanten (voorbeeld)']],
      body: summaryData,
      styles: { 
        fontSize: 10, 
        cellPadding: 3,
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [0, 0, 0], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        halign: 'left'
      },
      alternateRowStyles: { fillColor: [250, 250, 250] }
    });

    // Detailed per reservation
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(14, finalY, 196, finalY);
    finalY += 8;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Details per Reservering', 14, finalY);
    finalY += 8;

    const detailData = filtered
      .filter(res => res.merchandise && res.merchandise.length > 0)
      .map(res => {
        const items = res.merchandise.map(merchSelection => {
          const merchItem = merchandiseItems.find(m => m.id === merchSelection.itemId);
          return merchItem ? `${merchSelection.quantity}x ${merchItem.name}` : '';
        }).filter(Boolean).join(', ');
        
        return [
          formatDate(new Date(res.eventDate)),
          res.contactPerson,
          items
        ];
      });

    autoTable(doc, {
      startY: finalY,
      head: [['Datum', 'Klant', 'Merchandise']],
      body: detailData,
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [0, 0, 0], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        halign: 'left'
      },
      alternateRowStyles: { fillColor: [250, 250, 250] }
    });

    doc.save(`Merchandise_${dateRange.start}_${dateRange.end}.pdf`);
  };

  // Generate Allergy List PDF (NIEUW DESIGN)
  const generateAllergyListPDF = () => {
    const doc = new jsPDF();
    const filtered = getFilteredReservations();

    // Filter only reservations with dietary requirements
    const withDietary = filtered.filter(res => {
      const dr = res.dietaryRequirements;
      return dr && (dr.vegetarian || dr.vegan || dr.glutenFree || dr.lactoseFree || dr.other);
    });

    // Simple header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(14, 20, 196, 20);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('KEUKENLIJST - DIEETWENSEN', 14, 16);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${formatDate(new Date(dateRange.start))} - ${formatDate(new Date(dateRange.end))}`, 14, 27);
    doc.text(`Gegenereerd: ${formatDate(new Date())}`, 14, 32);
    doc.text(`Reserveringen met dieetwensen: ${withDietary.length} van ${filtered.length}`, 14, 37);

    // Summary counts
    let vegetarianTotal = 0;
    let veganTotal = 0;
    let glutenFreeTotal = 0;
    let lactoseFreeTotal = 0;

    withDietary.forEach(res => {
      const dr = res.dietaryRequirements!;
      vegetarianTotal += dr.vegetarianCount || 0;
      veganTotal += dr.veganCount || 0;
      glutenFreeTotal += dr.glutenFreeCount || 0;
      lactoseFreeTotal += dr.lactoseFreeCount || 0;
    });

    // Totaal box - zwart/wit
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(14, 42, 100, 28, 'FD');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TOTAAL OVERZICHT:', 18, 48);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Vegetarisch: ${vegetarianTotal} personen`, 20, 54);
    doc.text(`Veganistisch: ${veganTotal} personen`, 20, 59);
    doc.text(`Glutenvrij: ${glutenFreeTotal} personen`, 20, 64);
    doc.text(`Lactosevrij: ${lactoseFreeTotal} personen`, 20, 69);

    // Detailed table
    const tableData = withDietary.map(res => {
      const dr = res.dietaryRequirements!;
      const requirements: string[] = [];
      
      if (dr.vegetarian) requirements.push(`Veg: ${dr.vegetarianCount || 0}`);
      if (dr.vegan) requirements.push(`Veganist: ${dr.veganCount || 0}`);
      if (dr.glutenFree) requirements.push(`Glutenvrij: ${dr.glutenFreeCount || 0}`);
      if (dr.lactoseFree) requirements.push(`Lactosevrij: ${dr.lactoseFreeCount || 0}`);
      if (dr.other) requirements.push(`Anders: ${dr.other} (${dr.otherCount || 0})`);

      return [
        formatDate(new Date(res.eventDate)),
        res.contactPerson,
        res.numberOfPersons.toString(),
        requirements.join('\n')
      ];
    });

    autoTable(doc, {
      startY: 75,
      head: [['Datum', 'Klant', 'Totaal Personen', 'Dieetwensen']],
      body: tableData,
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [0, 0, 0], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        halign: 'left'
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 90 }
      }
    });

    doc.save(`Keukenlijst_Dieetwensen_${dateRange.start}_${dateRange.end}.pdf`);
  };

  // Generate Week Overview PDF (met gouden branding)
  const generateWeekOverviewPDF = () => {
    const doc = new jsPDF();
    const filtered = getFilteredReservations();

    // Group by week
    const weekData = new Map<string, {
      reservations: Reservation[];
      totalPersons: number;
      totalDeluxe: number;
      totalCouvert: number;
      merchandiseCount: number;
      revenue: number;
    }>();

    filtered.forEach(res => {
      const date = new Date(res.eventDate);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
      const weekKey = weekStart.toISOString().split('T')[0];

      const existing = weekData.get(weekKey) || {
        reservations: [],
        totalPersons: 0,
        totalDeluxe: 0,
        totalCouvert: 0,
        merchandiseCount: 0,
        revenue: 0
      };

      existing.reservations.push(res);
      existing.totalPersons += res.numberOfPersons;
      
      if (res.arrangement === 'BWFM') {
        existing.totalDeluxe += res.numberOfPersons;
      } else {
        existing.totalCouvert += res.numberOfPersons;
      }

      if (res.merchandise && res.merchandise.length > 0) {
        existing.merchandiseCount += res.merchandise.reduce((sum: number, item: MerchandiseSelection) => sum + item.quantity, 0);
      }

      existing.revenue += res.totalPrice;

      weekData.set(weekKey, existing);
    });

    // Simple header - zwart op wit
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(14, 20, 196, 20);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('WEEKOVERZICHT BOEKINGEN', 14, 16);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${formatDate(new Date(dateRange.start))} - ${formatDate(new Date(dateRange.end))}`, 14, 27);
    doc.text(`Gegenereerd: ${formatDate(new Date())}`, 14, 32);

    // Summary table
    const tableData = Array.from(weekData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, data]) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        return [
          `${formatDate(new Date(weekStart))} - ${formatDate(weekEnd)}`,
          data.reservations.length.toString(),
          data.totalPersons.toString(),
          data.totalDeluxe.toString(),
          data.totalCouvert.toString(),
          data.merchandiseCount.toString(),
          formatCurrency(data.revenue)
        ];
      });

    autoTable(doc, {
      startY: 38,
      head: [['Week', 'Boekingen', 'Personen', 'Deluxe', 'Couvert', 'Merch.', 'Omzet']],
      body: tableData,
      styles: { 
        fontSize: 10, 
        cellPadding: 3,
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [0, 0, 0], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        halign: 'left'
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 30, halign: 'right' }
      }
    });

    // Totals box - zwart/wit
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    const totals = Array.from(weekData.values()).reduce((acc, data) => ({
      reservations: acc.reservations + data.reservations.length,
      persons: acc.persons + data.totalPersons,
      deluxe: acc.deluxe + data.totalDeluxe,
      couvert: acc.couvert + data.totalCouvert,
      merchandise: acc.merchandise + data.merchandiseCount,
      revenue: acc.revenue + data.revenue
    }), { reservations: 0, persons: 0, deluxe: 0, couvert: 0, merchandise: 0, revenue: 0 });

    // Draw separator line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(14, finalY - 5, 196, finalY - 5);

    // Totals box
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(14, finalY, 110, 38, 'FD');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TOTALEN OVERZICHT', 18, finalY + 7);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Totaal boekingen: ${totals.reservations}`, 20, finalY + 14);
    doc.text(`Totaal personen: ${totals.persons}`, 20, finalY + 19);
    doc.text(`Deluxe arrangementen: ${totals.deluxe}`, 20, finalY + 24);
    doc.text(`Couvert arrangementen: ${totals.couvert}`, 20, finalY + 29);
    doc.text(`Merchandise items: ${totals.merchandise}`, 20, finalY + 34);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Totale omzet: ${formatCurrency(totals.revenue)}`, 20, finalY + 39);

    doc.save(`Weekoverzicht_${dateRange.start}_${dateRange.end}.pdf`);
  };

  const handleGeneratePDF = async (type: ExportType) => {
    setIsGenerating(true);
    setSelectedExport(type);

    try {
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

      switch (type) {
        case 'daily-rundown':
          await generateDailyRundownPDF();
          break;
        case 'guest-list':
          generateGuestListPDF();
          break;
        case 'merchandise-list':
          generateMerchandiseListPDF();
          break;
        case 'allergy-list':
          generateAllergyListPDF();
          break;
        case 'week-overview':
          generateWeekOverviewPDF();
          break;
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Er is een fout opgetreden bij het genereren van de PDF');
    } finally {
      setIsGenerating(false);
      setSelectedExport(null);
    }
  };

  const filteredCount = getFilteredReservations().length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Printbare PDF Rapporten</h2>
          <p className="text-sm text-slate-600">Voor receptie, keuken en management (niet voor data-analyse)</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Periode selecteren
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Van</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Tot</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {filteredCount} reservering(en) in deze periode
        </p>
      </div>

      {/* 🆕 NIEUW: Dagelijks Draaiboek - Featured */}
      <div className="mb-6">
        <button
          onClick={() => handleGeneratePDF('daily-rundown')}
          disabled={isGenerating || filteredCount === 0}
          className="group relative w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 hover:from-amber-100 hover:to-yellow-200 border-3 border-amber-400 rounded-xl p-6 transition-all hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed text-left"
          style={{ borderWidth: '3px' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <ClipboardList className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-slate-900">Dagelijks Draaiboek</h3>
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">NIEUW!</span>
                </div>
                <p className="text-sm text-slate-700 font-medium">
                  Alles-in-een overzicht: gasten, dieetwensen, merchandise, opmerkingen + QR codes
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Vervangt de oude losse rapporten - Visuele kleurcodering - Check-in QR codes
                </p>
              </div>
            </div>
            {isGenerating && selectedExport === 'daily-rundown' ? (
              <Loader className="w-6 h-6 text-amber-600 animate-spin" />
            ) : (
              <Download className="w-6 h-6 text-amber-600 group-hover:translate-y-1 transition-transform" />
            )}
          </div>
          <div className="flex items-center gap-4 pt-3 border-t border-amber-200">
            <span className="text-xs text-slate-600">Dieetwensen</span>
            <span className="text-xs text-slate-600">Merchandise</span>
            <span className="text-xs text-slate-600">Opmerkingen</span>
            <span className="text-xs text-slate-600">QR Check-in</span>
          </div>
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-slate-200"></div>
        <span className="text-xs font-medium text-slate-500 uppercase">Losse rapporten (legacy)</span>
        <div className="flex-1 h-px bg-slate-200"></div>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Guest List */}
        <button
          onClick={() => handleGeneratePDF('guest-list')}
          disabled={isGenerating || filteredCount === 0}
          className="group relative bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 rounded-xl p-4 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            {isGenerating && selectedExport === 'guest-list' ? (
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
            ) : (
              <Download className="w-5 h-5 text-blue-600 group-hover:translate-y-0.5 transition-transform" />
            )}
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Gastenlijst</h3>
          <p className="text-sm text-slate-600">
            Simpele tabel met basis gasteninfo
          </p>
        </button>

        {/* Merchandise List */}
        <button
          onClick={() => handleGeneratePDF('merchandise-list')}
          disabled={isGenerating || filteredCount === 0}
          className="group relative bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-200 rounded-xl p-4 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            {isGenerating && selectedExport === 'merchandise-list' ? (
              <Loader className="w-5 h-5 text-purple-600 animate-spin" />
            ) : (
              <Download className="w-5 h-5 text-purple-600 group-hover:translate-y-0.5 transition-transform" />
            )}
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Merchandise Lijst</h3>
          <p className="text-sm text-slate-600">
            Picklijst voor merchandise voorbereidingen
          </p>
        </button>

        {/* Allergy List */}
        <button
          onClick={() => handleGeneratePDF('allergy-list')}
          disabled={isGenerating || filteredCount === 0}
          className="group relative bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-2 border-red-200 rounded-xl p-4 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            {isGenerating && selectedExport === 'allergy-list' ? (
              <Loader className="w-5 h-5 text-red-600 animate-spin" />
            ) : (
              <Download className="w-5 h-5 text-red-600 group-hover:translate-y-0.5 transition-transform" />
            )}
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Keukenlijst</h3>
          <p className="text-sm text-slate-600">
            Dieetwensen en allergieën voor de keuken
          </p>
        </button>

        {/* Week Overview */}
        <button
          onClick={() => handleGeneratePDF('week-overview')}
          disabled={isGenerating || filteredCount === 0}
          className="group relative bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-200 rounded-xl p-4 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            {isGenerating && selectedExport === 'week-overview' ? (
              <Loader className="w-5 h-5 text-green-600 animate-spin" />
            ) : (
              <Download className="w-5 h-5 text-green-600 group-hover:translate-y-0.5 transition-transform" />
            )}
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Weekoverzicht</h3>
          <p className="text-sm text-slate-600">
            Management rapport voor planning
          </p>
        </button>
      </div>

      {filteredCount === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Geen reserveringen</p>
            <p className="text-sm text-yellow-700">
              Er zijn geen reserveringen in de geselecteerde periode.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
