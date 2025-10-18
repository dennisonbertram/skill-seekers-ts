import { describe, it, expect, beforeEach } from 'vitest';
import { Categorizer } from '../../../src/core/builder/categorizer';
import type { Page } from '../../../src/types/page';
import type { Config } from '../../../src/types/config';

describe('Categorizer', () => {
  let categorizer: Categorizer;

  const mockConfig: Config = {
    name: 'test',
    base_url: 'https://example.com',
    selectors: {
      main_content: 'div',
      title: 'h1',
      code_blocks: 'pre',
    },
    url_patterns: {
      include: [],
      exclude: [],
    },
    categories: {
      tutorial: ['getting_started', 'introduction', 'tutorial'],
      api: ['api', 'reference', 'documentation'],
      examples: ['example', 'sample', 'demo'],
    },
    rate_limit: 0.5,
    max_pages: 100,
  };

  beforeEach(() => {
    categorizer = new Categorizer();
  });

  describe('categorizePage', () => {
    it('should categorize pages based on URL patterns', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/getting_started',
          title: 'Getting Started',
          content: 'Tutorial content',
          codeSamples: [],
          links: [],
        },
        {
          url: 'https://example.com/api/methods',
          title: 'API Methods',
          content: 'API documentation',
          codeSamples: [],
          links: [],
        },
        {
          url: 'https://example.com/examples/basic',
          title: 'Basic Example',
          content: 'Example code',
          codeSamples: [],
          links: [],
        },
      ];

      const result = categorizer.categorizePage(pages, mockConfig);

      expect(result.categories.get('tutorial')).toHaveLength(1);
      expect(result.categories.get('api')).toHaveLength(1);
      expect(result.categories.get('examples')).toHaveLength(1);
      expect(result.uncategorized).toHaveLength(0);
    });

    it('should use pre-assigned category if available', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/page1',
          title: 'Page 1',
          content: 'Content',
          category: 'tutorial',
          codeSamples: [],
          links: [],
        },
      ];

      const result = categorizer.categorizePage(pages, mockConfig);

      expect(result.categories.get('tutorial')).toHaveLength(1);
    });

    it('should put unmatched pages in uncategorized', () => {
      const pages: Page[] = [
        {
          url: 'https://testsite.com/unrelated/path',
          title: 'Random Page',
          content: 'Random content',
          codeSamples: [],
          links: [],
        },
      ];

      const result = categorizer.categorizePage(pages, mockConfig);

      expect(result.uncategorized).toHaveLength(1);
      expect(result.uncategorized[0].url).toBe('https://testsite.com/unrelated/path');
    });

    it('should handle empty page array', () => {
      const result = categorizer.categorizePage([], mockConfig);

      expect(result.categories.size).toBeGreaterThan(0);
      expect(result.uncategorized).toHaveLength(0);
      expect(result.stats).toHaveLength(0);
    });
  });

  describe('calculateStats', () => {
    it('should calculate correct statistics', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/tutorial/1',
          title: 'Tutorial 1',
          content: 'A'.repeat(100),
          codeSamples: [{ language: 'python', code: 'print()' }],
          links: [],
        },
        {
          url: 'https://example.com/tutorial/2',
          title: 'Tutorial 2',
          content: 'B'.repeat(200),
          codeSamples: [
            { language: 'python', code: 'import sys' },
            { language: 'python', code: 'def main()' },
          ],
          links: [],
        },
      ];

      const result = categorizer.categorizePage(pages, mockConfig);

      const tutorialStats = result.stats.find((s) => s.category === 'tutorial');
      expect(tutorialStats).toBeDefined();
      expect(tutorialStats!.pageCount).toBe(2);
      expect(tutorialStats!.totalCodeSamples).toBe(3);
      expect(tutorialStats!.averageContentLength).toBe(150); // (100 + 200) / 2
    });

    it('should sort stats by page count descending', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/tutorial/1',
          title: 'Tutorial',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
        {
          url: 'https://example.com/api/1',
          title: 'API 1',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
        {
          url: 'https://example.com/api/2',
          title: 'API 2',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
        {
          url: 'https://example.com/api/3',
          title: 'API 3',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
      ];

      const result = categorizer.categorizePage(pages, mockConfig);

      expect(result.stats[0].category).toBe('api'); // 3 pages
      expect(result.stats[0].pageCount).toBe(3);
      expect(result.stats[1].category).toBe('tutorial'); // 1 page
      expect(result.stats[1].pageCount).toBe(1);
    });

    it('should include uncategorized in stats if present', () => {
      const pages: Page[] = [
        {
          url: 'https://testsite.com/unrelated',
          title: 'Random',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
      ];

      const result = categorizer.categorizePage(pages, mockConfig);

      const uncategorizedStats = result.stats.find((s) => s.category === 'uncategorized');
      expect(uncategorizedStats).toBeDefined();
      expect(uncategorizedStats!.pageCount).toBe(1);
    });
  });

  describe('getCategoryPages', () => {
    it('should return pages for specified category', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/tutorial/1',
          title: 'Tutorial',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
      ];

      const result = categorizer.categorizePage(pages, mockConfig);
      const tutorialPages = categorizer.getCategoryPages(result, 'tutorial');

      expect(tutorialPages).toHaveLength(1);
      expect(tutorialPages[0].url).toContain('tutorial');
    });

    it('should return uncategorized pages when requested', () => {
      const pages: Page[] = [
        {
          url: 'https://testsite.com/unrelated',
          title: 'Random',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
      ];

      const result = categorizer.categorizePage(pages, mockConfig);
      const uncategorizedPages = categorizer.getCategoryPages(result, 'uncategorized');

      expect(uncategorizedPages).toHaveLength(1);
    });

    it('should return empty array for non-existent category', () => {
      const pages: Page[] = [];
      const result = categorizer.categorizePage(pages, mockConfig);
      const nonExistent = categorizer.getCategoryPages(result, 'nonexistent');

      expect(nonExistent).toHaveLength(0);
    });
  });

  describe('getNonEmptyCategories', () => {
    it('should return only categories with pages', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/tutorial/1',
          title: 'Tutorial',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
        {
          url: 'https://example.com/api/1',
          title: 'API',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
      ];

      const result = categorizer.categorizePage(pages, mockConfig);
      const nonEmpty = categorizer.getNonEmptyCategories(result);

      expect(nonEmpty).toContain('tutorial');
      expect(nonEmpty).toContain('api');
      expect(nonEmpty).not.toContain('examples'); // Empty category
    });

    it('should include uncategorized if present', () => {
      const pages: Page[] = [
        {
          url: 'https://testsite.com/unrelated',
          title: 'Random',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
      ];

      const result = categorizer.categorizePage(pages, mockConfig);
      const nonEmpty = categorizer.getNonEmptyCategories(result);

      expect(nonEmpty).toContain('uncategorized');
    });

    it('should return sorted category names', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/tutorial/1',
          title: 'Tutorial',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
        {
          url: 'https://example.com/api/1',
          title: 'API',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
      ];

      const result = categorizer.categorizePage(pages, mockConfig);
      const nonEmpty = categorizer.getNonEmptyCategories(result);

      expect(nonEmpty).toEqual(['api', 'tutorial']); // Alphabetically sorted
    });
  });

  describe('validateCategorization', () => {
    it('should return true for valid categorization', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/tutorial/1',
          title: 'Tutorial',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
        {
          url: 'https://example.com/api/1',
          title: 'API',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
      ];

      const result = categorizer.categorizePage(pages, mockConfig);
      const isValid = categorizer.validateCategorization(result, pages);

      expect(isValid).toBe(true);
    });

    it('should return false if page count mismatch', () => {
      const pages: Page[] = [
        {
          url: 'https://testsite.com/page1',
          title: 'Page 1',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
        {
          url: 'https://testsite.com/page2',
          title: 'Page 2',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
      ];

      const result = categorizer.categorizePage(pages, mockConfig);

      // Artificially modify result to create mismatch by removing one page
      result.uncategorized.pop();

      const isValid = categorizer.validateCategorization(result, pages);

      expect(isValid).toBe(false);
    });
  });
});
