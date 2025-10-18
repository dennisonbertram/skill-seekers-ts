/**
 * Tests for config-loader utility
 * Following TDD: Write tests FIRST (RED phase)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import { loadConfig, ConfigLoadError } from '../../../src/cli/utils/config-loader';
import type { Config } from '../../../src/types/config';

describe('config-loader', () => {
  const testDir = path.join(process.cwd(), 'test-temp-config');
  const validConfigPath = path.join(testDir, 'valid-config.json');
  const invalidJsonPath = path.join(testDir, 'invalid-json.json');
  const invalidSchemaPath = path.join(testDir, 'invalid-schema.json');
  const nonExistentPath = path.join(testDir, 'does-not-exist.json');

  // Valid config for testing
  const validConfig: Config = {
    name: 'test-skill',
    description: 'A test skill',
    base_url: 'https://example.com',
    selectors: {
      main_content: 'main',
      title: 'h1',
      code_blocks: 'pre code',
    },
    url_patterns: {
      include: ['**/docs/**'],
      exclude: ['**/api/**'],
    },
    categories: {
      guide: ['getting-started', 'tutorial'],
      reference: ['api', 'cli'],
    },
    rate_limit: 0.5,
    max_pages: 100,
  };

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });

    // Create valid config file
    await fs.writeFile(validConfigPath, JSON.stringify(validConfig, null, 2));

    // Create invalid JSON file
    await fs.writeFile(invalidJsonPath, '{ invalid json }');

    // Create invalid schema file (missing required fields)
    await fs.writeFile(
      invalidSchemaPath,
      JSON.stringify({
        name: 'test',
        // missing base_url and selectors
      }),
    );
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('loadConfig', () => {
    it('should load and validate a valid config file', async () => {
      const config = await loadConfig(validConfigPath);

      expect(config).toEqual(validConfig);
      expect(config.name).toBe('test-skill');
      expect(config.base_url).toBe('https://example.com');
      expect(config.selectors.main_content).toBe('main');
    });

    it('should throw ConfigLoadError when file does not exist', async () => {
      await expect(loadConfig(nonExistentPath)).rejects.toThrow(ConfigLoadError);
      await expect(loadConfig(nonExistentPath)).rejects.toThrow('Config file not found');
    });

    it('should throw ConfigLoadError for invalid JSON syntax', async () => {
      await expect(loadConfig(invalidJsonPath)).rejects.toThrow(ConfigLoadError);
      await expect(loadConfig(invalidJsonPath)).rejects.toThrow('Invalid JSON');
    });

    it('should throw ConfigLoadError for invalid schema', async () => {
      await expect(loadConfig(invalidSchemaPath)).rejects.toThrow(ConfigLoadError);
      await expect(loadConfig(invalidSchemaPath)).rejects.toThrow('Invalid config schema');
    });

    it('should include file path in error message', async () => {
      try {
        await loadConfig(nonExistentPath);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigLoadError);
        expect((error as ConfigLoadError).filePath).toBe(nonExistentPath);
      }
    });

    it('should provide detailed validation errors for schema violations', async () => {
      try {
        await loadConfig(invalidSchemaPath);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigLoadError);
        const configError = error as ConfigLoadError;
        expect(configError.message).toContain('Invalid config schema');
        expect(configError.validationErrors).toBeDefined();
        expect(configError.validationErrors!.length).toBeGreaterThan(0);
      }
    });

    it('should apply default values for optional fields', async () => {
      const minimalConfig = {
        name: 'minimal',
        base_url: 'https://example.com',
        selectors: {
          main_content: 'main',
          title: 'h1',
          code_blocks: 'pre code',
        },
      };

      const minimalConfigPath = path.join(testDir, 'minimal.json');
      await fs.writeFile(minimalConfigPath, JSON.stringify(minimalConfig));

      const config = await loadConfig(minimalConfigPath);

      // Should have default values
      expect(config.rate_limit).toBe(0.5);
      expect(config.max_pages).toBe(500);
      expect(config.url_patterns).toEqual({ include: [], exclude: [] });
    });

    it('should validate URL format', async () => {
      const invalidUrlConfig = {
        ...validConfig,
        base_url: 'not-a-valid-url',
      };

      const invalidUrlPath = path.join(testDir, 'invalid-url.json');
      await fs.writeFile(invalidUrlPath, JSON.stringify(invalidUrlConfig));

      await expect(loadConfig(invalidUrlPath)).rejects.toThrow(ConfigLoadError);
      await expect(loadConfig(invalidUrlPath)).rejects.toThrow('Invalid config schema');
    });

    it('should validate rate_limit is non-negative', async () => {
      const negativeRateConfig = {
        ...validConfig,
        rate_limit: -1,
      };

      const negativeRatePath = path.join(testDir, 'negative-rate.json');
      await fs.writeFile(negativeRatePath, JSON.stringify(negativeRateConfig));

      await expect(loadConfig(negativeRatePath)).rejects.toThrow(ConfigLoadError);
    });

    it('should validate max_pages is positive', async () => {
      const zeroMaxPages = {
        ...validConfig,
        max_pages: 0,
      };

      const zeroMaxPagesPath = path.join(testDir, 'zero-pages.json');
      await fs.writeFile(zeroMaxPagesPath, JSON.stringify(zeroMaxPages));

      await expect(loadConfig(zeroMaxPagesPath)).rejects.toThrow(ConfigLoadError);
    });
  });

  describe('ConfigLoadError', () => {
    it('should have correct properties', () => {
      const error = new ConfigLoadError('Test error', '/path/to/config.json');

      expect(error.message).toBe('Test error');
      expect(error.filePath).toBe('/path/to/config.json');
      expect(error.name).toBe('ConfigLoadError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should support validation errors', () => {
      const validationErrors = [
        { path: 'name', message: 'Required' },
        { path: 'base_url', message: 'Invalid URL' },
      ];

      const error = new ConfigLoadError('Invalid schema', '/path/config.json', validationErrors);

      expect(error.validationErrors).toEqual(validationErrors);
    });
  });
});
