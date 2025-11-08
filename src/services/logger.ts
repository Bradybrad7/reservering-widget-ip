/**
 * Environment-Aware Logging Service
 * 
 * Purpose: Replace console.log statements with proper logging that:
 * - Respects environment (dev vs production)
 * - Provides structured logging
 * - Can be redirected to monitoring services
 * - Supports different log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  enabled: boolean;
  level: LogLevel;
  includeTimestamp: boolean;
  includeContext: boolean;
}

class Logger {
  private config: LogConfig = {
    enabled: import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGGING === 'true',
    level: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'debug',
    includeTimestamp: true,
    includeContext: true
  };

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }

  private formatMessage(level: LogLevel, context: string, message: string, data?: any): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      parts.push(new Date().toISOString());
    }

    const levelEmoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    };

    parts.push(`${levelEmoji[level]} [${level.toUpperCase()}]`);

    if (this.config.includeContext && context) {
      parts.push(`[${context}]`);
    }

    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Debug level logging (development only)
   */
  debug(context: string, message: string, data?: any): void {
    if (!this.shouldLog('debug')) return;
    
    const formatted = this.formatMessage('debug', context, message, data);
    if (data !== undefined) {
      console.log(formatted, data);
    } else {
      console.log(formatted);
    }
  }

  /**
   * Info level logging
   */
  info(context: string, message: string, data?: any): void {
    if (!this.shouldLog('info')) return;
    
    const formatted = this.formatMessage('info', context, message, data);
    if (data !== undefined) {
      console.info(formatted, data);
    } else {
      console.info(formatted);
    }
  }

  /**
   * Warning level logging
   */
  warn(context: string, message: string, data?: any): void {
    if (!this.shouldLog('warn')) return;
    
    const formatted = this.formatMessage('warn', context, message, data);
    if (data !== undefined) {
      console.warn(formatted, data);
    } else {
      console.warn(formatted);
    }
  }

  /**
   * Error level logging (always logged)
   */
  error(context: string, message: string, error?: Error | any): void {
    if (!this.shouldLog('error')) return;
    
    const formatted = this.formatMessage('error', context, message);
    if (error) {
      console.error(formatted, error);
      
      // In production, you might want to send errors to a monitoring service
      if (import.meta.env.PROD) {
        // TODO: Send to Sentry, LogRocket, etc.
        // this.sendToMonitoringService(error);
      }
    } else {
      console.error(formatted);
    }
  }

  /**
   * Update configuration
   */
  configure(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience methods for common contexts
export const storeLogger = {
  debug: (message: string, data?: any) => logger.debug('STORE', message, data),
  info: (message: string, data?: any) => logger.info('STORE', message, data),
  warn: (message: string, data?: any) => logger.warn('STORE', message, data),
  error: (message: string, error?: any) => logger.error('STORE', message, error)
};

export const apiLogger = {
  debug: (message: string, data?: any) => logger.debug('API', message, data),
  info: (message: string, data?: any) => logger.info('API', message, data),
  warn: (message: string, data?: any) => logger.warn('API', message, data),
  error: (message: string, error?: any) => logger.error('API', message, error)
};

export const firestoreLogger = {
  debug: (message: string, data?: any) => logger.debug('FIRESTORE', message, data),
  info: (message: string, data?: any) => logger.info('FIRESTORE', message, data),
  warn: (message: string, data?: any) => logger.warn('FIRESTORE', message, data),
  error: (message: string, error?: any) => logger.error('FIRESTORE', message, error)
};

export const uiLogger = {
  debug: (message: string, data?: any) => logger.debug('UI', message, data),
  info: (message: string, data?: any) => logger.info('UI', message, data),
  warn: (message: string, data?: any) => logger.warn('UI', message, data),
  error: (message: string, error?: any) => logger.error('UI', message, error)
};
