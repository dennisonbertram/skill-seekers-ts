import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirecrawlScraper } from '../../../src/core/scraper/firecrawl';
import type { Config } from '../../../src/types/config';

// Mock Firecrawl
vi.mock('@mendable/firecrawl-js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      scrapeUrl: vi.fn(),
      crawlUrl: vi.fn(),
    })),
  };
});

describe('FirecrawlScraper', () => {
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
    max_pages: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error if API key is not provided', () => {
    expect(() => new FirecrawlScraper({ config: mockConfig })).toThrow(
      'Firecrawl API key is required',
    );
  });

  it('should create instance with API key', () => {
    const scraper = new FirecrawlScraper({
      config: mockConfig,
      apiKey: 'test-key',
    });
    expect(scraper).toBeInstanceOf(FirecrawlScraper);
  });

  describe('validateConnection', () => {
    it('should return true for successful connection', async () => {
      const Firecrawl = (await import('@mendable/firecrawl-js')).default;
      const mockScrapeUrl = vi.fn().mockResolvedValue({ success: true });
      (Firecrawl as any).mockImplementation(() => ({ scrapeUrl: mockScrapeUrl }));

      const scraper = new FirecrawlScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      const isValid = await scraper.validateConnection();
      expect(isValid).toBe(true);
      expect(mockScrapeUrl).toHaveBeenCalledWith(mockConfig.base_url, {
        formats: ['markdown'],
      });
    });

    it('should return false for failed connection', async () => {
      const Firecrawl = (await import('@mendable/firecrawl-js')).default;
      const mockScrapeUrl = vi.fn().mockRejectedValue(new Error('Connection failed'));
      (Firecrawl as any).mockImplementation(() => ({ scrapeUrl: mockScrapeUrl }));

      const scraper = new FirecrawlScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      const isValid = await scraper.validateConnection();
      expect(isValid).toBe(false);
    });
  });

  describe('scrapeSingle', () => {
    it('should scrape a single page successfully', async () => {
      const Firecrawl = (await import('@mendable/firecrawl-js')).default;
      const mockScrapeUrl = vi.fn().mockResolvedValue({
        success: true,
        url: 'https://example.com/page',
        metadata: { title: 'Test Page' },
        markdown: '# Test\n\n```python\nprint("hello")\n```',
        html: '<h1>Test</h1>',
        links: ['https://example.com/link'],
      });
      (Firecrawl as any).mockImplementation(() => ({ scrapeUrl: mockScrapeUrl }));

      const scraper = new FirecrawlScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      const page = await scraper.scrapeSingle('https://example.com/page');

      expect(page.url).toBe('https://example.com/page');
      expect(page.title).toBe('Test Page');
      expect(page.codeSamples).toHaveLength(1);
      expect(page.codeSamples[0].language).toBe('python');
      expect(page.codeSamples[0].code).toBe('print("hello")');
    });

    it('should extract title from markdown if metadata missing', async () => {
      const Firecrawl = (await import('@mendable/firecrawl-js')).default;
      const mockScrapeUrl = vi.fn().mockResolvedValue({
        success: true,
        url: 'https://example.com/page',
        markdown: '# Markdown Title\n\nContent',
        html: '<h1>Test</h1>',
      });
      (Firecrawl as any).mockImplementation(() => ({ scrapeUrl: mockScrapeUrl }));

      const scraper = new FirecrawlScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      const page = await scraper.scrapeSingle('https://example.com/page');
      expect(page.title).toBe('Markdown Title');
    });
  });

  describe('scrapeAll', () => {
    it('should crawl multiple pages successfully', async () => {
      const Firecrawl = (await import('@mendable/firecrawl-js')).default;
      const mockCrawlUrl = vi.fn().mockResolvedValue({
        success: true,
        data: [
          {
            url: 'https://example.com/page1',
            metadata: { title: 'Page 1' },
            markdown: '# Page 1',
            html: '<h1>Page 1</h1>',
            links: [],
          },
          {
            url: 'https://example.com/page2',
            metadata: { title: 'Page 2' },
            markdown: '# Page 2',
            html: '<h1>Page 2</h1>',
            links: [],
          },
        ],
      });
      (Firecrawl as any).mockImplementation(() => ({ crawlUrl: mockCrawlUrl }));

      const scraper = new FirecrawlScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      const pages = await scraper.scrapeAll();

      expect(pages).toHaveLength(2);
      expect(pages[0].title).toBe('Page 1');
      expect(pages[1].title).toBe('Page 2');
      expect(mockCrawlUrl).toHaveBeenCalledWith(mockConfig.base_url, {
        limit: mockConfig.max_pages,
        maxDepth: 3,
        includePaths: [],
        excludePaths: [],
        scrapeOptions: {
          formats: ['markdown', 'html', 'links'],
        },
      });
    });

    it('should throw error if crawl fails', async () => {
      const Firecrawl = (await import('@mendable/firecrawl-js')).default;
      const mockCrawlUrl = vi.fn().mockResolvedValue({ success: false });
      (Firecrawl as any).mockImplementation(() => ({ crawlUrl: mockCrawlUrl }));

      const scraper = new FirecrawlScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      await expect(scraper.scrapeAll()).rejects.toThrow('Firecrawl crawl failed');
    });
  });

  describe('code sample extraction', () => {
    it('should extract multiple code blocks', async () => {
      const Firecrawl = (await import('@mendable/firecrawl-js')).default;
      const mockScrapeUrl = vi.fn().mockResolvedValue({
        success: true,
        url: 'https://example.com',
        markdown: '# Test\n\n```python\ncode1\n```\n\n```javascript\ncode2\n```',
        html: '<h1>Test</h1>',
      });
      (Firecrawl as any).mockImplementation(() => ({ scrapeUrl: mockScrapeUrl }));

      const scraper = new FirecrawlScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      const page = await scraper.scrapeSingle('https://example.com');
      expect(page.codeSamples).toHaveLength(2);
      expect(page.codeSamples[0].language).toBe('python');
      expect(page.codeSamples[1].language).toBe('javascript');
    });

    it('should handle code blocks without language specification', async () => {
      const Firecrawl = (await import('@mendable/firecrawl-js')).default;
      const mockScrapeUrl = vi.fn().mockResolvedValue({
        success: true,
        url: 'https://example.com',
        markdown: '```\ncode without lang\n```',
        html: '<h1>Test</h1>',
      });
      (Firecrawl as any).mockImplementation(() => ({ scrapeUrl: mockScrapeUrl }));

      const scraper = new FirecrawlScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      const page = await scraper.scrapeSingle('https://example.com');
      expect(page.codeSamples).toHaveLength(1);
      expect(page.codeSamples[0].language).toBe('plaintext');
    });
  });
});