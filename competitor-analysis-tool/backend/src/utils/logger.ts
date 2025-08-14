import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { config } from '../config/config'

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`
  })
)

const transports: winston.transport[] = [
  // Console transport for development
  new winston.transports.Console({
    level: config.environment === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    ),
  }),
]

// File transports for production
if (config.environment === 'production') {
  // Error log file
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    })
  )

  // Combined log file
  transports.push(
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      format: logFormat,
    })
  )
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
  ],
})

// Create a stream object for Morgan HTTP request logging
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim())
  },
}

export default logger