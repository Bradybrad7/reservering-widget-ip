// Core enums and types
// EventType is now dynamic and matches event type keys from configuration
// Common types: 'weekday', 'weekend', 'matinee', 'care_heroes', 'special_event', etc.
export type EventType = string;
export type Arrangement = 'BWF' | 'BWFM';
// DayType is now dynamic and matches event type keys
export type DayType = string;
export type Salutation = 'Dhr' | 'Mevr' | '';
// Reservation Status
export type ReservationStatus = 
  | 'pending'       // Waiting for admin confirmation
  | 'confirmed'     // Confirmed by admin
  | 'rejected'      // Rejected by admin
  | 'cancelled'     // Cancelled (by customer or admin)
  | 'waitlist'      // On waitlist (DEPRECATED - use WaitlistEntry instead)
  | 'checked-in'    // Customer has checked in on event day
  | 'request'       // Over-capacity request
  | 'option';       // 🆕 Temporary hold (1 week) - minimal info, counts toward capacity

// ✨ NEW: Payment Status (October 2025)
// This tracks the financial status INDEPENDENTLY from booking status
// A reservation can be 'confirmed' (seat reserved) but 'pending' payment
export type PaymentStatus = 
  | 'pending'         // Invoice sent, awaiting payment
  | 'paid'            // Payment received and confirmed
  | 'overdue'         // Payment deadline passed
  | 'refunded'        // Payment was refunded
  | 'not_applicable'; // E.g., free event, voucher, or comp ticket

// Wizard step types
export type StepKey = 
  | 'calendar' 
  | 'persons'
  | 'package' // ✨ Gecombineerde stap voor arrangement + borrels
  | 'merchandise' // 🛍️ Optionele merchandise stap
  | 'contact' // ✨ Essentiële contactgegevens (naam, bedrijf, email, telefoon)
  | 'details' // ✨ Extra details (adres, factuur, dieetwensen)
  | 'form' // ⚠️ DEPRECATED: Wordt vervangen door contact + details
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
    [key: string]: PricingByDayType; // Dynamic keys based on event types
  };
  // ✨ NEW: Control which arrangements are available for voucher purchase
  voucherSettings?: {
    BWF: {
      available: boolean;
      description?: string; // What's included in this arrangement
    };
    BWFM: {
      available: boolean;
      description?: string;
    };
  };
  // ✨ NEW: Per event type voucher configuration
  voucherAvailability?: {
    [eventType: string]: { // e.g., 'weekday', 'weekend', 'matinee'
      displayName?: string; // Custom name for voucher display (e.g., "Weekendshow" instead of "weekend")
      BWF?: boolean; // Is BWF available for this event type?
      BWFM?: boolean; // Is BWFM available for this event type?
    };
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
  vegetarian?: boolean;
  vegetarianCount?: number;
  vegan?: boolean;
  veganCount?: number;
  glutenFree?: boolean;
  glutenFreeCount?: number;
  lactoseFree?: boolean;
  lactoseFreeCount?: number;
  other?: string; // ✨ VEREENVOUDIGD: Klanten vullen alles in dit veld (inclusief aantallen)
  otherCount?: number;
}

// Customer form data
export interface CustomerFormData {
  // Company/Personal details
  companyName?: string; // Optional - can be empty for personal bookings
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
  
  // Promotion & Vouchers (NEW)
  promotionCode?: string;
  voucherCode?: string;
  
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
  
  // ✨ IMPORTANT: Store pricing snapshot at time of booking
  // This ensures price changes don't affect existing reservations
  pricingSnapshot?: {
    basePrice: number;           // Price per person for arrangement
    pricePerPerson: number;       // Same as basePrice (for clarity)
    numberOfPersons: number;
    arrangement: Arrangement;
    arrangementTotal: number;     // basePrice * numberOfPersons
    preDrinkPrice?: number;       // Price per person if enabled
    preDrinkTotal?: number;
    afterPartyPrice?: number;     // Price per person if enabled
    afterPartyTotal?: number;
    merchandiseTotal?: number;
    subtotal: number;             // Before discounts
    discountAmount?: number;      // Total discount applied
    discountDescription?: string; // e.g., "Kortingscode: SUMMER2024"
    voucherAmount?: number;       // Voucher discount
    finalTotal: number;           // After all discounts
    calculatedAt: Date;           // When this pricing was calculated
  };
  
  status: ReservationStatus;
  isWaitlist?: boolean;
  requestedOverCapacity?: boolean; // TRUE if booking was made when exceeding available capacity
  
  // ✨ NEW: Financial/Payment Tracking (October 2025)
  paymentStatus: PaymentStatus;
  invoiceNumber?: string;           // Invoice reference number
  paymentMethod?: string;           // 'bank_transfer', 'ideal', 'voucher', 'cash', etc.
  paymentReceivedAt?: Date;         // Timestamp when payment was confirmed
  paymentDueDate?: Date;            // When payment is expected
  paymentNotes?: string;            // Admin notes about payment
  
  createdAt: Date;
  updatedAt: Date;
  isArchived?: boolean; // NEW: For archiving cancelled/rejected bookings
  archivedAt?: Date; // NEW: When it was archived
  archivedBy?: string; // NEW: Who archived it
  tags?: string[]; // VIP, Corporate, Repeat Customer, etc.
  communicationLog?: CommunicationLog[];
  notes?: string; // Admin notes
  checkedInAt?: Date; // NEW: Check-in timestamp
  checkedInBy?: string; // NEW: Who performed the check-in
  
  // 🆕 OPTION SYSTEM: Temporary 1-week hold (October 2025)
  // When status = 'option': minimal booking info (naam, adres, telefoon)
  // NO arrangement/pricing required yet - just securing capacity
  // Counts toward event capacity to reserve the seats
  optionPlacedAt?: Date;      // When the option was created
  optionExpiresAt?: Date;     // Auto-calculated: optionPlacedAt + 7 days
  optionNotes?: string;       // Admin notes specific to this option
  optionFollowedUp?: boolean; // Has admin contacted customer about expiring option?
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
// Note: NO arrangement or pricing - they're just on the waitlist!
export interface WaitlistEntry {
  id: string;
  eventId: string;
  eventDate: Date;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  phoneCountryCode?: string;
  numberOfPersons: number;
  // ⚠️ NO arrangement - waitlist entries don't book yet!
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
  discountAmount?: number; // ✨ NEW: Total discount from promotions/vouchers
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
    discount?: { // ✨ NEW: Discount breakdown
      description: string;
      amount: number;
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
  type: 'percentage' | 'fixed' | 'per_person' | 'per_arrangement';
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
// ✨ SIMPLIFIED ADMIN NAVIGATION (Oct 2025)
// Reduced from 30+ items to 9 logical groups
// Sub-pages implemented as tabs within main components
export type AdminSection = 
  | 'dashboard'      // Home overview
  | 'events'         // All event management (tabs: overview, calendar, templates, shows, types)
  | 'reservations'   // All reservations with filter tabs (all, pending, confirmed, cancelled)
  | 'waitlist'       // Waitlist management (separate workflow)
  | 'archive'        // Archived/deleted reservations
  | 'checkin'        // Check-in system (day-of workflow)
  | 'customers'      // CRM & customer management
  | 'products'       // Products & Pricing (tabs: arrangements, addons, merchandise, promotions, vouchers)
  | 'reports'        // Analytics & reporting (tabs: dashboard, custom reports)
  | 'config';        // All configuration (tabs: general, booking, system)

export interface NavigationItem {
  id: AdminSection;
  label: string;
  icon: string; // Lucide icon name
  parent?: string; // Parent group ID (deprecated with new flat structure)
  order: number;
  badge?: string | number; // Optional badge for notifications
}

export interface NavigationGroup {
  id: string;
  label: string;
  icon: string;
  order: number;
  items?: NavigationItem[]; // Optional: for future nested structure
  defaultExpanded?: boolean;
  section: AdminSection; // Direct mapping to AdminSection
}

// ✨ Product Management Types (Oct 2025)

// Arrangement (Product) - Full definition beyond just the code
export interface ArrangementProduct {
  id: string;
  name: string;
  code: Arrangement; // 'BWF' | 'BWFM'
  description: string;
  minPersons?: number;
  maxPersons?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Promotion/Discount Code
export interface Promotion {
  id: string;
  name: string; // Internal name
  code: string; // The code customers enter
  description?: string;
  type: 'percentage' | 'fixed_amount';
  value: number; // 20 for 20% or 10 for €10
  validFrom: Date | string;
  validTo: Date | string;
  minBookingValue?: number;
  applicableTo: 'all' | 'arrangements' | 'merchandise';
  applicableItemIds?: string[]; // Specific arrangement/merchandise IDs
  isActive: boolean;
  usageCount?: number; // How many times it has been used
  maxUsage?: number; // Optional limit
  createdAt?: Date;
  updatedAt?: Date;
}

// Voucher Template (What you sell)
export interface VoucherTemplate {
  id: string;
  name: string; // e.g., "€25 Cadeaubon"
  description: string;
  value: number; // Fixed value
  validityDays: number; // Days valid after issuance
  imageUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Issued Voucher (Actual voucher given to customer)
export interface IssuedVoucher {
  id: string;
  code: string; // Unique generated code
  templateId: string; // Links to VoucherTemplate
  issuedTo: string; // Name or email
  issueDate: Date | string;
  expiryDate: Date | string;
  initialValue: number;
  remainingValue: number;
  status: 'active' | 'used' | 'expired' | 'pending_payment';
  usedInReservationIds?: string[]; // Track where it was used
  
  // Extended metadata for voucher purchases
  metadata?: {
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    recipientEmail?: string;
    personalMessage?: string;
    deliveryMethod: 'email' | 'physical';
    quantity: number;
    paymentId?: string;
    paymentStatus: 'pending' | 'paid' | 'failed';
    activatedAt?: Date;
  };
  
  createdAt?: Date;
  updatedAt?: Date;
}

// ============ VOUCHER PURCHASE & REDEMPTION ============

export interface VoucherPurchaseRequest {
  templateId: string;
  quantity: number;
  recipientName?: string;
  recipientEmail?: string;
  personalMessage?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  deliveryMethod: 'email' | 'physical';
  
  // Optional fields for arrangement-based vouchers
  customAmount?: number;
  arrangement?: Arrangement;
  eventType?: string; // weekday, weekend, matinee, etc.
  isGift?: boolean;
  shippingAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface VoucherPurchaseResponse {
  voucherId: string;
  paymentUrl: string;
  paymentId: string;
  temporaryCode?: string;
}

export interface VoucherValidationResult {
  isValid: boolean;
  voucher?: IssuedVoucher;
  remainingValue: number;
  expiryDate: Date;
  errorReason?: 'not_found' | 'expired' | 'used' | 'inactive';
}

export interface VoucherApplicationResult {
  success: boolean;
  newRemainingValue: number;
  discountApplied: number;
  voucher: IssuedVoucher;
}

export interface VoucherUsage {
  reservationId: string;
  eventDate: Date;
  amountUsed: number;
  usedAt: Date;
}

export interface VoucherStatusResponse {
  code: string;
  initialValue: number;
  remainingValue: number;
  status: 'active' | 'used' | 'expired' | 'pending_payment';
  expiryDate: Date;
  issueDate: Date;
  usageHistory: VoucherUsage[];
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