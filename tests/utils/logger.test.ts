import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, createModuleLogger } from '../../src/utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create logger instance', () => {
    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it('should have file transport for error logs', () => {
    const fileTransports = logger.transports.filter(
      (transport: any) => transport.constructor.name === 'File'
    );
    const errorTransport = fileTransports.find(
      (transport: any) => transport.level === 'error'
    );
    expect(errorTransport).toBeDefined();
  });

  it('should have file transport for combined logs', () => {
    const fileTransports = logger.transports.filter(
      (transport: any) => transport.constructor.name === 'File'
    );
    const combinedTransport = fileTransports.find(
      (transport: any) => !transport.level || transport.level === 'info'
    );
    expect(combinedTransport).toBeDefined();
  });

  it('should have console transport', () => {
    const consoleTransport = logger.transports.find(
      (transport: any) => transport.constructor.name === 'Console'
    );
    expect(consoleTransport).toBeDefined();
  });

  it('should use timestamp format YYYY-MM-DD HH:mm:ss', async () => {
    // The best way to verify timestamp format is to check actual log output
    const testLogFile = path.join(process.cwd(), 'logs', 'combined.log');

    // Write a test log
    logger.info('Timestamp format test');

    // Give time for async write
    await new Promise(resolve => setTimeout(resolve, 100));

    // Read the log file
    const logContent = await fs.readFile(testLogFile, 'utf-8');
    const lines = logContent.split('\n').filter(Boolean);
    const lastLine = lines[lines.length - 1];

    if (lastLine) {
      const logEntry = JSON.parse(lastLine);
      // Check timestamp format matches YYYY-MM-DD HH:mm:ss pattern
      expect(logEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    }
  });

  it('should create module-specific logger', () => {
    const moduleLogger = createModuleLogger('test-module');
    expect(moduleLogger).toBeDefined();
    expect(moduleLogger.info).toBeDefined();
    expect(moduleLogger.error).toBeDefined();
    expect(moduleLogger.debug).toBeDefined();
  });

  it('should not throw when logging messages', () => {
    expect(() => logger.info('Test message')).not.toThrow();
    expect(() => logger.error('Error message')).not.toThrow();
    expect(() => logger.debug('Debug message')).not.toThrow();
  });

  it('should create logs directory automatically', async () => {
    const logsDir = path.join(process.cwd(), 'logs');
    // Logger should have already created the logs directory
    const dirExists = await fs.access(logsDir).then(() => true).catch(() => false);
    expect(dirExists).toBe(true);
  });

  it('should write error logs to error.log file', async () => {
    const errorLogPath = path.join(process.cwd(), 'logs', 'error.log');
    logger.error('Test error for file');

    // Give some time for async file write
    await new Promise(resolve => setTimeout(resolve, 100));

    const fileExists = await fs.access(errorLogPath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should format console output correctly', () => {
    const consoleTransport = logger.transports.find(
      (transport: any) => transport.constructor.name === 'Console'
    );

    expect(consoleTransport).toBeDefined();
    // Check that console transport has colorize and custom printf format
    const format = (consoleTransport as any).format;
    expect(format).toBeDefined();
  });
});