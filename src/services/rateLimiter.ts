/**
 * Rate Limiter Service
 * 
 * Prevents spam and abuse by limiting the number of requests
 * a user can make within a time window.
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitEntry {
  attempts: number[];
  blocked: boolean;
  blockedUntil?: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Default configurations
    this.configs.set('reservation', { maxAttempts: 5, windowMs: 60000 }); // 5 per minute
    this.configs.set('form-submit', { maxAttempts: 3, windowMs: 60000 }); // 3 per minute
    this.configs.set('api-call', { maxAttempts: 30, windowMs: 60000 }); // 30 per minute
    this.configs.set('email-send', { maxAttempts: 10, windowMs: 300000 }); // 10 per 5 minutes
    
    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  /**
   * Check if a request can be made
   */
  canMakeRequest(
    key: string,
    type: 'reservation' | 'form-submit' | 'api-call' | 'email-send' = 'api-call'
  ): { allowed: boolean; remaining: number; resetIn: number; reason?: string } {
    const config = this.configs.get(type)!;
    const now = Date.now();
    
    // Get or create entry
    let entry = this.limits.get(key);
    if (!entry) {
      entry = { attempts: [], blocked: false };
      this.limits.set(key, entry);
    }

    // Check if currently blocked
    if (entry.blocked && entry.blockedUntil) {
      if (now < entry.blockedUntil) {
        return {
          allowed: false,
          remaining: 0,
          resetIn: Math.ceil((entry.blockedUntil - now) / 1000),
          reason: `Te veel verzoeken. Probeer het over ${Math.ceil((entry.blockedUntil - now) / 1000)} seconden opnieuw.`
        };
      } else {
        // Unblock
        entry.blocked = false;
        entry.blockedUntil = undefined;
        entry.attempts = [];
      }
    }

    // Remove attempts outside the window
    entry.attempts = entry.attempts.filter(time => now - time < config.windowMs);

    // Check if limit exceeded
    if (entry.attempts.length >= config.maxAttempts) {
      // Block for 5 minutes
      entry.blocked = true;
      entry.blockedUntil = now + 300000; // 5 minutes
      
      return {
        allowed: false,
        remaining: 0,
        resetIn: 300,
        reason: 'Te veel verzoeken. U bent tijdelijk geblokkeerd. Probeer het over 5 minuten opnieuw.'
      };
    }

    // Add current attempt
    entry.attempts.push(now);

    const remaining = config.maxAttempts - entry.attempts.length;
    const oldestAttempt = entry.attempts[0];
    const resetIn = oldestAttempt ? Math.ceil((oldestAttempt + config.windowMs - now) / 1000) : 0;

    return {
      allowed: true,
      remaining,
      resetIn
    };
  }

  /**
   * Record a successful request
   */
  recordRequest(key: string, type: string = 'api-call'): void {
    this.canMakeRequest(key, type as any);
  }

  /**
   * Check remaining attempts without recording
   */
  checkRemaining(
    key: string,
    type: 'reservation' | 'form-submit' | 'api-call' | 'email-send' = 'api-call'
  ): number {
    const config = this.configs.get(type)!;
    const entry = this.limits.get(key);
    
    if (!entry) {
      return config.maxAttempts;
    }

    const now = Date.now();
    const recentAttempts = entry.attempts.filter(time => now - time < config.windowMs);
    
    return Math.max(0, config.maxAttempts - recentAttempts.length);
  }

  /**
   * Reset limits for a specific key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Block a key manually (for abuse detection)
   */
  block(key: string, durationMs: number = 3600000): void {
    const entry = this.limits.get(key) || { attempts: [], blocked: false };
    entry.blocked = true;
    entry.blockedUntil = Date.now() + durationMs;
    this.limits.set(key, entry);
  }

  /**
   * Unblock a key manually
   */
  unblock(key: string): void {
    const entry = this.limits.get(key);
    if (entry) {
      entry.blocked = false;
      entry.blockedUntil = undefined;
    }
  }

  /**
   * Check if a key is currently blocked
   */
  isBlocked(key: string): boolean {
    const entry = this.limits.get(key);
    if (!entry || !entry.blocked) return false;
    
    if (entry.blockedUntil && Date.now() >= entry.blockedUntil) {
      entry.blocked = false;
      entry.blockedUntil = undefined;
      return false;
    }
    
    return true;
  }

  /**
   * Get rate limit info for a key
   */
  getInfo(key: string, type: string = 'api-call'): {
    attempts: number;
    maxAttempts: number;
    remaining: number;
    blocked: boolean;
    blockedUntil?: Date;
  } {
    const config = this.configs.get(type)!;
    const entry = this.limits.get(key);
    
    if (!entry) {
      return {
        attempts: 0,
        maxAttempts: config.maxAttempts,
        remaining: config.maxAttempts,
        blocked: false
      };
    }

    const now = Date.now();
    const recentAttempts = entry.attempts.filter(time => now - time < config.windowMs);
    
    return {
      attempts: recentAttempts.length,
      maxAttempts: config.maxAttempts,
      remaining: Math.max(0, config.maxAttempts - recentAttempts.length),
      blocked: entry.blocked,
      blockedUntil: entry.blockedUntil ? new Date(entry.blockedUntil) : undefined
    };
  }

  /**
   * Cleanup old entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.limits.entries()) {
      // Remove entries with no recent attempts and not blocked
      if (entry.attempts.length === 0 && !entry.blocked) {
        this.limits.delete(key);
        continue;
      }

      // Remove entries where block has expired
      if (entry.blocked && entry.blockedUntil && now >= entry.blockedUntil) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Update configuration for a rate limit type
   */
  setConfig(type: string, config: RateLimitConfig): void {
    this.configs.set(type, config);
  }

  /**
   * Get all current limits (for debugging)
   */
  getAllLimits() {
    const result: Array<{ key: string; info: any }> = [];
    
    for (const key of this.limits.keys()) {
      result.push({
        key,
        info: this.getInfo(key)
      });
    }
    
    return result;
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Helper functions for common use cases
export const checkReservationLimit = (email: string) => {
  return rateLimiter.canMakeRequest(`reservation-${email}`, 'reservation');
};

export const checkFormSubmitLimit = (identifier: string) => {
  return rateLimiter.canMakeRequest(`form-${identifier}`, 'form-submit');
};

export const checkApiLimit = (endpoint: string, identifier: string) => {
  return rateLimiter.canMakeRequest(`${endpoint}-${identifier}`, 'api-call');
};

export const checkEmailLimit = (email: string) => {
  return rateLimiter.canMakeRequest(`email-${email}`, 'email-send');
};

export default rateLimiter;
