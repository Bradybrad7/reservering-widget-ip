import * as XLSX from 'xlsx';
import type { Reservation, AdminEvent } from '../types';
import { formatCurrency, formatDate, formatTime } from '../utils';

/**
 * Advanced Excel Export Service
 * 
 * Features:
 * - Multi-sheet exports
 * - Custom column selection
 * - Formulas and calculations
 * - Styling and formatting
 * - Charts (basic support)
 */

interface ExportColumn {
  key: string;
  label: string;
  formatter?: (value: any) => string | number;
  width?: number;
}

interface ExportOptions {
  filename?: string;
  sheets?: Array<{
    name: string;
    data: any[];
    columns: ExportColumn[];
  }>;
  includeStats?: boolean;
  includeTotals?: boolean;
}

export class ExcelService {
  /**
   * Export reservations with custom columns
   */
  static exportReservations(
    reservations: Reservation[],
    selectedColumns?: ExportColumn[],
    options: ExportOptions = {}
  ): void {
    const workbook = XLSX.utils.book_new();

    // Default columns if none provided
    const columns = selectedColumns || this.getDefaultReservationColumns();

    // Main data sheet
    const data = reservations.map(reservation => {
      const row: any = {};
      columns.forEach(col => {
        const value = this.getNestedValue(reservation, col.key);
        row[col.label] = col.formatter ? col.formatter(value) : value;
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const wscols = columns.map(col => ({ wch: col.width || 15 }));
    worksheet['!cols'] = wscols;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reserveringen');

    // Add summary sheet if requested
    if (options.includeStats) {
      this.addSummarySheet(workbook, reservations);
    }

    // Add pivot analysis
    if (options.includeTotals) {
      this.addPivotSheet(workbook, reservations);
    }

    // Export
    const filename = options.filename || `Reserveringen-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Export events with reservations
   */
  static exportEvents(
    events: AdminEvent[],
    options: ExportOptions = {}
  ): void {
    const workbook = XLSX.utils.book_new();

    // Events overview sheet
    const eventsData = events.map(event => ({
      'Datum': formatDate(event.date),
      'Aanvang': formatTime(event.startsAt),
      'Type': event.type,
      'Capaciteit': event.capacity,
      'Bezet': event.reservations?.length || 0,
      'Vrij': event.capacity - (event.reservations?.length || 0),
      'Bezettingsgraad': `${Math.round(((event.reservations?.length || 0) / event.capacity) * 100)}%`,
      'Omzet': formatCurrency(event.revenue || 0),
      'Status': event.isActive ? 'Actief' : 'Inactief'
    }));

    const eventsSheet = XLSX.utils.json_to_sheet(eventsData);
    eventsSheet['!cols'] = [
      { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
      { wch: 8 }, { wch: 8 }, { wch: 15 }, { wch: 12 }, { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(workbook, eventsSheet, 'Evenementen');

    // Detailed reservations per event
    events.forEach((event, index) => {
      if (event.reservations && event.reservations.length > 0 && index < 10) { // Max 10 event sheets
        const eventReservations = event.reservations.map(res => ({
          'Bedrijf': res.companyName,
          'Contactpersoon': res.contactPerson || '-',
          'Email': res.email,
          'Telefoon': res.phone || '-',
          'Personen': res.numberOfPersons,
          'Arrangement': res.arrangement,
          'Borrel vooraf': res.preDrink?.enabled ? 'Ja' : 'Nee',
          'Afterparty': res.afterParty?.enabled ? 'Ja' : 'Nee',
          'Status': res.status
        }));

        const sheet = XLSX.utils.json_to_sheet(eventReservations);
        const sheetName = `${formatDate(event.date).replace(/\//g, '-').substring(0, 20)}`;
        XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
      }
    });

    // Stats sheet
    this.addEventStatsSheet(workbook, events);

    // Export
    const filename = options.filename || `Evenementen-Export-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Custom report export with grouping and aggregation
   */
  static exportCustomReport(
    data: any[],
    config: {
      groupBy?: string;
      aggregations?: Array<{
        field: string;
        type: 'sum' | 'avg' | 'count' | 'min' | 'max';
        label: string;
      }>;
      filters?: Array<{
        field: string;
        operator: '=' | '!=' | '>' | '<' | 'contains';
        value: any;
      }>;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
    }
  ): void {
    const workbook = XLSX.utils.book_new();

    // Apply filters
    let filteredData = data;
    if (config.filters) {
      filteredData = data.filter(item => {
        return config.filters!.every(filter => {
          const value = this.getNestedValue(item, filter.field);
          switch (filter.operator) {
            case '=': return value === filter.value;
            case '!=': return value !== filter.value;
            case '>': return value > filter.value;
            case '<': return value < filter.value;
            case 'contains': return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
            default: return true;
          }
        });
      });
    }

    // Apply sorting
    if (config.sortBy) {
      filteredData.sort((a, b) => {
        const aVal = this.getNestedValue(a, config.sortBy!);
        const bVal = this.getNestedValue(b, config.sortBy!);
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return config.sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    // Group and aggregate if requested
    if (config.groupBy) {
      const grouped = this.groupBy(filteredData, config.groupBy);
      const aggregated = Object.entries(grouped).map(([key, items]) => {
        const row: any = { [config.groupBy!]: key, 'Count': (items as any[]).length };
        
        config.aggregations?.forEach(agg => {
          const values = (items as any[]).map(item => this.getNestedValue(item, agg.field));
          switch (agg.type) {
            case 'sum':
              row[agg.label] = values.reduce((a, b) => a + (Number(b) || 0), 0);
              break;
            case 'avg':
              row[agg.label] = values.reduce((a, b) => a + (Number(b) || 0), 0) / values.length;
              break;
            case 'count':
              row[agg.label] = values.filter(v => v != null).length;
              break;
            case 'min':
              row[agg.label] = Math.min(...values.map(v => Number(v) || 0));
              break;
            case 'max':
              row[agg.label] = Math.max(...values.map(v => Number(v) || 0));
              break;
          }
        });
        
        return row;
      });

      const sheet = XLSX.utils.json_to_sheet(aggregated);
      XLSX.utils.book_append_sheet(workbook, sheet, 'Gegroepeerd');
    }

    // Raw data sheet
    const rawSheet = XLSX.utils.json_to_sheet(filteredData);
    XLSX.utils.book_append_sheet(workbook, rawSheet, 'Raw Data');

    // Export
    XLSX.writeFile(workbook, `Custom-Report-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  // Private helper methods
  private static getDefaultReservationColumns(): ExportColumn[] {
    return [
      { key: 'id', label: 'ID', width: 20 },
      { key: 'companyName', label: 'Bedrijf', width: 25 },
      { key: 'contactPerson', label: 'Contactpersoon', width: 20 },
      { key: 'email', label: 'Email', width: 25 },
      { key: 'phone', label: 'Telefoon', width: 15 },
      { 
        key: 'eventDate', 
        label: 'Datum', 
        formatter: (value) => formatDate(new Date(value)),
        width: 12
      },
      { key: 'numberOfPersons', label: 'Personen', width: 10 },
      { key: 'arrangement', label: 'Arrangement', width: 10 },
      { key: 'status', label: 'Status', width: 12 },
      { 
        key: 'totalPrice', 
        label: 'Totaalprijs', 
        formatter: (value) => value ? formatCurrency(value) : '-',
        width: 12
      }
    ];
  }

  private static addSummarySheet(workbook: XLSX.WorkBook, reservations: Reservation[]): void {
    const stats = [
      { 'Metric': 'Totaal reserveringen', 'Waarde': reservations.length },
      { 'Metric': 'Bevestigd', 'Waarde': reservations.filter(r => r.status === 'confirmed').length },
      { 'Metric': 'In behandeling', 'Waarde': reservations.filter(r => r.status === 'pending').length },
      { 'Metric': 'Geannuleerd', 'Waarde': reservations.filter(r => r.status === 'cancelled').length },
      { 'Metric': '', 'Waarde': '' },
      { 'Metric': 'Totaal personen', 'Waarde': reservations.reduce((sum, r) => sum + r.numberOfPersons, 0) },
      { 
        'Metric': 'Gemiddelde groepsgrootte', 
        'Waarde': Math.round(reservations.reduce((sum, r) => sum + r.numberOfPersons, 0) / reservations.length)
      },
      { 'Metric': '', 'Waarde': '' },
      { 
        'Metric': 'Totale omzet (excl. BTW)', 
        'Waarde': formatCurrency(reservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0))
      }
    ];

    const sheet = XLSX.utils.json_to_sheet(stats);
    sheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Samenvatting');
  }

  private static addPivotSheet(workbook: XLSX.WorkBook, reservations: Reservation[]): void {
    // Group by arrangement
    const byArrangement = reservations.reduce((acc, res) => {
      if (!acc[res.arrangement]) {
        acc[res.arrangement] = { count: 0, persons: 0, revenue: 0 };
      }
      acc[res.arrangement].count++;
      acc[res.arrangement].persons += res.numberOfPersons;
      acc[res.arrangement].revenue += res.totalPrice || 0;
      return acc;
    }, {} as Record<string, any>);

    const pivotData = Object.entries(byArrangement).map(([arrangement, data]) => ({
      'Arrangement': arrangement,
      'Aantal reserveringen': data.count,
      'Totaal personen': data.persons,
      'Gemiddelde groepsgrootte': Math.round(data.persons / data.count),
      'Totale omzet': formatCurrency(data.revenue),
      'Gemiddelde omzet per reservering': formatCurrency(data.revenue / data.count)
    }));

    const sheet = XLSX.utils.json_to_sheet(pivotData);
    sheet['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Per Arrangement');
  }

  private static addEventStatsSheet(workbook: XLSX.WorkBook, events: AdminEvent[]): void {
    const stats = [
      { 'Metric': 'Totaal evenementen', 'Waarde': events.length },
      { 'Metric': 'Actieve evenementen', 'Waarde': events.filter(e => e.isActive).length },
      { 'Metric': '', 'Waarde': '' },
      { 
        'Metric': 'Totale capaciteit', 
        'Waarde': events.reduce((sum, e) => sum + e.capacity, 0)
      },
      { 
        'Metric': 'Totaal gereserveerd', 
        'Waarde': events.reduce((sum, e) => sum + (e.reservations?.length || 0), 0)
      },
      { 
        'Metric': 'Gemiddelde bezettingsgraad', 
        'Waarde': `${Math.round(events.reduce((sum, e) => 
          sum + ((e.reservations?.length || 0) / e.capacity) * 100, 0
        ) / events.length)}%`
      },
      { 'Metric': '', 'Waarde': '' },
      { 
        'Metric': 'Totale omzet', 
        'Waarde': formatCurrency(events.reduce((sum, e) => sum + (e.revenue || 0), 0))
      }
    ];

    const sheet = XLSX.utils.json_to_sheet(stats);
    sheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Event Stats');
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  private static groupBy(array: any[], key: string): Record<string, any[]> {
    return array.reduce((result, item) => {
      const groupKey = this.getNestedValue(item, key) || 'Onbekend';
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {} as Record<string, any[]>);
  }
}

export default ExcelService;
