import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ReferenceGenerator } from '../../../src/core/builder/reference-generator';
import type { Page } from '../../../src/types/page';
import { exists, readFile } from '../../../src/utils/fs';

const TEST_OUTPUT_DIR = path.join(process.cwd(), 'test-output-references');

describe('ReferenceGenerator', () => {
  let generator: ReferenceGenerator;

  beforeEach(async () => {
    generator = new ReferenceGenerator();

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

  describe('generateFilename', () => {
    it('should generate filename from URL path', () => {
      const page: Page = {
        url: 'https://example.com/docs/getting-started',
        title: 'Getting Started',
        content: 'Content',
        codeSamples: [],
        links: [],
      };

      const filename = (generator as any).generateFilename(page);
      expect(filename).toBe('docs-getting-started.md');
    });

    it('should handle root URL', () => {
      const page: Page = {
        url: 'https://example.com/',
        title: 'Home',
        content: 'Content',
        codeSamples: [],
        links: [],
      };

      const filename = (generator as any).generateFilename(page);
      expect(filename).toBe('index.md');
    });

    it('should replace invalid characters', () => {
      const page: Page = {
        url: 'https://example.com/docs/file%20with%20spaces',
        title: 'File with Spaces',
        content: 'Content',
        codeSamples: [],
        links: [],
      };

      const filename = (generator as any).generateFilename(page);
      expect(filename).toMatch(/\.md$/);
      expect(filename).not.toContain(' ');
      expect(filename).not.toContain('%');
    });

    it('should handle nested paths', () => {
      const page: Page = {
        url: 'https://example.com/api/v2/methods/get',
        title: 'GET Method',
        content: 'Content',
        codeSamples: [],
        links: [],
      };

      const filename = (generator as any).generateFilename(page);
      expect(filename).toBe('api-v2-methods-get.md');
    });
  });

  describe('generateReferenceContent', () => {
    it('should generate markdown with all sections', () => {
      const page: Page = {
        url: 'https://example.com/test',
        title: 'Test Page',
        content: 'HTML content',
        markdown: '# Test\n\nTest content',
        category: 'tutorial',
        codeSamples: [
          {
            language: 'python',
            code: 'print("hello")',
            context: 'Hello World Example',
          },
        ],
        links: ['https://example.com/related'],
      };

      const content = (generator as any).generateReferenceContent(page);

      expect(content).toContain('# Test Page');
      expect(content).toContain('**URL**: https://example.com/test');
      expect(content).toContain('**Category**: tutorial');
      expect(content).toContain('## Content');
      expect(content).toContain('# Test');
      expect(content).toContain('## Code Samples');
      expect(content).toContain('```python');
      expect(content).toContain('print("hello")');
      expect(content).toContain('## Related Links');
      expect(content).toContain('https://example.com/related');
    });

    it('should handle page without markdown', () => {
      const page: Page = {
        url: 'https://example.com/test',
        title: 'Test',
        content: 'Content',
        codeSamples: [],
        links: [],
      };

      const content = (generator as any).generateReferenceContent(page);

      expect(content).toContain('# Test');
      expect(content).toContain('## Metadata');
      expect(content).not.toContain('## Content');
    });

    it('should handle page without code samples', () => {
      const page: Page = {
        url: 'https://example.com/test',
        title: 'Test',
        content: 'Content',
        markdown: 'Test',
        codeSamples: [],
        links: [],
      };

      const content = (generator as any).generateReferenceContent(page);

      expect(content).not.toContain('## Code Samples');
    });

    it('should limit links to 20', () => {
      const links = Array.from({ length: 30 }, (_, i) => `https://example.com/link${i}`);

      const page: Page = {
        url: 'https://example.com/test',
        title: 'Test',
        content: 'Content',
        codeSamples: [],
        links,
      };

      const content = (generator as any).generateReferenceContent(page);

      // Count links in content
      const linkMatches = content.match(/- https:\/\//g);
      expect(linkMatches).toHaveLength(20);
    });

    it('should deduplicate links', () => {
      const page: Page = {
        url: 'https://example.com/test',
        title: 'Test',
        content: 'Content',
        codeSamples: [],
        links: [
          'https://example.com/link1',
          'https://example.com/link1', // Duplicate
          'https://example.com/link2',
        ],
      };

      const content = (generator as any).generateReferenceContent(page);

      const linkMatches = content.match(/- https:\/\/example\.com\/link1/g);
      expect(linkMatches).toHaveLength(1); // Only one instance
    });
  });

  describe('generateReferences', () => {
    it('should create reference files in output directory', async () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/page1',
          title: 'Page 1',
          content: 'Content 1',
          codeSamples: [],
          links: [],
        },
        {
          url: 'https://example.com/page2',
          title: 'Page 2',
          content: 'Content 2',
          codeSamples: [],
          links: [],
        },
      ];

      const referenceFiles = await generator.generateReferences(pages, TEST_OUTPUT_DIR);

      expect(referenceFiles).toHaveLength(2);

      // Check files exist
      const file1Exists = await exists(referenceFiles[0].path);
      const file2Exists = await exists(referenceFiles[1].path);

      expect(file1Exists).toBe(true);
      expect(file2Exists).toBe(true);
    });

    it('should create files in category subdirectory', async () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/tutorial/1',
          title: 'Tutorial 1',
          content: 'Content',
          category: 'tutorial',
          codeSamples: [],
          links: [],
        },
      ];

      const referenceFiles = await generator.generateReferences(
        pages,
        TEST_OUTPUT_DIR,
        'tutorial',
      );

      expect(referenceFiles[0].path).toContain('tutorial');

      const fileExists = await exists(referenceFiles[0].path);
      expect(fileExists).toBe(true);
    });

    it('should write correct markdown content to files', async () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/test',
          title: 'Test Page',
          content: 'Content',
          markdown: '# Test Content',
          codeSamples: [],
          links: [],
        },
      ];

      const referenceFiles = await generator.generateReferences(pages, TEST_OUTPUT_DIR);

      const content = await readFile(referenceFiles[0].path);

      expect(content).toContain('# Test Page');
      expect(content).toContain('# Test Content');
    });
  });

  describe('generateIndex', () => {
    it('should create INDEX.md file', async () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/page1',
          title: 'Page 1',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
      ];

      const referenceFiles = await generator.generateReferences(pages, TEST_OUTPUT_DIR);
      const indexPath = await generator.generateIndex(referenceFiles, TEST_OUTPUT_DIR);

      const indexExists = await exists(indexPath);
      expect(indexExists).toBe(true);
    });

    it('should list all reference files in index', async () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/page1',
          title: 'Page 1',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
        {
          url: 'https://example.com/page2',
          title: 'Page 2',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
      ];

      const referenceFiles = await generator.generateReferences(pages, TEST_OUTPUT_DIR);
      const indexPath = await generator.generateIndex(referenceFiles, TEST_OUTPUT_DIR);

      const indexContent = await readFile(indexPath);

      expect(indexContent).toContain('Total Pages: 2');
      expect(indexContent).toContain('[Page 1]');
      expect(indexContent).toContain('[Page 2]');
    });

    it('should include category in title when specified', async () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/tutorial/1',
          title: 'Tutorial 1',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
      ];

      const referenceFiles = await generator.generateReferences(
        pages,
        TEST_OUTPUT_DIR,
        'tutorial',
      );
      const indexPath = await generator.generateIndex(
        referenceFiles,
        TEST_OUTPUT_DIR,
        'tutorial',
      );

      const indexContent = await readFile(indexPath);

      expect(indexContent).toContain('# tutorial References');
    });
  });

  describe('generateAll', () => {
    it('should generate references and index in one call', async () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/page1',
          title: 'Page 1',
          content: 'Content',
          codeSamples: [],
          links: [],
        },
      ];

      const result = await generator.generateAll(pages, TEST_OUTPUT_DIR);

      expect(result.referenceFiles).toHaveLength(1);
      expect(result.indexPath).toBeTruthy();

      const fileExists = await exists(result.referenceFiles[0].path);
      const indexExists = await exists(result.indexPath);

      expect(fileExists).toBe(true);
      expect(indexExists).toBe(true);
    });
  });
});
