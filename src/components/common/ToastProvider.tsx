import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, type, title, message, duration };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast('success', title, message);
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    showToast('error', title, message, 7000); // Longer for errors
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast('warning', title, message);
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast('info', title, message);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const config = {
    success: {
      icon: CheckCircle,
      bgClass: 'bg-success-500/10 border-success-500/30',
      iconClass: 'text-success-400',
      titleClass: 'text-success-400',
      messageClass: 'text-success-300'
    },
    error: {
      icon: XCircle,
      bgClass: 'bg-error-500/10 border-error-500/30',
      iconClass: 'text-error-400',
      titleClass: 'text-error-400',
      messageClass: 'text-error-300'
    },
    warning: {
      icon: AlertTriangle,
      bgClass: 'bg-warning-500/10 border-warning-500/30',
      iconClass: 'text-warning-400',
      titleClass: 'text-warning-400',
      messageClass: 'text-warning-300'
    },
    info: {
      icon: Info,
      bgClass: 'bg-info-500/10 border-info-500/30',
      iconClass: 'text-info-400',
      titleClass: 'text-info-400',
      messageClass: 'text-info-300'
    }
  };

  const { icon: Icon, bgClass, iconClass, titleClass, messageClass } = config[toast.type];

  return (
    <div
      className={cn(
        'pointer-events-auto max-w-sm p-4 rounded-xl border shadow-lifted backdrop-blur-sm',
        'animate-slide-in',
        bgClass,
        'bg-bg-elevated/95'
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconClass)} />
        <div className="flex-1 min-w-0">
          <h4 className={cn('font-semibold text-sm', titleClass)}>{toast.title}</h4>
          {toast.message && (
            <p className={cn('text-sm mt-1', messageClass)}>{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
