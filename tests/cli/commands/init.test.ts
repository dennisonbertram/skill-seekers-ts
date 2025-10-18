/**
 * Tests for init command
 * Following TDD: Write tests FIRST (RED phase)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import { initCommand } from '../../../src/cli/commands/init';
import type { Config } from '../../../src/types/config';

describe('init command', () => {
  const testDir = path.join(process.cwd(), 'test-temp-init');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('initCommand', () => {
    it('should create a config file with minimal required fields', async () => {
      const outputPath = path.join(testDir, 'skill-config.json');

      await initCommand({
        name: 'test-skill',
        url: 'https://example.com',
        output: outputPath,
      });

      // Verify file exists
      const fileExists = await fs
        .access(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      // Verify file content
      const content = await fs.readFile(outputPath, 'utf-8');
      const config: Config = JSON.parse(content);

      expect(config.name).toBe('test-skill');
      expect(config.base_url).toBe('https://example.com');
      expect(config.selectors).toBeDefined();
      expect(config.selectors.main_content).toBe('main');
      expect(config.selectors.title).toBe('h1');
      expect(config.selectors.code_blocks).toBe('pre code');
    });

    it('should include default values for optional fields', async () => {
      const outputPath = path.join(testDir, 'config.json');

      await initCommand({
        name: 'test',
        url: 'https://test.com',
        output: outputPath,
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      const config: Config = JSON.parse(content);

      expect(config.rate_limit).toBe(0.5);
      expect(config.max_pages).toBe(500);
      expect(config.categories).toEqual({});
    });

    it('should format JSON with 2-space indentation', async () => {
      const outputPath = path.join(testDir, 'formatted.json');

      await initCommand({
        name: 'test',
        url: 'https://test.com',
        output: outputPath,
      });

      const content = await fs.readFile(outputPath, 'utf-8');

      // Check for 2-space indentation
      expect(content).toContain('  "name"');
      expect(content).toContain('  "base_url"');
    });

    it('should use default output path when not specified', async () => {
      const defaultPath = path.join(process.cwd(), 'skill-config.json');

      // Clean up if exists
      await fs.rm(defaultPath, { force: true });

      try {
        await initCommand({
          name: 'test',
          url: 'https://test.com',
        });

        const fileExists = await fs
          .access(defaultPath)
          .then(() => true)
          .catch(() => false);
        expect(fileExists).toBe(true);
      } finally {
        // Clean up
        await fs.rm(defaultPath, { force: true });
      }
    });

    it('should throw error if file already exists and overwrite not specified', async () => {
      const outputPath = path.join(testDir, 'existing.json');

      // Create existing file
      await fs.writeFile(outputPath, '{}');

      await expect(
        initCommand({
          name: 'test',
          url: 'https://test.com',
          output: outputPath,
          overwrite: false,
        }),
      ).rejects.toThrow('already exists');
    });

    it('should overwrite existing file when overwrite is true', async () => {
      const outputPath = path.join(testDir, 'overwrite.json');

      // Create existing file with old content
      await fs.writeFile(outputPath, '{"old": "data"}');

      await initCommand({
        name: 'new-skill',
        url: 'https://new.com',
        output: outputPath,
        overwrite: true,
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      const config: Config = JSON.parse(content);

      expect(config.name).toBe('new-skill');
      expect(config.base_url).toBe('https://new.com');
    });

    it('should validate URL format', async () => {
      const outputPath = path.join(testDir, 'invalid.json');

      await expect(
        initCommand({
          name: 'test',
          url: 'not-a-valid-url',
          output: outputPath,
        }),
      ).rejects.toThrow('Invalid URL');
    });

    it('should validate skill name is not empty', async () => {
      const outputPath = path.join(testDir, 'empty-name.json');

      await expect(
        initCommand({
          name: '',
          url: 'https://test.com',
          output: outputPath,
        }),
      ).rejects.toThrow('Skill name');
    });

    it('should create parent directories if they do not exist', async () => {
      const nestedPath = path.join(testDir, 'nested', 'dir', 'config.json');

      await initCommand({
        name: 'test',
        url: 'https://test.com',
        output: nestedPath,
      });

      const fileExists = await fs
        .access(nestedPath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should create valid config that passes schema validation', async () => {
      const outputPath = path.join(testDir, 'valid.json');

      await initCommand({
        name: 'valid-skill',
        url: 'https://valid.com',
        output: outputPath,
      });

      // Import config loader to validate
      const { loadConfig } = await import('../../../src/cli/utils/config-loader');

      // Should not throw
      const config = await loadConfig(outputPath);
      expect(config.name).toBe('valid-skill');
    });

    it('should include helpful description comment in config', async () => {
      const outputPath = path.join(testDir, 'commented.json');

      await initCommand({
        name: 'test',
        url: 'https://test.com',
        output: outputPath,
        includeComments: true,
      });

      const content = await fs.readFile(outputPath, 'utf-8');

      // JSON doesn't support comments, but we can include description field
      const config: Config = JSON.parse(content);
      expect(config.description).toBeDefined();
    });

    it('should allow custom description', async () => {
      const outputPath = path.join(testDir, 'custom-desc.json');

      await initCommand({
        name: 'test',
        url: 'https://test.com',
        output: outputPath,
        description: 'My custom description',
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      const config: Config = JSON.parse(content);

      expect(config.description).toBe('My custom description');
    });
  });
});
