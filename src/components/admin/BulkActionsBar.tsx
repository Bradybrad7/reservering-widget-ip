import { useState } from 'react';
import { 
  Mail, 
  Download, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle
} from 'lucide-react';
import type { Reservation } from '../../types';
import { useReservationsStore } from '../../store/reservationsStore';
import { useUndoManager } from './UndoToast';
import { cn } from '../../utils';

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  reservations: Reservation[];
  onClearSelection: () => void;
}

/**
 * Bulk Actions Bar
 * 
 * Floating action bar dat verschijnt wanneer items geselecteerd zijn
 * Biedt bulk operaties zoals:
 * - Status wijzigen (confirm, cancel, pending)
 * - Email versturen
 * - Export naar Excel/PDF
 * - Bulk delete
 */
export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedIds,
  reservations,
  onClearSelection
}) => {
  const { updateReservation, deleteReservation, loadReservations } = useReservationsStore();
  const { trackAction } = useUndoManager();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const selectedReservations = reservations.filter(r => selectedIds.has(r.id));
  const count = selectedReservations.length;

  if (count === 0) return null;

  const handleBulkStatusChange = async (newStatus: 'confirmed' | 'cancelled' | 'pending') => {
    setIsProcessing(true);
    
    try {
      const updates = [];
      
      for (const reservation of selectedReservations) {
        const success = await updateReservation(reservation.id, {
          ...reservation,
          status: newStatus
        });
        
        if (success) {
          updates.push({
            reservationId: reservation.id,
            oldStatus: reservation.status,
            newStatus,
            reservation
          });
        }
      }

      // Track for undo
      updates.forEach(update => {
        trackAction({
          type: 'STATUS_CHANGE',
          payload: update
        });
      });

      onClearSelection();
      await loadReservations();
    } catch (error) {
      console.error('Bulk status change failed:', error);
      alert('Er is een fout opgetreden bij het wijzigen van de status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkEmail = () => {
    // Open email composer met alle selected emails
    const emails = selectedReservations
      .map(r => r.email)
      .filter(Boolean)
      .join(',');
    
    window.location.href = `mailto:${emails}?subject=Betreffende uw reservering bij Inspiration Point`;
  };

  const handleBulkExport = () => {
    // Export selected to CSV
    const csvHeader = 'Bedrijf,Contact,Email,Telefoon,Datum,Personen,Arrangement,Status\n';
    const csvData = selectedReservations.map(r => {
      const date = new Date(r.eventDate).toLocaleDateString('nl-NL');
      return `"${r.companyName}","${r.contactPerson || ''}","${r.email}","${r.phone || ''}","${date}","${r.numberOfPersons}","${r.arrangement}","${r.status}"`;
    }).join('\n');

    const blob = new Blob([csvHeader + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reserveringen-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleBulkDelete = async () => {
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }

    setIsProcessing(true);
    
    try {
      // Track for undo before deleting
      trackAction({
        type: 'BULK_DELETE_RESERVATIONS',
        payload: { reservations: selectedReservations }
      });

      for (const reservation of selectedReservations) {
        await deleteReservation(reservation.id);
      }

      onClearSelection();
      setShowConfirmDelete(false);
      await loadReservations();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      alert('Er is een fout opgetreden bij het verwijderen');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-neutral-900 text-white rounded-lg shadow-2xl border border-neutral-700 px-6 py-4 flex items-center gap-4 min-w-[600px]">
          {/* Selection Info */}
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gold-500" />
            <span className="font-medium">{count} geselecteerd</span>
          </div>

          <div className="h-6 w-px bg-neutral-700" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Confirm */}
            <button
              onClick={() => handleBulkStatusChange('confirmed')}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
              title="Bevestig geselecteerde"
            >
              <CheckCircle className="w-4 h-4" />
              Bevestig
            </button>

            {/* Pending */}
            <button
              onClick={() => handleBulkStatusChange('pending')}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
              title="Zet op in behandeling"
            >
              <Clock className="w-4 h-4" />
              Pending
            </button>

            {/* Cancel */}
            <button
              onClick={() => handleBulkStatusChange('cancelled')}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
              title="Annuleer geselecteerde"
            >
              <XCircle className="w-4 h-4" />
              Annuleer
            </button>

            <div className="h-6 w-px bg-neutral-700" />

            {/* Email */}
            <button
              onClick={handleBulkEmail}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
              title="Email versturen"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>

            {/* Export */}
            <button
              onClick={handleBulkExport}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
              title="Exporteer naar CSV"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            {/* Delete */}
            <button
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
                showConfirmDelete
                  ? "bg-red-600 hover:bg-red-700 animate-pulse"
                  : "bg-red-600/50 hover:bg-red-600"
              )}
              title={showConfirmDelete ? "Klik nogmaals om te bevestigen" : "Verwijder geselecteerde"}
            >
              {showConfirmDelete ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Zeker weten?
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Verwijder
                </>
              )}
            </button>
          </div>

          <div className="h-6 w-px bg-neutral-700" />

          {/* Close */}
          <button
            onClick={() => {
              onClearSelection();
              setShowConfirmDelete(false);
            }}
            className="text-neutral-400 hover:text-white transition-colors"
            title="Deselecteer alles"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-neutral-900 rounded-lg p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
              <span>Bezig met verwerken...</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Checkbox voor bulk selectie
 */
interface SelectCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const SelectCheckbox: React.FC<SelectCheckboxProps> = ({
  checked,
  onChange,
  className
}) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className={cn(
        "w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-gold-500",
        "focus:ring-2 focus:ring-gold-500 focus:ring-offset-0",
        "cursor-pointer transition-colors",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    />
  );
};

export default BulkActionsBar;
