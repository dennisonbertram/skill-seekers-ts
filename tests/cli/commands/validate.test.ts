/**
 * Tests for validate command
 * Following TDD: Write tests FIRST (RED phase)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import { validateCommand, ValidationResult } from '../../../src/cli/commands/validate';
import type { Config } from '../../../src/types/config';

describe('validate command', () => {
  const testDir = path.join(process.cwd(), 'test-temp-validate');
  const validConfigPath = path.join(testDir, 'valid-config.json');
  const invalidConfigPath = path.join(testDir, 'invalid-config.json');
  const nonExistentPath = path.join(testDir, 'does-not-exist.json');

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
      include: [],
      exclude: [],
    },
    categories: {
      guide: ['getting-started'],
      reference: ['api'],
    },
    rate_limit: 0.5,
    max_pages: 100,
  };

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(validConfigPath, JSON.stringify(validConfig, null, 2));
    await fs.writeFile(
      invalidConfigPath,
      JSON.stringify({
        name: 'test',
        // missing required fields
      }),
    );
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('validateCommand', () => {
    it('should return valid result for valid config', async () => {
      const result = await validateCommand({ config: validConfigPath });

      expect(result.isValid).toBe(true);
      expect(result.config).toEqual(validConfig);
      expect(result.errors).toBeUndefined();
    });

    it('should return config summary for valid config', async () => {
      const result = await validateCommand({ config: validConfigPath });

      expect(result.summary).toBeDefined();
      expect(result.summary!.name).toBe('test-skill');
      expect(result.summary!.url).toBe('https://example.com');
      expect(result.summary!.maxPages).toBe(100);
      expect(result.summary!.categoryCount).toBe(2);
    });

    it('should return invalid result when file does not exist', async () => {
      const result = await validateCommand({ config: nonExistentPath });

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('not found');
    });

    it('should return invalid result for schema violations', async () => {
      const result = await validateCommand({ config: invalidConfigPath });

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should include detailed error messages for each violation', async () => {
      const result = await validateCommand({ config: invalidConfigPath });

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      // Should have errors for missing base_url and selectors
      expect(result.errors!.some((e) => e.includes('base_url'))).toBe(true);
      expect(result.errors!.some((e) => e.includes('selectors'))).toBe(true);
    });

    it('should handle invalid JSON gracefully', async () => {
      const invalidJsonPath = path.join(testDir, 'invalid.json');
      await fs.writeFile(invalidJsonPath, '{ invalid json }');

      const result = await validateCommand({ config: invalidJsonPath });

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('JSON');
    });

    it('should include filePath in result', async () => {
      const result = await validateCommand({ config: validConfigPath });

      expect(result.filePath).toBe(validConfigPath);
    });

    it('should show category count as 0 when no categories defined', async () => {
      const noCategoriesConfig = {
        ...validConfig,
        categories: {},
      };
      const noCategoriesPath = path.join(testDir, 'no-categories.json');
      await fs.writeFile(noCategoriesPath, JSON.stringify(noCategoriesConfig));

      const result = await validateCommand({ config: noCategoriesPath });

      expect(result.isValid).toBe(true);
      expect(result.summary!.categoryCount).toBe(0);
    });

    it('should include rate limit in summary', async () => {
      const result = await validateCommand({ config: validConfigPath });

      expect(result.summary!.rateLimit).toBe(0.5);
    });

    it('should count categories correctly', async () => {
      const multiCategoryConfig = {
        ...validConfig,
        categories: {
          guide: ['getting-started'],
          reference: ['api'],
          tutorial: ['basics'],
        },
      };
      const multiCategoryPath = path.join(testDir, 'multi-category.json');
      await fs.writeFile(multiCategoryPath, JSON.stringify(multiCategoryConfig));

      const result = await validateCommand({ config: multiCategoryPath });

      expect(result.summary!.categoryCount).toBe(3);
    });
  });

  describe('ValidationResult', () => {
    it('should have correct structure for valid result', async () => {
      const result = await validateCommand({ config: validConfigPath });

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('config');
      expect(result).toHaveProperty('summary');
      expect(result.errors).toBeUndefined();
    });

    it('should have correct structure for invalid result', async () => {
      const result = await validateCommand({ config: invalidConfigPath });

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('errors');
      expect(result.config).toBeUndefined();
      expect(result.summary).toBeUndefined();
    });
  });
});
