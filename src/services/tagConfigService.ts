import type { ReservationTagConfig, OptionConfig, ReservationTag } from '../types';

/**
 * 🏷️ TAG CONFIGURATION SERVICE
 * 
 * Beheert tag configuraties, kleuren, en optie termijnen
 * Zorgt voor consistente styling en functionaliteit
 */
export class TagConfigService {
  
  // 🎨 DEFAULT TAG CONFIGURATIE - Alleen essentiële tags
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
        id: 'OPTIE',
        label: 'Optie',
        description: 'Optie/reservering - nog niet definitief',
        color: '#F59E0B', // Orange
        icon: 'Clock',
        isDefault: true,
        isActive: true,
        category: 'special'
      },
      {
        id: 'MPL',
        label: 'Mooie Plaatsen',
        description: 'Premium seating - speciale zitplaatsen',
        color: '#EC4899', // Pink/Magenta
        icon: 'Star',
        isDefault: true,
        isActive: true,
        category: 'special'
      },
      {
        id: 'MERCHANDISE',
        label: 'Merchandise',
        description: 'Merchandise bestelling',
        color: '#3B82F6', // Blue
        icon: 'ShoppingBag',
        isDefault: true,
        isActive: true,
        category: 'purchase'
      },
      {
        id: 'DIEET',
        label: 'Dieet',
        description: 'Speciale dieetwensen (vegetarisch, allergieën, etc.)',
        color: '#10B981', // Green
        icon: 'UtensilsCrossed',
        isDefault: true,
        isActive: true,
        category: 'special'
      },
      {
        id: 'VIERING',
        label: 'Viering',
        description: 'Iets te vieren (verjaardag, jubileum, etc.)',
        color: '#EF4444', // Red
        icon: 'PartyPopper',
        isDefault: true,
        isActive: true,
        category: 'special'
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