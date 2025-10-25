/**
 * Firebase-based Config Store
 * Replaces localStorage with Firestore real-time listeners
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { configService } from '../services/firebaseService';
import type { FirestoreConfig } from '../types/firestore';
import type { Unsubscribe } from 'firebase/firestore';

interface ConfigState {
  config: FirestoreConfig | null;
  isLoading: boolean;
  error: string | null;
  unsubscribe: Unsubscribe | null;
}

interface ConfigActions {
  // Data loading
  loadConfig: () => Promise<void>;
  subscribeToConfig: () => void;
  unsubscribeFromConfig: () => void;
  
  // Update operations
  updateConfig: (data: Partial<FirestoreConfig>) => Promise<void>;
  
  // Specific config updates
  updateBookingRules: (bookingRules: FirestoreConfig['bookingRules']) => Promise<void>;
  updateWidgetSettings: (widgetSettings: FirestoreConfig['widgetSettings']) => Promise<void>;
  updateTextCustomization: (textCustomization: FirestoreConfig['textCustomization']) => Promise<void>;
}

export const useConfigStore = create<ConfigState & ConfigActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    config: null,
    isLoading: false,
    error: null,
    unsubscribe: null,

    // Load config once
    loadConfig: async () => {
      set({ isLoading: true, error: null });
      try {
        const config = await configService.get();
        set({ config, isLoading: false });
      } catch (error) {
        console.error('❌ Failed to load config:', error);
        set({ 
          error: (error as Error).message, 
          isLoading: false 
        });
      }
    },

    // Subscribe to real-time updates
    subscribeToConfig: () => {
      const { unsubscribe } = get();
      
      if (unsubscribe) {
        unsubscribe();
      }

      const newUnsubscribe = configService.subscribe((config) => {
        set({ config, isLoading: false, error: null });
      });
      
      set({ unsubscribe: newUnsubscribe, isLoading: true });
    },

    // Unsubscribe from real-time updates
    unsubscribeFromConfig: () => {
      const { unsubscribe } = get();
      if (unsubscribe) {
        unsubscribe();
        set({ unsubscribe: null });
      }
    },

    // Update config
    updateConfig: async (data) => {
      try {
        await configService.update(data);
      } catch (error) {
        console.error('❌ Failed to update config:', error);
        throw error;
      }
    },

    // Update booking rules
    updateBookingRules: async (bookingRules) => {
      const { config } = get();
      if (!config) {
        throw new Error('Config not loaded');
      }
      
      await get().updateConfig({ bookingRules });
    },

    // Update widget settings
    updateWidgetSettings: async (widgetSettings) => {
      const { config } = get();
      if (!config) {
        throw new Error('Config not loaded');
      }
      
      await get().updateConfig({ widgetSettings });
    },

    // Update text customization
    updateTextCustomization: async (textCustomization) => {
      const { config } = get();
      if (!config) {
        throw new Error('Config not loaded');
      }
      
      await get().updateConfig({ textCustomization });
    }
  }))
);

// Selectors
export const useConfig = () => useConfigStore(state => state.config);
export const useBookingRules = () => useConfigStore(state => state.config?.bookingRules);
export const useWidgetSettings = () => useConfigStore(state => state.config?.widgetSettings);
export const useTextCustomization = () => useConfigStore(state => state.config?.textCustomization);
export const useConfigLoading = () => useConfigStore(state => state.isLoading);
