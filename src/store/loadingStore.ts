/**
 * ⏳ Loading States Manager
 * 
 * Global loading state management
 */

import { create } from 'zustand';

interface LoadingState {
  globalLoading: boolean;
  operationLoading: Record<string, boolean>;
  loadingMessages: Record<string, string>;
  
  // Actions
  startGlobalLoading: (message?: string) => void;
  stopGlobalLoading: () => void;
  startOperation: (operationId: string, message?: string) => void;
  stopOperation: (operationId: string) => void;
  isOperationLoading: (operationId: string) => boolean;
  getLoadingMessage: (operationId: string) => string | undefined;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  globalLoading: false,
  operationLoading: {},
  loadingMessages: {},
  
  startGlobalLoading: (message) => {
    set({
      globalLoading: true,
      loadingMessages: message ? { global: message } : {}
    });
  },
  
  stopGlobalLoading: () => {
    set({ globalLoading: false });
  },
  
  startOperation: (operationId, message) => {
    set(state => ({
      operationLoading: {
        ...state.operationLoading,
        [operationId]: true
      },
      loadingMessages: message ? {
        ...state.loadingMessages,
        [operationId]: message
      } : state.loadingMessages
    }));
  },
  
  stopOperation: (operationId) => {
    set(state => {
      const { [operationId]: _, ...restLoading } = state.operationLoading;
      const { [operationId]: __, ...restMessages } = state.loadingMessages;
      
      return {
        operationLoading: restLoading,
        loadingMessages: restMessages
      };
    });
  },
  
  isOperationLoading: (operationId) => {
    return get().operationLoading[operationId] || false;
  },
  
  getLoadingMessage: (operationId) => {
    return get().loadingMessages[operationId];
  }
}));

// Convenience hooks
export const useOperationLoading = (operationId: string) => {
  const { isOperationLoading, startOperation, stopOperation, getLoadingMessage } = useLoadingStore();
  
  return {
    isLoading: isOperationLoading(operationId),
    message: getLoadingMessage(operationId),
    startLoading: (message?: string) => startOperation(operationId, message),
    stopLoading: () => stopOperation(operationId)
  };
};
