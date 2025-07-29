export declare enum LogLevel {
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
export declare class Logger {
    private level;
    private prefix;
    private timestamp;
    constructor(options?: LoggerOptions);
    private formatMessage;
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    success(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, error?: Error | any): void;
    setLevel(level: LogLevel): void;
    createChildLogger(prefix: string): Logger;
}
export declare const logger: Logger;
//# sourceMappingURL=Logger.d.ts.map