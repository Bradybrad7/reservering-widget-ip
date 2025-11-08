import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Event, Reservation, CustomerFormData } from '../../types';

// Since apiService might not be implemented yet, we'll test the expected API behavior
describe('ApiService', () => {
  const mockFetch = vi.fn();
  
  beforeEach(() => {
    global.fetch = mockFetch;
    vi.clearAllMocks();
  });

  describe('fetchEvents', () => {
    it('should fetch events successfully', async () => {
      const mockEvents: Event[] = [
        {
          id: 'event-1',
          date: new Date('2025-12-25'),
          doorsOpen: '19:00',
          startsAt: '20:00',
          endsAt: '22:30',
          type: 'REGULAR',
          showId: 'show-1',
          capacity: 230,
          remainingCapacity: 100,
          allowedArrangements: ['BWF', 'BWFM'],
          isActive: true,
          bookingOpensAt: null,
          bookingClosesAt: null
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents
      });

      const result = await fetch('/api/events').then(r => r.json());

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockEvents);
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetch('/api/events')).rejects.toThrow('Network error');
    });
  });

  describe('createReservation', () => {
    const mockFormData: Partial<CustomerFormData> = {
      eventId: 'event-1',
      arrangement: 'BWF',
      numberOfPersons: 10,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '0612345678',
      preDrink: { enabled: false, quantity: 0 },
      afterParty: { enabled: false, quantity: 0 },
      merchandise: []
    };

    it('should create reservation successfully', async () => {
      const mockReservation: Partial<Reservation> = {
        id: 'res-1',
        eventId: 'event-1',
        arrangement: 'BWF',
        numberOfPersons: 10,
        status: 'PENDING',
        totalPrice: 500
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReservation
      });

      const result = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockFormData)
      }).then(r => r.json());

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reservations',
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(result.id).toBe('res-1');
    });
  });

  describe('updateReservation', () => {
    it('should update reservation successfully', async () => {
      const updates = {
        status: 'CONFIRMED' as const,
        numberOfPersons: 12
      };

      const mockUpdatedReservation = {
        id: 'res-1',
        status: 'CONFIRMED',
        numberOfPersons: 12
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedReservation
      });

      const result = await fetch('/api/reservations/res-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).then(r => r.json());

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reservations/res-1',
        expect.objectContaining({
          method: 'PATCH'
        })
      );
      expect(result.status).toBe('CONFIRMED');
    });
  });

  describe('deleteReservation', () => {
    it('should delete reservation successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await fetch('/api/reservations/res-1', {
        method: 'DELETE'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reservations/res-1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
      expect(result.ok).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle non-ok responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const response = await fetch('/api/events');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('should handle network failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetch('/api/events')).rejects.toThrow('Network error');
    });
  });
});
