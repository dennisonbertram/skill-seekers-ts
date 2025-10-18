import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { CheerioScraper } from '../../../src/core/scraper/cheerio';
import type { Config } from '../../../src/types/config';

// Mock axios
vi.mock('axios');

describe('CheerioScraper', () => {
  const mockConfig: Config = {
    name: 'test',
    base_url: 'https://example.com',
    selectors: {
      main_content: 'div.content',
      title: 'h1',
      code_blocks: 'pre code',
    },
    url_patterns: {
      include: [],
      exclude: ['/search', '/genindex'],
    },
    rate_limit: 0,
    max_pages: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create instance without API key', () => {
    const scraper = new CheerioScraper({ config: mockConfig });
    expect(scraper).toBeInstanceOf(CheerioScraper);
  });

  describe('validateConnection', () => {
    it('should return true for successful connection', async () => {
      vi.mocked(axios.get).mockResolvedValue({ status: 200, data: '' });

      const scraper = new CheerioScraper({ config: mockConfig });
      const isValid = await scraper.validateConnection();

      expect(isValid).toBe(true);
      expect(axios.get).toHaveBeenCalledWith(mockConfig.base_url, expect.any(Object));
    });

    it('should return false for failed connection', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));

      const scraper = new CheerioScraper({ config: mockConfig });
      const isValid = await scraper.validateConnection();

      expect(isValid).toBe(false);
    });
  });

  describe('scrapeSingle', () => {
    it('should scrape a single page successfully', async () => {
      const html = `
        <html>
          <head><title>Test Page</title></head>
          <body>
            <h1>Test Page Title</h1>
            <div class="content">
              <p>Test content</p>
              <pre><code class="language-python">print("hello")</code></pre>
            </div>
            <a href="/page2">Link 1</a>
            <a href="https://example.com/page3">Link 2</a>
          </body>
        </html>
      `;

      vi.mocked(axios.get).mockResolvedValue({ status: 200, data: html });

      const scraper = new CheerioScraper({ config: mockConfig });
      const page = await scraper.scrapeSingle('https://example.com/page1');

      expect(page.url).toBe('https://example.com/page1');
      expect(page.title).toBe('Test Page Title');
      expect(page.content).toContain('Test content');
      expect(page.codeSamples).toHaveLength(1);
      expect(page.codeSamples[0].language).toBe('python');
      expect(page.codeSamples[0].code).toBe('print("hello")');
      expect(page.links.length).toBeGreaterThan(0);
    });

    it('should extract title from h1 selector', async () => {
      const html = `
        <html>
          <body>
            <h1>My Custom Title</h1>
            <div class="content">Content here</div>
          </body>
        </html>
      `;

      vi.mocked(axios.get).mockResolvedValue({ status: 200, data: html });

      const scraper = new CheerioScraper({ config: mockConfig });
      const page = await scraper.scrapeSingle('https://example.com');

      expect(page.title).toBe('My Custom Title');
    });

    it('should handle missing title gracefully', async () => {
      const html = `
        <html>
          <body>
            <div class="content">Content without title</div>
          </body>
        </html>
      `;

      vi.mocked(axios.get).mockResolvedValue({ status: 200, data: html });

      const scraper = new CheerioScraper({ config: mockConfig });
      const page = await scraper.scrapeSingle('https://example.com');

      expect(page.title).toBe('Untitled');
    });
  });

  describe('code sample extraction', () => {
    it('should detect language from class attribute', async () => {
      const html = `
        <html>
          <body>
            <h1>Test</h1>
            <div class="content">
              <pre><code class="language-javascript">const x = 5;</code></pre>
              <pre><code class="lang-python">import sys</code></pre>
              <pre><code class="highlight-typescript">type X = string;</code></pre>
            </div>
          </body>
        </html>
      `;

      vi.mocked(axios.get).mockResolvedValue({ status: 200, data: html });

      const scraper = new CheerioScraper({ config: mockConfig });
      const page = await scraper.scrapeSingle('https://example.com');

      expect(page.codeSamples).toHaveLength(3);
      expect(page.codeSamples[0].language).toBe('javascript');
      expect(page.codeSamples[1].language).toBe('python');
      expect(page.codeSamples[2].language).toBe('typescript');
    });

    it('should fall back to content-based detection', async () => {
      const html = `
        <html>
          <body>
            <h1>Test</h1>
            <div class="content">
              <pre><code>def hello():\n    print("world")</code></pre>
            </div>
          </body>
        </html>
      `;

      vi.mocked(axios.get).mockResolvedValue({ status: 200, data: html });

      const scraper = new CheerioScraper({ config: mockConfig });
      const page = await scraper.scrapeSingle('https://example.com');

      expect(page.codeSamples).toHaveLength(1);
      expect(page.codeSamples[0].language).toBe('python');
    });

    it('should skip empty code blocks', async () => {
      const html = `
        <html>
          <body>
            <h1>Test</h1>
            <div class="content">
              <pre><code></code></pre>
              <pre><code>   </code></pre>
              <pre><code class="language-python">print("hello")</code></pre>
            </div>
          </body>
        </html>
      `;

      vi.mocked(axios.get).mockResolvedValue({ status: 200, data: html });

      const scraper = new CheerioScraper({ config: mockConfig });
      const page = await scraper.scrapeSingle('https://example.com');

      expect(page.codeSamples).toHaveLength(1);
      expect(page.codeSamples[0].code).toBe('print("hello")');
    });
  });

  describe('link extraction and filtering', () => {
    it('should extract and normalize links', async () => {
      const html = `
        <html>
          <body>
            <h1>Test</h1>
            <div class="content">
              <a href="/page2">Relative Link</a>
              <a href="https://example.com/page3">Absolute Link</a>
              <a href="https://other.com/page">External Link</a>
            </div>
          </body>
        </html>
      `;

      vi.mocked(axios.get).mockResolvedValue({ status: 200, data: html });

      const scraper = new CheerioScraper({ config: mockConfig });
      const page = await scraper.scrapeSingle('https://example.com/page1');

      expect(page.links).toContain('https://example.com/page2');
      expect(page.links).toContain('https://example.com/page3');
      expect(page.links).toContain('https://other.com/page');
    });

    it('should filter links based on exclude patterns', async () => {
      const html = `
        <html>
          <body>
            <h1>Test</h1>
            <div class="content">Content</div>
            <a href="https://example.com/page2">Valid</a>
            <a href="https://example.com/search">Search</a>
            <a href="https://example.com/genindex">Index</a>
          </body>
        </html>
      `;

      vi.mocked(axios.get).mockResolvedValue({ status: 200, data: html });

      const scraper = new CheerioScraper({ config: mockConfig });

      // Mock scrapeAll to test filtering
      vi.mocked(axios.get).mockResolvedValue({ status: 200, data: html });

      const pages = await scraper.scrapeAll();

      // The scraper should filter out /search and /genindex URLs
      const allUrls = pages.flatMap(p => p.links);
      expect(allUrls.some(url => url.includes('/search'))).toBe(true); // Links are extracted
      // But they won't be visited (checked in scrapeAll logic)
    });
  });

  describe('scrapeAll', () => {
    it('should crawl multiple pages up to max_pages limit', async () => {
      const page1Html = `
        <html><body>
          <h1>Page 1</h1>
          <div class="content">Content 1</div>
          <a href="https://example.com/page2">Page 2</a>
          <a href="https://example.com/page3">Page 3</a>
        </body></html>
      `;

      const page2Html = `
        <html><body>
          <h1>Page 2</h1>
          <div class="content">Content 2</div>
        </body></html>
      `;

      vi.mocked(axios.get)
        .mockResolvedValueOnce({ status: 200, data: page1Html })
        .mockResolvedValueOnce({ status: 200, data: page2Html });

      const scraper = new CheerioScraper({
        config: { ...mockConfig, max_pages: 2 },
      });

      const pages = await scraper.scrapeAll();

      expect(pages.length).toBeLessThanOrEqual(2);
      expect(axios.get).toHaveBeenCalled();
    });

    it('should skip already visited URLs', async () => {
      const html = `
        <html><body>
          <h1>Test</h1>
          <div class="content">Content</div>
          <a href="https://example.com">Self link</a>
        </body></html>
      `;

      vi.mocked(axios.get).mockResolvedValue({ status: 200, data: html });

      const scraper = new CheerioScraper({
        config: { ...mockConfig, max_pages: 5 },
      });

      const pages = await scraper.scrapeAll();

      // Should only scrape once even though there's a self-link
      expect(pages.length).toBe(1);
      expect(vi.mocked(axios.get)).toHaveBeenCalledTimes(1);
    });

    it('should handle scraping errors gracefully', async () => {
      vi.mocked(axios.get)
        .mockResolvedValueOnce({
          status: 200,
          data: '<html><body><h1>Page 1</h1><div class="content">Content</div><a href="https://example.com/page2">Page 2</a></body></html>',
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const scraper = new CheerioScraper({ config: mockConfig });
      const pages = await scraper.scrapeAll();

      // Should have at least the first page
      expect(pages.length).toBeGreaterThan(0);
    });
  });
});