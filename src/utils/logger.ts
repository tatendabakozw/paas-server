import { createLogger, format, transports } from 'winston';

// Define logging format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
);

// Create logger
const logger = createLogger({
  level: 'info', // Default level for logging
  format: logFormat,
  transports: [
    // Console output
    new transports.Console({
      format: format.combine(format.colorize(), logFormat)
    }),
    // File output for error logs
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // File output for combined logs
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
