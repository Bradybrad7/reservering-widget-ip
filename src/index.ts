// Main component exports
export { default as ReservationWidget } from './components/ReservationWidget';
export { default as BookingAdmin } from './components/BookingAdminNew2';

// Individual component exports
export { default as Calendar } from './components/Calendar';
// Export reservation form when available
// export { default as ReservationForm } from './components/ReservationForm';
export { default as OrderSummary } from './components/OrderSummary';
export { default as SuccessPage } from './components/SuccessPage';
export { ToastProvider, useToast, useFormErrorHandler } from './components/Toast';

// Types exports
export type * from './types';

// Configuration and utilities
export { defaultConfig, defaultPricing, defaultAddOns, defaultBookingRules, nl } from './config/defaults';
export { cn, formatCurrency, formatDate, formatTime, isValidEmail, isValidPhoneNumber, isValidPostalCode } from './utils';
export { customerFormSchema, eventSchema, pricingSchema, validateFormData } from './validation/schemas';

// Store and services
export { useReservationStore } from './store/reservationStore';
export { apiService } from './services/apiService';
export { priceService } from './services/priceService';