import type { Event, Reservation, Arrangement, EventType } from '../types';
import { localStorageService } from './localStorageService';
import { customerService } from './customerService';

/**
 * 📊 ANALYTICS SERVICE
 * 
 * Provides business intelligence and reporting features
 * 
 * Features:
 * - Revenue analysis (by month, event type, arrangement)
 * - Booking trends and patterns
 * - Occupancy metrics
 * - Customer lifetime value
 * - Popular arrangements and time slots
 * - Forecasting and predictions
 */

export interface RevenueByMonth {
  month: string; // YYYY-MM
  revenue: number;
  bookings: number;
  averageBookingValue: number;
}

export interface RevenueByEventType {
  eventType: EventType;
  revenue: number;
  bookings: number;
  averageGroupSize: number;
}

export interface RevenueByArrangement {
  arrangement: Arrangement;
  revenue: number;
  bookings: number;
  percentage: number; // Percentage of total revenue
}

export interface OccupancyMetrics {
  totalCapacity: number;
  bookedSeats: number;
  occupancyRate: number; // Percentage
  averageGroupSize: number;
}

export interface PopularTimeslot {
  hour: number; // 0-23
  bookings: number;
}

class AnalyticsService {
  /**
   * Get revenue breakdown by month
   */
  getRevenueByMonth(startDate?: Date, endDate?: Date): RevenueByMonth[] {
    const reservations = this.getFilteredReservations(startDate, endDate);
    const monthlyData = new Map<string, { revenue: number; bookings: number }>();

    reservations.forEach(res => {
      const monthKey = new Date(res.eventDate).toISOString().slice(0, 7); // YYYY-MM
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { revenue: 0, bookings: 0 });
      }
      
      const data = monthlyData.get(monthKey)!;
      data.revenue += res.totalPrice;
      data.bookings++;
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        bookings: data.bookings,
        averageBookingValue: data.bookings > 0 ? data.revenue / data.bookings : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Get revenue breakdown by event type
   */
  getRevenueByEventType(startDate?: Date, endDate?: Date): RevenueByEventType[] {
    const reservations = this.getFilteredReservations(startDate, endDate);
    const events = localStorageService.getEvents();
    const typeData = new Map<EventType, { revenue: number; bookings: number; totalPersons: number }>();

    reservations.forEach(res => {
      const event = events.find(e => e.id === res.eventId);
      if (!event) return;

      const eventType = event.type;
      
      if (!typeData.has(eventType)) {
        typeData.set(eventType, { revenue: 0, bookings: 0, totalPersons: 0 });
      }
      
      const data = typeData.get(eventType)!;
      data.revenue += res.totalPrice;
      data.bookings++;
      data.totalPersons += res.numberOfPersons;
    });

    return Array.from(typeData.entries())
      .map(([eventType, data]) => ({
        eventType,
        revenue: data.revenue,
        bookings: data.bookings,
        averageGroupSize: data.bookings > 0 ? data.totalPersons / data.bookings : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Get revenue breakdown by arrangement
   */
  getRevenueByArrangement(startDate?: Date, endDate?: Date): RevenueByArrangement[] {
    const reservations = this.getFilteredReservations(startDate, endDate);
    const arrangementData = new Map<Arrangement, { revenue: number; bookings: number }>();
    let totalRevenue = 0;

    reservations.forEach(res => {
      if (!arrangementData.has(res.arrangement)) {
        arrangementData.set(res.arrangement, { revenue: 0, bookings: 0 });
      }
      
      const data = arrangementData.get(res.arrangement)!;
      data.revenue += res.totalPrice;
      data.bookings++;
      totalRevenue += res.totalPrice;
    });

    return Array.from(arrangementData.entries())
      .map(([arrangement, data]) => ({
        arrangement,
        revenue: data.revenue,
        bookings: data.bookings,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Get occupancy metrics
   */
  getOccupancyMetrics(startDate?: Date, endDate?: Date): OccupancyMetrics {
    const events = this.getFilteredEvents(startDate, endDate);
    const reservations = this.getFilteredReservations(startDate, endDate);

    const totalCapacity = events.reduce((sum, event) => sum + event.capacity, 0);
    const bookedSeats = reservations.reduce((sum, res) => sum + res.numberOfPersons, 0);
    const totalBookings = reservations.length;

    return {
      totalCapacity,
      bookedSeats,
      occupancyRate: totalCapacity > 0 ? (bookedSeats / totalCapacity) * 100 : 0,
      averageGroupSize: totalBookings > 0 ? bookedSeats / totalBookings : 0
    };
  }

  /**
   * Get popular time slots (by hour)
   */
  getPopularTimeslots(startDate?: Date, endDate?: Date): PopularTimeslot[] {
    const events = this.getFilteredEvents(startDate, endDate);
    const reservations = this.getFilteredReservations(startDate, endDate);
    const timeslotData = new Map<number, number>();

    reservations.forEach(res => {
      const event = events.find(e => e.id === res.eventId);
      if (!event) return;

      const hour = parseInt(event.startsAt.split(':')[0]);
      timeslotData.set(hour, (timeslotData.get(hour) || 0) + 1);
    });

    return Array.from(timeslotData.entries())
      .map(([hour, bookings]) => ({ hour, bookings }))
      .sort((a, b) => b.bookings - a.bookings);
  }

  /**
   * Get comprehensive dashboard statistics
   */
  getDashboardStats(startDate?: Date, endDate?: Date) {
    const reservations = this.getFilteredReservations(startDate, endDate);
    const events = this.getFilteredEvents(startDate, endDate);
    const customerStats = customerService.getCustomerStats();

    const totalRevenue = reservations.reduce((sum, res) => sum + res.totalPrice, 0);
    const totalBookings = reservations.length;
    const totalGuests = reservations.reduce((sum, res) => sum + res.numberOfPersons, 0);
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Get confirmed vs pending
    const confirmed = reservations.filter(r => r.status === 'confirmed').length;
    const pending = reservations.filter(r => r.status === 'pending').length;
    const cancelled = reservations.filter(r => r.status === 'cancelled').length;

    // Get add-ons statistics
    const preDrinkBookings = reservations.filter(r => r.preDrink?.enabled).length;
    const afterPartyBookings = reservations.filter(r => r.afterParty?.enabled).length;

    return {
      revenue: {
        total: totalRevenue,
        average: avgBookingValue,
        byMonth: this.getRevenueByMonth(startDate, endDate),
        byEventType: this.getRevenueByEventType(startDate, endDate),
        byArrangement: this.getRevenueByArrangement(startDate, endDate)
      },
      bookings: {
        total: totalBookings,
        confirmed,
        pending,
        cancelled,
        totalGuests
      },
      occupancy: this.getOccupancyMetrics(startDate, endDate),
      events: {
        total: events.length,
        upcoming: events.filter(e => new Date(e.date) > new Date()).length,
        past: events.filter(e => new Date(e.date) <= new Date()).length
      },
      customers: customerStats,
      addOns: {
        preDrink: {
          bookings: preDrinkBookings,
          rate: totalBookings > 0 ? (preDrinkBookings / totalBookings) * 100 : 0
        },
        afterParty: {
          bookings: afterPartyBookings,
          rate: totalBookings > 0 ? (afterPartyBookings / totalBookings) * 100 : 0
        }
      },
      popularTimeslots: this.getPopularTimeslots(startDate, endDate)
    };
  }

  /**
   * Get year-over-year comparison
   */
  getYearOverYearComparison(year: number) {
    const currentYearStart = new Date(year, 0, 1);
    const currentYearEnd = new Date(year, 11, 31);
    const previousYearStart = new Date(year - 1, 0, 1);
    const previousYearEnd = new Date(year - 1, 11, 31);

    const currentYearRevenue = this.getRevenueByMonth(currentYearStart, currentYearEnd);
    const previousYearRevenue = this.getRevenueByMonth(previousYearStart, previousYearEnd);

    const currentTotal = currentYearRevenue.reduce((sum, m) => sum + m.revenue, 0);
    const previousTotal = previousYearRevenue.reduce((sum, m) => sum + m.revenue, 0);

    const growth = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal) * 100 
      : 0;

    return {
      currentYear: {
        year,
        revenue: currentTotal,
        bookings: currentYearRevenue.reduce((sum, m) => sum + m.bookings, 0),
        monthly: currentYearRevenue
      },
      previousYear: {
        year: year - 1,
        revenue: previousTotal,
        bookings: previousYearRevenue.reduce((sum, m) => sum + m.bookings, 0),
        monthly: previousYearRevenue
      },
      growth: {
        percentage: growth,
        absolute: currentTotal - previousTotal
      }
    };
  }

  /**
   * Get best performing events (by revenue)
   */
  getBestPerformingEvents(limit: number = 10): Array<{
    event: Event;
    revenue: number;
    bookings: number;
    occupancyRate: number;
  }> {
    const events = localStorageService.getEvents();
    const reservations = localStorageService.getReservations();

    const eventPerformance = events.map(event => {
      const eventReservations = reservations.filter(r => r.eventId === event.id);
      const revenue = eventReservations.reduce((sum, r) => sum + r.totalPrice, 0);
      const bookings = eventReservations.length;
      const bookedSeats = eventReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
      const occupancyRate = (bookedSeats / event.capacity) * 100;

      return {
        event,
        revenue,
        bookings,
        occupancyRate
      };
    });

    return eventPerformance
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Get booking conversion funnel
   */
  getConversionFunnel() {
    const reservations = localStorageService.getReservations();

    const total = reservations.length;
    const confirmed = reservations.filter(r => r.status === 'confirmed').length;
    const cancelled = reservations.filter(r => r.status === 'cancelled').length;
    const checkedIn = reservations.filter(r => r.checkedInAt).length;

    return {
      total,
      confirmed: {
        count: confirmed,
        rate: total > 0 ? (confirmed / total) * 100 : 0
      },
      cancelled: {
        count: cancelled,
        rate: total > 0 ? (cancelled / total) * 100 : 0
      },
      checkedIn: {
        count: checkedIn,
        rate: confirmed > 0 ? (checkedIn / confirmed) * 100 : 0
      }
    };
  }

  // ===== HELPER METHODS =====

  private getFilteredReservations(startDate?: Date, endDate?: Date): Reservation[] {
    const reservations = localStorageService.getReservations();
    
    if (!startDate && !endDate) return reservations;

    return reservations.filter(res => {
      const resDate = new Date(res.eventDate);
      if (startDate && resDate < startDate) return false;
      if (endDate && resDate > endDate) return false;
      return true;
    });
  }

  private getFilteredEvents(startDate?: Date, endDate?: Date): Event[] {
    const events = localStorageService.getEvents();
    
    if (!startDate && !endDate) return events;

    return events.filter(event => {
      const eventDate = new Date(event.date);
      if (startDate && eventDate < startDate) return false;
      if (endDate && eventDate > endDate) return false;
      return true;
    });
  }
}

export const analyticsService = new AnalyticsService();
