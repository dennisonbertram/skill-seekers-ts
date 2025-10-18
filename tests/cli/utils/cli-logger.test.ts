/**
 * Tests for CLI logger utility
 * Following TDD: Write tests FIRST (RED phase)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CliLogger } from '../../../src/cli/utils/cli-logger';

describe('CliLogger', () => {
  let logger: CliLogger;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new CliLogger();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('success', () => {
    it('should output success message with checkmark', () => {
      logger.success('Operation completed');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation completed'),
      );
    });

    it('should use green color for success messages', () => {
      logger.success('Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[32m'),
      );
    });
  });

  describe('error', () => {
    it('should output error message with X mark', () => {
      logger.error('Operation failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌'),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed'),
      );
    });

    it('should use red color for error messages', () => {
      logger.error('Test');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[31m'),
      );
    });

    it('should display error details when provided', () => {
      const error = new Error('Test error');
      logger.error('Operation failed', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test error'),
      );
    });
  });

  describe('info', () => {
    it('should output info message with info icon', () => {
      logger.info('Processing...');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Processing...'),
      );
    });

    it('should use blue color for info messages', () => {
      logger.info('Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[36m'),
      );
    });
  });

  describe('warning', () => {
    it('should output warning message with warning icon', () => {
      logger.warning('This might take a while');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('This might take a while'),
      );
    });

    it('should use yellow color for warning messages', () => {
      logger.warning('Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[33m'),
      );
    });
  });

  describe('progress', () => {
    it('should output progress message with spinner', () => {
      logger.progress('Scraping pages...', 10, 50);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('⏳'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Scraping pages...'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('10/50'),
      );
    });

    it('should display percentage when current and total provided', () => {
      logger.progress('Processing', 25, 100);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('25%'),
      );
    });

    it('should work without current/total counts', () => {
      logger.progress('Loading...');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('⏳'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Loading...'),
      );
    });
  });

  describe('header', () => {
    it('should output header with rocket icon', () => {
      logger.header('skill-seekers-ts v2.0.0');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚀'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('skill-seekers-ts v2.0.0'),
      );
    });

    it('should use bold formatting for header', () => {
      logger.header('Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[1m'),
      );
    });
  });

  describe('summary', () => {
    it('should output summary with folder icon', () => {
      logger.summary('Output: ./output/test-skill');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('📂'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Output: ./output/test-skill'),
      );
    });
  });

  describe('blank', () => {
    it('should output blank line', () => {
      logger.blank();

      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });
  });

  describe('list', () => {
    it('should output list items with bullets', () => {
      logger.list(['Item 1', 'Item 2', 'Item 3']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('  • Item 1'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('  • Item 2'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('  • Item 3'),
      );
    });

    it('should work with empty array', () => {
      logger.list([]);

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('quiet mode', () => {
    it('should not output when quiet mode enabled', () => {
      const quietLogger = new CliLogger({ quiet: true });

      quietLogger.success('Test');
      quietLogger.error('Test');
      quietLogger.info('Test');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should still output errors in quiet mode when forceErrors is true', () => {
      const quietLogger = new CliLogger({ quiet: true });

      quietLogger.error('Critical error', undefined, true);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('verbose mode', () => {
    it('should output debug messages when verbose enabled', () => {
      const verboseLogger = new CliLogger({ verbose: true });

      verboseLogger.debug('Debug info');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Debug info'),
      );
    });

    it('should not output debug messages when verbose disabled', () => {
      logger.debug('Debug info');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
