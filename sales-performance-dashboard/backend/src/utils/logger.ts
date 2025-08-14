import winston from 'winston';
import { config } from '../config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Define colors for each log level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'white',
  debug: 'cyan',
  silly: 'grey',
};

// Tell winston that we want to link the colors to the levels
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// Add file transports for production
if (config.env === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object with a 'write' function that will be used by morgan
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Add request ID to logger context
export const addRequestId = (requestId: string) => {
  return logger.child({ requestId });
};

// Structured logging functions
export const loggers = {
  // Authentication events
  auth: {
    login: (userId: string, email: string, ip: string) => {
      logger.info('User login', {
        event: 'auth.login',
        userId,
        email,
        ip,
        timestamp: new Date().toISOString(),
      });
    },
    logout: (userId: string, email: string) => {
      logger.info('User logout', {
        event: 'auth.logout',
        userId,
        email,
        timestamp: new Date().toISOString(),
      });
    },
    failed: (email: string, ip: string, reason: string) => {
      logger.warn('Authentication failed', {
        event: 'auth.failed',
        email,
        ip,
        reason,
        timestamp: new Date().toISOString(),
      });
    },
    tokenRefresh: (userId: string, email: string) => {
      logger.info('Token refresh', {
        event: 'auth.token_refresh',
        userId,
        email,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // API events
  api: {
    request: (method: string, url: string, userId?: string, responseTime?: number) => {
      logger.http('API request', {
        event: 'api.request',
        method,
        url,
        userId,
        responseTime,
        timestamp: new Date().toISOString(),
      });
    },
    error: (method: string, url: string, error: any, userId?: string) => {
      logger.error('API error', {
        event: 'api.error',
        method,
        url,
        error: error.message,
        stack: error.stack,
        userId,
        timestamp: new Date().toISOString(),
      });
    },
    rateLimit: (ip: string, userId?: string) => {
      logger.warn('Rate limit exceeded', {
        event: 'api.rate_limit',
        ip,
        userId,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Business events
  business: {
    userCreated: (userId: string, email: string, organizationId: string) => {
      logger.info('User created', {
        event: 'business.user_created',
        userId,
        email,
        organizationId,
        timestamp: new Date().toISOString(),
      });
    },
    organizationCreated: (organizationId: string, name: string, userId: string) => {
      logger.info('Organization created', {
        event: 'business.organization_created',
        organizationId,
        name,
        createdBy: userId,
        timestamp: new Date().toISOString(),
      });
    },
    integrationConnected: (integrationId: string, type: string, organizationId: string) => {
      logger.info('Integration connected', {
        event: 'business.integration_connected',
        integrationId,
        type,
        organizationId,
        timestamp: new Date().toISOString(),
      });
    },
    dashboardCreated: (dashboardId: string, name: string, userId: string) => {
      logger.info('Dashboard created', {
        event: 'business.dashboard_created',
        dashboardId,
        name,
        createdBy: userId,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Security events
  security: {
    suspiciousActivity: (description: string, userId?: string, ip?: string) => {
      logger.warn('Suspicious activity detected', {
        event: 'security.suspicious_activity',
        description,
        userId,
        ip,
        timestamp: new Date().toISOString(),
      });
    },
    dataAccess: (resource: string, action: string, userId: string) => {
      logger.info('Sensitive data access', {
        event: 'security.data_access',
        resource,
        action,
        userId,
        timestamp: new Date().toISOString(),
      });
    },
    configChange: (setting: string, oldValue: any, newValue: any, userId: string) => {
      logger.info('Configuration changed', {
        event: 'security.config_change',
        setting,
        oldValue,
        newValue,
        changedBy: userId,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Performance events
  performance: {
    slowQuery: (query: string, duration: number, userId?: string) => {
      logger.warn('Slow database query', {
        event: 'performance.slow_query',
        query,
        duration,
        userId,
        timestamp: new Date().toISOString(),
      });
    },
    highMemoryUsage: (usage: number, threshold: number) => {
      logger.warn('High memory usage', {
        event: 'performance.high_memory',
        usage,
        threshold,
        timestamp: new Date().toISOString(),
      });
    },
    highCpuUsage: (usage: number, threshold: number) => {
      logger.warn('High CPU usage', {
        event: 'performance.high_cpu',
        usage,
        threshold,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Integration events
  integration: {
    syncStarted: (integrationId: string, type: string) => {
      logger.info('Data sync started', {
        event: 'integration.sync_started',
        integrationId,
        type,
        timestamp: new Date().toISOString(),
      });
    },
    syncCompleted: (integrationId: string, type: string, recordsProcessed: number, duration: number) => {
      logger.info('Data sync completed', {
        event: 'integration.sync_completed',
        integrationId,
        type,
        recordsProcessed,
        duration,
        timestamp: new Date().toISOString(),
      });
    },
    syncFailed: (integrationId: string, type: string, error: string) => {
      logger.error('Data sync failed', {
        event: 'integration.sync_failed',
        integrationId,
        type,
        error,
        timestamp: new Date().toISOString(),
      });
    },
    webhookReceived: (source: string, eventType: string, organizationId?: string) => {
      logger.info('Webhook received', {
        event: 'integration.webhook_received',
        source,
        eventType,
        organizationId,
        timestamp: new Date().toISOString(),
      });
    },
  },
};

// Export default logger
export default logger;