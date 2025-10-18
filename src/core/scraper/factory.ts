import type { IScraper, ScraperOptions } from '../../types/scraper';
import { FirecrawlScraper } from './firecrawl';
import { CheerioScraper } from './cheerio';
import { HybridScraper } from './hybrid';
import { logger } from '../../utils/logger';

export type ScraperType = 'firecrawl' | 'cheerio' | 'hybrid';

export interface ScraperFactoryOptions extends ScraperOptions {
  type?: ScraperType;
}

export class ScraperFactory {
  private static moduleLogger = logger.child({ module: 'ScraperFactory' });

  /**
   * Create a scraper instance based on type
   */
  static create(options: ScraperFactoryOptions): IScraper {
    const type = options.type || 'hybrid';

    this.moduleLogger.info('Creating scraper', { type });

    switch (type) {
      case 'firecrawl':
        return this.createFirecrawl(options);

      case 'cheerio':
        return this.createCheerio(options);

      case 'hybrid':
        return this.createHybrid(options);

      default:
        throw new Error(`Unknown scraper type: ${type}`);
    }
  }

  /**
   * Create Firecrawl scraper
   */
  private static createFirecrawl(options: ScraperOptions): FirecrawlScraper {
    if (!options.apiKey) {
      throw new Error('Firecrawl scraper requires an API key');
    }
    return new FirecrawlScraper(options);
  }

  /**
   * Create Cheerio scraper
   */
  private static createCheerio(options: ScraperOptions): CheerioScraper {
    return new CheerioScraper(options);
  }

  /**
   * Create Hybrid scraper
   */
  private static createHybrid(options: ScraperOptions): IScraper {
    return new HybridScraper(options);
  }
}
