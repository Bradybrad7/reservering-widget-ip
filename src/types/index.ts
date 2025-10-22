// Core enums and types
export type EventType = 'REGULAR' | 'MATINEE' | 'CARE_HEROES' | 'REQUEST' | 'UNAVAILABLE';
export type Arrangement = 'BWF' | 'BWFM';
export type DayType = 'weekday' | 'weekend' | 'matinee' | 'careHeroes';
export type Salutation = 'Dhr' | 'Mevr' | '';

// Wizard step types
export type StepKey = 
  | 'calendar' 
  | 'persons'
  | 'package' // ✨ NIEUW: Gecombineerde stap voor arrangement + borrels
  | 'arrangement' 
  | 'addons' 
  | 'merchandise' 
  | 'form' 
  | 'summary' 
  | 'success'
  | 'waitlistPrompt'
  | 'waitlistSuccess';

// Show interface
export interface Show {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Event interface
export interface Event {
  id: string;
  date: Date;
  doorsOpen: string; // HH:MM format
  startsAt: string;  // HH:MM format
  endsAt: string;    // HH:MM format
  type: EventType;
  showId: string; // Reference to Show
  capacity: number;
  remainingCapacity?: number;
  bookingOpensAt: Date | null;
  bookingClosesAt: Date | null;
  allowedArrangements: Arrangement[];
  customPricing?: Partial<Record<Arrangement, number>>;
  notes?: string;
  isActive: boolean;
  waitlistActive?: boolean; // Admin can manually activate waitlist to close bookings
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
  defaultCapacity: number; // Default capacity for new events (e.g., 230)
}

// Event Type Configuration
export interface EventTypeConfig {
  key: EventType;
  name: string;
  description: string;
  color: string; // Hex color code for visual identification
  defaultTimes: {
    doorsOpen: string;
    startsAt: string;
    endsAt: string;
  };
  days: string[];
  enabled: boolean;
  showOnCalendar: boolean; // Whether to display on public calendar
}

export interface EventTypesConfig {
  types: EventTypeConfig[];
}

// Wizard configuration
export interface WizardStep {
  key: StepKey;
  label: string;
  enabled: boolean;
  order: number;
  required: boolean; // calendar, form, summary are always required
}

export interface WizardConfig {
  steps: WizardStep[];
}

// Text Customization
export interface TextCustomization {
  [key: string]: string;
}

// Dietary requirements and allergies
export interface DietaryRequirements {
  vegetarian: boolean;
  vegetarianCount?: number;
  vegan: boolean;
  veganCount?: number;
  glutenFree: boolean;
  glutenFreeCount?: number;
  lactoseFree: boolean;
  lactoseFreeCount?: number;
  other: string; // Free text for other allergies/requirements
  otherCount?: number;
}

// Customer form data
export interface CustomerFormData {
  // Company/Personal details
  companyName: string;
  salutation: Salutation;
  firstName: string;
  lastName: string;
  contactPerson: string; // Keep for backward compatibility, will be computed from firstName + lastName
  
  // Business details (optional)
  vatNumber?: string;
  
  // Address
  address: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  
  // Invoice Address (for businesses)
  invoiceAddress?: string;
  invoiceHouseNumber?: string;
  invoicePostalCode?: string;
  invoiceCity?: string;
  invoiceCountry?: string;
  invoiceInstructions?: string;
  
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
  
  // Dietary requirements (NEW)
  dietaryRequirements?: DietaryRequirements;
  
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
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'request' | 'waitlist' | 'checked-in';
  isWaitlist?: boolean;
  requestedOverCapacity?: boolean; // TRUE if booking was made when exceeding available capacity
  createdAt: Date;
  updatedAt: Date;
  tags?: string[]; // VIP, Corporate, Repeat Customer, etc.
  communicationLog?: CommunicationLog[];
  notes?: string; // Admin notes
  checkedInAt?: Date; // NEW: Check-in timestamp
  checkedInBy?: string; // NEW: Who performed the check-in
}

// Communication log for tracking interactions
export interface CommunicationLog {
  id: string;
  timestamp: Date;
  type: 'email' | 'phone' | 'note' | 'status_change';
  subject?: string;
  message: string;
  author: string; // Admin who made the entry
}

// ✨ NEW: Waitlist Entry - Separate from Reservations
export interface WaitlistEntry {
  id: string;
  eventId: string;
  eventDate: Date;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  phoneCountryCode?: string;
  numberOfPersons: number;
  arrangement?: Arrangement;
  status: 'pending' | 'contacted' | 'converted' | 'expired' | 'cancelled';
  priority?: number; // Order in waitlist (1 = first)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  contactedAt?: Date;
  contactedBy?: string;
  convertedToReservationId?: string; // If converted to actual reservation
}

// Availability response
export interface Availability {
  eventId: string;
  isAvailable: boolean;
  remainingCapacity: number;
  bookingStatus: 'open' | 'closed' | 'cutoff' | 'full' | 'request';
  reason?: string;
  waitlistCount?: number; // NEW: Number of people on waitlist
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
  recentActivity?: {
    pendingReservations: number;
    upcomingEvents: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
  };
}

// Customer profile (CRM)
export interface CustomerProfile {
  email: string;
  companyName: string;
  contactPerson: string;
  totalBookings: number;
  totalSpent: number;
  lastBooking: Date;
  firstBooking: Date;
  tags: string[];
  notes?: string;
  reservations: Reservation[];
  averageGroupSize: number;
  preferredArrangement?: Arrangement;
}

// Event Template
export interface EventTemplate {
  id: string;
  name: string;
  description?: string;
  type: EventType;
  doorsOpen: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  allowedArrangements: Arrangement[];
  customPricing?: Partial<Record<Arrangement, number>>;
  notes?: string;
  createdAt: Date;
}

// Promotion/Discount Code
export interface PromotionCode {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number; // percentage (0-100) or fixed amount
  minBookingAmount?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableTo?: {
    eventTypes?: EventType[];
    arrangements?: Arrangement[];
  };
}

// Voucher/Gift Card (NEW)
export interface Voucher {
  id: string;
  code: string;
  type: 'gift_card' | 'discount_code';
  value: number; // Remaining value for gift cards, discount amount/percentage for codes
  discountType?: 'percentage' | 'fixed'; // Only for discount codes
  originalValue: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  usageHistory: VoucherUsage[];
  createdAt: Date;
  createdBy: string;
  notes?: string;
}

export interface VoucherUsage {
  reservationId: string;
  usedAt: Date;
  amountUsed: number;
}

// Audit Log Entry (NEW)
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'check_in';
  entityType: 'event' | 'reservation' | 'customer' | 'config' | 'voucher' | 'merchandise';
  entityId: string;
  actor: string; // "Admin" or specific user if auth is implemented
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  description: string;
}

// Email reminder configuration
export interface EmailReminderConfig {
  enabled: boolean;
  daysBefore: number;
  subject: string;
  template: string; // HTML template with placeholders
}

// Admin navigation types
export type AdminSection = 
  | 'dashboard'
  | 'events-overview'
  | 'events-shows'
  | 'events-types'
  | 'events-calendar'
  | 'events-templates'
  | 'reservations-all'
  | 'reservations-pending'
  | 'reservations-confirmed'
  | 'reservations-waitlist'
  | 'reservations-checkin'
  | 'customers-overview'
  | 'customers-detail'
  | 'products-addons'
  | 'products-merchandise'
  | 'products-arrangements'
  | 'settings-pricing'
  | 'settings-booking'
  | 'settings-wizard'
  | 'settings-texts'
  | 'settings-general'
  | 'settings-promotions'
  | 'settings-vouchers'
  | 'settings-reminders'
  | 'system-data'
  | 'system-capacity'
  | 'system-health'
  | 'system-audit'
  | 'analytics-reports'
  | 'analytics-dashboard';

export interface NavigationItem {
  id: AdminSection;
  label: string;
  icon: string; // Lucide icon name
  parent?: string; // Parent group ID
  order: number;
}

export interface NavigationGroup {
  id: string;
  label: string;
  icon: string;
  order: number;
  items: NavigationItem[];
  defaultExpanded?: boolean;
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