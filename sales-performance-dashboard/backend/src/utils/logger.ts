import winston from 'winston'
import path from 'path'

// Log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

// Log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
}

winston.addColors(logColors)

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''
    return `${timestamp} [${level}]: ${message}${metaStr}`
  })
)

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Create transports
const transports: winston.transport[] = []

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  )
}

// File transports for production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  )

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  )

  // Console transport for production (only errors and warnings)
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'warn'
    })
  )
}

// Create logger instance
export const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: fileFormat,
  defaultMeta: {
    service: 'sales-dashboard-api',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports,
  exitOnError: false
})

// Performance logging
export class PerformanceLogger {
  private static timers: Map<string, number> = new Map()

  static start(label: string): void {
    this.timers.set(label, Date.now())
  }

  static end(label: string, metadata?: any): number {
    const startTime = this.timers.get(label)
    if (!startTime) {
      logger.warn('Performance timer not found', { label })
      return 0
    }

    const duration = Date.now() - startTime
    this.timers.delete(label)

    logger.info('Performance measurement', {
      label,
      duration,
      ...metadata
    })

    return duration
  }

  static measure<T>(label: string, fn: () => T, metadata?: any): T {
    this.start(label)
    try {
      const result = fn()
      this.end(label, metadata)
      return result
    } catch (error) {
      this.end(label, { ...metadata, error: true })
      throw error
    }
  }

  static async measureAsync<T>(
    label: string, 
    fn: () => Promise<T>, 
    metadata?: any
  ): Promise<T> {
    this.start(label)
    try {
      const result = await fn()
      this.end(label, metadata)
      return result
    } catch (error) {
      this.end(label, { ...metadata, error: true })
      throw error
    }
  }
}

// Structured logging helpers
export const loggers = {
  // HTTP request logging
  http: (req: any, res: any, duration?: number) => {
    logger.http('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      tenantId: req.user?.tenantId,
      duration
    })
  },

  // Database operation logging
  database: (operation: string, table: string, duration?: number, error?: any) => {
    const logLevel = error ? 'error' : 'debug'
    logger.log(logLevel, 'Database Operation', {
      operation,
      table,
      duration,
      error: error?.message
    })
  },

  // Authentication logging
  auth: (action: string, userId?: string, metadata?: any) => {
    logger.info('Authentication Event', {
      action,
      userId,
      ...metadata
    })
  },

  // Business logic logging
  business: (event: string, data?: any) => {
    logger.info('Business Event', {
      event,
      ...data
    })
  },

  // Security event logging
  security: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: any) => {
    const logLevel = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info'
    logger.log(logLevel, 'Security Event', {
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...metadata
    })
  },

  // Cache operation logging
  cache: (operation: string, key: string, hit?: boolean, duration?: number) => {
    logger.debug('Cache Operation', {
      operation,
      key,
      hit,
      duration
    })
  },

  // External API logging
  external: (service: string, operation: string, duration?: number, error?: any) => {
    const logLevel = error ? 'error' : 'debug'
    logger.log(logLevel, 'External API Call', {
      service,
      operation,
      duration,
      error: error?.message
    })
  },

  // Error logging with context
  error: (error: Error, context?: any) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    })
  }
}

// Request correlation ID middleware helper
export const addRequestId = () => {
  return (req: any, res: any, next: any) => {
    req.requestId = req.get('X-Request-ID') || 
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    res.set('X-Request-ID', req.requestId)
    
    // Add request ID to all logs in this request context
    logger.defaultMeta = {
      ...logger.defaultMeta,
      requestId: req.requestId
    }
    
    next()
    
    // Clean up after request
    delete logger.defaultMeta.requestId
  }
}

// Sanitize sensitive data from logs
export const sanitizeLogData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'email',
    'phone'
  ]

  const sanitized = { ...data }

  const sanitizeObject = (obj: any, path: string = ''): any => {
    if (!obj || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) => sanitizeObject(item, `${path}[${index}]`))
    }

    const result: any = {}
    
    Object.keys(obj).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key
      const lowerKey = key.toLowerCase()
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        result[key] = '[REDACTED]'
      } else if (typeof obj[key] === 'object') {
        result[key] = sanitizeObject(obj[key], currentPath)
      } else {
        result[key] = obj[key]
      }
    })
    
    return result
  }

  return sanitizeObject(sanitized)
}

// Custom error logging
export const logError = (error: Error, context?: any) => {
  const sanitizedContext = sanitizeLogData(context)
  loggers.error(error, sanitizedContext)
}

// Log application startup
export const logStartup = (port: number, environment: string) => {
  logger.info('🚀 Application Started', {
    port,
    environment,
    nodeVersion: process.version,
    pid: process.pid,
    timestamp: new Date().toISOString()
  })
}

// Log application shutdown
export const logShutdown = (reason?: string) => {
  logger.info('🛑 Application Shutdown', {
    reason,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
}

// Log health check
export const logHealthCheck = (status: 'healthy' | 'unhealthy', checks: any) => {
  const logLevel = status === 'healthy' ? 'info' : 'error'
  logger.log(logLevel, 'Health Check', {
    status,
    checks,
    timestamp: new Date().toISOString()
  })
}

export default logger