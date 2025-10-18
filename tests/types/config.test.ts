import { describe, it, expect } from 'vitest';
import { ConfigSchema } from '../../src/types/config';

describe('ConfigSchema', () => {
  it('should validate a correct config', () => {
    const validConfig = {
      name: 'test-skill',
      base_url: 'https://example.com',
      selectors: {
        main_content: 'div.content',
        title: 'h1',
        code_blocks: 'pre',
      },
      url_patterns: {
        include: [],
        exclude: ['/search'],
      },
      rate_limit: 0.5,
      max_pages: 100,
    };

    const result = ConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('should reject config with invalid URL', () => {
    const invalidConfig = {
      name: 'test',
      base_url: 'not-a-url',
      selectors: { main_content: 'div', title: 'h1', code_blocks: 'pre' },
    };

    const result = ConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('should apply default values for optional fields', () => {
    const minimalConfig = {
      name: 'minimal',
      base_url: 'https://example.com',
      selectors: { main_content: 'div', title: 'h1', code_blocks: 'pre' },
    };

    const result = ConfigSchema.safeParse(minimalConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rate_limit).toBe(0.5);
      expect(result.data.max_pages).toBe(500);
      expect(result.data.url_patterns.include).toEqual([]);
      expect(result.data.url_patterns.exclude).toEqual([]);
    }
  });

  it('should reject config without required fields', () => {
    const incompleteConfig = {
      name: 'incomplete',
    };

    const result = ConfigSchema.safeParse(incompleteConfig);
    expect(result.success).toBe(false);
  });

  it('should reject config with negative rate_limit', () => {
    const invalidRateConfig = {
      name: 'invalid-rate',
      base_url: 'https://example.com',
      selectors: { main_content: 'div', title: 'h1', code_blocks: 'pre' },
      rate_limit: -1,
    };

    const result = ConfigSchema.safeParse(invalidRateConfig);
    expect(result.success).toBe(false);
  });

  it('should reject config with invalid max_pages', () => {
    const invalidPagesConfig = {
      name: 'invalid-pages',
      base_url: 'https://example.com',
      selectors: { main_content: 'div', title: 'h1', code_blocks: 'pre' },
      max_pages: 0,
    };

    const result = ConfigSchema.safeParse(invalidPagesConfig);
    expect(result.success).toBe(false);
  });

  it('should accept config with optional description', () => {
    const configWithDescription = {
      name: 'with-description',
      description: 'A test configuration',
      base_url: 'https://example.com',
      selectors: { main_content: 'div', title: 'h1', code_blocks: 'pre' },
    };

    const result = ConfigSchema.safeParse(configWithDescription);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('A test configuration');
    }
  });

  it('should accept config with categories', () => {
    const configWithCategories = {
      name: 'with-categories',
      base_url: 'https://example.com',
      selectors: { main_content: 'div', title: 'h1', code_blocks: 'pre' },
      categories: {
        'Getting Started': ['intro', 'tutorial'],
        'API Reference': ['api', 'reference'],
      },
    };

    const result = ConfigSchema.safeParse(configWithCategories);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categories).toBeDefined();
      expect(result.data.categories!['Getting Started']).toEqual(['intro', 'tutorial']);
    }
  });

  it('should validate config name is not empty', () => {
    const emptyNameConfig = {
      name: '',
      base_url: 'https://example.com',
      selectors: { main_content: 'div', title: 'h1', code_blocks: 'pre' },
    };

    const result = ConfigSchema.safeParse(emptyNameConfig);
    expect(result.success).toBe(false);
  });

  it('should validate all selector fields are present', () => {
    const missingSelector = {
      name: 'missing-selector',
      base_url: 'https://example.com',
      selectors: { main_content: 'div', title: 'h1' }, // missing code_blocks
    };

    const result = ConfigSchema.safeParse(missingSelector);
    expect(result.success).toBe(false);
  });
});