import { useEffect, useState } from 'react';
import { Undo2, Redo2, X } from 'lucide-react';
import { useUndoStore, getActionDescription, type UndoableAction } from '../../store/undoStore';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { cn } from '../../utils';

/**
 * Undo Toast Component
 * 
 * Toont een toast na belangrijke acties met een "Ongedaan maken" knop
 * Verschijnt 5 seconden en verdwijnt dan automatisch
 */

interface UndoToastProps {
  action: UndoableAction;
  onUndo: () => void;
  onClose: () => void;
  duration?: number;
}

const UndoToast: React.FC<UndoToastProps> = ({ 
  action, 
  onUndo, 
  onClose,
  duration = 5000 
}) => {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100));
        if (newProgress <= 0) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            onClose();
          }, 300);
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  const handleUndo = () => {
    setIsVisible(false);
    setTimeout(() => {
      onUndo();
      onClose();
    }, 200);
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 transition-all duration-300',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <div className="bg-neutral-900 text-white rounded-lg shadow-2xl border border-neutral-700 overflow-hidden min-w-[350px] max-w-md">
        {/* Progress bar */}
        <div className="h-1 bg-neutral-800">
          <div
            className="h-full bg-gold-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">
                {getActionDescription(action)}
              </p>
              <p className="text-xs text-neutral-400">
                Wil je dit ongedaan maken?
              </p>
            </div>

            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-500 text-neutral-900 rounded text-sm font-medium hover:bg-gold-600 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              Ongedaan maken
            </button>

            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 200);
              }}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Undo Manager Hook
 * 
 * Beheert undo/redo functionaliteit en handelt het ongedaan maken af
 */
export const useUndoManager = () => {
  const { addAction, undo, redo, canUndo, canRedo } = useUndoStore();
  const { createEvent, deleteEvent, updateEvent, loadEvents } = useEventsStore();
  const { 
    deleteReservation, 
    updateReservation,
    loadReservations
  } = useReservationsStore();
  
  const [currentToast, setCurrentToast] = useState<UndoableAction | null>(null);

  const executeUndo = async () => {
    const action = undo();
    if (!action) return;

    try {
      switch (action.type) {
        case 'DELETE_EVENT':
          // Restore deleted event by creating it again with same ID
          await createEvent(action.payload.event as any);
          await loadEvents();
          break;

        case 'DELETE_RESERVATION':
          // For now, just reload - proper restore would need API support
          await loadReservations();
          break;

        case 'UPDATE_EVENT':
          await updateEvent(action.payload.before.id, action.payload.before);
          break;

        case 'UPDATE_RESERVATION':
          await updateReservation(action.payload.before.id, action.payload.before);
          break;

        case 'BULK_DELETE_EVENTS':
          for (const event of action.payload.events) {
            await createEvent(event as any);
          }
          await loadEvents();
          break;

        case 'BULK_DELETE_RESERVATIONS':
          // Reload to show all data
          await loadReservations();
          break;

        case 'STATUS_CHANGE':
          await updateReservation(action.payload.reservationId, {
            ...action.payload.reservation,
            status: action.payload.oldStatus as any,
          });
          break;
      }

      return true;
    } catch (error) {
      console.error('Undo failed:', error);
      return false;
    }
  };

  const executeRedo = async () => {
    const action = redo();
    if (!action) return;

    try {
      switch (action.type) {
        case 'DELETE_EVENT':
          await deleteEvent(action.payload.event.id);
          break;

        case 'DELETE_RESERVATION':
          await deleteReservation(action.payload.reservation.id);
          break;

        case 'UPDATE_EVENT':
          await updateEvent(action.payload.after.id, action.payload.after);
          break;

        case 'UPDATE_RESERVATION':
          await updateReservation(action.payload.after.id, action.payload.after);
          break;

        case 'STATUS_CHANGE':
          await updateReservation(action.payload.reservationId, {
            ...action.payload.reservation,
            status: action.payload.newStatus as any,
          });
          break;
      }

      return true;
    } catch (error) {
      console.error('Redo failed:', error);
      return false;
    }
  };

  const trackAction = (action: UndoableAction) => {
    addAction(action);
    setCurrentToast(action);
  };

  return {
    trackAction,
    undo: executeUndo,
    redo: executeRedo,
    canUndo,
    canRedo,
    currentToast,
    clearToast: () => setCurrentToast(null),
  };
};

/**
 * Undo/Redo Toolbar
 * 
 * Floating toolbar met undo/redo knoppen
 */
export const UndoToolbar: React.FC = () => {
  const { undo, redo, canUndo, canRedo, currentToast, clearToast } = useUndoManager();

  const handleUndo = async () => {
    await undo();
  };

  const handleRedo = async () => {
    await redo();
  };

  return (
    <>
      <div className="fixed bottom-6 left-6 z-40 flex gap-2">
        <button
          onClick={handleUndo}
          disabled={!canUndo()}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all',
            canUndo()
              ? 'bg-neutral-800 text-white hover:bg-neutral-700 cursor-pointer'
              : 'bg-neutral-800/50 text-neutral-500 cursor-not-allowed'
          )}
          title="Ongedaan maken (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
          <span className="text-sm font-medium">Undo</span>
        </button>

        <button
          onClick={handleRedo}
          disabled={!canRedo()}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all',
            canRedo()
              ? 'bg-neutral-800 text-white hover:bg-neutral-700 cursor-pointer'
              : 'bg-neutral-800/50 text-neutral-500 cursor-not-allowed'
          )}
          title="Opnieuw (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
          <span className="text-sm font-medium">Redo</span>
        </button>
      </div>

      {currentToast && (
        <UndoToast
          action={currentToast}
          onUndo={handleUndo}
          onClose={clearToast}
        />
      )}
    </>
  );
};

export default UndoToast;
