import { create } from 'zustand';
import type { AdminEvent, Reservation } from '../types';

/**
 * Undo/Redo Store voor Admin Acties
 * 
 * Houdt een history bij van belangrijke admin acties
 * zodat deze ongedaan gemaakt kunnen worden.
 */

export type UndoableAction = 
  | { type: 'DELETE_EVENT'; payload: { event: AdminEvent } }
  | { type: 'DELETE_RESERVATION'; payload: { reservation: Reservation } }
  | { type: 'UPDATE_EVENT'; payload: { before: AdminEvent; after: AdminEvent } }
  | { type: 'UPDATE_RESERVATION'; payload: { before: Reservation; after: Reservation } }
  | { type: 'BULK_DELETE_EVENTS'; payload: { events: AdminEvent[] } }
  | { type: 'BULK_DELETE_RESERVATIONS'; payload: { reservations: Reservation[] } }
  | { type: 'BULK_UPDATE_EVENTS'; payload: { updates: Array<{ before: AdminEvent; after: AdminEvent }> } }
  | { type: 'STATUS_CHANGE'; payload: { reservationId: string; oldStatus: string; newStatus: string; reservation: Reservation } };

interface UndoState {
  history: UndoableAction[];
  redoStack: UndoableAction[];
  maxHistorySize: number;
}

interface UndoActions {
  addAction: (action: UndoableAction) => void;
  undo: () => UndoableAction | null;
  redo: () => UndoableAction | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
  getLastAction: () => UndoableAction | null;
}

export const useUndoStore = create<UndoState & UndoActions>((set, get) => ({
  history: [],
  redoStack: [],
  maxHistorySize: 50,

  addAction: (action) => {
    set((state) => {
      const newHistory = [...state.history, action];
      
      // Limit history size
      if (newHistory.length > state.maxHistorySize) {
        newHistory.shift();
      }

      return {
        history: newHistory,
        redoStack: [], // Clear redo stack when new action is added
      };
    });
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return null;

    const action = history[history.length - 1];
    
    set((state) => ({
      history: state.history.slice(0, -1),
      redoStack: [...state.redoStack, action],
    }));

    return action;
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return null;

    const action = redoStack[redoStack.length - 1];
    
    set((state) => ({
      history: [...state.history, action],
      redoStack: state.redoStack.slice(0, -1),
    }));

    return action;
  },

  canUndo: () => get().history.length > 0,
  canRedo: () => get().redoStack.length > 0,
  
  clear: () => set({ history: [], redoStack: [] }),
  
  getLastAction: () => {
    const { history } = get();
    return history.length > 0 ? history[history.length - 1] : null;
  },
}));

/**
 * Helper function om action descriptions te genereren
 */
export function getActionDescription(action: UndoableAction): string {
  switch (action.type) {
    case 'DELETE_EVENT':
      return `Event op ${new Date(action.payload.event.date).toLocaleDateString('nl-NL')} verwijderd`;
    case 'DELETE_RESERVATION':
      return `Reservering van ${action.payload.reservation.companyName} verwijderd`;
    case 'UPDATE_EVENT':
      return `Event op ${new Date(action.payload.after.date).toLocaleDateString('nl-NL')} gewijzigd`;
    case 'UPDATE_RESERVATION':
      return `Reservering ${action.payload.after.id} gewijzigd`;
    case 'BULK_DELETE_EVENTS':
      return `${action.payload.events.length} events verwijderd`;
    case 'BULK_DELETE_RESERVATIONS':
      return `${action.payload.reservations.length} reserveringen verwijderd`;
    case 'BULK_UPDATE_EVENTS':
      return `${action.payload.updates.length} events gewijzigd`;
    case 'STATUS_CHANGE':
      return `Status gewijzigd: ${action.payload.oldStatus} → ${action.payload.newStatus}`;
    default:
      return 'Actie uitgevoerd';
  }
}
