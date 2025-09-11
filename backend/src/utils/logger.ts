import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // File transport for all logs
  new DailyRotateFile({
    filename: path.join(process.env.LOG_FILE_PATH || './logs', 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // Error log file
  new DailyRotateFile({
    filename: path.join(process.env.LOG_FILE_PATH || './logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    level: 'error',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // Database operations log file
  new DailyRotateFile({
    filename: path.join(process.env.LOG_FILE_PATH || './logs', 'database-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // API requests log file
  new DailyRotateFile({
    filename: path.join(process.env.LOG_FILE_PATH || './logs', 'api-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

// Create specialized loggers
export const dbLogger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new DailyRotateFile({
      filename: path.join(process.env.LOG_FILE_PATH || './logs', 'database-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

export const apiLogger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new DailyRotateFile({
      filename: path.join(process.env.LOG_FILE_PATH || './logs', 'api-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Helper functions for different types of logging
export const logDatabase = {
  connection: (message: string, details?: any) => {
    dbLogger.info(`[DB CONNECTION] ${message}`, { details });
  },
  query: (query: string, params?: any, duration?: number) => {
    dbLogger.debug(`[DB QUERY] ${query}`, { 
      params, 
      duration: duration ? `${duration}ms` : undefined 
    });
  },
  success: (operation: string, details?: any) => {
    dbLogger.info(`[DB SUCCESS] ${operation}`, { details });
  },
  error: (operation: string, error: any) => {
    dbLogger.error(`[DB ERROR] ${operation}`, { error: error.message, stack: error.stack });
  }
};

export const logApi = {
  request: (method: string, url: string, ip: string, userAgent?: string) => {
    apiLogger.http(`[API REQUEST] ${method} ${url}`, { ip, userAgent });
  },
  response: (method: string, url: string, statusCode: number, duration?: number) => {
    apiLogger.http(`[API RESPONSE] ${method} ${url} - ${statusCode}`, { 
      duration: duration ? `${duration}ms` : undefined 
    });
  },
  error: (method: string, url: string, error: any) => {
    apiLogger.error(`[API ERROR] ${method} ${url}`, { error: error.message, stack: error.stack });
  }
};

export const logAuth = {
  login: (username: string, success: boolean, ip?: string) => {
    logger.info(`[AUTH] Login attempt for ${username} - ${success ? 'SUCCESS' : 'FAILED'}`, { ip });
  },
  token: (action: string, details?: any) => {
    logger.debug(`[AUTH] Token ${action}`, { details });
  },
  unauthorized: (ip: string, userAgent?: string) => {
    logger.warn(`[AUTH] Unauthorized access attempt`, { ip, userAgent });
  }
};

export default logger;
