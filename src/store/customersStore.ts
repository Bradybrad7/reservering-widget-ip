// Customers (CRM) Store Module
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  CustomerProfile,
  Reservation
} from '../types';
import { apiService } from '../services/apiService';

// Customers State
interface CustomersState {
  customers: CustomerProfile[];
  selectedCustomer: CustomerProfile | null;
  isLoadingCustomers: boolean;
  customerSearchTerm: string;
}

// Customers Actions
interface CustomersActions {
  loadCustomers: () => Promise<void>;
  loadCustomer: (email: string) => Promise<void>;
  selectCustomer: (customer: CustomerProfile | null) => void;
  updateCustomer: (email: string, updates: Partial<CustomerProfile>) => Promise<boolean>;
  getCustomerReservations: (email: string) => Promise<Reservation[]>;
  getCustomerStats: (email: string) => Promise<{
    totalBookings: number;
    totalRevenue: number;
    averageSpend: number;
    lastBooking: Date | null;
  }>;
  setCustomerSearchTerm: (term: string) => void;
  getFilteredCustomers: () => CustomerProfile[];
}

// Customers Store
export const useCustomersStore = create<CustomersState & CustomersActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    customers: [],
    selectedCustomer: null,
    isLoadingCustomers: false,
    customerSearchTerm: '',

    // Actions
    loadCustomers: async () => {
      set({ isLoadingCustomers: true });
      try {
        const response = await apiService.getCustomers();
        if (response.success && response.data) {
          set({ customers: response.data, isLoadingCustomers: false });
        } else {
          set({ isLoadingCustomers: false });
        }
      } catch (error) {
        console.error('Failed to load customers:', error);
        set({ isLoadingCustomers: false });
      }
    },

    loadCustomer: async (email: string) => {
      try {
        const response = await apiService.getCustomerProfile(email);
        if (response.success && response.data) {
          set({ selectedCustomer: response.data });
        }
      } catch (error) {
        console.error('Failed to load customer:', error);
      }
    },

    selectCustomer: (customer: CustomerProfile | null) => {
      set({ selectedCustomer: customer });
    },

    updateCustomer: async (email: string, updates: Partial<CustomerProfile>) => {
      const response = await apiService.updateCustomerProfile(email, updates);
      if (response.success) {
        set(state => ({
          customers: state.customers.map(c =>
            c.email === email ? { ...c, ...updates } : c
          ),
          selectedCustomer: state.selectedCustomer?.email === email
            ? { ...state.selectedCustomer, ...updates }
            : state.selectedCustomer
        }));
        return true;
      }
      return false;
    },

    getCustomerReservations: async (email: string) => {
      try {
        const response = await apiService.getCustomerReservations(email);
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      } catch (error) {
        console.error('Failed to load customer reservations:', error);
        return [];
      }
    },

    getCustomerStats: async (email: string) => {
      const reservations = await get().getCustomerReservations(email);
      
      const confirmedReservations = reservations.filter(
        r => r.status === 'confirmed' || r.status === 'checked-in'
      );

      const totalBookings = confirmedReservations.length;
      const totalRevenue = confirmedReservations.reduce((sum, r) => sum + r.totalPrice, 0);
      const averageSpend = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const lastBooking = confirmedReservations.length > 0
        ? new Date(Math.max(...confirmedReservations.map(r => new Date(r.eventDate).getTime())))
        : null;

      return {
        totalBookings,
        totalRevenue,
        averageSpend,
        lastBooking
      };
    },

    setCustomerSearchTerm: (term: string) => {
      set({ customerSearchTerm: term });
    },

    getFilteredCustomers: () => {
      const { customers, customerSearchTerm } = get();
      
      if (!customerSearchTerm) return customers;

      const term = customerSearchTerm.toLowerCase();
      
      return customers.filter(customer =>
        customer.companyName?.toLowerCase().includes(term) ||
        customer.contactPerson.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term)
      );
    }
  }))
);
