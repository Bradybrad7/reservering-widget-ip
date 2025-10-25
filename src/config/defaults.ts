import type { 
  GlobalConfig, 
  Pricing, 
  AddOns, 
  BookingRules, 
  EventType,
  EventTypesConfig,
  WizardConfig
} from '../types';

// Default configuration
export const defaultConfig: GlobalConfig = {
  timeZone: 'Europe/Amsterdam',
  locale: 'nl-NL',
  currency: 'EUR',
  maxCapacity: 230,
  termsUrl: 'https://www.inspiration-point.nl/faq.html',
  privacyUrl: 'https://www.inspiration-point.nl/privacyverklaring',
  colors: {
    REGULAR: '#2563eb',     // Blue
    MATINEE: '#06b6d4',     // Cyan
    CARE_HEROES: '#10b981', // Green
    REQUEST: '#f59e0b',     // Orange
    UNAVAILABLE: '#9ca3af'  // Gray
  },
  companyInfo: {
    name: 'Inspiration Point',
    address: 'Adres nog in te vullen',
    phone: '+31 (0)xx xxx xxxx',
    email: 'info@inspiration-point.nl'
  }
} as const;

// Default pricing structure
// NOTE: These are fallback values. Actual pricing should be configured via admin panel.
// Keys should match event type keys (e.g., 'weekday', 'weekend', 'matinee', 'care_heroes')
export const defaultPricing: Pricing = {
  byDayType: {
    'weekday': { BWF: 70, BWFM: 85 },      // Doordeweeks (zo–do)
    'weekend': { BWF: 80, BWFM: 95 },      // Weekend (vr–za)
    'matinee': { BWF: 70, BWFM: 85 },      // Matinee voorstellingen
    'care_heroes': { BWF: 65, BWFM: 80 }   // Zorgzame Helden korting
  }
};

// Default add-ons
export const defaultAddOns: AddOns = {
  preDrink: { 
    pricePerPerson: 15, 
    minPersons: 25,
    description: 'Ontvang je gasten met een gezellige borrel voorafgaand aan het evenement'
  },
  afterParty: { 
    pricePerPerson: 15, 
    minPersons: 25,
    description: 'Verleng de avond met een naborrel na afloop van het evenement'
  }
} as const;

// Default merchandise items
export const defaultMerchandise = [
  {
    id: 'merch-shirt-1',
    name: 'Inspiration Point T-shirt',
    description: 'Zwart T-shirt met logo (S t/m XXL)',
    price: 25,
    category: 'clothing' as const,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    inStock: true
  },
  {
    id: 'merch-hoodie-1',
    name: 'Inspiration Point Hoodie',
    description: 'Zwarte hoodie met logo (S t/m XXL)',
    price: 45,
    category: 'clothing' as const,
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
    inStock: true
  },
  {
    id: 'merch-cap-1',
    name: 'Inspiration Point Pet',
    description: 'Zwarte pet met geborduurd logo',
    price: 20,
    category: 'accessories' as const,
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop',
    inStock: true
  },
  {
    id: 'merch-mug-1',
    name: 'Inspiration Point Mok',
    description: 'Keramische mok met logo',
    price: 12,
    category: 'accessories' as const,
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop',
    inStock: true
  },
  {
    id: 'merch-poster-1',
    name: 'Comedy Poster',
    description: 'A2 poster met iconische moment',
    price: 15,
    category: 'other' as const,
    imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
    inStock: true
  },
  {
    id: 'merch-bouquet-1',
    name: 'Bloemetje voor Feestvierder',
    description: 'Prachtig boeket om de feestvierder extra in het zonnetje te zetten',
    price: 35,
    category: 'other' as const,
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop',
    inStock: true
  }
] as const;

// Default booking rules
export const defaultBookingRules: BookingRules = {
  defaultOpenDaysBefore: 120,
  defaultCutoffHoursBefore: 72,
  softCapacityWarningPercent: 90,
  enableWaitlist: true,
  defaultCapacity: 230 // Default capacity for new events
} as const;

// Event type definitions and show times
export const eventTypeConfig = {
  REGULAR: {
    name: 'Reguliere Show',
    description: 'Standaard comedy show',
    defaultTimes: {
      doorsOpen: '19:00',
      startsAt: '20:00',
      endsAt: '22:30'
    },
    days: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
  },
  MATINEE: {
    name: 'Matinee',
    description: 'Middagvoorstelling (14:00–18:00)',
    defaultTimes: {
      doorsOpen: '13:30',
      startsAt: '14:00',
      endsAt: '18:00'
    },
    days: ['zondag']
  },
  CARE_HEROES: {
    name: 'Zorgzame Helden',
    description: 'Speciale voorstelling voor zorgmedewerkers',
    defaultTimes: {
      doorsOpen: '19:00',
      startsAt: '20:00',
      endsAt: '22:30'
    },
    days: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag']
  },
  REQUEST: {
    name: 'Op Aanvraag',
    description: 'Beperkte beschikbaarheid, neem contact op',
    defaultTimes: {
      doorsOpen: '19:00',
      startsAt: '20:00',
      endsAt: '22:30'
    },
    days: []
  },
  UNAVAILABLE: {
    name: 'Niet Beschikbaar',
    description: 'Geen voorstelling op deze datum',
    defaultTimes: {
      doorsOpen: '00:00',
      startsAt: '00:00',
      endsAt: '00:00'
    },
    days: []
  }
} as const;

// Default Event Types Configuration
export const getDefaultEventTypesConfig = (): EventTypesConfig => ({
  types: [
    {
      key: 'REGULAR',
      name: 'Reguliere Show',
      description: 'Standaard comedy show',
      color: '#F59E0B', // Amber/Gold
      defaultTimes: {
        doorsOpen: '19:00',
        startsAt: '20:00',
        endsAt: '22:30'
      },
      days: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
      enabled: true,
      showOnCalendar: false // REGULAR wordt niet getoond (is standaard)
    },
    {
      key: 'MATINEE',
      name: 'Matinee',
      description: 'Middagvoorstelling (14:00–18:00)',
      color: '#3B82F6', // Blue
      defaultTimes: {
        doorsOpen: '13:30',
        startsAt: '14:00',
        endsAt: '18:00'
      },
      days: ['zondag'],
      enabled: true,
      showOnCalendar: true // Matinee wel tonen (andere tijd/prijs)
    },
    {
      key: 'CARE_HEROES',
      name: 'Zorgzame Helden',
      description: 'Speciale voorstelling voor zorgmedewerkers',
      color: '#10B981', // Green
      defaultTimes: {
        doorsOpen: '19:00',
        startsAt: '20:00',
        endsAt: '22:30'
      },
      days: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag'],
      enabled: true,
      showOnCalendar: true // Speciale show, wel tonen
    },
    {
      key: 'REQUEST',
      name: 'Op Aanvraag',
      description: 'Beperkte beschikbaarheid, neem contact op',
      color: '#8B5CF6', // Purple
      defaultTimes: {
        doorsOpen: '19:00',
        startsAt: '20:00',
        endsAt: '22:30'
      },
      days: [],
      enabled: true,
      showOnCalendar: false // REQUEST niet tonen (op aanvraag)
    },
    {
      key: 'UNAVAILABLE',
      name: 'Niet Beschikbaar',
      description: 'Geen voorstelling op deze datum',
      color: '#6B7280', // Gray
      defaultTimes: {
        doorsOpen: '00:00',
        startsAt: '00:00',
        endsAt: '00:00'
      },
      days: [],
      enabled: true,
      showOnCalendar: false // Niet beschikbaar, niet tonen
    }
  ]
});

// Default Wizard Configuration
export const getDefaultWizardConfig = (): WizardConfig => ({
  steps: [
    { key: 'calendar', label: 'Datum', enabled: true, order: 1, required: true },
    { key: 'persons', label: 'Personen', enabled: true, order: 2, required: true },
    { key: 'package', label: 'Pakket & Opties', enabled: true, order: 3, required: true },
    { key: 'merchandise', label: 'Merchandise', enabled: true, order: 4, required: false },
    { key: 'contact', label: 'Contactgegevens', enabled: true, order: 5, required: true },
    { key: 'details', label: 'Extra Details', enabled: true, order: 6, required: true },
    { key: 'summary', label: 'Bevestigen', enabled: true, order: 7, required: true },
    { key: 'success', label: 'Voltooid', enabled: true, order: 8, required: true },
    { key: 'waitlistPrompt', label: 'Wachtlijst', enabled: true, order: 9, required: false },
    { key: 'waitlistSuccess', label: 'Wachtlijst Bevestigd', enabled: true, order: 10, required: false }
  ]
});

// Dutch translations and copy
export const nl = {
  // General
  loading: 'Laden...',
  saving: 'Opslaan...',
  error: 'Er is een fout opgetreden',
  success: 'Succesvol opgeslagen',
  required: 'Dit veld is verplicht',
  optional: 'Optioneel',
  cancel: 'Annuleren',
  save: 'Opslaan',
  edit: 'Bewerken',
  delete: 'Verwijderen',
  confirm: 'Bevestigen',
  close: 'Sluiten',
  
  // Calendar
  calendar: {
    title: 'Kies een datum',
    prevMonth: 'Vorige maand',
    nextMonth: 'Volgende maand',
    today: 'Vandaag',
    noEventsThisMonth: 'Geen voorstellingen deze maand',
    legend: 'Legenda',
    available: 'Beschikbaar',
    soldOut: 'Uitverkocht',
    almostFull: 'Bijna vol',
    notAvailable: 'Niet beschikbaar'
  },
  
  // Event types
  eventTypes: {
    REGULAR: 'Reguliere Show',
    MATINEE: 'Matinee (14:00-18:00)',
    CARE_HEROES: 'Zorgzame Helden',
    REQUEST: 'Op Aanvraag',
    UNAVAILABLE: 'Niet Beschikbaar'
  },
  
  // Arrangements
  arrangements: {
    BWF: 'Standaard Arrangement',
    BWFM: 'Deluxe Arrangement',
    bwfDescription: 'Bier, wijn, fris, port & Martini',
    bwfmDescription: 'Bier, wijn, fris, sterke drank, speciale bieren en bubbels van het huis'
  },
  
  // Form fields
  form: {
    companyName: {
      label: 'Bedrijfsnaam (optioneel)',
      placeholder: 'Vul uw bedrijfsnaam in'
    },
    salutation: {
      label: 'Aanhef',
      options: {
        '': 'Selecteer aanhef',
        'Dhr': 'Dhr.',
        'Mevr': 'Mevr.'
      }
    },
    contactPerson: {
      label: 'Contactpersoon',
      placeholder: 'Voor- en achternaam'
    },
    address: {
      label: 'Adres',
      placeholder: 'Straatnaam'
    },
    houseNumber: {
      label: 'Huisnummer',
      placeholder: '123'
    },
    postalCode: {
      label: 'Postcode',
      placeholder: '1234 AB'
    },
    city: {
      label: 'Woonplaats',
      placeholder: 'Stad'
    },
    phone: {
      label: 'Telefoonnummer',
      placeholder: '+31 6 12345678'
    },
    email: {
      label: 'E-mailadres',
      placeholder: 'naam@voorbeeld.nl'
    },
    numberOfPersons: {
      label: 'Aantal personen',
      placeholder: 'Minimaal 1 persoon'
    },
    arrangement: {
      label: 'Kies uw arrangement',
      placeholder: 'Selecteer arrangement'
    },
    preDrink: {
      label: 'Voorborrel',
      description: '€15 p.p. (vanaf 25 personen)',
      quantity: 'Aantal personen voorborrel'
    },
    afterParty: {
      label: 'AfterParty',
      description: '€15 p.p. (vanaf 25 personen)',
      quantity: 'Aantal personen afterparty'
    },
    comments: {
      label: 'Opmerkingen',
      placeholder: 'Heeft u nog bijzondere wensen of opmerkingen?'
    },
    newsletterOptIn: {
      label: 'Houd mij op de hoogte van nieuws en aanbiedingen'
    },
    acceptTerms: {
      label: 'Ik ga akkoord met de',
      linkText: 'Algemene voorwaarden'
    }
  },
  
  // Order summary
  summary: {
    title: 'Uw reservering',
    date: 'Datum',
    time: 'Tijd',
    persons: 'Aantal personen',
    arrangement: 'Arrangement',
    addOns: 'Extra\'s',
    preDrink: 'Voorborrel',
    afterParty: 'AfterParty',
    subtotal: 'Subtotaal',
    vat: 'BTW (21%)',
    total: 'Totaal',
    pricePerPerson: 'per persoon',
    reserve: 'Reserveren',
    calculating: 'Berekenen...'
  },
  
  // Validation messages
  validation: {
    required: 'Dit veld is verplicht',
    email: 'Vul een geldig e-mailadres in',
    phone: 'Vul een geldig telefoonnummer in',
    postalCode: 'Vul een geldige postcode in (1234 AB)',
    minPersons: 'Minimaal {min} personen vereist',
    maxPersons: 'Maximaal {max} personen mogelijk',
    minAddOnPersons: '{addOn} is alleen beschikbaar vanaf {min} personen',
    terms: 'U moet akkoord gaan met de algemene voorwaarden'
  },
  
  // Success message
  successPage: {
    title: 'Reservering verzonden!',
    message: 'Bedankt voor uw reservering. Je ontvangt binnen een week een boekingsbevestiging per e-mail. Check ook je spam.',
    backToCalendar: 'Nieuwe reservering',
    details: 'Details van uw reservering:'
  },
  
  // Error messages
  errors: {
    eventNotFound: 'Voorstelling niet gevonden',
    eventNotAvailable: 'Deze datum is niet meer beschikbaar',
    capacityExceeded: 'Niet genoeg plaatsen beschikbaar',
    cutoffReached: 'Reserveren voor deze datum is gesloten',
    networkError: 'Verbindingsfout. Probeer het opnieuw.',
    generalError: 'Er is een fout opgetreden. Probeer het opnieuw.'
  },
  
  // Admin interface
  admin: {
    title: 'Reserveringen Beheer',
    events: {
      title: 'Evenementen',
      add: 'Evenement Toevoegen',
      edit: 'Evenement Bewerken',
      delete: 'Evenement Verwijderen',
      export: 'Exporteer CSV',
      filters: 'Filters',
      noEvents: 'Geen evenementen gevonden'
    },
    settings: {
      title: 'Instellingen',
      pricing: 'Prijzen',
      addOns: 'Extra\'s',
      rules: 'Boekingsregels',
      company: 'Bedrijfsgegevens'
    },
    stats: {
      title: 'Statistieken',
      totalEvents: 'Totaal Evenementen',
      totalReservations: 'Totaal Reserveringen',
      totalRevenue: 'Totale Omzet',
      averageGroupSize: 'Gemiddelde Groepsgrootte'
    }
  }
} as const;

// Utility functions
export const getEventTypeColor = (type: EventType): string => {
  // For backwards compatibility, try defaultConfig.colors first
  // Otherwise return a default color
  return (defaultConfig.colors as any)[type] || defaultConfig.colors.REGULAR || '#FFD700';
};

export const getEventTypeName = (type: EventType): string => {
  // For backwards compatibility, try nl.eventTypes first
  // Otherwise return the type key in a readable format
  const translatedName = (nl.eventTypes as any)[type];
  if (translatedName) return translatedName;
  
  // Convert kebab-case or snake_case to Title Case
  return type
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const formatCurrency = (amount: number, locale = defaultConfig.locale): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: defaultConfig.currency
  }).format(amount);
};

export const formatDate = (date: Date, locale = defaultConfig.locale): string => {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const formatTime = (time: string): string => {
  return time;
};

// Country codes for phone numbers
export const phoneCountryCodes = [
  { code: '+31', country: 'Nederland', flag: '🇳🇱' },
  { code: '+32', country: 'België', flag: '🇧🇪' },
  { code: '+49', country: 'Duitsland', flag: '🇩🇪' },
  { code: '+33', country: 'Frankrijk', flag: '🇫🇷' },
  { code: '+44', country: 'Verenigd Koninkrijk', flag: '🇬🇧' },
  { code: '+34', country: 'Spanje', flag: '🇪🇸' },
  { code: '+39', country: 'Italië', flag: '🇮🇹' },
  { code: '+1', country: 'VS/Canada', flag: '🇺🇸' },
  { code: '+41', country: 'Zwitserland', flag: '🇨🇭' },
  { code: '+43', country: 'Oostenrijk', flag: '🇦🇹' },
  { code: '+45', country: 'Denemarken', flag: '🇩🇰' },
  { code: '+46', country: 'Zweden', flag: '🇸🇪' },
  { code: '+47', country: 'Noorwegen', flag: '🇳🇴' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+48', country: 'Polen', flag: '🇵🇱' },
  { code: '+420', country: 'Tsjechië', flag: '🇨🇿' },
] as const;

// Countries list
export const countries = [
  'Nederland',
  'België',
  'Duitsland',
  'Frankrijk',
  'Verenigd Koninkrijk',
  'Spanje',
  'Italië',
  'Verenigde Staten',
  'Canada',
  'Zwitserland',
  'Oostenrijk',
  'Denemarken',
  'Zweden',
  'Noorwegen',
  'Portugal',
  'Polen',
  'Tsjechië',
  'Luxemburg',
  'Ierland',
  'Finland',
  'Griekenland',
  'Turkije',
  'Andere',
] as const;