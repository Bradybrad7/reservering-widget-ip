/**
 * Error Messages Constants
 * Centrale plek voor alle error messages in het Nederlands
 */

export const ERROR_MESSAGES = {
  // Algemeen
  UNKNOWN_ERROR: 'Er is een onbekende fout opgetreden',
  NETWORK_ERROR: 'Netwerkfout - controleer je internetverbinding',
  TIMEOUT_ERROR: 'De actie duurde te lang - probeer het opnieuw',
  PERMISSION_DENIED: 'Je hebt geen toestemming voor deze actie',
  
  // Authenticatie
  AUTH_INVALID_CREDENTIALS: 'Ongeldig e-mailadres of wachtwoord',
  AUTH_NO_ADMIN_RIGHTS: 'Je hebt geen admin rechten',
  AUTH_SESSION_EXPIRED: 'Je sessie is verlopen - log opnieuw in',
  AUTH_UNAUTHORIZED: 'Je bent niet geautoriseerd',
  
  // Events
  EVENT_NOT_FOUND: 'Evenement niet gevonden',
  EVENT_CREATE_FAILED: 'Kan evenement niet aanmaken',
  EVENT_UPDATE_FAILED: 'Kan evenement niet bijwerken',
  EVENT_DELETE_FAILED: 'Kan evenement niet verwijderen',
  EVENT_ALREADY_FULL: 'Dit evenement is al vol',
  EVENT_DATE_PASSED: 'Dit evenement is al geweest',
  EVENT_TOO_SOON: 'Dit evenement kan niet meer geboekt worden (minder dan 2 dagen)',
  
  // Reserveringen
  RESERVATION_NOT_FOUND: 'Reservering niet gevonden',
  RESERVATION_CREATE_FAILED: 'Kan reservering niet aanmaken',
  RESERVATION_UPDATE_FAILED: 'Kan reservering niet bijwerken',
  RESERVATION_DELETE_FAILED: 'Kan reservering niet verwijderen',
  RESERVATION_INVALID_STATUS: 'Ongeldige reserveringsstatus',
  RESERVATION_DUPLICATE: 'Deze reservering bestaat al',
  RESERVATION_CAPACITY_EXCEEDED: 'Niet genoeg capaciteit beschikbaar',
  
  // Klanten
  CUSTOMER_NOT_FOUND: 'Klant niet gevonden',
  CUSTOMER_UPDATE_FAILED: 'Kan klantgegevens niet bijwerken',
  CUSTOMER_INVALID_EMAIL: 'Ongeldig e-mailadres',
  CUSTOMER_INVALID_PHONE: 'Ongeldig telefoonnummer',
  
  // Betalingen
  PAYMENT_REGISTER_FAILED: 'Kan betaling niet registreren',
  PAYMENT_INVALID_AMOUNT: 'Ongeldig bedrag',
  PAYMENT_REFUND_FAILED: 'Kan terugbetaling niet verwerken',
  PAYMENT_REFUND_EXCEEDS: 'Terugbetaling kan niet meer zijn dan betaald bedrag',
  
  // Email
  EMAIL_SEND_FAILED: 'Kan email niet verzenden',
  EMAIL_INVALID_ADDRESS: 'Ongeldig e-mailadres',
  EMAIL_TEMPLATE_NOT_FOUND: 'Email template niet gevonden',
  EMAIL_RATE_LIMIT: 'Te veel emails verzonden - probeer het later opnieuw',
  
  // Wachtlijst
  WAITLIST_ADD_FAILED: 'Kan niet toevoegen aan wachtlijst',
  WAITLIST_REMOVE_FAILED: 'Kan niet verwijderen van wachtlijst',
  WAITLIST_ALREADY_EXISTS: 'Al op de wachtlijst voor dit evenement',
  WAITLIST_TOKEN_EXPIRED: 'Je reserveringslink is verlopen',
  WAITLIST_TOKEN_USED: 'Deze reserveringslink is al gebruikt',
  
  // Vouchers
  VOUCHER_NOT_FOUND: 'Cadeaubon niet gevonden',
  VOUCHER_INVALID_CODE: 'Ongeldige cadeaubon code',
  VOUCHER_EXPIRED: 'Deze cadeaubon is verlopen',
  VOUCHER_ALREADY_USED: 'Deze cadeaubon is al gebruikt',
  VOUCHER_ISSUE_FAILED: 'Kan cadeaubon niet uitgeven',
  
  // Import/Export
  IMPORT_FAILED: 'Import mislukt',
  IMPORT_INVALID_FORMAT: 'Ongeldig bestandsformaat - gebruik CSV of Excel',
  IMPORT_MISSING_COLUMNS: 'Verplichte kolommen ontbreken',
  EXPORT_FAILED: 'Export mislukt',
  EXPORT_NO_DATA: 'Geen data om te exporteren',
  
  // Validatie
  VALIDATION_REQUIRED_FIELD: 'Dit veld is verplicht',
  VALIDATION_INVALID_DATE: 'Ongeldige datum',
  VALIDATION_DATE_IN_PAST: 'Datum kan niet in het verleden zijn',
  VALIDATION_INVALID_NUMBER: 'Ongeldig nummer',
  VALIDATION_NUMBER_TOO_LOW: 'Nummer is te laag',
  VALIDATION_NUMBER_TOO_HIGH: 'Nummer is te hoog',
  VALIDATION_INVALID_EMAIL: 'Ongeldig e-mailadres',
  VALIDATION_INVALID_PHONE: 'Ongeldig telefoonnummer',
  VALIDATION_MIN_LENGTH: (min: number) => `Minimaal ${min} karakters vereist`,
  VALIDATION_MAX_LENGTH: (max: number) => `Maximaal ${max} karakters toegestaan`,
  
  // Configuratie
  CONFIG_LOAD_FAILED: 'Kan configuratie niet laden',
  CONFIG_SAVE_FAILED: 'Kan configuratie niet opslaan',
  CONFIG_INVALID: 'Ongeldige configuratie',
  
  // Storage
  STORAGE_QUOTA_EXCEEDED: 'Opslaglimiet bereikt',
  STORAGE_READ_FAILED: 'Kan data niet laden',
  STORAGE_WRITE_FAILED: 'Kan data niet opslaan',
} as const;

export const SUCCESS_MESSAGES = {
  // Events
  EVENT_CREATED: 'Evenement succesvol aangemaakt',
  EVENT_UPDATED: 'Evenement succesvol bijgewerkt',
  EVENT_DELETED: 'Evenement succesvol verwijderd',
  
  // Reserveringen
  RESERVATION_CREATED: 'Reservering succesvol aangemaakt',
  RESERVATION_UPDATED: 'Reservering succesvol bijgewerkt',
  RESERVATION_CONFIRMED: 'Reservering bevestigd',
  RESERVATION_CANCELLED: 'Reservering geannuleerd',
  
  // Klanten
  CUSTOMER_UPDATED: 'Klantgegevens bijgewerkt',
  
  // Betalingen
  PAYMENT_REGISTERED: 'Betaling geregistreerd',
  PAYMENT_REFUNDED: 'Terugbetaling verwerkt',
  
  // Email
  EMAIL_SENT: 'Email verzonden',
  EMAIL_SCHEDULED: 'Email ingepland',
  
  // Wachtlijst
  WAITLIST_ADDED: 'Toegevoegd aan wachtlijst',
  WAITLIST_REMOVED: 'Verwijderd van wachtlijst',
  WAITLIST_CONVERTED: 'Wachtlijst omgezet naar reservering',
  
  // Import/Export
  IMPORT_SUCCESS: (count: number) => `${count} item(s) succesvol geïmporteerd`,
  EXPORT_SUCCESS: 'Export succesvol',
  
  // Configuratie
  CONFIG_SAVED: 'Instellingen opgeslagen',
  CONFIG_RESET: 'Instellingen gereset naar standaard',
} as const;

export const WARNING_MESSAGES = {
  // Capaciteit
  CAPACITY_LOW: 'Weinig plaatsen beschikbaar',
  CAPACITY_ALMOST_FULL: 'Bijna vol',
  
  // Betalingen
  PAYMENT_OVERDUE: 'Betaling is verlopen',
  PAYMENT_REMINDER_SENT: 'Betalingsherinnering verzonden',
  
  // Evenementen
  EVENT_STARTING_SOON: 'Evenement begint binnenkort',
  EVENT_NO_RESERVATIONS: 'Geen reserveringen voor dit evenement',
  
  // Data
  DATA_STALE: 'Data kan verouderd zijn - ververs de pagina',
  DATA_SYNCING: 'Data wordt gesynchroniseerd',
} as const;

// Helper types
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
export type SuccessMessageKey = keyof typeof SUCCESS_MESSAGES;
export type WarningMessageKey = keyof typeof WARNING_MESSAGES;
