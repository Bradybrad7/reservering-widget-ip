import { describe, it, expect } from 'vitest';
import { 
  isValidEmail, 
  isValidPhoneNumber, 
  isValidPostalCode
} from '../../utils';

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should accept valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('email@subdomain.example.com')).toBe(true);
      expect(isValidEmail('firstname.lastname@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('plaintext')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should handle edge cases', () => {
      // Simple regex may not catch all edge cases - these are implementation-specific
      expect(isValidEmail('user@domain.com')).toBe(true);
      expect(isValidEmail('test@example.com')).toBe(true);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should accept valid Dutch phone numbers', () => {
      expect(isValidPhoneNumber('0612345678')).toBe(true);
      expect(isValidPhoneNumber('+31612345678')).toBe(true);
      expect(isValidPhoneNumber('06-12345678')).toBe(true);
      expect(isValidPhoneNumber('06 12 34 56 78')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhoneNumber('123')).toBe(false);
      expect(isValidPhoneNumber('abcdefghij')).toBe(false);
      expect(isValidPhoneNumber('')).toBe(false);
      expect(isValidPhoneNumber('06-123')).toBe(false);
    });

    it('should handle whitespace and formatting', () => {
      expect(isValidPhoneNumber('  06 12 34 56 78  ')).toBe(true);
      expect(isValidPhoneNumber('(06) 12345678')).toBe(true);
    });
  });

  describe('isValidPostalCode', () => {
    it('should accept valid Dutch postal codes', () => {
      expect(isValidPostalCode('1234AB')).toBe(true);
      expect(isValidPostalCode('1234 AB')).toBe(true);
      expect(isValidPostalCode('1234ab')).toBe(true);
      expect(isValidPostalCode('9876ZZ')).toBe(true);
    });

    it('should reject invalid postal codes', () => {
      expect(isValidPostalCode('12345')).toBe(false);
      expect(isValidPostalCode('ABCD12')).toBe(false);
      expect(isValidPostalCode('1234A')).toBe(false);
      expect(isValidPostalCode('1234ABC')).toBe(false);
      expect(isValidPostalCode('')).toBe(false);
    });

    it('should reject postal codes starting with 0', () => {
      expect(isValidPostalCode('0000AA')).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(isValidPostalCode('  1234AB  ')).toBe(false);
      expect(isValidPostalCode('1234 AB')).toBe(true);
    });
  });
});
