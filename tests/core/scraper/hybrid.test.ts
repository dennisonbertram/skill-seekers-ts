import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HybridScraper } from '../../../src/core/scraper/hybrid';
import { FirecrawlScraper } from '../../../src/core/scraper/firecrawl';
import { CheerioScraper } from '../../../src/core/scraper/cheerio';
import type { Config } from '../../../src/types/config';
import type { Page } from '../../../src/types/page';

// Mock both scrapers
vi.mock('../../../src/core/scraper/firecrawl');
vi.mock('../../../src/core/scraper/cheerio');

describe('HybridScraper', () => {
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

  const mockPage: Page = {
    url: 'https://example.com/page',
    title: 'Test Page',
    content: 'Test content',
    codeSamples: [],
    links: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with both Firecrawl and Cheerio when API key provided', () => {
      const scraper = new HybridScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      expect(FirecrawlScraper).toHaveBeenCalled();
      expect(CheerioScraper).toHaveBeenCalled();
      expect(scraper.hasFirecrawl()).toBe(true);
    });

    it('should initialize with only Cheerio when no API key', () => {
      const scraper = new HybridScraper({
        config: mockConfig,
      });

      expect(CheerioScraper).toHaveBeenCalled();
      expect(scraper.hasFirecrawl()).toBe(false);
      expect(scraper.getActiveScraper()).toBe('cheerio');
    });

    it('should fall back to Cheerio if Firecrawl initialization fails', () => {
      vi.mocked(FirecrawlScraper).mockImplementationOnce(() => {
        throw new Error('Firecrawl init failed');
      });

      const scraper = new HybridScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      expect(scraper.hasFirecrawl()).toBe(false);
      expect(scraper.getActiveScraper()).toBe('cheerio');
    });
  });

  describe('validateConnection', () => {
    it('should validate with Firecrawl first if available', async () => {
      const mockValidate = vi.fn().mockResolvedValue(true);
      vi.mocked(FirecrawlScraper).mockImplementation(
        () =>
          ({
            validateConnection: mockValidate,
          }) as any,
      );

      const scraper = new HybridScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      const isValid = await scraper.validateConnection();

      expect(isValid).toBe(true);
      expect(mockValidate).toHaveBeenCalled();
    });

    it('should fall back to Cheerio if Firecrawl validation fails', async () => {
      const mockFirecrawlValidate = vi.fn().mockResolvedValue(false);
      const mockCheerioValidate = vi.fn().mockResolvedValue(true);

      vi.mocked(FirecrawlScraper).mockImplementation(
        () =>
          ({
            validateConnection: mockFirecrawlValidate,
          }) as any,
      );

      vi.mocked(CheerioScraper).mockImplementation(
        () =>
          ({
            validateConnection: mockCheerioValidate,
          }) as any,
      );

      const scraper = new HybridScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      const isValid = await scraper.validateConnection();

      expect(isValid).toBe(true);
      expect(mockFirecrawlValidate).toHaveBeenCalled();
      expect(mockCheerioValidate).toHaveBeenCalled();
    });

    it('should return false if both validations fail', async () => {
      const mockFirecrawlValidate = vi.fn().mockResolvedValue(false);
      const mockCheerioValidate = vi.fn().mockResolvedValue(false);

      vi.mocked(FirecrawlScraper).mockImplementation(
        () =>
          ({
            validateConnection: mockFirecrawlValidate,
          }) as any,
      );

      vi.mocked(CheerioScraper).mockImplementation(
        () =>
          ({
            validateConnection: mockCheerioValidate,
          }) as any,
      );

      const scraper = new HybridScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      const isValid = await scraper.validateConnection();

      expect(isValid).toBe(false);
    });
  });

  describe('scrapeAll', () => {
    it('should use Firecrawl first if available', async () => {
      const mockPages = [mockPage];
      const mockScrapeAll = vi.fn().mockResolvedValue(mockPages);

      vi.mocked(FirecrawlScraper).mockImplementation(
        () =>
          ({
            scrapeAll: mockScrapeAll,
          }) as any,
      );

      const scraper = new HybridScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      const pages = await scraper.scrapeAll();

      expect(pages).toEqual(mockPages);
      expect(mockScrapeAll).toHaveBeenCalled();
    });

    it('should fall back to Cheerio if Firecrawl fails', async () => {
      const mockPages = [mockPage];
      const mockFirecrawlScrapeAll = vi.fn().mockRejectedValue(new Error('Firecrawl failed'));
      const mockCheerioScrapeAll = vi.fn().mockResolvedValue(mockPages);

      vi.mocked(FirecrawlScraper).mockImplementation(
        () =>
          ({
            scrapeAll: mockFirecrawlScrapeAll,
          }) as any,
      );

      vi.mocked(CheerioScraper).mockImplementation(
        () =>
          ({
            scrapeAll: mockCheerioScrapeAll,
          }) as any,
      );

      const scraper = new HybridScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      const pages = await scraper.scrapeAll();

      expect(pages).toEqual(mockPages);
      expect(mockFirecrawlScrapeAll).toHaveBeenCalled();
      expect(mockCheerioScrapeAll).toHaveBeenCalled();
    });

    it('should use Cheerio when no API key provided', async () => {
      const mockPages = [mockPage];
      const mockCheerioScrapeAll = vi.fn().mockResolvedValue(mockPages);

      vi.mocked(CheerioScraper).mockImplementation(
        () =>
          ({
            scrapeAll: mockCheerioScrapeAll,
          }) as any,
      );

      const scraper = new HybridScraper({
        config: mockConfig,
      });

      const pages = await scraper.scrapeAll();

      expect(pages).toEqual(mockPages);
      expect(mockCheerioScrapeAll).toHaveBeenCalled();
    });
  });

  describe('scrapeSingle', () => {
    it('should use Firecrawl first if available', async () => {
      const mockScrapeSingle = vi.fn().mockResolvedValue(mockPage);

      vi.mocked(FirecrawlScraper).mockImplementation(
        () =>
          ({
            scrapeSingle: mockScrapeSingle,
          }) as any,
      );

      const scraper = new HybridScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      const page = await scraper.scrapeSingle('https://example.com/page');

      expect(page).toEqual(mockPage);
      expect(mockScrapeSingle).toHaveBeenCalledWith('https://example.com/page');
    });

    it('should fall back to Cheerio if Firecrawl fails', async () => {
      const mockFirecrawlScrape = vi.fn().mockRejectedValue(new Error('Failed'));
      const mockCheerioScrape = vi.fn().mockResolvedValue(mockPage);

      vi.mocked(FirecrawlScraper).mockImplementation(
        () =>
          ({
            scrapeSingle: mockFirecrawlScrape,
          }) as any,
      );

      vi.mocked(CheerioScraper).mockImplementation(
        () =>
          ({
            scrapeSingle: mockCheerioScrape,
          }) as any,
      );

      const scraper = new HybridScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      const page = await scraper.scrapeSingle('https://example.com/page');

      expect(page).toEqual(mockPage);
      expect(mockFirecrawlScrape).toHaveBeenCalled();
      expect(mockCheerioScrape).toHaveBeenCalled();
    });
  });

  describe('getActiveScraper', () => {
    it('should return firecrawl when API key provided', () => {
      const scraper = new HybridScraper({
        config: mockConfig,
        apiKey: 'test-key',
      });

      expect(scraper.getActiveScraper()).toBe('firecrawl');
    });

    it('should return cheerio when no API key', () => {
      const scraper = new HybridScraper({
        config: mockConfig,
      });

      expect(scraper.getActiveScraper()).toBe('cheerio');
    });
  });
});