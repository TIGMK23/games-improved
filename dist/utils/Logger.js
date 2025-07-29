import chalk from 'chalk';
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["SILENT"] = 4] = "SILENT";
})(LogLevel || (LogLevel = {}));
export class Logger {
    level;
    prefix;
    timestamp;
    constructor(options = { level: LogLevel.INFO }) {
        this.level = options.level;
        this.prefix = options.prefix || '';
        this.timestamp = options.timestamp || true;
    }
    formatMessage(level, message, data) {
        const timestamp = this.timestamp ? `[${new Date().toISOString()}] ` : '';
        const prefix = this.prefix ? `[${this.prefix}] ` : '';
        const dataStr = data ? ` ${JSON.stringify(data, null, 2)}` : '';
        return `${timestamp}${prefix}${level} ${message}${dataStr}`;
    }
    debug(message, data) {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(chalk.gray(this.formatMessage('DEBUG', message, data)));
        }
    }
    info(message, data) {
        if (this.level <= LogLevel.INFO) {
            console.info(chalk.blue(this.formatMessage('INFO', message, data)));
        }
    }
    success(message, data) {
        if (this.level <= LogLevel.INFO) {
            console.info(chalk.green(this.formatMessage('SUCCESS', message, data)));
        }
    }
    warn(message, data) {
        if (this.level <= LogLevel.WARN) {
            console.warn(chalk.yellow(this.formatMessage('WARN', message, data)));
        }
    }
    error(message, error) {
        if (this.level <= LogLevel.ERROR) {
            const errorData = error instanceof Error
                ? { message: error.message, stack: error.stack }
                : error;
            console.error(chalk.red(this.formatMessage('ERROR', message, errorData)));
        }
    }
    setLevel(level) {
        this.level = level;
    }
    createChildLogger(prefix) {
        return new Logger({
            level: this.level,
            prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
            timestamp: this.timestamp
        });
    }
}
// Default logger instance
export const logger = new Logger();
//# sourceMappingURL=Logger.js.map