/**
 * ↩️ UndoToastSystem - Toast met Undo Button
 * 
 * Shows toast notifications with undo functionality for critical actions
 */

import React, { useEffect, useState } from 'react';
import { X, RotateCcw, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils';
import { useUndoStore, getActionDescription } from '../../store/undoStore';

interface ToastState {
  show: boolean;
  message: string;
}

export const UndoToastSystem: React.FC = () => {
  const { getLastAction, undo, canUndo } = useUndoStore();
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  
  const lastAction = getLastAction();
  
  useEffect(() => {
    if (lastAction) {
      const message = getActionDescription(lastAction);
      setToast({ show: true, message });
      
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        setToast({ show: false, message: '' });
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [lastAction]);
  
  if (!toast.show || !canUndo()) return null;
  
  const handleUndo = () => {
    const action = undo();
    if (action) {
      setToast({ show: false, message: '' });
      // Here you would call the actual undo logic based on action type
      // This could be implemented in the store or passed as a callback
    }
  };
  
  const handleClose = () => {
    setToast({ show: false, message: '' });
  };
  
  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="flex items-center gap-3 px-5 py-3 bg-slate-900 dark:bg-slate-800 border-2 border-slate-700 rounded-xl shadow-2xl backdrop-blur-sm min-w-[320px]">
        {/* Icon */}
        <div className="flex-shrink-0 p-1.5 bg-emerald-600/20 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white mb-0.5">
            {toast.message}
          </div>
          <div className="text-xs text-slate-400">
            Klik op "Ongedaan maken" binnen 8 seconden
          </div>
        </div>
        
        {/* Undo Button */}
        <button
          onClick={handleUndo}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Ongedaan maken
        </button>
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-slate-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
};

// Helper component to add to main layout
export const UndoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <UndoToastSystem />
    </>
  );
};
