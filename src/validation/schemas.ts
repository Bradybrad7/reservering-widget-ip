import { z } from 'zod';
import { isValidEmail, isValidPhoneNumber, isValidPostalCode } from '../utils';

// Custom validators
const phoneNumberSchema = z.string()
  .min(1, 'Telefoonnummer is verplicht')
  .refine(isValidPhoneNumber, 'Vul een geldig telefoonnummer in');

const emailSchema = z.string()
  .min(1, 'E-mailadres is verplicht')
  .refine(isValidEmail, 'Vul een geldig e-mailadres in');

const postalCodeSchema = z.string()
  .min(1, 'Postcode is verplicht')
  .refine(isValidPostalCode, 'Vul een geldige postcode in (1234 AB)');

// Add-on schema
const addOnSchema = z.object({
  enabled: z.boolean(),
  quantity: z.number().min(0)
});

// Merchandise selection schema
const merchandiseSelectionSchema = z.object({
  itemId: z.string(),
  quantity: z.number().min(1, 'Aantal moet minimaal 1 zijn').max(99, 'Maximaal 99 stuks per item')
});

// Customer form validation schema
export const customerFormSchema = z.object({
  // Company/Personal details
  companyName: z.string().min(1, 'Bedrijfsnaam is verplicht'),
  salutation: z.enum(['', 'Dhr', 'Mevr']),
  contactPerson: z.string().min(1, 'Contactpersoon is verplicht'),
  
  // Address
  address: z.string().min(1, 'Adres is verplicht'),
  houseNumber: z.string().min(1, 'Huisnummer is verplicht'),
  postalCode: postalCodeSchema,
  city: z.string().min(1, 'Woonplaats is verplicht'),
  
  // Contact
  phone: phoneNumberSchema,
  email: emailSchema,
  
  // Booking details
  numberOfPersons: z.number()
    .min(1, 'Minimaal 1 persoon vereist')
    .max(300, 'Maximaal 300 personen mogelijk'),
  arrangement: z.enum(['standaard', 'premium']),
  
  // Add-ons
  preDrink: addOnSchema,
  afterParty: addOnSchema,
  
  // Merchandise
  merchandise: z.array(merchandiseSelectionSchema),
  
  // Special occasion
  partyPerson: z.string().optional(),
  
  // Optional fields
  comments: z.string().optional(),
  newsletterOptIn: z.boolean(),
  acceptTerms: z.boolean().refine(
    val => val === true, 
    'U moet akkoord gaan met de algemene voorwaarden'
  )
});

// Event validation schema (for admin)
export const eventSchema = z.object({
  date: z.date(),
  doorsOpen: z.string().regex(/^\d{2}:\d{2}$/, 'Gebruik HH:MM formaat'),
  startsAt: z.string().regex(/^\d{2}:\d{2}$/, 'Gebruik HH:MM formaat'),
  endsAt: z.string().regex(/^\d{2}:\d{2}$/, 'Gebruik HH:MM formaat'),
  type: z.enum(['REGULAR', 'MATINEE', 'CARE_HEROES', 'REQUEST', 'UNAVAILABLE']),
  capacity: z.number().min(1).max(500),
  bookingOpensAt: z.date().nullable(),
  bookingClosesAt: z.date().nullable(),
  allowedArrangements: z.array(z.enum(['standaard', 'premium'])),
  customPricing: z.object({
    standaard: z.number().min(0).optional(),
    premium: z.number().min(0).optional()
  }).optional(),
  notes: z.string().optional(),
  isActive: z.boolean()
});

// Pricing validation schema
export const pricingSchema = z.object({
  byDayType: z.object({
    weekday: z.object({
      standaard: z.number().min(0, 'Prijs moet minimaal €0 zijn'),
      premium: z.number().min(0, 'Prijs moet minimaal €0 zijn')
    }),
    weekend: z.object({
      standaard: z.number().min(0, 'Prijs moet minimaal €0 zijn'),
      premium: z.number().min(0, 'Prijs moet minimaal €0 zijn')
    }),
    matinee: z.object({
      standaard: z.number().min(0, 'Prijs moet minimaal €0 zijn'),
      premium: z.number().min(0, 'Prijs moet minimaal €0 zijn')
    }),
    careHeroes: z.object({
      standaard: z.number().min(0, 'Prijs moet minimaal €0 zijn'),
      premium: z.number().min(0, 'Prijs moet minimaal €0 zijn')
    })
  })
});

// Add-ons validation schema
export const addOnsSchema = z.object({
  preDrink: z.object({
    pricePerPerson: z.number().min(0, 'Prijs moet minimaal €0 zijn'),
    minPersons: z.number().min(1, 'Minimum aantal moet minimaal 1 zijn')
  }),
  afterParty: z.object({
    pricePerPerson: z.number().min(0, 'Prijs moet minimaal €0 zijn'),
    minPersons: z.number().min(1, 'Minimum aantal moet minimaal 1 zijn')
  })
});

// Global config validation schema
export const globalConfigSchema = z.object({
  maxCapacity: z.number().min(1).max(1000),
  currency: z.string().length(3),
  locale: z.string().min(2),
  timeZone: z.string().min(1),
  termsUrl: z.string().url('Vul een geldige URL in'),
  privacyUrl: z.string().url('Vul een geldige URL in'),
  colors: z.object({
    REGULAR: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Vul een geldige hex kleur in'),
    MATINEE: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Vul een geldige hex kleur in'),
    CARE_HEROES: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Vul een geldige hex kleur in'),
    REQUEST: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Vul een geldige hex kleur in'),
    UNAVAILABLE: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Vul een geldige hex kleur in')
  }),
  companyInfo: z.object({
    name: z.string().min(1, 'Bedrijfsnaam is verplicht'),
    address: z.string().min(1, 'Adres is verplicht'),
    phone: phoneNumberSchema,
    email: emailSchema
  })
});

// Booking rules validation schema
export const bookingRulesSchema = z.object({
  defaultOpenDaysBefore: z.number().min(1).max(365),
  defaultCutoffHoursBefore: z.number().min(0).max(8760), // Max 1 year in hours
  softCapacityWarningPercent: z.number().min(50).max(100),
  enableWaitlist: z.boolean()
});

// Type inference from schemas
export type CustomerFormData = z.infer<typeof customerFormSchema>;
export type EventData = z.infer<typeof eventSchema>;
export type PricingData = z.infer<typeof pricingSchema>;
export type AddOnsData = z.infer<typeof addOnsSchema>;
export type GlobalConfigData = z.infer<typeof globalConfigSchema>;
export type BookingRulesData = z.infer<typeof bookingRulesSchema>;

// Validation helper function
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((error: z.ZodIssue) => {
      const path = error.path.join('.');
      errors[path] = error.message;
    });
    return { success: false, errors };
  }
}

// Partial validation for form fields
export function validateField<T>(
  schema: z.ZodSchema<T>,
  fieldPath: string,
  value: unknown,
  context?: Partial<T>
): string | null {
  // Create a partial object with the field value
  const testData = { ...context, [fieldPath]: value };
  
  try {
    // Try to validate just this field by picking it from the schema
    const fieldSchema = (schema as any).shape?.[fieldPath];
    if (fieldSchema) {
      fieldSchema.parse(value);
    } else {
      // Fallback to full validation if field schema not accessible
      schema.parse(testData);
    }
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.issues.find((e: z.ZodIssue) => 
        e.path.length === 0 || e.path[0] === fieldPath
      );
      return fieldError?.message || null;
    }
    return null;
  }
}

// Custom validation for add-ons with minimum person requirements
export function validateAddOnQuantity(
  addOnType: 'preDrink' | 'afterParty',
  enabled: boolean,
  quantity: number,
  minPersons: number
): string | null {
  if (!enabled) return null;
  
  if (quantity < minPersons) {
    const addOnName = addOnType === 'preDrink' ? 'Voorborrel' : 'AfterParty';
    return `${addOnName} is alleen beschikbaar vanaf ${minPersons} personen`;
  }
  
  return null;
}

// Validate event capacity against existing reservations
export function validateEventCapacity(
  requestedPersons: number,
  remainingCapacity: number,
  eventType: string
): string | null {
  if (eventType === 'REQUEST') {
    return null; // No capacity check for request events
  }
  
  if (requestedPersons > remainingCapacity) {
    return `Niet genoeg plaatsen beschikbaar. Nog ${remainingCapacity} plaatsen beschikbaar.`;
  }
  
  return null;
}