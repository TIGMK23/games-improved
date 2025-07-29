import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export interface LoggerOptions {
  level: LogLevel;
  prefix?: string;
  timestamp?: boolean;
}

export class Logger {
  private level: LogLevel;
  private prefix: string;
  private timestamp: boolean;

  constructor(options: LoggerOptions = { level: LogLevel.INFO }) {
    this.level = options.level;
    this.prefix = options.prefix || '';
    this.timestamp = options.timestamp || true;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = this.timestamp ? `[${new Date().toISOString()}] ` : '';
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    const dataStr = data ? ` ${JSON.stringify(data, null, 2)}` : '';
    return `${timestamp}${prefix}${level} ${message}${dataStr}`;
  }

  debug(message: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(chalk.gray(this.formatMessage('DEBUG', message, data)));
    }
  }

  info(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.info(chalk.blue(this.formatMessage('INFO', message, data)));
    }
  }

  success(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.info(chalk.green(this.formatMessage('SUCCESS', message, data)));
    }
  }

  warn(message: string, data?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(chalk.yellow(this.formatMessage('WARN', message, data)));
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.level <= LogLevel.ERROR) {
      const errorData = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error;
      console.error(chalk.red(this.formatMessage('ERROR', message, errorData)));
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  createChildLogger(prefix: string): Logger {
    return new Logger({
      level: this.level,
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
      timestamp: this.timestamp
    });
  }
}

// Default logger instance
export const logger = new Logger();
