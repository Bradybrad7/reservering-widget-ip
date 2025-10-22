import { describe, it, expect } from 'vitest';
import { calculatePrice, getDayType, getArrangementPrice } from '../../services/priceService';
import type { Event, CustomerFormData } from '../../types';

describe('PriceService', () => {
  // Mock data
  const mockEvent: Event = {
    id: 'event-1',
    date: new Date('2025-12-25'),
    doorsOpen: '19:00',
    startsAt: '20:00',
    endsAt: '22:30',
    type: 'REGULAR',
    showId: 'show-1',
    capacity: 230,
    remainingCapacity: 100,
    bookingOpensAt: null,
    bookingClosesAt: null,
    allowedArrangements: ['BWF', 'BWFM'],
    isActive: true
  };

  const mockFormData: Partial<CustomerFormData> = {
    numberOfPersons: 10,
    arrangement: 'BWF',
    preDrink: { enabled: false, quantity: 0 },
    afterParty: { enabled: false, quantity: 0 },
    merchandise: []
  };

  describe('calculatePrice', () => {
    it('should calculate base price for BWF arrangement on weekday', () => {
      const result = calculatePrice(mockEvent, mockFormData);

      expect(result).toBeDefined();
      expect(result.basePrice).toBeGreaterThan(0);
      expect(result.totalPrice).toBeGreaterThan(0);
    });

    it('should add preDrink cost when enabled', () => {
      const withPreDrink = {
        ...mockFormData,
        preDrink: { enabled: true, quantity: 10 }
      };

      const resultWithout = calculatePrice(mockEvent, mockFormData);
      const resultWith = calculatePrice(mockEvent, withPreDrink);

      expect(resultWith.preDrinkTotal).toBeGreaterThan(0);
      expect(resultWith.totalPrice).toBeGreaterThan(resultWithout.totalPrice);
    });

    it('should add afterParty cost when enabled', () => {
      const withAfterParty = {
        ...mockFormData,
        afterParty: { enabled: true, quantity: 10 }
      };

      const resultWithout = calculatePrice(mockEvent, mockFormData);
      const resultWith = calculatePrice(mockEvent, withAfterParty);

      expect(resultWith.afterPartyTotal).toBeGreaterThan(0);
      expect(resultWith.totalPrice).toBeGreaterThan(resultWithout.totalPrice);
    });

    it('should handle BWFM arrangement with higher price', () => {
      const bwfmData = {
        ...mockFormData,
        arrangement: 'BWFM' as const
      };

      const bwfResult = calculatePrice(mockEvent, mockFormData);
      const bwfmResult = calculatePrice(mockEvent, bwfmData);

      expect(bwfmResult.basePrice).toBeGreaterThan(bwfResult.basePrice);
    });

    it('should calculate correct totals with all add-ons', () => {
      const fullData = {
        ...mockFormData,
        preDrink: { enabled: true, quantity: 10 },
        afterParty: { enabled: true, quantity: 10 },
        merchandise: []
      };

      const result = calculatePrice(mockEvent, fullData);

      expect(result.basePrice).toBeGreaterThan(0);
      expect(result.preDrinkTotal).toBeGreaterThan(0);
      expect(result.afterPartyTotal).toBeGreaterThan(0);
      expect(result.totalPrice).toBe(
        result.basePrice + 
        result.preDrinkTotal + 
        result.afterPartyTotal + 
        result.merchandiseTotal
      );
    });

    it('should apply weekend pricing correctly', () => {
      const weekendEvent = {
        ...mockEvent,
        date: new Date('2025-12-27') // Saturday
      };

      const weekdayResult = calculatePrice(mockEvent, mockFormData);
      const weekendResult = calculatePrice(weekendEvent, mockFormData);

      // Weekend should typically be more expensive
      expect(weekendResult.basePrice).toBeGreaterThanOrEqual(weekdayResult.basePrice);
    });

    it('should handle custom event pricing when provided', () => {
      const eventWithCustomPricing = {
        ...mockEvent,
        customPricing: {
          BWF: 50,
          BWFM: 65
        }
      };

      const result = calculatePrice(eventWithCustomPricing, mockFormData);

      expect(result.breakdown.arrangement.pricePerPerson).toBe(50);
    });

    it('should calculate for minimum persons (1)', () => {
      const singlePerson = {
        ...mockFormData,
        numberOfPersons: 1
      };

      const result = calculatePrice(mockEvent, singlePerson);

      expect(result.totalPrice).toBeGreaterThan(0);
      expect(result.breakdown.arrangement.persons).toBe(1);
    });

    it('should calculate for maximum capacity', () => {
      const maxCapacity = {
        ...mockFormData,
        numberOfPersons: mockEvent.capacity
      };

      const result = calculatePrice(mockEvent, maxCapacity);

      expect(result.totalPrice).toBeGreaterThan(0);
      expect(result.breakdown.arrangement.persons).toBe(mockEvent.capacity);
    });
  });

  describe('getDayType', () => {
    it('should return weekday for Monday-Thursday', () => {
      const monday = new Date('2025-12-22'); // Monday
      expect(getDayType(monday, 'REGULAR')).toBe('weekday');
    });

    it('should return weekend for Friday-Saturday', () => {
      const friday = new Date('2025-12-26'); // Friday
      const saturday = new Date('2025-12-27'); // Saturday
      
      expect(getDayType(friday, 'REGULAR')).toBe('weekend');
      expect(getDayType(saturday, 'REGULAR')).toBe('weekend');
    });

    it('should handle matinee events', () => {
      const monday = new Date('2025-12-22');
      const dayType = getDayType(monday, 'MATINEE');
      expect(dayType).toBe('matinee');
    });

    it('should handle care heroes events', () => {
      const monday = new Date('2025-12-22');
      const dayType = getDayType(monday, 'CARE_HEROES');
      expect(dayType).toBe('careHeroes');
    });
  });
});
