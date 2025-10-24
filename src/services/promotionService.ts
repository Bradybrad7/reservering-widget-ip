import type { PromotionCode, Voucher, Event, Arrangement } from '../types';
import { localStorageService } from './localStorageService';

/**
 * 🎟️ PROMOTION & VOUCHER SERVICE
 * 
 * Handles validation and application of:
 * - Promotion codes (percentage or fixed discounts)
 * - Vouchers/Gift cards (prepaid value)
 * 
 * Features:
 * - Code validation (expiry, usage limits, applicability)
 * - Discount calculation
 * - Usage tracking
 * - Admin CRUD operations
 */

export interface DiscountResult {
  isValid: boolean;
  errorMessage?: string;
  discountAmount?: number;
  discountType?: 'percentage' | 'fixed' | 'per_person' | 'per_arrangement';
  code?: PromotionCode | Voucher;
}

class PromotionService {
  private readonly PROMOTION_CODES_KEY = 'promotionCodes';
  private readonly VOUCHERS_KEY = 'vouchers';

  // ===== PROMOTION CODES =====

  /**
   * Validate and apply a promotion code
   */
  validatePromotionCode(
    code: string,
    subtotal: number,
    event?: Event,
    arrangement?: Arrangement,
    numberOfPersons?: number,
    numberOfArrangements?: number
  ): DiscountResult {
    const promotionCodes = this.getAllPromotionCodes();
    const promo = promotionCodes.find(
      p => p.code.toLowerCase() === code.toLowerCase() && p.isActive
    );

    if (!promo) {
      return {
        isValid: false,
        errorMessage: 'Ongeldige kortingscode'
      };
    }

    // Check date validity
    const now = new Date();
    if (now < new Date(promo.validFrom) || now > new Date(promo.validUntil)) {
      return {
        isValid: false,
        errorMessage: 'Deze kortingscode is verlopen'
      };
    }

    // Check usage limits
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return {
        isValid: false,
        errorMessage: 'Deze kortingscode is niet meer geldig (maximaal gebruik bereikt)'
      };
    }

    // Check minimum booking amount
    if (promo.minBookingAmount && subtotal < promo.minBookingAmount) {
      return {
        isValid: false,
        errorMessage: `Minimaal bestelbedrag voor deze code is €${promo.minBookingAmount.toFixed(2)}`
      };
    }

    // Check applicability to event type
    if (promo.applicableTo?.eventTypes && event) {
      if (!promo.applicableTo.eventTypes.includes(event.type)) {
        return {
          isValid: false,
          errorMessage: 'Deze kortingscode is niet geldig voor dit evenement'
        };
      }
    }

    // Check applicability to arrangement
    if (promo.applicableTo?.arrangements && arrangement) {
      if (!promo.applicableTo.arrangements.includes(arrangement)) {
        return {
          isValid: false,
          errorMessage: 'Deze kortingscode is niet geldig voor dit arrangement'
        };
      }
    }

    // Calculate discount
    const discountAmount = this.calculatePromotionDiscount(
      promo, 
      subtotal, 
      numberOfPersons || 0,
      numberOfArrangements || 1
    );

    return {
      isValid: true,
      discountAmount,
      discountType: promo.type,
      code: promo
    };
  }

  /**
   * Calculate discount amount from promotion code
   */
  private calculatePromotionDiscount(
    promo: PromotionCode, 
    subtotal: number,
    numberOfPersons: number,
    numberOfArrangements: number
  ): number {
    switch (promo.type) {
      case 'percentage':
        return (subtotal * promo.value) / 100;
      
      case 'fixed':
        return Math.min(promo.value, subtotal);
      
      case 'per_person':
        const perPersonDiscount = promo.value * numberOfPersons;
        return Math.min(perPersonDiscount, subtotal);
      
      case 'per_arrangement':
        const perArrangementDiscount = promo.value * numberOfArrangements;
        return Math.min(perArrangementDiscount, subtotal);
      
      default:
        return 0;
    }
  }

  /**
   * Apply a promotion code (increment usage counter)
   */
  applyPromotionCode(code: string): void {
    const promotionCodes = this.getAllPromotionCodes();
    const promo = promotionCodes.find(p => p.code.toLowerCase() === code.toLowerCase());
    
    if (promo) {
      promo.usedCount++;
      this.savePromotionCodes(promotionCodes);
    }
  }

  // ===== VOUCHERS =====

  /**
   * Validate and apply a voucher/gift card
   */
  validateVoucher(code: string, totalAmount: number): DiscountResult {
    const vouchers = this.getAllVouchers();
    const voucher = vouchers.find(
      v => v.code.toLowerCase() === code.toLowerCase() && v.isActive
    );

    if (!voucher) {
      return {
        isValid: false,
        errorMessage: 'Ongeldige vouchercode'
      };
    }

    // Check date validity
    const now = new Date();
    if (now < new Date(voucher.validFrom) || now > new Date(voucher.validUntil)) {
      return {
        isValid: false,
        errorMessage: 'Deze voucher is verlopen'
      };
    }

    // Check if voucher has remaining value
    if (voucher.value <= 0) {
      return {
        isValid: false,
        errorMessage: 'Deze voucher heeft geen saldo meer'
      };
    }

    let discountAmount: number;

    if (voucher.type === 'gift_card') {
      // Gift card: use remaining value, up to total amount
      discountAmount = Math.min(voucher.value, totalAmount);
    } else {
      // Discount code
      if (voucher.discountType === 'percentage') {
        discountAmount = (totalAmount * voucher.value) / 100;
      } else {
        discountAmount = Math.min(voucher.value, totalAmount);
      }
    }

    return {
      isValid: true,
      discountAmount,
      discountType: voucher.type === 'gift_card' ? 'fixed' : voucher.discountType,
      code: voucher
    };
  }

  /**
   * Apply a voucher (deduct from remaining value, log usage)
   */
  applyVoucher(code: string, amountUsed: number, reservationId: string): void {
    const vouchers = this.getAllVouchers();
    const voucher = vouchers.find(v => v.code.toLowerCase() === code.toLowerCase());
    
    if (voucher && voucher.type === 'gift_card') {
      voucher.value -= amountUsed;
      voucher.usageHistory.push({
        reservationId,
        usedAt: new Date(),
        amountUsed
      });
      this.saveVouchers(vouchers);
    }
  }

  // ===== ADMIN: PROMOTION CODES CRUD =====

  getAllPromotionCodes(): PromotionCode[] {
    return localStorageService.get<PromotionCode[]>(this.PROMOTION_CODES_KEY) || [];
  }

  getPromotionCodeById(id: string): PromotionCode | undefined {
    return this.getAllPromotionCodes().find(p => p.id === id);
  }

  createPromotionCode(data: Omit<PromotionCode, 'id' | 'usedCount'>): PromotionCode {
    const promotionCodes = this.getAllPromotionCodes();
    
    const newPromo: PromotionCode = {
      ...data,
      id: `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      usedCount: 0
    };

    promotionCodes.push(newPromo);
    this.savePromotionCodes(promotionCodes);
    
    return newPromo;
  }

  updatePromotionCode(id: string, updates: Partial<PromotionCode>): PromotionCode | null {
    const promotionCodes = this.getAllPromotionCodes();
    const index = promotionCodes.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    promotionCodes[index] = { ...promotionCodes[index], ...updates };
    this.savePromotionCodes(promotionCodes);
    
    return promotionCodes[index];
  }

  deletePromotionCode(id: string): boolean {
    const promotionCodes = this.getAllPromotionCodes();
    const filtered = promotionCodes.filter(p => p.id !== id);
    
    if (filtered.length === promotionCodes.length) return false;
    
    this.savePromotionCodes(filtered);
    return true;
  }

  private savePromotionCodes(promotionCodes: PromotionCode[]): void {
    localStorageService.set(this.PROMOTION_CODES_KEY, promotionCodes);
  }

  // ===== ADMIN: VOUCHERS CRUD =====

  getAllVouchers(): Voucher[] {
    return localStorageService.get<Voucher[]>(this.VOUCHERS_KEY) || [];
  }

  getVoucherById(id: string): Voucher | undefined {
    return this.getAllVouchers().find(v => v.id === id);
  }

  createVoucher(data: Omit<Voucher, 'id' | 'usageHistory' | 'createdAt'>): Voucher {
    const vouchers = this.getAllVouchers();
    
    const newVoucher: Voucher = {
      ...data,
      id: `voucher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      usageHistory: [],
      createdAt: new Date()
    };

    vouchers.push(newVoucher);
    this.saveVouchers(vouchers);
    
    return newVoucher;
  }

  updateVoucher(id: string, updates: Partial<Voucher>): Voucher | null {
    const vouchers = this.getAllVouchers();
    const index = vouchers.findIndex(v => v.id === id);
    
    if (index === -1) return null;
    
    vouchers[index] = { ...vouchers[index], ...updates };
    this.saveVouchers(vouchers);
    
    return vouchers[index];
  }

  deleteVoucher(id: string): boolean {
    const vouchers = this.getAllVouchers();
    const filtered = vouchers.filter(v => v.id !== id);
    
    if (filtered.length === vouchers.length) return false;
    
    this.saveVouchers(filtered);
    return true;
  }

  private saveVouchers(vouchers: Voucher[]): void {
    localStorageService.set(this.VOUCHERS_KEY, vouchers);
  }

  // ===== BULK OPERATIONS =====

  /**
   * Generate multiple gift card vouchers at once
   */
  generateBulkVouchers(
    count: number,
    value: number,
    validFrom: Date,
    validUntil: Date,
    createdBy: string
  ): Voucher[] {
    const vouchers: Voucher[] = [];

    for (let i = 0; i < count; i++) {
      const voucher = this.createVoucher({
        code: this.generateVoucherCode(),
        type: 'gift_card',
        value,
        originalValue: value,
        isActive: true,
        validFrom,
        validUntil,
        createdBy,
        notes: `Bulk generated ${new Date().toLocaleDateString()}`
      });
      vouchers.push(voucher);
    }

    return vouchers;
  }

  /**
   * Generate a unique voucher code
   */
  private generateVoucherCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code; // Format: XXXX-XXXX-XXXX
  }

  // ===== STATISTICS =====

  getPromotionStats() {
    const promotions = this.getAllPromotionCodes();
    
    return {
      total: promotions.length,
      active: promotions.filter(p => p.isActive).length,
      expired: promotions.filter(p => new Date(p.validUntil) < new Date()).length,
      totalUsage: promotions.reduce((sum, p) => sum + p.usedCount, 0)
    };
  }

  getVoucherStats() {
    const vouchers = this.getAllVouchers();
    
    return {
      total: vouchers.length,
      active: vouchers.filter(v => v.isActive).length,
      totalValue: vouchers.reduce((sum, v) => sum + v.value, 0),
      totalOriginalValue: vouchers.reduce((sum, v) => sum + v.originalValue, 0),
      redeemed: vouchers.filter(v => v.value === 0).length
    };
  }
}

export const promotionService = new PromotionService();
