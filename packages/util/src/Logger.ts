

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

type LoggerOptions = {
    logLevel: LogLevel;
    doc: string;
};

export default class Logger {
    private static instance?: Logger;
    private options: LoggerOptions;
    private logInt: { [key: string]: number } = {
        error: 4,
        warn: 3,
        info: 2,
        debug: 1,
    };
    public static configure(options?: LoggerOptions) {
        if (!this.instance) {
            this.instance = new Logger(options);
        }
        return this.instance;
    }
    private constructor(options?: LoggerOptions) {
        if (options) {   
            this.options = options;
        } else {
            this.options = {
                logLevel: 'info',
                doc: 'default'
            }
        }
    }
    private _shouldLog(type: string): boolean {
        return this.logInt[type] >= this.logInt[this.options!.logLevel];
    }

    private _log(type: string, message: string, ...args: any[]) {
        if (this._shouldLog(type)) {
            console[type](message, ...args);
        }
    }

    public debug(message: string, ...args: any[]) {
        this._log('debug', message, ...args);
    }

    public info(message: string, ...args: any[]) {
        this._log('info', message, ...args);
    }

    public warn(message: string, ...args: any[]) {
        this._log('warn', message, ...args);
    }

    public error(message: string, ...args: any[]) {
        this._log('error', message, ...args);
    }

}