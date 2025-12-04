import React from 'react';
import { Copy, Download } from 'lucide-react';
import { format } from 'date-fns';

interface QuickActionsProps {
  events: any[];
  onBulkCreate: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  events,
  onBulkCreate
}) => {
  const handleExport = () => {
    // Create CSV content
    const headers = ['Datum', 'Type', 'Show ID', 'Deuren Open', 'Start', 'Eind', 'Capaciteit', 'Geboekt', 'Status'];
    const rows = events.map(event => {
      const bookedSeats = event.capacity - (event.remainingCapacity || event.capacity);
      return [
        format(new Date(event.date), 'yyyy-MM-dd'),
        event.type,
        event.showId,
        event.doorsOpen,
        event.startsAt,
        event.endsAt,
        event.capacity,
        bookedSeats,
        event.isActive ? 'Actief' : 'Inactief'
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    
    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `events_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onBulkCreate}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
        title="Meerdere events aanmaken"
      >
        <Copy className="w-4 h-4" />
        Bulk Aanmaken
      </button>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
        title="Events exporteren naar CSV"
      >
        <Download className="w-4 h-4" />
        Export CSV
      </button>
    </div>
  );
};
