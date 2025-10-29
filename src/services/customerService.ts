import type { CustomerProfile, Arrangement, Reservation } from '../types';
import { storageService } from './storageService';

/**
 * 👥 CUSTOMER SERVICE (CRM)
 * 
 * Aggregates and manages customer data from reservations
 * 
 * Features:
 * - Aggregate customer data by email
 * - Calculate customer metrics (total spent, booking count, etc.)
 * - Tag management (VIP, Corporate, etc.)
 * - Customer search and filtering
 * - Customer lifetime value analysis
 */

class CustomerService {
  /**
   * Get all unique customers from reservations
   */
  async getAllCustomers(): Promise<CustomerProfile[]> {
    const reservations = await storageService.getReservations();
    const customerMap = new Map<string, CustomerProfile>();

    // Group reservations by email
    reservations.forEach((reservation: Reservation) => {
      const email = reservation.email.toLowerCase();
      
      if (!customerMap.has(email)) {
        // Create new customer profile
        customerMap.set(email, {
          email,
          companyName: reservation.companyName || '',
          contactPerson: reservation.contactPerson,
          totalBookings: 0,
          totalSpent: 0,
          lastBooking: reservation.eventDate,
          firstBooking: reservation.eventDate,
          tags: reservation.tags || [],
          notes: reservation.notes,
          reservations: [],
          averageGroupSize: 0,
          preferredArrangement: undefined
        });
      }

      const customer = customerMap.get(email)!;
      
      // Update customer data
      customer.totalBookings++;
      customer.totalSpent += reservation.totalPrice;
      customer.reservations.push(reservation);
      
      // Update last/first booking dates
      if (new Date(reservation.eventDate) > new Date(customer.lastBooking)) {
        customer.lastBooking = reservation.eventDate;
      }
      if (new Date(reservation.eventDate) < new Date(customer.firstBooking)) {
        customer.firstBooking = reservation.eventDate;
      }

      // Merge tags (unique)
      if (reservation.tags) {
        customer.tags = Array.from(new Set([...customer.tags, ...reservation.tags]));
      }

      // Update company name if more recent
      if (reservation.companyName && new Date(reservation.eventDate) > new Date(customer.lastBooking)) {
        customer.companyName = reservation.companyName;
        customer.contactPerson = reservation.contactPerson;
      }
    });

    // Calculate derived metrics
    customerMap.forEach(customer => {
      // Average group size
      const totalPersons = customer.reservations.reduce(
        (sum, res) => sum + res.numberOfPersons, 
        0
      );
      customer.averageGroupSize = Math.round(totalPersons / customer.totalBookings);

      // Preferred arrangement (most frequently booked)
      const arrangementCounts = customer.reservations.reduce((acc, res) => {
        acc[res.arrangement] = (acc[res.arrangement] || 0) + 1;
        return acc;
      }, {} as Record<Arrangement, number>);

      const mostFrequent = Object.entries(arrangementCounts).sort((a, b) => b[1] - a[1])[0];
      customer.preferredArrangement = mostFrequent?.[0] as Arrangement;
    });

    return Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent); // Sort by total spent (highest first)
  }

  /**
   * Get a single customer profile by email
   */
  async getCustomerByEmail(email: string): Promise<CustomerProfile | null> {
    const customers = await this.getAllCustomers();
    return customers.find((c: CustomerProfile) => c.email.toLowerCase() === email.toLowerCase()) || null;
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats() {
    const customers = await this.getAllCustomers();
    
    return {
      totalCustomers: customers.length,
      totalRevenue: customers.reduce((sum: number, c: CustomerProfile) => sum + c.totalSpent, 0),
      averageLifetimeValue: customers.length > 0 
        ? customers.reduce((sum: number, c: CustomerProfile) => sum + c.totalSpent, 0) / customers.length 
        : 0,
      repeatCustomers: customers.filter((c: CustomerProfile) => c.totalBookings > 1).length,
      vipCustomers: customers.filter((c: CustomerProfile) => c.tags.includes('VIP')).length,
      corporateCustomers: customers.filter((c: CustomerProfile) => c.tags.includes('Corporate') || c.tags.includes('Bedrijf')).length
    };
  }

  /**
   * Get top customers by total spent
   */
  async getTopCustomers(limit: number = 10): Promise<CustomerProfile[]> {
    const customers = await this.getAllCustomers();
    return customers
      .sort((a: CustomerProfile, b: CustomerProfile) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  /**
   * Get repeat customers (more than 1 booking)
   */
  async getRepeatCustomers(): Promise<CustomerProfile[]> {
    const customers = await this.getAllCustomers();
    return customers.filter((c: CustomerProfile) => c.totalBookings > 1);
  }

  /**
   * Get customers by tag
   */
  async getCustomersByTag(tag: string): Promise<CustomerProfile[]> {
    const customers = await this.getAllCustomers();
    return customers.filter((c: CustomerProfile) => c.tags.includes(tag));
  }

  /**
   * Search customers by name, email, or company
   */
  async searchCustomers(query: string): Promise<CustomerProfile[]> {
    const customers = await this.getAllCustomers();
    const lowerQuery = query.toLowerCase();
    
    return customers.filter((c: CustomerProfile) => 
      c.email.toLowerCase().includes(lowerQuery) ||
      c.contactPerson.toLowerCase().includes(lowerQuery) ||
      c.companyName.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Add a tag to a customer (updates all their reservations)
   */
  async addTagToCustomer(email: string, tag: string): Promise<void> {
    const reservations = await storageService.getReservations();
    const updatedReservations = reservations.map((res: Reservation) => {
      if (res.email.toLowerCase() === email.toLowerCase()) {
        const tags = res.tags || [];
        if (!tags.includes(tag)) {
          return {
            ...res,
            tags: [...tags, tag]
          };
        }
      }
      return res;
    });
    
    storageService.saveReservations(updatedReservations);
  }

  /**
   * Remove a tag from a customer (updates all their reservations)
   */
  async removeTagFromCustomer(email: string, tag: string): Promise<void> {
    const reservations = await storageService.getReservations();
    const updatedReservations = reservations.map((res: Reservation) => {
      if (res.email.toLowerCase() === email.toLowerCase()) {
        return {
          ...res,
          tags: (res.tags || []).filter((t: string) => t !== tag)
        };
      }
      return res;
    });
    
    await storageService.saveReservations(updatedReservations);
  }

  /**
   * Add a note to all reservations of a customer
   */
  async addNoteToCustomer(email: string, note: string): Promise<void> {
    const reservations = await storageService.getReservations();
    const updatedReservations = reservations.map((res: Reservation) => {
      if (res.email.toLowerCase() === email.toLowerCase()) {
        return {
          ...res,
          notes: note
        };
      }
      return res;
    });
    
    await storageService.saveReservations(updatedReservations);
  }

  /**
   * Get customer segments
   */
  async getCustomerSegments() {
    const customers = await this.getAllCustomers();
    
    // Segment by value
    const highValue = customers.filter((c: CustomerProfile) => c.totalSpent >= 500);
    const mediumValue = customers.filter((c: CustomerProfile) => c.totalSpent >= 200 && c.totalSpent < 500);
    const lowValue = customers.filter((c: CustomerProfile) => c.totalSpent < 200);
    
    // Segment by frequency
    const frequent = customers.filter(c => c.totalBookings >= 3);
    const occasional = customers.filter(c => c.totalBookings === 2);
    const oneTime = customers.filter(c => c.totalBookings === 1);
    
    // Segment by recency (last booking within 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recent = customers.filter(c => new Date(c.lastBooking) >= sixMonthsAgo);
    const dormant = customers.filter(c => new Date(c.lastBooking) < sixMonthsAgo);
    
    return {
      byValue: {
        high: highValue.length,
        medium: mediumValue.length,
        low: lowValue.length
      },
      byFrequency: {
        frequent: frequent.length,
        occasional: occasional.length,
        oneTime: oneTime.length
      },
      byRecency: {
        recent: recent.length,
        dormant: dormant.length
      }
    };
  }

  /**
   * Get available tags from all customers
   */
  async getAllTags(): Promise<string[]> {
    const customers = await this.getAllCustomers();
    const tags = new Set<string>();
    
    customers.forEach((customer: CustomerProfile) => {
      customer.tags.forEach((tag: string) => tags.add(tag));
    });
    
    return Array.from(tags).sort();
  }

  /**
   * Get customer growth over time (by month)
   */
  async getCustomerGrowth(): Promise<{ month: string; newCustomers: number; totalCustomers: number }[]> {
    const customers = await this.getAllCustomers();
    const monthlyData = new Map<string, { new: number; total: Set<string> }>();
    
    customers.forEach(customer => {
      const monthKey = new Date(customer.firstBooking).toISOString().slice(0, 7); // YYYY-MM
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { new: 0, total: new Set() });
      }
      
      const data = monthlyData.get(monthKey)!;
      data.new++;
      data.total.add(customer.email);
    });
    
    // Convert to array and calculate cumulative totals
    const sortedMonths = Array.from(monthlyData.keys()).sort();
    const cumulativeCustomers = new Set<string>();
    
    return sortedMonths.map(month => {
      const data = monthlyData.get(month)!;
      data.total.forEach(email => cumulativeCustomers.add(email));
      
      return {
        month,
        newCustomers: data.new,
        totalCustomers: cumulativeCustomers.size
      };
    });
  }
}

export const customerService = new CustomerService();
