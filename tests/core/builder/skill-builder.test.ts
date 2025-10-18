import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import { SkillBuilder } from '../../../src/core/builder/skill-builder';
import type { Page } from '../../../src/types/page';
import type { Config } from '../../../src/types/config';
import { exists, readFile } from '../../../src/utils/fs';

const TEST_OUTPUT_DIR = path.join(process.cwd(), 'test-output-skill-builder');

describe('SkillBuilder', () => {
  let builder: SkillBuilder;

  const mockConfig: Config = {
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
      tutorial: ['tutorial', 'getting-started'],
      api: ['api', 'reference'],
    },
    rate_limit: 0.5,
    max_pages: 100,
  };

  const mockPages: Page[] = [
    {
      url: 'https://example.com/tutorial/intro',
      title: 'Introduction Tutorial',
      content: 'Tutorial content',
      markdown: '# Introduction',
      codeSamples: [{ language: 'python', code: 'print("hello")' }],
      links: [],
    },
    {
      url: 'https://example.com/api/methods',
      title: 'API Methods',
      content: 'API documentation',
      markdown: '# API Methods',
      codeSamples: [{ language: 'javascript', code: 'api.call()' }],
      links: [],
    },
    {
      url: 'https://example.com/random',
      title: 'Random Page',
      content: 'Random content',
      markdown: '# Random',
      codeSamples: [],
      links: [],
    },
  ];

  beforeEach(async () => {
    builder = new SkillBuilder();

    // Clean up test directory
    try {
      await fs.rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up after tests
    try {
      await fs.rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('build', () => {
    it('should create complete skill structure', async () => {
      const result = await builder.build(mockPages, mockConfig, TEST_OUTPUT_DIR);

      // Check output directory exists
      const dirExists = await exists(result.skillPath);
      expect(dirExists).toBe(true);

      // Check SKILL.md was created
      const skillMdExists = await exists(result.skillMdPath);
      expect(skillMdExists).toBe(true);

      // Check reference files were created
      expect(result.referenceFiles.length).toBeGreaterThan(0);

      // Check categories were created
      expect(result.categorizedPages.stats.length).toBeGreaterThan(0);
    });

    it('should categorize pages correctly', async () => {
      const result = await builder.build(mockPages, mockConfig, TEST_OUTPUT_DIR);

      const tutorialPages = result.categorizedPages.categories.get('tutorial') || [];
      const apiPages = result.categorizedPages.categories.get('api') || [];

      expect(tutorialPages.length).toBe(1);
      expect(apiPages.length).toBe(1);
      expect(result.categorizedPages.uncategorized.length).toBe(1);
    });

    it('should generate reference files for each category', async () => {
      const result = await builder.build(mockPages, mockConfig, TEST_OUTPUT_DIR);

      // Check tutorial references directory
      const tutorialDir = path.join(TEST_OUTPUT_DIR, 'references', 'tutorial');
      const tutorialDirExists = await exists(tutorialDir);
      expect(tutorialDirExists).toBe(true);

      // Check api references directory
      const apiDir = path.join(TEST_OUTPUT_DIR, 'references', 'api');
      const apiDirExists = await exists(apiDir);
      expect(apiDirExists).toBe(true);

      // Check INDEX.md files exist
      const tutorialIndex = path.join(tutorialDir, 'INDEX.md');
      const tutorialIndexExists = await exists(tutorialIndex);
      expect(tutorialIndexExists).toBe(true);
    });

    it('should generate valid SKILL.md content', async () => {
      const result = await builder.build(mockPages, mockConfig, TEST_OUTPUT_DIR);

      const skillMdContent = await readFile(result.skillMdPath);

      expect(skillMdContent).toContain('# Test Skill Documentation Skill');
      expect(skillMdContent).toContain('## Description');
      expect(skillMdContent).toContain('## Documentation Statistics');
      expect(skillMdContent).toContain('**Total Pages**: 3');
      expect(skillMdContent).toContain('## How to Use This Skill');
    });

    it('should throw error on categorization validation failure', async () => {
      // Mock categorizer to return invalid result
      const originalValidate = builder['categorizer'].validateCategorization;

      builder['categorizer'].validateCategorization = () => false;

      await expect(builder.build(mockPages, mockConfig, TEST_OUTPUT_DIR)).rejects.toThrow(
        'Categorization validation failed',
      );

      // Restore original method
      builder['categorizer'].validateCategorization = originalValidate;
    });

    it('should use default output directory if not specified', async () => {
      const result = await builder.build(mockPages, mockConfig);

      const expectedPath = path.join(process.cwd(), 'output', mockConfig.name);
      expect(result.skillPath).toBe(expectedPath);

      // Clean up default output
      try {
        await fs.rm(result.skillPath, { recursive: true, force: true });
      } catch {
        // Ignore
      }
    });

    it('should handle pages with pre-assigned categories', async () => {
      const pagesWithCategories: Page[] = [
        {
          url: 'https://example.com/page1',
          title: 'Page 1',
          content: 'Content',
          category: 'tutorial',
          codeSamples: [],
          links: [],
        },
        {
          url: 'https://example.com/page2',
          title: 'Page 2',
          content: 'Content',
          category: 'api',
          codeSamples: [],
          links: [],
        },
      ];

      const result = await builder.build(pagesWithCategories, mockConfig, TEST_OUTPUT_DIR);

      const tutorialPages = result.categorizedPages.categories.get('tutorial') || [];
      const apiPages = result.categorizedPages.categories.get('api') || [];

      expect(tutorialPages.length).toBe(1);
      expect(apiPages.length).toBe(1);
    });

    it('should count all reference files correctly', async () => {
      const result = await builder.build(mockPages, mockConfig, TEST_OUTPUT_DIR);

      // Should have 3 reference files (one per page)
      expect(result.referenceFiles.length).toBe(3);
    });

    it('should create reference files with correct content', async () => {
      const result = await builder.build(mockPages, mockConfig, TEST_OUTPUT_DIR);

      // Pick first reference file and check its content
      const firstRefPath = result.referenceFiles[0];
      const refContent = await readFile(firstRefPath);

      expect(refContent).toContain('# '); // Has title
      expect(refContent).toContain('## Metadata'); // Has metadata section
    });
  });

  describe('buildFromProcessed', () => {
    it('should work with processed pages', async () => {
      const result = await builder.buildFromProcessed(mockPages, mockConfig, TEST_OUTPUT_DIR);

      expect(result.skillPath).toBe(TEST_OUTPUT_DIR);
      expect(result.categorizedPages.stats.length).toBeGreaterThan(0);
      expect(result.referenceFiles.length).toBe(3);

      const skillMdExists = await exists(result.skillMdPath);
      expect(skillMdExists).toBe(true);
    });
  });
});
