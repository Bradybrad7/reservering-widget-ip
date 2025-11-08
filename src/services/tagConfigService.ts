import type { ReservationTagConfig, OptionConfig, ReservationTag } from '../types';

/**
 * 🏷️ TAG CONFIGURATION SERVICE
 * 
 * Beheert tag configuraties, kleuren, en optie termijnen
 * Zorgt voor consistente styling en functionaliteit
 */
export class TagConfigService {
  
  // 🎨 DEFAULT TAG CONFIGURATIE met logische kleuren
  static getDefaultTagConfigs(): ReservationTagConfig[] {
    return [
      {
        id: 'GENODIGDE',
        label: 'Genodigde',
        description: 'Gratis boeking - gast van het theater',
        color: '#8B5CF6', // Purple
        icon: 'Gift',
        isDefault: true,
        isActive: true,
        category: 'guest'
      },
      {
        id: 'PERS',
        label: 'Pers',
        description: 'Media en journalisten',
        color: '#3B82F6', // Blue
        icon: 'Newspaper',
        isDefault: true,
        isActive: true,
        category: 'business'
      },
      {
        id: 'VIP',
        label: 'VIP',
        description: 'VIP gasten en belangrijke klanten',
        color: '#F59E0B', // Gold
        icon: 'Crown',
        isDefault: true,
        isActive: true,
        category: 'special'
      },
      {
        id: 'CREW',
        label: 'Crew',
        description: 'Theater crew en medewerkers',
        color: '#10B981', // Green
        icon: 'Users',
        isDefault: true,
        isActive: true,
        category: 'internal'
      },
      {
        id: 'SPONSOR',
        label: 'Sponsor',
        description: 'Theater sponsors en partners',
        color: '#EF4444', // Red
        icon: 'Handshake',
        isDefault: true,
        isActive: true,
        category: 'business'
      },
      {
        id: 'HERHALING',
        label: 'Herhaling',
        description: 'Terugkerende klant',
        color: '#06B6D4', // Cyan
        icon: 'RotateCcw',
        isDefault: false,
        isActive: true,
        category: 'guest'
      },
      {
        id: 'ZAKELIJK',
        label: 'Zakelijk',
        description: 'Zakelijke relatie',
        color: '#6366F1', // Indigo
        icon: 'Building',
        isDefault: false,
        isActive: true,
        category: 'business'
      },
      {
        id: 'FAMILIE',
        label: 'Familie',
        description: 'Familie/vrienden van theater',
        color: '#EC4899', // Pink
        icon: 'Heart',
        isDefault: false,
        isActive: true,
        category: 'internal'
      },
      {
        id: 'STUDENT',
        label: 'Student',
        description: 'Student met korting',
        color: '#14B8A6', // Teal
        icon: 'GraduationCap',
        isDefault: false,
        isActive: true,
        category: 'guest'
      },
      {
        id: 'SENIOR',
        label: 'Senior',
        description: 'Senior klant',
        color: '#F97316', // Orange
        icon: 'User',
        isDefault: false,
        isActive: true,
        category: 'guest'
      },
      {
        id: 'GROEP',
        label: 'Groep',
        description: 'Groepsboeking (10+ personen)',
        color: '#8B5A2B', // Brown
        icon: 'Users2',
        isDefault: false,
        isActive: true,
        category: 'business'
      },
      {
        id: 'LAST_MINUTE',
        label: 'Last Minute',
        description: 'Last minute boeking',
        color: '#DC2626', // Deep Red
        icon: 'Clock',
        isDefault: false,
        isActive: true,
        category: 'special'
      },
      {
        id: 'CELEBRATION',
        label: 'Iets te Vieren',
        description: 'Speciale gelegenheid (verjaardag, jubileum, etc.)',
        color: '#EC4899', // Pink/Magenta
        icon: 'PartyPopper',
        isDefault: false,
        isActive: true,
        category: 'special'
      },
      {
        id: 'MERCHANDISE',
        label: 'Merchandise',
        description: 'Klant heeft merchandise geboekt',
        color: '#8B5CF6', // Purple
        icon: 'ShoppingBag',
        isDefault: false,
        isActive: true,
        category: 'purchase'
      }
    ];
  }

  // ⏰ DEFAULT OPTIE TERMIJNEN met logische progressie
  static getDefaultOptionTerms(): OptionConfig[] {
    return [
      { 
        id: '3days', 
        label: '3 dagen', 
        days: 3, 
        color: '#EF4444' // Red - kort
      },
      { 
        id: '1week', 
        label: '1 week', 
        days: 7, 
        isDefault: true, 
        color: '#F59E0B' // Orange - standaard
      },
      { 
        id: '2weeks', 
        label: '2 weken', 
        days: 14, 
        color: '#10B981' // Green - goed
      },
      { 
        id: '3weeks', 
        label: '3 weken', 
        days: 21, 
        color: '#3B82F6' // Blue - ruim
      },
      { 
        id: '1month', 
        label: '1 maand', 
        days: 30, 
        color: '#8B5CF6' // Purple - lang
      },
      { 
        id: '2months', 
        label: '2 maanden', 
        days: 60, 
        color: '#EC4899' // Pink - zeer lang
      },
      { 
        id: 'custom', 
        label: 'Aangepast...', 
        days: 0, // Trigger custom date picker
        color: '#6B7280' // Gray - neutral
      }
    ];
  }

  // 🎨 Automatisch text kleur bepalen op basis van achtergrond
  static getContrastColor(hexColor: string): string {
    // Remove # if present
    const color = hexColor.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(color.slice(0, 2), 16);
    const g = parseInt(color.slice(2, 4), 16);
    const b = parseInt(color.slice(4, 6), 16);
    
    // Calculate luminance using relative luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black text for light backgrounds, white text for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  // 🔍 Get tag config by ID
  static getTagConfig(tagId: ReservationTag, customConfigs?: ReservationTagConfig[]): ReservationTagConfig | undefined {
    const allConfigs = customConfigs || this.getDefaultTagConfigs();
    return allConfigs.find(config => config.id === tagId);
  }

  // 🔍 Get tag config by string ID (helper for auto-tagging)
  static getTagById(tagId: string, customConfigs?: ReservationTagConfig[]): ReservationTagConfig | undefined {
    const allConfigs = customConfigs || this.getDefaultTagConfigs();
    return allConfigs.find(config => config.id === tagId);
  }

  // 📊 Get tags by category
  static getTagsByCategory(category: ReservationTagConfig['category'], customConfigs?: ReservationTagConfig[]): ReservationTagConfig[] {
    const allConfigs = customConfigs || this.getDefaultTagConfigs();
    return allConfigs.filter(config => config.category === category && config.isActive);
  }

  // ✨ Get default/featured tags for quick selection
  static getDefaultTags(customConfigs?: ReservationTagConfig[]): ReservationTagConfig[] {
    const allConfigs = customConfigs || this.getDefaultTagConfigs();
    return allConfigs.filter(config => config.isDefault && config.isActive);
  }

  // ⏰ Get option term config by ID
  static getOptionTermConfig(termId: string): OptionConfig | undefined {
    return this.getDefaultOptionTerms().find(term => term.id === termId);
  }

  // ⚡ Get default option duration (in days)
  static getDefaultOptionDuration(): number {
    // Try to get from configuration first
    try {
      // Import configStore dynamically to avoid circular dependencies
      const { useConfigStore } = require('../store/configStore');
      const { bookingRules } = useConfigStore.getState();
      if (bookingRules?.defaultOptionTermDays) {
        return bookingRules.defaultOptionTermDays;
      }
    } catch (error) {
      // Fallback if store is not available
    }
    
    // Fallback to default from option terms
    const defaultTerm = this.getDefaultOptionTerms().find(term => term.isDefault);
    return defaultTerm?.days || 7; // Ultimate fallback to 7 days
  }

  // ⚡ Get all available option durations (excluding custom)
  static getAvailableOptionDurations(): OptionConfig[] {
    return this.getDefaultOptionTerms().filter(term => term.days > 0);
  }

  // 📅 Calculate option expiry date
  static calculateOptionExpiryDate(termId: string, customDate?: Date): Date | null {
    if (termId === 'custom' && customDate) {
      return customDate;
    }
    
    const termConfig = this.getOptionTermConfig(termId);
    if (!termConfig || termConfig.days === 0) return null;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + termConfig.days);
    return expiryDate;
  }

  // ⏰ Get days until expiry (can be negative if expired)
  static getDaysUntilExpiry(expiryDate: Date | string): number {
    const expiry = new Date(expiryDate);
    const now = new Date();
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // ⚠️ Check if option is expiring soon
  static isOptionExpiringSoon(expiryDate: Date | string, warningDays: number = 2): boolean {
    const daysUntil = this.getDaysUntilExpiry(expiryDate);
    return daysUntil > 0 && daysUntil <= warningDays;
  }

  // ❌ Check if option has expired
  static isOptionExpired(expiryDate: Date | string): boolean {
    const daysUntil = this.getDaysUntilExpiry(expiryDate);
    return daysUntil < 0;
  }

  // 🎯 Get status color based on expiry
  static getExpiryStatusColor(expiryDate: Date | string): { color: string; status: string } {
    const daysUntil = this.getDaysUntilExpiry(expiryDate);
    
    if (daysUntil < 0) {
      return { color: '#DC2626', status: 'expired' }; // Red
    } else if (daysUntil <= 2) {
      return { color: '#EF4444', status: 'expiring-soon' }; // Red-orange
    } else if (daysUntil <= 7) {
      return { color: '#F59E0B', status: 'expiring-warning' }; // Orange
    } else {
      return { color: '#10B981', status: 'safe' }; // Green
    }
  }

  // 📝 Generate expiry status text
  static getExpiryStatusText(expiryDate: Date | string): string {
    const daysUntil = this.getDaysUntilExpiry(expiryDate);
    
    if (daysUntil < 0) {
      const daysAgo = Math.abs(daysUntil);
      return `VERLOPEN ${daysAgo} ${daysAgo === 1 ? 'dag' : 'dagen'} geleden`;
    } else if (daysUntil === 0) {
      return 'Verloopt vandaag';
    } else if (daysUntil === 1) {
      return '⚠️ Verloopt morgen';
    } else if (daysUntil <= 2) {
      return `⚠️ Verloopt over ${daysUntil} dagen`;
    } else {
      return `Verloopt over ${daysUntil} ${daysUntil === 1 ? 'dag' : 'dagen'}`;
    }
  }
}

export default TagConfigService;