import type { IScraper, ScraperOptions } from '../../types/scraper';
import type { Page } from '../../types/page';
import { logger } from '../../utils/logger';

/**
 * CheerioScraper - Basic HTML parsing scraper using Cheerio
 * This is a stub implementation for testing purposes
 */
export class CheerioScraper implements IScraper {
  private moduleLogger = logger.child({ module: 'CheerioScraper' });

  constructor(private options: ScraperOptions) {
    this.moduleLogger.info('CheerioScraper initialized', {
      baseUrl: options.config.base_url,
    });
  }

  async validateConnection(): Promise<boolean> {
    this.moduleLogger.info('Validating connection');
    // For now, always return true as a stub
    return true;
  }

  async scrapeAll(): Promise<Page[]> {
    this.moduleLogger.info('Starting scrapeAll');
    // Stub implementation - returns empty array
    return [];
  }

  async scrapeSingle(url: string): Promise<Page> {
    this.moduleLogger.info('Scraping single page', { url });
    // Stub implementation - returns minimal page
    return {
      url,
      title: 'Stub Page',
      content: '',
      codeSamples: [],
      links: [],
    };
  }
}
