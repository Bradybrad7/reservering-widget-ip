/**
 * Production-Ready Logger
 * 
 * Structured logging met verschillende log levels.
 * In development: Console output met kleuren
 * In production: Alleen errors/warns (kan later naar externe service)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'API' | 'Store' | 'Service' | 'Component' | 'Performance' | 'Auth' | 'Email' | 'Payment' | 'General';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  // Log level colors voor console
  private colors = {
    debug: '#6B7280',   // Gray
    info: '#3B82F6',    // Blue
    warn: '#F59E0B',    // Orange
    error: '#EF4444'    // Red
  };

  // Category emojis
  private categoryEmojis: Record<LogCategory, string> = {
    API: '🌐',
    Store: '📦',
    Service: '⚙️',
    Component: '🧩',
    Performance: '⚡',
    Auth: '🔐',
    Email: '📧',
    Payment: '💰',
    General: '📝'
  };

  /**
   * Log naar console met formatting (alleen in dev of bij errors/warns)
   */
  private log(level: LogLevel, category: LogCategory, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data
    };

    // Add to history
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // In production: Only log errors and warnings
    if (!this.isDevelopment && level !== 'error' && level !== 'warn') {
      return;
    }

    // Format message
    const emoji = this.categoryEmojis[category];
    const timestamp = entry.timestamp.toLocaleTimeString('nl-NL');
    const prefix = `${emoji} [${category}]`;

    // Console output met kleuren
    if (this.isDevelopment) {
      const color = this.colors[level];
      console.log(
        `%c${timestamp}%c ${prefix} ${message}`,
        'color: #9CA3AF',
        `color: ${color}; font-weight: bold`,
        data !== undefined ? data : ''
      );
    } else {
      // Production: Simple output
      console[level === 'debug' ? 'log' : level](
        `${timestamp} ${prefix} ${message}`,
        data !== undefined ? data : ''
      );
    }
  }

  /**
   * Debug logs (alleen development)
   */
  debug(category: LogCategory, message: string, data?: any) {
    this.log('debug', category, message, data);
  }

  /**
   * Info logs
   */
  info(category: LogCategory, message: string, data?: any) {
    this.log('info', category, message, data);
  }

  /**
   * Warning logs
   */
  warn(category: LogCategory, message: string, data?: any) {
    this.log('warn', category, message, data);
  }

  /**
   * Error logs (altijd gelogd)
   */
  error(category: LogCategory, message: string, error?: any) {
    // In production, zou je dit kunnen sturen naar Sentry/LogRocket
    this.log('error', category, message, error);
  }

  /**
   * Performance tracking
   */
  performance(operation: string, durationMs: number, category: LogCategory = 'Performance') {
    const message = `${operation} completed in ${durationMs}ms`;
    
    if (durationMs > 1000) {
      this.warn(category, `⏱️ Slow operation: ${message}`);
    } else if (durationMs > 500) {
      this.info(category, `⏱️ ${message}`);
    } else if (this.isDevelopment) {
      this.debug(category, `⏱️ ${message}`);
    }
  }

  /**
   * Get recent logs (voor debugging)
   */
  getHistory(level?: LogLevel, category?: LogCategory): LogEntry[] {
    return this.logHistory.filter(entry => {
      if (level && entry.level !== level) return false;
      if (category && entry.category !== category) return false;
      return true;
    });
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.logHistory = [];
  }

  /**
   * Export logs (voor debugging)
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }
}

// Singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (category: LogCategory, message: string, data?: any) => 
  logger.debug(category, message, data);

export const logInfo = (category: LogCategory, message: string, data?: any) => 
  logger.info(category, message, data);

export const logWarn = (category: LogCategory, message: string, data?: any) => 
  logger.warn(category, message, data);

export const logError = (category: LogCategory, message: string, error?: any) => 
  logger.error(category, message, error);

export const logPerformance = (operation: string, durationMs: number, category?: LogCategory) => 
  logger.performance(operation, durationMs, category);

// Make logger available in console for debugging
if (typeof window !== 'undefined') {
  (window as any).logger = logger;
}
