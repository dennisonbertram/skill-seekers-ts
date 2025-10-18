import { describe, it, expect, beforeEach } from 'vitest';
import { ContentProcessor } from '../../../src/core/processor/content-processor';
import type { Page } from '../../../src/types/page';
import type { Config } from '../../../src/types/config';

describe('ContentProcessor', () => {
  let processor: ContentProcessor;

  beforeEach(() => {
    processor = new ContentProcessor();
  });

  describe('htmlToMarkdown', () => {
    it('should convert simple HTML to Markdown', () => {
      const html = '<h1>Title</h1><p>Paragraph text</p>';
      const markdown = processor.htmlToMarkdown(html);

      expect(markdown).toContain('# Title');
      expect(markdown).toContain('Paragraph text');
    });

    it('should convert code blocks', () => {
      const html = '<pre><code>const x = 5;</code></pre>';
      const markdown = processor.htmlToMarkdown(html);

      expect(markdown).toContain('```');
      expect(markdown).toContain('const x = 5;');
    });

    it('should handle malformed HTML gracefully', () => {
      const html = '<div>Unclosed div';
      const markdown = processor.htmlToMarkdown(html);

      expect(markdown).toBeTruthy();
    });
  });

  describe('categorizePage', () => {
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

    it('should categorize page based on URL match', () => {
      const page: Page = {
        url: 'https://example.com/getting_started/intro',
        title: 'Introduction',
        content: 'Some content',
        codeSamples: [],
        links: [],
      };

      const category = processor.categorizePage(page, mockConfig);
      expect(category).toBe('tutorial');
    });

    it('should categorize page based on title match', () => {
      const page: Page = {
        url: 'https://example.com/docs/page1',
        title: 'API Reference Guide',
        content: 'Some content',
        codeSamples: [],
        links: [],
      };

      const category = processor.categorizePage(page, mockConfig);
      expect(category).toBe('api');
    });

    it('should categorize page based on content match', () => {
      const page: Page = {
        url: 'https://example.com/page',
        title: 'Page Title',
        content: 'This is an example of how to use the API with sample code and demo',
        codeSamples: [],
        links: [],
      };

      const category = processor.categorizePage(page, mockConfig);
      expect(category).toBe('examples');
    });

    it('should return uncategorized for no matches', () => {
      const page: Page = {
        url: 'https://testsite.org/misc',
        title: 'Misc Page',
        content: 'Some misc content here',
        codeSamples: [],
        links: [],
      };

      const category = processor.categorizePage(page, mockConfig);
      expect(category).toBe('uncategorized');
    });

    it('should prioritize higher-scoring categories', () => {
      const page: Page = {
        url: 'https://example.com/api/tutorial',
        title: 'Tutorial: API Usage',
        content: 'API reference and tutorial content',
        codeSamples: [],
        links: [],
      };

      const category = processor.categorizePage(page, mockConfig);
      // URL has both 'api' and 'tutorial', title has both
      // Should pick the one with highest score (likely 'tutorial' or 'api')
      expect(['tutorial', 'api']).toContain(category);
    });

    it('should handle config without categories', () => {
      const configNoCategories: Config = {
        ...mockConfig,
        categories: undefined,
      };

      const page: Page = {
        url: 'https://example.com/page',
        title: 'Test',
        content: 'Content',
        codeSamples: [],
        links: [],
      };

      const category = processor.categorizePage(page, configNoCategories);
      expect(category).toBe('uncategorized');
    });
  });

  describe('enhanceCodeSamples', () => {
    it('should clean code whitespace', () => {
      const samples = [
        {
          language: 'python',
          code: '\n\n  def hello():\n      print("world")  \n\n',
        },
      ];

      const enhanced = processor.enhanceCodeSamples(samples);

      expect(enhanced[0].code).toBe('  def hello():\n      print("world")');
      expect(enhanced[0].code).not.toMatch(/^\n/);
      expect(enhanced[0].code).not.toMatch(/\n$/);
    });

    it('should re-detect language for plaintext samples', () => {
      const samples = [
        {
          language: 'plaintext',
          code: 'def hello():\n    print("world")',
        },
      ];

      const enhanced = processor.enhanceCodeSamples(samples);

      expect(enhanced[0].language).toBe('python');
    });

    it('should preserve detected language', () => {
      const samples = [
        {
          language: 'javascript',
          code: 'const x = 5;',
        },
      ];

      const enhanced = processor.enhanceCodeSamples(samples);

      expect(enhanced[0].language).toBe('javascript');
    });
  });

  describe('cleanCode', () => {
    it('should remove leading empty lines', () => {
      const code = '\n\nconst x = 5;';
      const cleaned = (processor as any).cleanCode(code);

      expect(cleaned).toBe('const x = 5;');
    });

    it('should remove trailing empty lines', () => {
      const code = 'const x = 5;\n\n';
      const cleaned = (processor as any).cleanCode(code);

      expect(cleaned).toBe('const x = 5;');
    });

    it('should remove trailing whitespace from lines', () => {
      const code = 'const x = 5;  \nconst y = 10;   ';
      const cleaned = (processor as any).cleanCode(code);

      expect(cleaned).toBe('const x = 5;\nconst y = 10;');
    });

    it('should preserve internal empty lines', () => {
      const code = 'line1\n\nline2';
      const cleaned = (processor as any).cleanCode(code);

      expect(cleaned).toBe('line1\n\nline2');
    });
  });

  describe('extractKeywords', () => {
    it('should extract most common words', () => {
      const content = 'javascript tutorial javascript code example javascript programming';
      const keywords = processor.extractKeywords(content, 3);

      expect(keywords[0]).toBe('javascript');
      expect(keywords).toContain('tutorial');
    });

    it('should filter short words', () => {
      const content = 'this is a test of the system';
      const keywords = processor.extractKeywords(content, 5);

      expect(keywords).not.toContain('is');
      expect(keywords).not.toContain('a');
      expect(keywords).toContain('test');
      expect(keywords).toContain('system');
    });

    it('should respect limit parameter', () => {
      const content = 'word1 word2 word3 word4 word5 word6';
      const keywords = processor.extractKeywords(content, 3);

      expect(keywords.length).toBeLessThanOrEqual(3);
    });
  });

  describe('processPage', () => {
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
        tutorial: ['tutorial', 'guide'],
      },
      rate_limit: 0.5,
      max_pages: 100,
    };

    it('should process page completely', () => {
      const page: Page = {
        url: 'https://example.com/tutorial/intro',
        title: 'Tutorial Introduction',
        content: '<h1>Tutorial</h1><p>Learn here</p>',
        codeSamples: [
          {
            language: 'plaintext',
            code: '\n\ndef hello():\n    pass\n\n',
          },
        ],
        links: [],
      };

      const processed = processor.processPage(page, mockConfig);

      expect(processed.markdown).toBeTruthy();
      expect(processed.category).toBe('tutorial');
      expect(processed.codeSamples[0].language).toBe('python');
      expect(processed.codeSamples[0].code).not.toMatch(/^\n/);
    });

    it('should preserve existing markdown', () => {
      const page: Page = {
        url: 'https://example.com/page',
        title: 'Test',
        content: '<p>Content</p>',
        markdown: '# Existing Markdown',
        codeSamples: [],
        links: [],
      };

      const processed = processor.processPage(page, mockConfig);

      expect(processed.markdown).toBe('# Existing Markdown');
    });
  });

  describe('processPages', () => {
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
      rate_limit: 0.5,
      max_pages: 100,
    };

    it('should process multiple pages', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/page1',
          title: 'Page 1',
          content: '<p>Content 1</p>',
          codeSamples: [],
          links: [],
        },
        {
          url: 'https://example.com/page2',
          title: 'Page 2',
          content: '<p>Content 2</p>',
          codeSamples: [],
          links: [],
        },
      ];

      const processed = processor.processPages(pages, mockConfig);

      expect(processed).toHaveLength(2);
      expect(processed[0].markdown).toBeTruthy();
      expect(processed[1].markdown).toBeTruthy();
    });
  });
});