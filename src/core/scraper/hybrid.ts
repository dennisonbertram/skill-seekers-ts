import type { IScraper, ScraperOptions } from '../../types/scraper';
import type { Page } from '../../types/page';
import { FirecrawlScraper } from './firecrawl';
import { CheerioScraper } from './cheerio';
import { logger } from '../../utils/logger';

export class HybridScraper implements IScraper {
  private primary: FirecrawlScraper | null = null;
  private fallback: CheerioScraper;
  private moduleLogger = logger.child({ module: 'HybridScraper' });

  constructor(private options: ScraperOptions) {
    // Create primary scraper if API key is available
    if (options.apiKey) {
      try {
        this.primary = new FirecrawlScraper(options);
        this.moduleLogger.info('Initialized with Firecrawl as primary scraper');
      } catch (error) {
        this.moduleLogger.warn('Failed to initialize Firecrawl, using Cheerio only', {
          error,
        });
      }
    } else {
      this.moduleLogger.info('No API key provided, using Cheerio only');
    }

    // Always create fallback scraper
    this.fallback = new CheerioScraper(options);
  }

  async validateConnection(): Promise<boolean> {
    // Try primary first
    if (this.primary) {
      try {
        const isValid = await this.primary.validateConnection();
        if (isValid) {
          this.moduleLogger.info('Firecrawl connection validated');
          return true;
        }
      } catch (error) {
        this.moduleLogger.warn('Firecrawl validation failed, trying fallback', { error });
      }
    }

    // Try fallback
    try {
      const isValid = await this.fallback.validateConnection();
      if (isValid) {
        this.moduleLogger.info('Cheerio connection validated');
        return true;
      }
    } catch (error) {
      this.moduleLogger.error('Both scrapers failed validation', { error });
    }

    return false;
  }

  async scrapeAll(): Promise<Page[]> {
    // Try primary first
    if (this.primary) {
      try {
        this.moduleLogger.info('Attempting scrapeAll with Firecrawl');
        const pages = await this.primary.scrapeAll();
        this.moduleLogger.info('Successfully scraped with Firecrawl', {
          pageCount: pages.length,
        });
        return pages;
      } catch (error) {
        this.moduleLogger.warn('Firecrawl scrapeAll failed, falling back to Cheerio', {
          error,
        });
      }
    }

    // Fallback to Cheerio
    this.moduleLogger.info('Using Cheerio scraper for scrapeAll');
    return await this.fallback.scrapeAll();
  }

  async scrapeSingle(url: string): Promise<Page> {
    // Try primary first
    if (this.primary) {
      try {
        this.moduleLogger.debug('Attempting scrapeSingle with Firecrawl', { url });
        return await this.primary.scrapeSingle(url);
      } catch (error) {
        this.moduleLogger.warn('Firecrawl scrapeSingle failed, falling back to Cheerio', {
          url,
          error,
        });
      }
    }

    // Fallback to Cheerio
    this.moduleLogger.debug('Using Cheerio scraper for scrapeSingle', { url });
    return await this.fallback.scrapeSingle(url);
  }

  /**
   * Get the current active scraper type
   */
  getActiveScraper(): 'firecrawl' | 'cheerio' {
    return this.primary ? 'firecrawl' : 'cheerio';
  }

  /**
   * Check if Firecrawl is available
   */
  hasFirecrawl(): boolean {
    return this.primary !== null;
  }
}
