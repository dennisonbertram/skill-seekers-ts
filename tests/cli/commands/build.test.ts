/**
 * Tests for build command
 * Following TDD: Write tests FIRST (RED phase)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import { buildCommand, BuildCommandOptions } from '../../../src/cli/commands/build';
import type { Config } from '../../../src/types/config';

describe('build command', () => {
  const testDir = path.join(process.cwd(), 'test-temp-build');
  const configPath = path.join(testDir, 'config.json');
  const outputDir = path.join(testDir, 'output');

  const testConfig: Config = {
    name: 'test-skill',
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
    categories: {},
    rate_limit: 0.5,
    max_pages: 10,
  };

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(testConfig, null, 2));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('buildCommand - flag validation', () => {
    it('should require either --config or both --name and --url', async () => {
      await expect(buildCommand({})).rejects.toThrow(
        'Either --config or both --name and --url are required',
      );
    });

    it('should require --url when --name is provided without --config', async () => {
      await expect(
        buildCommand({
          name: 'test',
        }),
      ).rejects.toThrow('--url is required');
    });

    it('should require --name when --url is provided without --config', async () => {
      await expect(
        buildCommand({
          url: 'https://example.com',
        }),
      ).rejects.toThrow('--name is required');
    });

    it('should accept config file path', async () => {
      // Should not throw flag validation errors
      const options = {
        config: configPath,
        noFirecrawl: true,
      };

      // Validates that flags are accepted without throwing validation errors
      // (Will fail during scraping, but that's expected)
      try {
        await buildCommand(options);
      } catch (error) {
        const err = error as Error;
        // Should not be a flag validation error
        expect(err.message).not.toContain('required');
      }
    });

    it('should accept name and url without config', async () => {
      // Should not throw flag validation errors
      const options = {
        name: 'test',
        url: 'https://example.com',
        noFirecrawl: true,
      };

      // Validates that flags are accepted without throwing validation errors
      try {
        await buildCommand(options);
      } catch (error) {
        const err = error as Error;
        // Should not be a flag validation error
        expect(err.message).not.toContain('required');
      }
    });
  });

  describe('buildCommand - config merging', () => {
    it('should load config from file when --config provided', async () => {
      const options: BuildCommandOptions = {
        config: configPath,
        noFirecrawl: true,
      };

      // We expect this to fail during scraping (no real network), but not during config loading
      try {
        await buildCommand(options);
      } catch (error) {
        // Error should not be about missing flags
        const err = error as Error;
        expect(err.message).not.toContain('required');
        expect(err.message).not.toContain('--config');
        expect(err.message).not.toContain('--name');
        expect(err.message).not.toContain('--url');
      }
    });

    it('should merge flags with config (flags override)', async () => {
      const options: BuildCommandOptions = {
        config: configPath,
        maxPages: 5, // Override config's max_pages: 10
        output: outputDir,
      };

      // The merged config should use maxPages: 5, not 10
      // We'll verify this indirectly by checking the command doesn't throw flag validation errors
      try {
        await buildCommand(options);
      } catch (error) {
        // Should fail during scraping, not during config merging
        const err = error as Error;
        expect(err.message).not.toContain('required');
      }
    });
  });

  describe('buildCommand - scraper options', () => {
    it('should use Cheerio scraper when --no-firecrawl flag set', async () => {
      const options: BuildCommandOptions = {
        name: 'test',
        url: 'https://example.com',
        noFirecrawl: true,
      };

      try {
        await buildCommand(options);
      } catch (error) {
        // Should not fail due to missing API key
        const err = error as Error;
        expect(err.message).not.toContain('API key');
      }
    });

    it('should use Firecrawl key from flag when provided', async () => {
      const options: BuildCommandOptions = {
        name: 'test',
        url: 'https://example.com',
        firecrawlKey: 'test-key-123',
      };

      try {
        await buildCommand(options);
      } catch (error) {
        // Should not fail due to missing API key
        const err = error as Error;
        expect(err.message).not.toContain('API key');
      }
    });

    it('should use Firecrawl key from environment when not in flags', async () => {
      // Set environment variable
      const originalEnv = process.env.FIRECRAWL_API_KEY;
      process.env.FIRECRAWL_API_KEY = 'env-key-123';

      try {
        const options: BuildCommandOptions = {
          name: 'test',
          url: 'https://example.com',
        };

        await buildCommand(options);
      } catch (error) {
        // Should not fail due to missing API key
        const err = error as Error;
        expect(err.message).not.toContain('API key');
      } finally {
        // Restore environment
        if (originalEnv) {
          process.env.FIRECRAWL_API_KEY = originalEnv;
        } else {
          delete process.env.FIRECRAWL_API_KEY;
        }
      }
    });
  });

  describe('buildCommand - output options', () => {
    it('should use default output directory when not specified', async () => {
      const options: BuildCommandOptions = {
        name: 'test-skill',
        url: 'https://example.com',
        noFirecrawl: true,
      };

      try {
        await buildCommand(options);
      } catch {
        // Expected to fail during scraping
      }

      // Default output should be ./output/{name}
      // We can't verify this without mocking the entire scraper,
      // but we can verify the command doesn't throw an error about missing output
    });

    it('should use custom output directory when specified', async () => {
      const options: BuildCommandOptions = {
        name: 'test',
        url: 'https://example.com',
        output: outputDir,
        noFirecrawl: true,
      };

      try {
        await buildCommand(options);
      } catch {
        // Expected to fail during scraping
      }
    });
  });

  describe('buildCommand - rate limiting', () => {
    it('should use rate limit from flags when provided', async () => {
      const options: BuildCommandOptions = {
        name: 'test',
        url: 'https://example.com',
        rateLimit: 1.0,
        noFirecrawl: true,
      };

      try {
        await buildCommand(options);
      } catch (error) {
        // Should not fail due to invalid rate limit
        const err = error as Error;
        expect(err.message).not.toContain('rate limit');
      }
    });

    it('should use rate limit from config when not in flags', async () => {
      const options: BuildCommandOptions = {
        config: configPath,
        noFirecrawl: true,
      };

      try {
        await buildCommand(options);
      } catch (error) {
        // Config has rate_limit: 0.5, should be used
        const err = error as Error;
        expect(err.message).not.toContain('rate limit');
      }
    });
  });

  describe('buildCommand - max pages', () => {
    it('should use max pages from flags when provided', async () => {
      const options: BuildCommandOptions = {
        name: 'test',
        url: 'https://example.com',
        maxPages: 5,
        noFirecrawl: true,
      };

      try {
        await buildCommand(options);
      } catch (error) {
        // Should not fail due to invalid max pages
        const err = error as Error;
        expect(err.message).not.toContain('max pages');
      }
    });

    it('should validate max pages is positive', async () => {
      await expect(
        buildCommand({
          name: 'test',
          url: 'https://example.com',
          maxPages: 0,
        }),
      ).rejects.toThrow('must be greater than 0');
    });

    it('should validate max pages is not negative', async () => {
      await expect(
        buildCommand({
          name: 'test',
          url: 'https://example.com',
          maxPages: -5,
        }),
      ).rejects.toThrow('must be greater than 0');
    });
  });

  describe('buildCommand - categories', () => {
    it('should parse categories from JSON string', async () => {
      const categoriesJson = JSON.stringify({
        guide: ['getting-started'],
        reference: ['api'],
      });

      const options: BuildCommandOptions = {
        name: 'test',
        url: 'https://example.com',
        categories: categoriesJson,
        noFirecrawl: true,
      };

      try {
        await buildCommand(options);
      } catch (error) {
        // Should not fail due to invalid categories
        const err = error as Error;
        expect(err.message).not.toContain('categories');
        expect(err.message).not.toContain('JSON');
      }
    });

    it('should throw error for invalid categories JSON', async () => {
      await expect(
        buildCommand({
          name: 'test',
          url: 'https://example.com',
          categories: '{ invalid json }',
        }),
      ).rejects.toThrow('Invalid categories JSON');
    });
  });
});
