/**
 * Voucher Service - Business Logic for Voucher Operations
 * 
 * Handles:
 * - Voucher code generation
 * - Voucher validation
 * - Voucher redemption logic
 * - Email notifications
 */

import type { 
  IssuedVoucher, 
  VoucherTemplate,
  VoucherValidationResult 
} from '../types';
import { storageService } from './storageService';

class VoucherService {
  /**
   * Generate a unique voucher code
   * Format: XXXX-XXXX-XXXX (12 characters in 3 segments)
   * Characters: A-Z, 2-9 (excluding confusing characters: I, O, 0, 1)
   */
  async generateUniqueVoucherCode(): Promise<string> {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segments = 3;
    const segmentLength = 4;
    
    let code = '';
    for (let i = 0; i < segments; i++) {
      if (i > 0) code += '-';
      for (let j = 0; j < segmentLength; j++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters.charAt(randomIndex);
      }
    }
    
    // Check if code already exists (collision detection)
    const exists = await storageService.voucherCodeExists(code);
    if (exists) {
      // Recursively try again if collision detected
      console.warn('⚠️ Voucher code collision detected, generating new code...');
      return this.generateUniqueVoucherCode();
    }
    
    return code;
  }

  /**
   * Validate a voucher code
   * Checks: existence, status, expiry, remaining value
   */
  async validateVoucher(code: string): Promise<VoucherValidationResult> {
    // Find voucher
    const voucher = await storageService.findVoucherByCode(code);
    
    if (!voucher) {
      return {
        isValid: false,
        remainingValue: 0,
        expiryDate: new Date(),
        errorReason: 'not_found'
      };
    }

    // Check expiry
    const expiryDate = new Date(voucher.expiryDate);
    if (expiryDate < new Date()) {
      return {
        isValid: false,
        voucher,
        remainingValue: voucher.remainingValue,
        expiryDate,
        errorReason: 'expired'
      };
    }

    // Check status
    if (voucher.status === 'pending_payment') {
      return {
        isValid: false,
        voucher,
        remainingValue: voucher.remainingValue,
        expiryDate,
        errorReason: 'inactive'
      };
    }

    if (voucher.status === 'used' || voucher.remainingValue <= 0) {
      return {
        isValid: false,
        voucher,
        remainingValue: 0,
        expiryDate,
        errorReason: 'used'
      };
    }

    // All checks passed
    return {
      isValid: true,
      voucher,
      remainingValue: voucher.remainingValue,
      expiryDate
    };
  }

  /**
   * Apply voucher to a reservation
   * Returns the amount that was actually applied
   */
  async applyVoucher(
    voucherCode: string,
    reservationTotal: number,
    reservationId: string
  ): Promise<{ success: boolean; amountApplied: number; newRemainingValue: number; error?: string }> {
    // Validate voucher first
    const validation = await this.validateVoucher(voucherCode);
    
    if (!validation.isValid || !validation.voucher) {
      return {
        success: false,
        amountApplied: 0,
        newRemainingValue: 0,
        error: this.getErrorMessage(validation.errorReason)
      };
    }

    // Calculate amount to apply (min of voucher value and reservation total)
    const amountToApply = Math.min(validation.remainingValue, reservationTotal);

    // Update voucher in database
    const success = await storageService.decrementVoucherValue(
      voucherCode,
      amountToApply
    );

    if (!success) {
      return {
        success: false,
        amountApplied: 0,
        newRemainingValue: validation.remainingValue,
        error: 'Failed to update voucher'
      };
    }

    // Get updated voucher
    const updatedVoucher = await storageService.findVoucherByCode(voucherCode);

    return {
      success: true,
      amountApplied: amountToApply,
      newRemainingValue: updatedVoucher?.remainingValue || 0
    };
  }

  /**
   * Get human-readable error message for validation errors
   */
  private getErrorMessage(errorReason?: 'not_found' | 'expired' | 'used' | 'inactive'): string {
    switch (errorReason) {
      case 'not_found':
        return 'Deze vouchercode is onbekend. Controleer de code en probeer opnieuw.';
      case 'expired':
        return 'Deze voucher is verlopen.';
      case 'used':
        return 'Deze voucher is al volledig gebruikt.';
      case 'inactive':
        return 'Deze voucher is nog niet geactiveerd. Check je email voor bevestiging.';
      default:
        return 'Deze voucher is niet geldig.';
    }
  }

  /**
   * Format voucher code for display (ensures dashes)
   * Example: "ABCD1234EFGH" -> "ABCD-1234-EFGH"
   */
  formatVoucherCode(code: string): string {
    // Remove any existing dashes
    const cleanCode = code.replace(/-/g, '').toUpperCase();
    
    // Add dashes every 4 characters
    const formatted = cleanCode.match(/.{1,4}/g)?.join('-') || cleanCode;
    
    return formatted;
  }

  /**
   * Calculate expiry date based on template validity days
   */
  calculateExpiryDate(issueDate: Date, validityDays: number): Date {
    const expiryDate = new Date(issueDate);
    expiryDate.setDate(expiryDate.getDate() + validityDays);
    return expiryDate;
  }

  /**
   * Check if a voucher is expiring soon (within 30 days)
   */
  isExpiringSoon(expiryDate: Date | string): boolean {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }

  /**
   * Get voucher status badge color
   */
  getStatusColor(status: IssuedVoucher['status']): string {
    switch (status) {
      case 'active':
        return 'green';
      case 'used':
        return 'gray';
      case 'expired':
        return 'red';
      case 'pending_payment':
        return 'yellow';
      default:
        return 'gray';
    }
  }

  /**
   * Get voucher status label (Dutch)
   */
  getStatusLabel(status: IssuedVoucher['status']): string {
    switch (status) {
      case 'active':
        return 'Actief';
      case 'used':
        return 'Gebruikt';
      case 'expired':
        return 'Verlopen';
      case 'pending_payment':
        return 'In Afwachting';
      default:
        return 'Onbekend';
    }
  }

  /**
   * Generate a voucher ID
   */
  generateVoucherId(): string {
    return `voucher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new issued voucher (without payment integration)
   * Used for admin-created vouchers or testing
   */
  async createIssuedVoucher(
    template: VoucherTemplate,
    issuedTo: string,
    metadata?: Partial<IssuedVoucher['metadata']>
  ): Promise<IssuedVoucher> {
    const now = new Date();
    const code = await this.generateUniqueVoucherCode();
    const expiryDate = this.calculateExpiryDate(now, template.validityDays);

    const voucher: IssuedVoucher = {
      id: this.generateVoucherId(),
      code,
      templateId: template.id,
      issuedTo,
      issueDate: now,
      expiryDate,
      initialValue: template.value,
      remainingValue: template.value,
      status: 'active',
      usedInReservationIds: [],
      metadata: metadata ? {
        buyerName: metadata.buyerName || issuedTo,
        buyerEmail: metadata.buyerEmail || '',
        buyerPhone: metadata.buyerPhone || '',
        deliveryMethod: metadata.deliveryMethod || 'email',
        quantity: metadata.quantity || 1,
        paymentStatus: 'paid'
      } : undefined,
      createdAt: now,
      updatedAt: now
    };

    return voucher;
  }
}

// Export singleton instance
export const voucherService = new VoucherService();
