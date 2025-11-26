// Import email types
import type { EmailLog, EmailSettings, WaitlistBookingToken } from './email';

// Re-export email types for convenience
export type { EmailLog, EmailSettings, EmailTypeToggles, EmailTemplate, EmailType, EmailTrigger, EmailStatus, WaitlistBookingToken } from './email';

// Core enums and types
// EventType is now dynamic and matches event type keys from configuration
// Common types: 'weekday', 'weekend', 'matinee', 'care_heroes', 'special_event', etc.
export type EventType = string;
export type Arrangement = 'standaard' | 'premium';
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
  | 'option'        // 🆕 Temporary hold (1 week) - minimal info, counts toward capacity
  | 'no-show';      // 🚫 Customer did not show up (November 2025)

// ✨ Uitgebreid Reservation Tags systeem met configuratie
export type ReservationTag = 
  | 'GENODIGDE'     // Gratis boeking (€0) - gasten van het theater
  | 'OPTIE'         // Optie/reservering (nog niet definitief)
  | 'MPL'           // Mooie Plaatsen - premium seating
  | 'MERCHANDISE'   // Merchandise bestelling
  | 'DIEET'         // Speciale dieetwensen
  | 'VIERING'       // Iets te vieren (verjaardag, jubileum, etc.)
  | string;         // Custom tags toegestaan

// ✨ Tag configuratie voor kleuren en metadata
export interface ReservationTagConfig {
  id: ReservationTag;
  label: string;
  description: string;
  color: string; // Hex color code
  textColor?: string; // Text color (auto-calculated if not provided)
  icon?: string; // Lucide icon name
  isDefault: boolean; // Appears in quick-select
  isActive: boolean;
  category: 'guest' | 'business' | 'special' | 'internal' | 'purchase';
  createdAt?: Date;
  updatedAt?: Date;
}

// ✨ Optie configuratie uitgebreid
export interface OptionConfig {
  id: string;
  label: string;
  days: number;
  isDefault?: boolean;
  color?: string; // Voor visuele feedback
}

// ✨ Globale tag configuratie
export interface TagsConfig {
  tags: ReservationTagConfig[];
  optionTerms: OptionConfig[];
  defaultOptionTerm: number; // Dagen
}

// ✨ NEW: Payment Status (October 2025)
// This tracks the financial status INDEPENDENTLY from booking status
// A reservation can be 'confirmed' (seat reserved) but 'pending' payment
export type PaymentStatus = 
  | 'pending'         // Invoice sent, awaiting payment
  | 'paid'            // Payment received and confirmed
  | 'overdue'         // Payment deadline passed
  | 'refunded'        // Payment was refunded
  | 'not_applicable'; // E.g., free event, voucher, or comp ticket

// 💰 FINANCIAL SYSTEM V2 (November 12, 2025)
// Gescheiden Payment en Refund types voor beter grootboek-beheer

// Payment Methods
export type PaymentMethod = 
  | 'ideal'         // iDEAL (meest gebruikt)
  | 'bank_transfer' // Bankoverschrijving
  | 'pin'           // Pinterminal
  | 'cash'          // Contant
  | 'invoice'       // Factuur (betaling volgt later)
  | 'voucher'       // Voucher/cadeaubon
  | 'other';        // Overig

// 💰 Payment - Inkomende betalingen
export interface Payment {
  id: string;                    // Unique payment ID (e.g., "pay_123")
  amount: number;                // Bedrag in euros (altijd positief)
  date: Date;                    // Betaaldatum
  method: PaymentMethod;         // Betaalmethode
  reference?: string;            // Transactie-ID, factuurnummer, voucher-code
  note?: string;                 // Interne notitie over deze betaling
  processedBy?: string;          // Admin die betaling registreerde
  category?: 'arrangement' | 'merchandise' | 'full' | 'other'; // 🆕 Voor deelbetalingen
}

// Refund Reasons
export type RefundReason = 
  | 'cancellation'   // Annulering door klant
  | 'rebooking'      // Overboeking naar andere datum
  | 'goodwill'       // Coulance/goodwill
  | 'discount'       // Korting achteraf toegepast
  | 'overpayment'    // Te veel betaald
  | 'other';         // Overige reden

// 💰 Refund - Uitgaande restituties
export interface Refund {
  id: string;                    // Unique refund ID (e.g., "ref_123")
  amount: number;                // Bedrag in euros (altijd positief)
  date: Date;                    // Restitutiedatum
  reason: RefundReason;          // Reden voor restitutie
  method: PaymentMethod;         // Methode van terugbetaling (vaak 'bank_transfer')
  reference?: string;            // Transactie-ID van de restitutie
  note?: string;                 // Interne notitie (ZEER BELANGRIJK voor audit trail)
  processedBy?: string;          // Admin die restitutie verwerkte
}

// DEPRECATED: PaymentTransaction - Wordt vervangen door Payment + Refund
// Behouden voor backward compatibility
export interface PaymentTransaction {
  id: string;
  date: Date;
  type: 'payment' | 'refund';
  amount: number;
  method: PaymentMethod;
  notes?: string;
  processedBy?: string;
  referenceNumber?: string;
}

// 💰 Payment Summary - Berekende betalingsstatus
export interface PaymentSummary {
  totalPrice: number;           // Totale prijs van reservering
  totalPaid: number;            // Som van alle payments
  totalRefunded: number;        // Som van alle refunds
  balance: number;              // Restbedrag: totalPrice - totalPaid + totalRefunded
  netRevenue: number;           // Netto inkomsten: totalPaid - totalRefunded
  status: 'unpaid' | 'partial' | 'paid' | 'overpaid' | 'overdue';
  dueDate?: Date;               // Wanneer moet betaald zijn
  daysUntilDue?: number;        // Aantal dagen tot deadline (negatief = te laat)
  isOverdue: boolean;           // Is de deadline verstreken?
  payments: Payment[];          // Alle betalingen
  refunds: Refund[];            // Alle restituties
}

// Wizard step types
export type StepKey = 
  | 'calendar' 
  | 'persons'
  | 'package' // ✨ Gecombineerde stap voor arrangement + borrels
  | 'merchandise' // 🛍️ Optionele merchandise stap
  | 'contact' // ✨ Essentiële contactgegevens (naam, bedrijf, email, telefoon)
  | 'details' // ✨ Extra details (adres, factuur, dieetwensen)
  | 'summary'
  | 'success'
  | 'waitlistPrompt'
  | 'waitlistSuccess';

// 📞 Prefilled Contact Data - Voor manual booking en import wizard
export interface PrefilledContact {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
}

// Show interface
export interface Show {
  id: string;
  name: string;
  description?: string; // ✨ Korte omschrijving van de show
  logoUrl?: string;     // ✨ URL naar het show logo/afbeelding
  imageUrl?: string;    // Deprecated - gebruik logoUrl
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
  standaard: number;
  premium: number;
}

export interface Pricing {
  byDayType: {
    [key: string]: PricingByDayType; // Dynamic keys based on event types
  };
  // ✨ NEW: Control which arrangements are available for voucher purchase
  voucherSettings?: {
    standaard: {
      available: boolean;
      description?: string; // What's included in this arrangement
    };
    premium: {
      available: boolean;
      description?: string;
    };
  };
  // ✨ NEW: Per event type voucher configuration
  voucherAvailability?: {
    [eventType: string]: { // e.g., 'weekday', 'weekend', 'matinee'
      displayName?: string; // Custom name for voucher display (e.g., "Weekendshow" instead of "weekend")
      standaard?: boolean; // Is standaard available for this event type?
      premium?: boolean; // Is premium available for this event type?
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
  // ✨ NEW: Voucher-specific settings
  voucherShippingCost?: number; // Verzendkosten voor vouchers (default: 3.95)
  // ✨ NEW: Email settings
  emailSettings?: EmailSettings; // Email toggle configuration
}

// Booking rules
export interface BookingRules {
  defaultOpenDaysBefore: number;
  defaultCutoffHoursBefore: number;
  softCapacityWarningPercent: number;
  enableWaitlist: boolean;
  defaultCapacity: number; // Default capacity for new events (e.g., 230)
  defaultOptionTermDays: number; // Default option duration in days (e.g., 7)
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
  // 🆕 SIMPEL PRICING SYSTEEM - Vaste prijzen per event type!
  pricing: {
    standaard: number;
    premium: number;
  };
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
  customCountry?: string; // For "other" country selection
  
  // Invoice Address (for businesses)
  invoiceAddress?: string;
  invoiceHouseNumber?: string;
  invoicePostalCode?: string;
  invoiceCity?: string;
  invoiceCountry?: string;
  invoiceInstructions?: string;
  
  // Contact
  phoneCountryCode: string;
  customCountryCode?: string; // For "other" country selection
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
  
  // Special occasion / celebration
  partyPerson?: string;
  celebrationOccasion?: string; // What are they celebrating (verjaardag, jubileum, etc)
  celebrationDetails?: string;  // Additional celebration details
  
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
  
  // 💰 FINANCIAL SYSTEM V2 (November 12, 2025)
  // Gescheiden grootboek voor betalingen en restituties
  
  // DEPRECATED: paymentStatus - Now derived from payments/refunds
  paymentStatus?: PaymentStatus;    // Behouden voor backward compatibility
  
  // Factuur informatie
  invoiceNumber?: string;           // Invoice reference number
  paymentDueDate?: Date;            // When payment is expected
  
  // 💰 HET GROOTBOEK: Alle financiële transacties per reservering
  payments: Payment[];              // Alle inkomende betalingen
  refunds: Refund[];                // Alle uitgaande restituties
  
  // DEPRECATED: paymentTransactions - Vervangen door payments + refunds
  paymentTransactions?: PaymentTransaction[]; // Backward compatibility
  
  createdAt: Date;
  updatedAt: Date;
  isArchived?: boolean; // NEW: For archiving cancelled/rejected bookings
  archivedAt?: Date; // NEW: When it was archived
  archivedBy?: string; // NEW: Who archived it
  tags?: ReservationTag[]; // ✨ Speciale categorieën: GENODIGDE, PERS, VIP, CREW, etc.
  communicationLog?: CommunicationLog[];
  notes?: string; // Admin notes
  rejectionReason?: string; // Reason for rejection (when status = 'rejected')
  checkedInAt?: Date; // NEW: Check-in timestamp
  checkedInBy?: string; // NEW: Who performed the check-in
  emailLog?: EmailLog[]; // ✨ NEW: Email history for this reservation
  
  // 🏓 TABLE NUMBER & CHECK-IN SYSTEM (November 2025)
  // First booking of the day = Table 1, second = Table 2, etc.
  // Critical for check-in process and PDF exports
  tableNumber?: number; // Auto-assigned, sequential per event
  checkInTime?: Date; // When guest checked in
  checkInNote?: string; // Optional note during check-in
  actualPersons?: number; // Actual number of guests who showed up
  specialRequests?: string; // Special requests/allergies (from dietary requirements)
  adminNotes?: string; // Important admin notes (replaces notes for clarity)
  
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

// 🗄️ ARCHIVED RECORD (November 12, 2025)
// Onveranderbaar snapshot van een gearchiveerde reservering
// Dit is het "Data Vault" systeem - complete financiële geschiedenis behouden
export interface ArchivedRecord {
  // Basis archief metadata
  id: string;                       // Original reservation ID
  archivedAt: Date;                 // Wanneer gearchiveerd
  archivedBy: string;               // Admin die archiveerde
  archiveReason: string;            // Reden voor archivering
  
  // Snapshot van de originele reservering data
  reservation: {
    // Klant informatie
    companyName: string;
    contactPerson: string;
    email: string;
    phone?: string;
    
    // Boeking details
    eventId: string;
    eventDate: Date;
    eventType: string;              // Snapshot van event.type
    showName?: string;              // Snapshot van show.name
    numberOfPersons: number;
    arrangement: Arrangement;
    
    // Status en timestamps
    status: ReservationStatus;
    createdAt: Date;
    updatedAt: Date;
    
    // Optionele details
    merchandise?: any[];
    tags?: ReservationTag[];
    notes?: string;
    tableNumber?: number;
  };
  
  // 💰 HET FINANCIËLE GROOTBOEK - De kern van het archiefsysteem
  // Dit is de onveranderbare bewijslast van alle financiële transacties
  financials: {
    // Basis bedragen
    totalPrice: number;             // Originele prijs van de reservering
    
    // Afgeleide totalen (berekend bij archivering)
    totalPaid: number;              // Som van alle payments
    totalRefunded: number;          // Som van alle refunds
    netRevenue: number;             // totalPaid - totalRefunded (daadwerkelijke inkomsten)
    
    // De volledige transactie geschiedenis (onveranderbaar)
    payments: Payment[];            // Alle inkomende betalingen
    refunds: Refund[];              // Alle uitgaande restituties
    
    // Factuur informatie
    invoiceNumber?: string;
    paymentDueDate?: Date;
  };
  
  // Communicatie geschiedenis
  communication: {
    emailsSent: number;             // Aantal verzonden emails
    emailLog?: EmailLog[];          // Volledige email geschiedenis
    communicationLog?: CommunicationLog[]; // Alle interacties
  };
  
  // Zoekbare metadata voor de "Super-Search"
  searchMetadata: {
    keywords: string[];             // Voor full-text search
    paymentReferences: string[];    // Alle payment references (voor zoeken op iDEAL-ID)
    refundReferences: string[];     // Alle refund references
    hasRefunds: boolean;            // Quick filter
    isFullyRefunded: boolean;       // totalRefunded >= totalPaid
    hasOutstandingBalance: boolean; // netRevenue < totalPrice
  };
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
  emailLog?: EmailLog[]; // ✨ NEW: Email history for waitlist communications
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

// ✨ NEW: Paginated API Response
export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  error?: string;
  message?: string;
}

// ✨ NEW: Query Options for Pagination & Filtering
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReservationQueryOptions extends QueryOptions {
  status?: ReservationStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  eventId?: string;
  arrangement?: Arrangement | 'all';
  searchQuery?: string;
}

export interface EventQueryOptions extends QueryOptions {
  type?: EventType | 'all';
  isActive?: boolean | 'all';
  showId?: string;
}

// Price calculation
export interface PriceCalculation {
  basePrice: number;
  arrangementPrice?: number; // 💰 Total arrangement price (for admin override calculations)
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
  phone?: string; // Phone number from most recent reservation
  totalBookings: number;
  totalSpent: number;
  lastBooking: Date;
  firstBooking: Date;
  tags: string[];
  notes?: string; // Admin notes about this customer
  customerNotes?: string; // Dedicated field for CRM notes
  reservations: Reservation[];
  averageGroupSize: number;
  preferredArrangement?: Arrangement;
  // Additional CRM fields
  vipStatus?: boolean;
  lifetimeValue?: number; // Calculated from totalSpent
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
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
// ✨ OPERATIONS CONTROL CENTER (Nov 2025)
// Combined operations hub for 80% of daily tasks
// Reduced from 30+ items to 9 logical groups + unified operations center
// Sub-pages implemented as tabs within main components
export type AdminSection = 
  | 'dashboard'      // Home overview
  | 'operations'     // 🆕 RESERVERINGEN - Unified hub for reservations, waitlist, customers, payments
  | 'calendar'       // 🆕 CALENDAR MANAGER - Kalender sync met boekingspagina + bulk toevoegen + wachtlijst beheer (replaces agenda & events)
  | 'events'         // DEPRECATED: use 'calendar'
  | 'reservations'   // All reservations with filter tabs (all, pending, confirmed, cancelled) - DEPRECATED: use 'operations'
  | 'waitlist'       // Waitlist management (separate workflow) - DEPRECATED: use 'operations'
  | 'payments'       // Payment overview & deadline management - DEPRECATED: use 'operations'
  | 'archive'        // Archived/deleted reservations
  | 'checkin'        // Check-in system (day-of workflow)
  | 'customers'      // CRM & customer management - DEPRECATED: use 'operations'
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
  code: Arrangement; // 'standaard' | 'premium'
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

// 🎟️ Voucher Status Types - Admin Approval Workflow
export type VoucherOrderStatus = 
  | 'pending_approval'  // 🆕 NEW: Waiting for admin to review and approve
  | 'pending_payment'   // Approved, waiting for customer payment
  | 'active'            // Paid and ready to use
  | 'used'              // Fully redeemed
  | 'cancelled'         // Cancelled by admin or customer
  | 'expired';          // Expired without being used

// Issued Voucher (Actual voucher given to customer)
// 🆕 NOW ALSO SERVES AS ORDER/REQUEST BEFORE APPROVAL
export interface IssuedVoucher {
  id: string;
  code?: string; // 🆕 OPTIONAL: Only generated AFTER admin approval
  templateId?: string; // Links to VoucherTemplate (optional for arrangement-based vouchers)
  
  // Core voucher info
  issuedTo: string; // Name or email
  issueDate: Date | string;
  expiryDate?: Date | string; // Only set after approval
  initialValue: number;
  remainingValue: number;
  
  // 🆕 NEW: Status-driven workflow
  status: VoucherOrderStatus;
  
  usedInReservationIds?: string[]; // Track where it was used
  
  // 🆕 EXTENDED: Complete order metadata (all form data)
  metadata: {
    // Buyer information (always required)
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    
    // Gift information (optional)
    isGift?: boolean;
    recipientName?: string;
    recipientEmail?: string;
    personalMessage?: string;
    
    // Delivery information
    deliveryMethod: 'email' | 'shipping' | 'pickup';
    shippingAddress?: string;
    shippingCity?: string;
    shippingPostalCode?: string;
    shippingCountry?: string;
    
    // Order details
    quantity: number;
    
    // Arrangement-based voucher details (if applicable)
    arrangement?: Arrangement; // 'standaard' | 'premium'
    arrangementName?: string; // Display name
    eventType?: string; // 'weekday', 'weekend', 'matinee', etc.
    eventTypeName?: string; // Display name
    
    // Payment tracking
    paymentId?: string;
    paymentStatus?: 'pending' | 'paid' | 'failed';
    paidAt?: Date;
    
    // Activation tracking
    activatedAt?: Date;
    approvedAt?: Date; // 🆕 When admin approved
    approvedBy?: string; // 🆕 Admin who approved
    
    // Shipping cost
    shippingCost?: number;
    
    // Total amount
    totalAmount: number; // quantity * value + shipping
  };
  
  createdAt?: Date;
  updatedAt?: Date;
  
  // Admin notes
  adminNotes?: string;
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

// ✨ Voucher Configuration Settings
export interface VoucherSettings {
  globalStandaardEnabled: boolean;        // Global toggle for standaard arrangements
  globalPremiumEnabled: boolean;       // Global toggle for premium arrangements
  perEventType: {                   // Per-event-type overrides
    [eventTypeKey: string]: {
      standaard?: boolean;                // undefined = use global, false = disabled, true = enabled
      premium?: boolean;
    };
  };
}

// ✨ Capacity Override Configuration
export interface CapacityOverride {
  eventId: string;
  originalCapacity: number;
  overrideCapacity: number;
  reason: string;
  enabled: boolean;
  createdAt: Date;
}

// ✨ Capacity Overrides Map (keyed by eventId)
export type CapacityOverridesMap = Record<string, CapacityOverride>;

// ✨ Backup Data Structure
export interface BackupData {
  config?: GlobalConfig;
  pricing?: Pricing;
  addOns?: AddOns;
  bookingRules?: BookingRules;
  merchandise?: MerchandiseItem[];
  version: string;
  exportDate: string;
  backend: 'firestore' | 'localStorage';
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