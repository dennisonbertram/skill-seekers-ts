import { describe, it, expect, vi } from 'vitest';
import { ScraperFactory } from '../../../src/core/scraper/factory';
import { FirecrawlScraper } from '../../../src/core/scraper/firecrawl';
import { CheerioScraper } from '../../../src/core/scraper/cheerio';
import type { Config } from '../../../src/types/config';

// Mock scrapers
vi.mock('../../../src/core/scraper/firecrawl');
vi.mock('../../../src/core/scraper/cheerio');

describe('ScraperFactory', () => {
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

  it('should create Firecrawl scraper when type is firecrawl', () => {
    const scraper = ScraperFactory.create({
      config: mockConfig,
      type: 'firecrawl',
      apiKey: 'test-key',
    });

    expect(FirecrawlScraper).toHaveBeenCalledWith({
      config: mockConfig,
      type: 'firecrawl',
      apiKey: 'test-key',
    });
  });

  it('should throw error for Firecrawl without API key', () => {
    expect(() =>
      ScraperFactory.create({
        config: mockConfig,
        type: 'firecrawl',
      }),
    ).toThrow('Firecrawl scraper requires an API key');
  });

  it('should create Cheerio scraper when type is cheerio', () => {
    const scraper = ScraperFactory.create({
      config: mockConfig,
      type: 'cheerio',
    });

    expect(CheerioScraper).toHaveBeenCalledWith({
      config: mockConfig,
      type: 'cheerio',
    });
  });

  it('should create Hybrid scraper when type is hybrid', () => {
    const scraper = ScraperFactory.create({
      config: mockConfig,
      type: 'hybrid',
      apiKey: 'test-key',
    });

    expect(scraper).toBeDefined();
  });

  it('should create Hybrid scraper by default', () => {
    const scraper = ScraperFactory.create({
      config: mockConfig,
    });

    expect(scraper).toBeDefined();
  });

  it('should throw error for unknown scraper type', () => {
    expect(() =>
      ScraperFactory.create({
        config: mockConfig,
        type: 'unknown' as any,
      }),
    ).toThrow('Unknown scraper type: unknown');
  });
});