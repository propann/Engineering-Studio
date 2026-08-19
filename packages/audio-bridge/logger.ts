/**
 * Unified logging utility for all applications
 * Supports debug mode and production log levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
}

class Logger {
  private module: string;
  private debugEnabled: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor(module: string, debugEnabled = false) {
    this.module = module;
    this.debugEnabled = debugEnabled || this.isDebugMode();
  }

  private isDebugMode(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.localStorage?.getItem('DEBUG') === 'true'
    );
  }

  private formatTime(): string {
    return new Date().toISOString().split('T')[1].split('.')[0];
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.debugEnabled && level === 'debug') return false;
    return true;
  }

  private addToHistory(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  debug(message: string, data?: unknown): void {
    if (!this.shouldLog('debug')) return;
    const entry: LogEntry = {
      timestamp: this.formatTime(),
      level: 'debug',
      module: this.module,
      message,
      data,
    };
    this.addToHistory(entry);
    console.log(
      `[${entry.timestamp}] 🔍 ${this.module}: ${message}`,
      data || ''
    );
  }

  info(message: string, data?: unknown): void {
    if (!this.shouldLog('info')) return;
    const entry: LogEntry = {
      timestamp: this.formatTime(),
      level: 'info',
      module: this.module,
      message,
      data,
    };
    this.addToHistory(entry);
    console.info(
      `[${entry.timestamp}] ℹ️ ${this.module}: ${message}`,
      data || ''
    );
  }

  warn(message: string, data?: unknown): void {
    if (!this.shouldLog('warn')) return;
    const entry: LogEntry = {
      timestamp: this.formatTime(),
      level: 'warn',
      module: this.module,
      message,
      data,
    };
    this.addToHistory(entry);
    console.warn(
      `[${entry.timestamp}] ⚠️ ${this.module}: ${message}`,
      data || ''
    );
  }

  error(message: string, error?: unknown): void {
    if (!this.shouldLog('error')) return;
    const entry: LogEntry = {
      timestamp: this.formatTime(),
      level: 'error',
      module: this.module,
      message,
      data: error,
    };
    this.addToHistory(entry);
    console.error(
      `[${entry.timestamp}] ❌ ${this.module}: ${message}`,
      error || ''
    );
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) return this.logs;
    return this.logs.filter((log) => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }

  enableDebug(): void {
    this.debugEnabled = true;
    localStorage?.setItem('DEBUG', 'true');
  }

  disableDebug(): void {
    this.debugEnabled = false;
    localStorage?.removeItem('DEBUG');
  }
}

/**
 * Create a logger instance for a module
 * @param module - Module name for identifying logs
 * @param debug - Enable debug logs (default: read from localStorage)
 * @returns Logger instance
 */
export function createLogger(
  module: string,
  debug?: boolean
): Logger {
  return new Logger(module, debug);
}

// Export singleton for global use
export const globalLogger = new Logger('GLOBAL');

export default Logger;
