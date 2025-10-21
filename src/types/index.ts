// Core enums and types
export type EventType = 'REGULAR' | 'MATINEE' | 'CARE_HEROES' | 'REQUEST' | 'UNAVAILABLE';
export type Arrangement = 'BWF' | 'BWFM';
export type DayType = 'weekday' | 'weekend' | 'matinee' | 'careHeroes';
export type Salutation = 'Dhr' | 'Mevr' | '';

// Event interface
export interface Event {
  id: string;
  date: Date;
  doorsOpen: string; // HH:MM format
  startsAt: string;  // HH:MM format
  endsAt: string;    // HH:MM format
  type: EventType;
  capacity: number;
  remainingCapacity?: number;
  bookingOpensAt: Date | null;
  bookingClosesAt: Date | null;
  allowedArrangements: Arrangement[];
  customPricing?: Partial<Record<Arrangement, number>>;
  notes?: string;
  isActive: boolean;
}

// Pricing structure
export interface PricingByDayType {
  BWF: number;
  BWFM: number;
}

export interface Pricing {
  byDayType: {
    weekday: PricingByDayType;
    weekend: PricingByDayType;
    matinee: PricingByDayType;
    careHeroes: PricingByDayType;
  };
}

// Add-ons
export interface AddOn {
  pricePerPerson: number;
  minPersons: number;
  description?: string;
}

export interface AddOns {
  preDrink: AddOn;
  afterParty: AddOn;
}

// Merchandise
export interface MerchandiseItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'clothing' | 'accessories' | 'other';
  imageUrl?: string;
  inStock: boolean;
}

export interface MerchandiseSelection {
  itemId: string;
  quantity: number;
}

// Global configuration
export interface GlobalConfig {
  maxCapacity: number;
  currency: string;
  locale: string;
  timeZone: string;
  termsUrl: string;
  privacyUrl: string;
  colors: Record<EventType, string>;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

// Booking rules
export interface BookingRules {
  defaultOpenDaysBefore: number;
  defaultCutoffHoursBefore: number;
  softCapacityWarningPercent: number;
  enableWaitlist: boolean;
}

// Customer form data
export interface CustomerFormData {
  // Company/Personal details
  companyName: string;
  salutation: Salutation;
  contactPerson: string;
  
  // Address
  address: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  
  // Contact
  phoneCountryCode: string;
  phone: string;
  email: string;
  
  // Booking details
  numberOfPersons: number;
  arrangement: Arrangement;
  
  // Add-ons
  preDrink: {
    enabled: boolean;
    quantity: number;
  };
  afterParty: {
    enabled: boolean;
    quantity: number;
  };
  
  // Merchandise
  merchandise: MerchandiseSelection[];
  
  // Special occasion
  partyPerson?: string;
  
  // Optional fields
  comments?: string;
  newsletterOptIn: boolean;
  acceptTerms: boolean;
}

// Reservation data
export interface Reservation extends CustomerFormData {
  id: string;
  eventId: string;
  eventDate: Date;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'request' | 'waitlist';
  isWaitlist?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Availability response
export interface Availability {
  eventId: string;
  isAvailable: boolean;
  remainingCapacity: number;
  bookingStatus: 'open' | 'closed' | 'cutoff' | 'full' | 'request';
  reason?: string;
}

// API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Price calculation
export interface PriceCalculation {
  basePrice: number;
  preDrinkTotal: number;
  afterPartyTotal: number;
  merchandiseTotal: number;
  subtotal: number;
  vatAmount: number;
  totalPrice: number;
  breakdown: {
    arrangement: {
      type: Arrangement;
      pricePerPerson: number;
      persons: number;
      total: number;
    };
    preDrink?: {
      pricePerPerson: number;
      persons: number;
      total: number;
    };
    afterParty?: {
      pricePerPerson: number;
      persons: number;
      total: number;
    };
    merchandise?: {
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        total: number;
      }>;
      total: number;
    };
  };
}

// Calendar types
export interface CalendarDay {
  date: Date;
  event?: Event;
  isToday: boolean;
  isSelected: boolean;
  isInCurrentMonth: boolean;
  availability?: Availability;
}

// Form validation errors
export interface FormErrors {
  [key: string]: string | undefined;
}

// Admin interfaces
export interface AdminEvent extends Event {
  reservations: Reservation[];
  revenue: number;
}

export interface AdminStats {
  totalEvents: number;
  totalReservations: number;
  totalRevenue: number;
  averageGroupSize: number;
  popularArrangement: Arrangement;
}

// Export types for external use
export type ReservationWidgetProps = {
  config?: Partial<GlobalConfig>;
  onReservationComplete?: (reservation: Reservation) => void;
  className?: string;
};

export type BookingAdminProps = {
  onConfigChange?: (config: GlobalConfig) => void;
  className?: string;
};