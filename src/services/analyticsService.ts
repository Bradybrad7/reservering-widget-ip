import type { Event, Reservation, Arrangement, EventType } from '../types';
import { storageService } from './storageService';
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
  async getRevenueByMonth(startDate?: Date, endDate?: Date): Promise<RevenueByMonth[]> {
    const reservations = await this.getFilteredReservations(startDate, endDate);
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
  async getRevenueByEventType(startDate?: Date, endDate?: Date): Promise<RevenueByEventType[]> {
    const reservations = await this.getFilteredReservations(startDate, endDate);
    const events = await storageService.getEvents();
    const typeData = new Map<EventType, { revenue: number; bookings: number; totalPersons: number }>();

    reservations.forEach(res => {
      const event = events.find((e: Event) => e.id === res.eventId);
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
  async getRevenueByArrangement(startDate?: Date, endDate?: Date): Promise<RevenueByArrangement[]> {
    const reservations = await this.getFilteredReservations(startDate, endDate);
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
  async getOccupancyMetrics(startDate?: Date, endDate?: Date): Promise<OccupancyMetrics> {
    const events = await this.getFilteredEvents(startDate, endDate);
    const reservations = await this.getFilteredReservations(startDate, endDate);

    const totalCapacity = events.reduce((sum: number, event: Event) => sum + event.capacity, 0);
    const bookedSeats = reservations.reduce((sum: number, res: Reservation) => sum + res.numberOfPersons, 0);
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
  async getPopularTimeslots(startDate?: Date, endDate?: Date): Promise<PopularTimeslot[]> {
    const events = await this.getFilteredEvents(startDate, endDate);
    const reservations = await this.getFilteredReservations(startDate, endDate);
    const timeslotData = new Map<number, number>();

    reservations.forEach(res => {
      const event = events.find((e: Event) => e.id === res.eventId);
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
  async getDashboardStats(startDate?: Date, endDate?: Date) {
    const reservations = await this.getFilteredReservations(startDate, endDate);
    const events = await this.getFilteredEvents(startDate, endDate);
    const customerStats = customerService.getCustomerStats();

    const totalRevenue = reservations.reduce((sum: number, res: Reservation) => sum + res.totalPrice, 0);
    const totalBookings = reservations.length;
    const totalGuests = reservations.reduce((sum: number, res: Reservation) => sum + res.numberOfPersons, 0);
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Get confirmed vs pending
    const confirmed = reservations.filter((r: Reservation) => r.status === 'confirmed').length;
    const pending = reservations.filter((r: Reservation) => r.status === 'pending').length;
    const cancelled = reservations.filter((r: Reservation) => r.status === 'cancelled').length;

    // Get add-ons statistics
    const preDrinkBookings = reservations.filter((r: Reservation) => r.preDrink?.enabled).length;
    const afterPartyBookings = reservations.filter((r: Reservation) => r.afterParty?.enabled).length;

    return {
      revenue: {
        total: totalRevenue,
        average: avgBookingValue,
        byMonth: await this.getRevenueByMonth(startDate, endDate),
        byEventType: await this.getRevenueByEventType(startDate, endDate),
        byArrangement: await this.getRevenueByArrangement(startDate, endDate)
      },
      bookings: {
        total: totalBookings,
        confirmed,
        pending,
        cancelled,
        totalGuests
      },
      occupancy: await this.getOccupancyMetrics(startDate, endDate),
      events: {
        total: events.length,
        upcoming: events.filter((e: Event) => new Date(e.date) > new Date()).length,
        past: events.filter((e: Event) => new Date(e.date) <= new Date()).length
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
      popularTimeslots: await this.getPopularTimeslots(startDate, endDate)
    };
  }

  /**
   * Get year-over-year comparison
   */
  async getYearOverYearComparison(year: number) {
    const currentYearStart = new Date(year, 0, 1);
    const currentYearEnd = new Date(year, 11, 31);
    const previousYearStart = new Date(year - 1, 0, 1);
    const previousYearEnd = new Date(year - 1, 11, 31);

    const currentYearRevenue = await this.getRevenueByMonth(currentYearStart, currentYearEnd);
    const previousYearRevenue = await this.getRevenueByMonth(previousYearStart, previousYearEnd);

    const currentTotal = currentYearRevenue.reduce((sum: number, m: RevenueByMonth) => sum + m.revenue, 0);
    const previousTotal = previousYearRevenue.reduce((sum: number, m: RevenueByMonth) => sum + m.revenue, 0);

    const growth = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal) * 100 
      : 0;

    return {
      currentYear: {
        year,
        revenue: currentTotal,
        bookings: currentYearRevenue.reduce((sum: number, m: RevenueByMonth) => sum + m.bookings, 0),
        monthly: currentYearRevenue
      },
      previousYear: {
        year: year - 1,
        revenue: previousTotal,
        bookings: previousYearRevenue.reduce((sum: number, m: RevenueByMonth) => sum + m.bookings, 0),
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
  async getBestPerformingEvents(limit: number = 10): Promise<Array<{
    event: Event;
    revenue: number;
    bookings: number;
    occupancyRate: number;
  }>> {
    const events = await storageService.getEvents();
    const reservations = await storageService.getReservations();

    const eventPerformance = events.map((event: Event) => {
      const eventReservations = reservations.filter((r: Reservation) => r.eventId === event.id);
      const revenue = eventReservations.reduce((sum: number, r: Reservation) => sum + r.totalPrice, 0);
      const bookings = eventReservations.length;
      const bookedSeats = eventReservations.reduce((sum: number, r: Reservation) => sum + r.numberOfPersons, 0);
      const occupancyRate = (bookedSeats / event.capacity) * 100;

      return {
        event,
        revenue,
        bookings,
        occupancyRate
      };
    });

    return eventPerformance
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Get booking conversion funnel
   */
  async getConversionFunnel() {
    const reservations = await storageService.getReservations();

    const total = reservations.length;
    const confirmed = reservations.filter((r: Reservation) => r.status === 'confirmed').length;
    const cancelled = reservations.filter((r: Reservation) => r.status === 'cancelled').length;
    const checkedIn = reservations.filter((r: Reservation) => r.checkedInAt).length;

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

  private async getFilteredReservations(startDate?: Date, endDate?: Date): Promise<Reservation[]> {
    const reservations = await storageService.getReservations();
    
    if (!startDate && !endDate) return reservations;

    return reservations.filter((res: Reservation) => {
      const resDate = new Date(res.eventDate);
      if (startDate && resDate < startDate) return false;
      if (endDate && resDate > endDate) return false;
      return true;
    });
  }

  private async getFilteredEvents(startDate?: Date, endDate?: Date): Promise<Event[]> {
    const events = await storageService.getEvents();
    
    if (!startDate && !endDate) return events;

    return events.filter((event: Event) => {
      const eventDate = new Date(event.date);
      if (startDate && eventDate < startDate) return false;
      if (endDate && eventDate > endDate) return false;
      return true;
    });
  }
}

export const analyticsService = new AnalyticsService();
